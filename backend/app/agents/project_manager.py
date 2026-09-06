from app.agents.base import AgentBase
from app.schemas.agents import ProjectPlan
from app.workflows.state import AutoDevState

DEFAULT_PLAN = {
    "project_name": "Generated Project",
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
    "rationale": "Fallback plan: LLM unavailable, default 7-agent execution plan used.",
    "confidence": 0.3,
}


class ProjectManagerAgent(AgentBase):
    name = "project_manager"
    display_name = "Project Manager"
    version = "1.0"
    output_schema = ProjectPlan
    fallback_payload = DEFAULT_PLAN
    next_agent = "requirements"
    tools = []

    def build_user_prompt(self, state: AutoDevState) -> str:
        validated = state.get("validated_input") or {}
        return self.loader.render_user(
            self.name,
            idea=validated.get("idea", ""),
            preferences=validated.get("tech_preferences") or "none",
        )

    def build_fallback(self, state: AutoDevState) -> dict:
        validated = state.get("validated_input") or {}
        plan = dict(self.fallback_payload)
        plan["project_name"] = (validated.get("idea") or "Generated Project")[:60]
        return plan
