import time

import pytest
from fastapi.testclient import TestClient

COMPLETED_STATES = ("completed", "failed")


def _wait_for_status(client: TestClient, project_id: str, timeout: float = 20.0) -> dict:
    deadline = time.monotonic() + timeout
    last = None
    while time.monotonic() < deadline:
        response = client.get(f"/api/projects/{project_id}/status")
        assert response.status_code == 200
        last = response.json()
        if last["status"] in COMPLETED_STATES:
            return last
        time.sleep(0.05)
    pytest.fail(f"Project {project_id} did not finish; last status={last}")


def _create_project(client: TestClient, idea: str = "Build a Food Delivery App for urban users") -> dict:
    response = client.post("/api/projects", json={"idea": idea})
    assert response.status_code == 202
    payload = response.json()
    assert payload["job_id"]
    assert payload["project_id"]
    return payload


def test_create_project_then_poll_to_completed(api_client: TestClient):
    created = _create_project(api_client)
    status = _wait_for_status(api_client, created["project_id"])

    assert status["status"] == "completed"
    assert status["project_id"] == created["project_id"]
    assert status["current_agent"] == "report"
    assert status["completed"] == status["total"] == 10
    assert status["progress"] == 1.0
    assert status["error"] is None


def test_validation_rejected_at_api(api_client: TestClient):
    response = api_client.post("/api/projects", json={"idea": "hi"})
    assert response.status_code == 422


def test_project_detail_after_run(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.get(f"/api/projects/{created['project_id']}")
    assert response.status_code == 200
    detail = response.json()

    assert detail["title"] == "Food Delivery App"
    assert detail["status"] == "completed"
    assert 0.0 < detail["quality"] <= 1.0
    assert detail["cost"] >= 0.0
    assert detail["execution"] is not None
    assert detail["execution"]["duration"] is not None
    assert len(detail["agent_runs"]) == 8
    agent_names = [run["agent_name"] for run in detail["agent_runs"]]
    assert agent_names[0] == "project_manager"
    assert agent_names[-1] == "documentation"
    assert len(detail["artifacts"]) == 9
    filenames = [artifact["filename"] for artifact in detail["artifacts"]]
    assert "report.md" in filenames
    assert "requirements.md" in filenames


def test_report_endpoint(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.get(f"/api/projects/{created['project_id']}/report")
    assert response.status_code == 200
    report = response.json()

    assert report["title"] == "Food Delivery App"
    assert report["quality"] == api_client.get(
        f"/api/projects/{created['project_id']}"
    ).json()["quality"]
    assert report["markdown"].startswith("# AutoDev Project Report")
    assert "Requirements" in report["markdown"]


def test_artifacts_endpoint(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.get(f"/api/projects/{created['project_id']}/artifacts")
    assert response.status_code == 200
    artifacts = response.json()

    assert len(artifacts) == 9
    report_artifact = next(a for a in artifacts if a["filename"] == "report.md")
    assert report_artifact["type"] == "report"
    assert report_artifact["content"].startswith("# AutoDev Project Report")


def test_list_projects(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.get("/api/projects")
    assert response.status_code == 200
    projects = response.json()
    assert any(project["id"] == created["project_id"] for project in projects)


def test_delete_project(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.delete(f"/api/projects/{created['project_id']}")
    assert response.status_code == 204

    assert api_client.get(f"/api/projects/{created['project_id']}").status_code == 404
    assert api_client.get(f"/api/projects/{created['project_id']}/status").status_code == 404


def test_unknown_project_returns_404(api_client: TestClient):
    assert api_client.get("/api/projects/does-not-exist").status_code == 404
    assert api_client.get("/api/projects/does-not-exist/status").status_code == 404
    assert api_client.get("/api/projects/does-not-exist/report").status_code == 404


def test_export_pdf(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.get(f"/api/projects/{created['project_id']}/export/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_export_docx(api_client: TestClient):
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    response = api_client.get(f"/api/projects/{created['project_id']}/export/docx")
    assert response.status_code == 200
    assert "wordprocessingml" in response.headers["content-type"]
    assert response.content.startswith(b"PK")


def test_event_bus_emits_pipeline_events(api_client: TestClient):
    from app.core.container import get_container

    captured: list[str] = []
    bus = get_container().event_bus

    async def capture(event):
        captured.append(event.type)

    bus.subscribe(capture)
    created = _create_project(api_client)
    _wait_for_status(api_client, created["project_id"])

    for expected in ("agent_started", "agent_completed", "artifact_generated", "report_generated"):
        assert expected in captured, f"missing event {expected}; got {captured}"
