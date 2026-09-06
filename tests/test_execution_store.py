from app.services.execution import ExecutionEvent, ExecutionStore, utcnow


def test_execution_lifecycle():
    store = ExecutionStore()
    execution = store.start("Build a Library Management System")
    store.record(
        execution.id,
        ExecutionEvent(agent="validation", status="success", ts=utcnow(), execution_ms=1),
    )
    store.finish(execution.id, "completed", {"project_name": "Library Management System"})

    stored = store.get(execution.id)
    assert stored.status == "completed"
    assert len(stored.events) == 1
    assert stored.result["project_name"] == "Library Management System"
    assert stored.id in [e.id for e in store.list()]


def test_timeline_lists_agents_and_status():
    store = ExecutionStore()
    execution = store.start("idea")
    store.record(
        execution.id,
        ExecutionEvent(agent="validation", status="success", ts=utcnow(), execution_ms=2),
    )
    store.record(
        execution.id,
        ExecutionEvent(agent="project_manager", status="failed", ts=utcnow(), error="fallback"),
    )
    store.finish(execution.id, "completed", None)
    timeline = execution.timeline
    assert any("validation OK" in line for line in timeline)
    assert any("project_manager FAILED" in line for line in timeline)
    assert any("fallback" in line for line in timeline)


def test_unknown_execution_returns_none():
    store = ExecutionStore()
    assert store.get("missing") is None
