from app.agents.base import AgentBase
from app.agents.tools import TOOLS
from app.schemas.agents import PlanningOutput
from app.workflows.state import AutoDevState


class PlanningAgent(AgentBase):
    name = "planning"
    display_name = "Technical Planner"
    version = "1.0"
    output_schema = PlanningOutput
    next_agent = "backend"
    tools = [TOOLS["design_patterns"]]
    fallback_payload = {
        "sprints": [],
        "timeline": [],
        "deliverables": [],
        "risks": [],
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        context = self.context_block(state, ["requirements", "architecture"])
        return self.loader.render_user(self.name, context=context)
