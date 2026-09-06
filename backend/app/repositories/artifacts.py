from sqlalchemy.orm import Session

from app.models.entities import Artifact
from app.utils.ids import new_id
from app.workflows.graph import AGENT_CHAIN

_ARTIFACT_ORDER = {
    filename: index
    for index, (_, _, filename) in enumerate(AGENT_CHAIN)
}
_ARTIFACT_ORDER["report.md"] = len(_ARTIFACT_ORDER)


def create_artifact(
    session: Session,
    execution_id: str,
    artifact_type: str,
    filename: str,
    content: str,
) -> Artifact:
    artifact = Artifact(
        id=new_id(),
        execution_id=execution_id,
        type=artifact_type,
        filename=filename,
        content=content,
    )
    session.add(artifact)
    return artifact


def list_artifacts(session: Session, execution_id: str) -> list[Artifact]:
    artifacts = (
        session.query(Artifact)
        .filter(Artifact.execution_id == execution_id)
        .all()
    )
    return sorted(
        artifacts,
        key=lambda artifact: _ARTIFACT_ORDER.get(artifact.filename, len(_ARTIFACT_ORDER)),
    )


def get_artifact(session: Session, execution_id: str, filename: str) -> Artifact | None:
    return (
        session.query(Artifact)
        .filter(
            Artifact.execution_id == execution_id,
            Artifact.filename == filename,
        )
        .first()
    )
