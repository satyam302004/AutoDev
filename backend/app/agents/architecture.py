from app.agents.base import AgentBase
from app.agents.tools import TOOLS
from app.schemas.agents import ArchitectureOutput
from app.workflows.state import AutoDevState


class ArchitectureAgent(AgentBase):
    name = "architecture"
    display_name = "Solution Architect"
    version = "1.0"
    output_schema = ArchitectureOutput
    next_agent = "planning"
    tools = [TOOLS["tech_stack_catalog"], TOOLS["design_patterns"]]
    fallback_payload = {
        "architecture": "Monolith",
        "database": "SQLite",
        "authentication": "None",
        "services": [],
        "apis": [],
        "deployment": ["Local development"],
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        context = self.context_block(state, ["requirements"])
        return self.loader.render_user(self.name, context=context)
