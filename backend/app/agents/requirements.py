from app.agents.base import AgentBase
from app.agents.tools import TOOLS
from app.schemas.agents import RequirementsOutput
from app.workflows.state import AutoDevState


class RequirementsAgent(AgentBase):
    name = "requirements"
    display_name = "Requirements Engineer"
    version = "1.0"
    output_schema = RequirementsOutput
    next_agent = "architecture"
    tools = [TOOLS["requirement_templates"], TOOLS["project_examples"]]
    fallback_payload = {
        "functional_requirements": [],
        "non_functional_requirements": [],
        "user_stories": [],
        "assumptions": ["Requirements agent degraded, fallback used."],
        "scope": [],
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        context = self.context_block(state, ["project_metadata"])
        return self.loader.render_user(self.name, context=context)
