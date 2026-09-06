from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.repositories import memory as memory_repo
from app.schemas.api import MemoryEntryOut

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("/search", response_model=list[MemoryEntryOut])
def search_memory(
    q: str = "",
    type: str | None = None,
    agent: str | None = None,
    project_id: str | None = None,
    session: Session = Depends(get_session),
) -> list[MemoryEntryOut]:
    entries = memory_repo.search_memory_entries(
        session,
        query=q,
        type=type,
        agent=agent,
        project_id=project_id,
    )
    return [
        MemoryEntryOut(
            id=entry.id,
            type=entry.type,
            title=entry.title,
            content=entry.content,
            agent=entry.agent,
            project_id=entry.project_id,
            timestamp=entry.created_at.isoformat(),
            quality=entry.quality,
        )
        for entry in entries
    ]
