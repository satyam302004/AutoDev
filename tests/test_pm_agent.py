import pytest
from langgraph.graph import END, START, StateGraph

from app.agents.project_manager import DEFAULT_PLAN, ProjectManagerAgent
from app.llm.base import LLMService
from app.prompts.loader import PromptLoader
from app.workflows.graph import make_agent_node, validate_node
from app.workflows.state import AutoDevState
from tests.fake_llm import FakeLLM

SAMPLE_PLAN = {
    "project_name": "Food Delivery App",
    "validated": True,
    "complexity": "Medium",
    "estimated_agents": 7,
    "execution_plan": [
        "Requirements",
        "Planner",
        "Architecture",
        "Backend",
        "Frontend",
        "QA",
        "Documentation",
    ],
    "rationale": "Standard CRUD with delivery logistics.",
    "confidence": 0.8,
}


def build_mini_graph(fake: FakeLLM):
    pm = ProjectManagerAgent(LLMService(provider=fake), PromptLoader())
    graph = StateGraph(AutoDevState)
    graph.add_node("validate", validate_node)
    graph.add_node("project_manager", make_agent_node(pm, "project_metadata", "project_plan.md"))
    graph.add_edge(START, "validate")
    graph.add_conditional_edges(
        "validate",
        lambda s: "project_manager" if not s.get("validation_failed") else END,
    )
    graph.add_edge("project_manager", END)
    return graph.compile()


@pytest.mark.asyncio
async def test_short_idea_rejected_before_llm():
    fake = FakeLLM(sample=SAMPLE_PLAN)
    state = await build_mini_graph(fake).ainvoke({"idea": "hi"})
    assert state["validation_failed"] is True
    assert state["final_result"]["status"] == "failed"
    assert "project_manager" not in state.get("completed_agents", [])
    assert fake.calls == 0


@pytest.mark.asyncio
async def test_valid_idea_produces_plan():
    fake = FakeLLM(sample=SAMPLE_PLAN)
    state = await build_mini_graph(fake).ainvoke({"idea": "Build a Library Management System"})
    assert state["project_metadata"]["project_name"] == "Food Delivery App"
    assert state["completed_agents"] == ["project_manager"]
    assert len(state["execution_log"]) == 2
    assert state["execution_log"][1]["status"] == "success"
    assert state["execution_log"][1]["tokens"]["input"] == 520
    assert state["project_metadata"]["execution_plan"][0] == "Requirements"
    assert state["agent_outputs"]["project_manager"]["confidence"] == 0.8


@pytest.mark.asyncio
async def test_invalid_json_retries_then_succeeds():
    fake = FakeLLM(sample=SAMPLE_PLAN, mode=["invalid_json", "perfect"])
    state = await build_mini_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    assert fake.calls == 2
    assert state["project_metadata"]["project_name"] == "Food Delivery App"
    assert state["execution_log"][1]["status"] == "retry"


@pytest.mark.asyncio
async def test_hallucinated_fields_retries_then_succeeds():
    fake = FakeLLM(sample=SAMPLE_PLAN, mode=["hallucinated_fields", "perfect"])
    state = await build_mini_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    assert fake.calls == 2
    assert state["project_metadata"]["project_name"] == "Food Delivery App"


@pytest.mark.asyncio
async def test_persistent_failure_uses_fallback():
    fake = FakeLLM(sample=SAMPLE_PLAN, mode="timeout")
    state = await build_mini_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    assert fake.calls == 3
    assert state["project_metadata"]["project_name"] == "Build a Food Delivery App"
    assert state["project_metadata"]["execution_plan"] == DEFAULT_PLAN["execution_plan"]
    assert state["project_metadata"]["confidence"] <= 0.3
    assert state["errors"][-1]["agent"] == "project_manager"
    assert state["execution_log"][1]["status"] == "failed"


@pytest.mark.asyncio
async def test_wrong_schema_uses_fallback():
    fake = FakeLLM(sample=SAMPLE_PLAN, mode="wrong_schema")
    state = await build_mini_graph(fake).ainvoke({"idea": "Build a Food Delivery App"})
    assert state["project_metadata"]["execution_plan"] == DEFAULT_PLAN["execution_plan"]
