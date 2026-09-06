import pytest

from app.llm.base import LLMService
from app.prompts.loader import PromptLoader
from app.services.execution import ExecutionStore, run_execution
from app.services.report import REPORT_SECTIONS
from app.workflows.graph import build_graph
from tests.fake_llm import FakeLLM
from tests.samples import ALL_SAMPLES


@pytest.fixture()
def full_graph():
    def make(fake):
        return build_graph(LLMService(provider=fake), PromptLoader())

    return make


@pytest.mark.asyncio
async def test_full_pipeline_runs_every_agent(full_graph):
    fake = FakeLLM(samples=ALL_SAMPLES)
    state = await full_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    assert fake.calls == len(ALL_SAMPLES)
    assert state["completed_agents"] == [
        "project_manager",
        "requirements",
        "architecture",
        "planning",
        "backend",
        "frontend",
        "qa",
        "documentation",
        "report",
    ]
    filenames = [a["filename"] for a in state["artifacts"]]
    assert filenames == [
        "project_plan.md",
        "requirements.md",
        "architecture.md",
        "plan.md",
        "api_spec.md",
        "ui_plan.md",
        "testing.md",
        "README.md",
        "report.md",
    ]


@pytest.mark.asyncio
async def test_full_pipeline_produces_merged_report(full_graph):
    fake = FakeLLM(samples=ALL_SAMPLES)
    state = await full_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    report = state["report"]
    assert set(REPORT_SECTIONS) <= set(report)
    assert report["requirements"]["functional_requirements"][0]["id"] == "FR-01"
    assert report["backend"]["endpoints"][0]["method"] == "POST"
    assert report["documentation"]["readme"].startswith("# Food Delivery App")
    assert state["quality_score"] == 0.83
    assert state["execution_time_ms"] >= 0
    assert state["execution_cost"] >= 0
    assert state["final_result"]["status"] == "completed"
    assert state["final_result"]["project_name"] == "Food Delivery App"


@pytest.mark.asyncio
async def test_low_confidence_produces_low_quality_score(full_graph):
    samples = [{**sample, "confidence": 0.4} for sample in ALL_SAMPLES]
    fake = FakeLLM(samples=samples)
    state = await full_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    assert state["quality_score"] < 0.6


@pytest.mark.asyncio
async def test_full_pipeline_validation_failure_stops_graph(full_graph):
    fake = FakeLLM(samples=ALL_SAMPLES)
    state = await full_graph(fake).ainvoke({"idea": "hi"})
    assert state["validation_failed"] is True
    assert fake.calls == 0
    assert "report" not in state.get("completed_agents", [])
    assert state["final_result"]["status"] == "failed"


@pytest.mark.asyncio
async def test_run_execution_records_full_history(full_graph):
    fake = FakeLLM(samples=ALL_SAMPLES)
    store = ExecutionStore()
    execution = await run_execution("Build a Food Delivery App", full_graph(fake), store)
    assert execution.status == "completed"
    assert [e.agent for e in execution.events] == [
        "validation",
        "project_manager",
        "requirements",
        "architecture",
        "planning",
        "backend",
        "frontend",
        "qa",
        "documentation",
        "report",
    ]
    assert execution.events[1].tokens["input"] == 520
    assert execution.execution_time_ms is not None
    assert execution.execution_cost is not None
    assert execution.result["report"]["architecture"]["database"] == "PostgreSQL"
    timeline = execution.timeline
    assert any("documentation OK" in line for line in timeline)
    assert any("wall time=" in line for line in timeline)
