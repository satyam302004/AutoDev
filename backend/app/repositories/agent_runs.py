from sqlalchemy.orm import Session

from app.models.entities import AgentRun
from app.utils.ids import new_id
from app.workflows.graph import AGENT_CHAIN

_AGENT_ORDER = {agent.name: index for index, (agent, _, _) in enumerate(AGENT_CHAIN)}


def create_agent_run(
    session: Session,
    execution_id: str,
    agent_name: str,
    status: str,
    confidence: float | None,
    execution_ms: int | None,
    tokens: dict,
    summary: str,
) -> AgentRun:
    run = AgentRun(
        id=new_id(),
        execution_id=execution_id,
        agent_name=agent_name,
        status=status,
        confidence=confidence,
        execution_ms=execution_ms,
        tokens=tokens,
        summary=summary,
    )
    session.add(run)
    return run


def list_agent_runs(session: Session, execution_id: str) -> list[AgentRun]:
    runs = (
        session.query(AgentRun)
        .filter(AgentRun.execution_id == execution_id)
        .all()
    )
    return sorted(
        runs,
        key=lambda run: _AGENT_ORDER.get(run.agent_name, len(_AGENT_ORDER)),
    )
