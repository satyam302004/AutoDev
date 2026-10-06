import json

from app.api.routes_projects import _status_payload
from app.core.container import get_container
from app.repositories import projects as projects_repo
from app.services.events import Event, EventBus
from app.services.job_manager import Job
from app.utils.ids import new_id


def _seed_project(session, status: str = "pending") -> str:
    """Create a project row in the test session.

    POST /api/projects cannot be used for this: JobManager.submit() writes
    through the global session_factory(), which is not the session this conftest
    overrides, so the row would land in the real database and the request would
    404 on read-back.
    """
    project_id = new_id()
    projects_repo.create_project(session, project_id, title="sse test")
    projects_repo.update_project(session, project_id, status=status)
    session.commit()
    return project_id


def _install_job(project_id: str, **overrides) -> Job:
    manager = get_container().get_job_manager()
    job = Job(
        id=overrides.pop("id", new_id()),
        project_id=project_id,
        execution_id=new_id(),
        idea="x",
        **overrides,
    )
    manager._jobs[job.id] = job
    manager._jobs_by_project[project_id] = job
    return job


def _remove_job(job: Job) -> None:
    manager = get_container().get_job_manager()
    manager._jobs.pop(job.id, None)
    manager._jobs_by_project.pop(job.project_id, None)


async def test_event_bus_unsubscribe_stops_delivery():
    bus = EventBus()
    seen = []

    async def subscriber(event: Event) -> None:
        seen.append(event)

    bus.subscribe(subscriber)
    assert bus.subscriber_count == 1
    bus.unsubscribe(subscriber)
    assert bus.subscriber_count == 0

    # Idempotent: unsubscribing twice must not raise.
    bus.unsubscribe(subscriber)
    assert bus.subscriber_count == 0

    await bus.publish(Event(type="agent_started", project_id="p", execution_id="e"))
    assert seen == []


async def test_event_bus_publish_reaches_subscriber():
    bus = EventBus()
    seen = []

    async def subscriber(event: Event) -> None:
        seen.append(event.type)

    bus.subscribe(subscriber)
    await bus.publish(Event(type="agent_completed", project_id="p", execution_id="e"))
    assert seen == ["agent_completed"]


def test_status_payload_falls_back_to_project(client):
    manager = get_container().get_job_manager()

    payload = _status_payload(manager, "unknown-project", "pending")
    assert payload.status == "pending"
    assert payload.job_id == ""
    assert payload.completed == 0
    assert payload.progress == 0.0


def test_status_payload_marks_terminal_project_complete(client):
    manager = get_container().get_job_manager()

    payload = _status_payload(manager, "unknown-project", "completed")
    assert payload.status == "completed"
    assert payload.completed == payload.total
    assert payload.progress == 1.0


def test_status_payload_prefers_live_job(client):
    manager = get_container().get_job_manager()
    project_id = new_id()
    # fallback_status says pending, the live job says running: the job must win.
    job = _install_job(
        project_id,
        status="running",
        current_agent="architecture",
        completed=4,
        total=10,
    )
    try:
        payload = _status_payload(manager, project_id, "pending")
        assert payload.job_id == job.id
        assert payload.status == "running"
        assert payload.current_agent == "architecture"
        assert payload.completed == 4
        assert payload.total == 10
        assert payload.progress == 0.4
    finally:
        _remove_job(job)


def test_events_unknown_project_404(client):
    response = client.get("/api/projects/nonexistent/events")
    assert response.status_code == 404


def test_events_streams_terminal_snapshot_and_unsubscribes(client, client_session):
    project_id = _seed_project(client_session, status="pending")
    job = _install_job(
        project_id,
        status="failed",
        current_agent="qa",
        completed=7,
        total=10,
        error="boom",
    )
    container = get_container()
    before = container.event_bus.subscriber_count
    try:
        # TestClient buffers the ASGI body, so only a terminal stream (one that
        # the app ends on its own) can be exercised over HTTP.
        with client.stream("GET", f"/api/projects/{project_id}/events") as response:
            assert response.status_code == 200
            assert response.headers["content-type"].startswith("text/event-stream")
            assert response.headers["cache-control"] == "no-cache"
            lines = [line for line in response.iter_lines() if line]

        assert lines, "expected a snapshot line"
        assert lines[0].startswith("data: "), lines[0]
        payload = json.loads(lines[0].removeprefix("data: "))
        assert payload["status"] == "failed"
        assert payload["current_agent"] == "qa"
        assert payload["completed"] == 7
        assert payload["error"] == "boom"
        assert payload["project_id"] == project_id
        # The app returned on its own, so the subscriber must have been detached.
        assert container.event_bus.subscriber_count == before
    finally:
        _remove_job(job)
