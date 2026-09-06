import pytest

from app.agents.architecture import ArchitectureAgent
from app.agents.artifacts import render_artifact
from app.agents.backend import BackendAgent
from app.agents.documentation import DocumentationAgent
from app.agents.frontend import FrontendAgent
from app.agents.planning import PlanningAgent
from app.agents.project_manager import ProjectManagerAgent
from app.agents.qa import QAAgent
from app.agents.requirements import RequirementsAgent
from app.llm.base import LLMService
from app.prompts.loader import PromptLoader
from tests.fake_llm import FakeLLM
from tests.samples import (
    ARCHITECTURE_SAMPLE,
    BACKEND_SAMPLE,
    DOCUMENTATION_SAMPLE,
    FRONTEND_SAMPLE,
    PM_SAMPLE,
    PLANNING_SAMPLE,
    QA_SAMPLE,
    REQUIREMENTS_SAMPLE,
)

AGENTS = [
    (ProjectManagerAgent, PM_SAMPLE, "project_metadata"),
    (RequirementsAgent, REQUIREMENTS_SAMPLE, "requirements"),
    (ArchitectureAgent, ARCHITECTURE_SAMPLE, "architecture"),
    (PlanningAgent, PLANNING_SAMPLE, "planning"),
    (BackendAgent, BACKEND_SAMPLE, "backend"),
    (FrontendAgent, FRONTEND_SAMPLE, "frontend"),
    (QAAgent, QA_SAMPLE, "qa"),
    (DocumentationAgent, DOCUMENTATION_SAMPLE, "documentation"),
]

FULL_STATE = {
    "project_metadata": PM_SAMPLE,
    "requirements": REQUIREMENTS_SAMPLE,
    "architecture": ARCHITECTURE_SAMPLE,
    "planning": PLANNING_SAMPLE,
    "backend": BACKEND_SAMPLE,
    "frontend": FRONTEND_SAMPLE,
    "qa": QA_SAMPLE,
    "documentation": DOCUMENTATION_SAMPLE,
}


@pytest.mark.asyncio
@pytest.mark.parametrize("agent_cls,sample,state_key", AGENTS)
async def test_agent_happy_path(agent_cls, sample, state_key):
    agent = agent_cls(LLMService(provider=FakeLLM(sample=sample)), PromptLoader())
    result = await agent.run(FULL_STATE)
    assert result.status == "success"
    assert result.data["confidence"] == sample["confidence"]
    assert result.next_agent is not None
    artifact = render_artifact(agent.name, result.data)
    assert artifact.startswith("#")
    assert "Confidence" in artifact


@pytest.mark.asyncio
@pytest.mark.parametrize("agent_cls,sample,state_key", AGENTS)
async def test_agent_fallback_on_persistent_failure(agent_cls, sample, state_key):
    fake = FakeLLM(sample=sample, mode="timeout")
    agent = agent_cls(LLMService(provider=fake), PromptLoader())
    result = await agent.run(FULL_STATE)
    assert result.status == "failed"
    assert result.data["confidence"] <= 0.3
    assert render_artifact(agent.name, result.data)


@pytest.mark.asyncio
@pytest.mark.parametrize("agent_cls,sample,state_key", AGENTS)
async def test_agent_retries_on_schema_error(agent_cls, sample, state_key):
    fake = FakeLLM(sample=sample, mode=["invalid_json", "perfect"])
    agent = agent_cls(LLMService(provider=fake), PromptLoader())
    result = await agent.run(FULL_STATE)
    assert fake.calls == 2
    assert result.status == "retry"
    assert result.data["confidence"] == sample["confidence"]


@pytest.mark.asyncio
async def test_agent_tools_included_in_prompt():
    agent = RequirementsAgent(LLMService(provider=FakeLLM(sample=REQUIREMENTS_SAMPLE)), PromptLoader())
    prompt = agent._with_tool_context(agent.build_user_prompt(FULL_STATE))
    assert "Available tools" in prompt
    assert "requirement_templates" in prompt
