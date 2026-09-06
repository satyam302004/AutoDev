import json
import logging

from langgraph.graph import END, START, StateGraph

logger = logging.getLogger("app.workflows")

from app.agents.architecture import ArchitectureAgent
from app.agents.artifacts import render_artifact
from app.agents.backend import BackendAgent
from app.agents.base import AgentBase, utcnow
from app.agents.documentation import DocumentationAgent
from app.agents.frontend import FrontendAgent
from app.agents.planning import PlanningAgent
from app.agents.project_manager import ProjectManagerAgent
from app.agents.qa import QAAgent
from app.agents.requirements import RequirementsAgent
from app.core.db import session_factory
from app.llm.base import LLMService
from app.prompts.loader import PromptLoader
from app.repositories import memory as memory_repo
from app.services.report import generate_report
from app.workflows.state import AutoDevState

MIN_IDEA_LENGTH = 10

AGENT_CHAIN = [
    (ProjectManagerAgent, "project_metadata", "project_plan.md"),
    (RequirementsAgent, "requirements", "requirements.md"),
    (ArchitectureAgent, "architecture", "architecture.md"),
    (PlanningAgent, "planning", "plan.md"),
    (BackendAgent, "backend", "api_spec.md"),
    (FrontendAgent, "frontend", "ui_plan.md"),
    (QAAgent, "qa", "testing.md"),
    (DocumentationAgent, "documentation", "README.md"),
]


def _store_memory(
    type: str,
    title: str,
    content: str,
    agent: str | None = None,
    project_id: str | None = None,
    quality: float | None = None,
) -> None:
    try:
        session = session_factory()
        try:
            memory_repo.create_memory_entry(
                session,
                type=type,
                title=title,
                content=content,
                agent=agent,
                project_id=project_id,
                quality=quality,
            )
            session.commit()
        finally:
            session.close()
    except Exception as exc:
        logger.warning("Failed to store memory: %s project_id=%r agent=%s", exc, project_id, agent)


def validate_node(state: AutoDevState) -> dict:
    idea = (state.get("idea") or "").strip()
    prefs = (state.get("tech_preferences") or "").strip() or None

    if len(idea) < MIN_IDEA_LENGTH:
        entry = {
            "agent": "validation",
            "status": "failed",
            "attempt": 1,
            "error": f"Idea must be at least {MIN_IDEA_LENGTH} characters.",
            "ts": utcnow().isoformat(),
        }
        return {
            "validation_failed": True,
            "current_agent": "validation",
            "errors": [entry],
            "execution_log": [entry],
            "final_result": {"status": "failed", "error": entry["error"]},
        }

    entry = {
        "agent": "validation",
        "status": "success",
        "attempt": 1,
        "error": None,
        "ts": utcnow().isoformat(),
    }

    # Store project idea as memory entry
    _store_memory(
        type="project",
        title=f"Project Idea - {idea[:50]}",
        content=f"Tech preferences: {prefs or 'None specified'}\n\n{idea}",
        agent="validation",
        project_id=None,  # Will be set when project is created
    )

    return {
        "validated_input": {"idea": idea, "tech_preferences": prefs},
        "current_agent": "validation",
        "execution_log": [entry],
    }


def make_agent_node(agent: AgentBase, state_key: str, artifact_name: str):
    async def node(state: AutoDevState) -> dict:
        result = await agent.run(state)
        meta = result.metadata
        entry = {
            "agent": result.agent,
            "status": result.status,
            "attempt": 1,
            "error": None if result.status != "failed" else result.summary,
            "execution_ms": meta.execution_ms,
            "tokens": meta.tokens.model_dump(),
            "ts": meta.timestamp.isoformat(),
        }
        updates: dict = {
            state_key: result.data,
            "current_agent": result.agent,
            "completed_agents": [result.agent],
            "execution_log": [entry],
            "agent_outputs": {**state.get("agent_outputs", {}), result.agent: result.data},
            "artifacts": [
                {
                    "agent": result.agent,
                    "filename": artifact_name,
                    "markdown": render_artifact(agent.name, result.data),
                }
            ],
        }
        if result.status == "failed":
            updates["errors"] = [entry]

        # Store memory entry for this agent's work
        project_id = state.get("project_id")
        idea = state.get("idea", "")
        agent_label = agent.display_name or agent.name
        content = f"Agent {agent_label} completed with status: {result.status}"
        if result.data:
            content = json.dumps(result.data, indent=2)[:2000]
        logger.info("Storing memory for agent=%s status=%s", agent.name, result.status)
        _store_memory(
            type="agent",
            title=f"{agent_label} - {idea[:50]}",
            content=content,
            agent=agent.name,
            project_id=project_id,
            quality=result.data.get("confidence") if isinstance(result.data, dict) else None,
        )

        return updates

    return node


def report_node(state: AutoDevState) -> dict:
    report, markdown, quality_score, execution_time_ms, execution_cost = generate_report(state)
    entry = {
        "agent": "report",
        "status": "success",
        "attempt": 1,
        "error": None,
        "execution_ms": 0,
        "tokens": {"input": 0, "output": 0},
        "ts": utcnow().isoformat(),
    }
    return {
        "report": report,
        "quality_score": quality_score,
        "execution_time_ms": execution_time_ms,
        "execution_cost": execution_cost,
        "current_agent": "report",
        "completed_agents": ["report"],
        "execution_log": [entry],
        "artifacts": [
            {"agent": "report", "filename": "report.md", "markdown": markdown}
        ],
        "final_result": {
            "status": "completed",
            "project_name": (state.get("project_metadata") or {}).get(
                "project_name", "Untitled"
            ),
            "report": report,
            "quality_score": quality_score,
            "execution_time_ms": execution_time_ms,
            "execution_cost": execution_cost,
        },
    }


def build_graph(llm_service: LLMService, loader: PromptLoader | None = None):
    loader = loader or PromptLoader()

    graph = StateGraph(AutoDevState)
    graph.add_node("validate", validate_node)
    graph.add_edge(START, "validate")
    graph.add_conditional_edges(
        "validate",
        lambda s: "project_manager" if not s.get("validation_failed") else END,
    )

    for agent_cls, state_key, artifact_name in AGENT_CHAIN:
        agent = agent_cls(llm_service, loader)
        graph.add_node(agent.name, make_agent_node(agent, state_key, artifact_name))

    previous = "project_manager"
    for agent_cls, state_key, artifact_name in AGENT_CHAIN[1:]:
        graph.add_edge(previous, agent_cls.name)
        previous = agent_cls.name

    graph.add_node("report", report_node)
    graph.add_edge(previous, "report")
    graph.add_edge("report", END)
    return graph.compile()




