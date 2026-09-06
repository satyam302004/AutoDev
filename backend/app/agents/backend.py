from app.agents.base import AgentBase
from app.agents.tools import TOOLS
from app.schemas.agents import BackendOutput
from app.workflows.state import AutoDevState


class BackendAgent(AgentBase):
    name = "backend"
    display_name = "Backend Engineer"
    version = "1.0"
    output_schema = BackendOutput
    next_agent = "frontend"
    tools = [TOOLS["rest_conventions"]]
    fallback_payload = {
        "folder_structure": ["backend/app/"],
        "apis": [],
        "models": [],
        "endpoints": [],
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        context = self.context_block(state, ["requirements", "architecture"])
        return self.loader.render_user(self.name, context=context)
