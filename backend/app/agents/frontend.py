from app.agents.base import AgentBase
from app.schemas.agents import FrontendOutput
from app.workflows.state import AutoDevState


class FrontendAgent(AgentBase):
    name = "frontend"
    display_name = "Frontend Engineer"
    version = "1.0"
    output_schema = FrontendOutput
    next_agent = "qa"
    tools = []
    fallback_payload = {
        "pages": [],
        "components": [],
        "routes": [],
        "state_management": "",
        "ui_layout": "",
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        context = self.context_block(state, ["requirements", "architecture"])
        return self.loader.render_user(self.name, context=context)
