import operator
from typing import Annotated, TypedDict


class AutoDevState(TypedDict, total=False):
    execution_id: str
    project_id: str | None
    idea: str
    tech_preferences: str | None
    validated_input: dict | None
    validation_failed: bool
    project_metadata: dict | None
    requirements: dict | None
    architecture: dict | None
    planning: dict | None
    backend: dict | None
    frontend: dict | None
    qa: dict | None
    documentation: dict | None
    agent_outputs: dict | None
    artifacts: Annotated[list[dict], operator.add]
    report: dict | None
    quality_score: float | None
    execution_cost: float | None
    execution_time_ms: int | None
    current_agent: str | None
    completed_agents: Annotated[list[str], operator.add]
    errors: Annotated[list[dict], operator.add]
    execution_log: Annotated[list[dict], operator.add]
    final_result: dict | None
