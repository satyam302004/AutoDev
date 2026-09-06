from datetime import datetime

from sqlalchemy.orm import Session

from app.models.entities import Execution
from app.utils.ids import new_id


def create_execution(session: Session, execution_id: str, project_id: str) -> Execution:
    execution = Execution(id=execution_id, project_id=project_id)
    session.add(execution)
    return execution


def get_execution(session: Session, execution_id: str) -> Execution | None:
    return session.get(Execution, execution_id)


def get_execution_by_project(session: Session, project_id: str) -> Execution | None:
    return session.query(Execution).filter(Execution.project_id == project_id).first()


def finish_execution(
    session: Session,
    execution_id: str,
    finished: datetime,
    duration: int | None,
    tokens: dict,
    cost: float | None,
) -> Execution | None:
    execution = session.get(Execution, execution_id)
    if execution is None:
        return None
    execution.finished = finished
    execution.duration = duration
    execution.tokens = tokens
    execution.cost = cost
    return execution
