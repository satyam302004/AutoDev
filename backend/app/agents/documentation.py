from app.agents.base import AgentBase
from app.agents.tools import TOOLS
from app.schemas.agents import DocumentationOutput
from app.workflows.state import AutoDevState


class DocumentationAgent(AgentBase):
    name = "documentation"
    display_name = "Documentation Engineer"
    version = "1.0"
    output_schema = DocumentationOutput
    next_agent = "report"
    retries = 1
    tools = [TOOLS["markdown_templates"]]
    fallback_payload = {
        "installation": "See project documentation in artifacts.",
        "setup_guide": "See project documentation in artifacts.",
        "api_summary": "See project documentation in artifacts.",
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        # Only include essential agents to reduce context size for free models
        context = self.context_block(
            state,
            [
                "requirements",
                "architecture",
                "backend",
                "frontend",
            ],
        )
        return self.loader.render_user(self.name, context=context)
