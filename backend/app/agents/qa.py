from app.agents.base import AgentBase
from app.schemas.agents import QAOutput
from app.workflows.state import AutoDevState


class QAAgent(AgentBase):
    name = "qa"
    display_name = "QA Engineer"
    version = "1.0"
    output_schema = QAOutput
    next_agent = "documentation"
    tools = []
    fallback_payload = {
        "test_cases": [],
        "acceptance_criteria": [],
        "edge_cases": [],
        "confidence": 0.2,
    }

    def build_user_prompt(self, state: AutoDevState) -> str:
        context = self.context_block(state, ["requirements", "backend", "frontend"])
        return self.loader.render_user(self.name, context=context)
