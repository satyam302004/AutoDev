from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.entities import MemoryEntry
from app.utils.ids import new_id


def create_memory_entry(
    session: Session,
    type: str,
    title: str,
    content: str,
    agent: str | None = None,
    project_id: str | None = None,
    quality: float | None = None,
) -> MemoryEntry:
    entry = MemoryEntry(
        id=new_id(),
        type=type,
        title=title,
        content=content,
        agent=agent,
        project_id=project_id,
        quality=quality,
    )
    session.add(entry)
    return entry


def search_memory_entries(
    session: Session,
    query: str = "",
    type: str | None = None,
    agent: str | None = None,
    project_id: str | None = None,
    limit: int = 50,
) -> list[MemoryEntry]:
    stmt = session.query(MemoryEntry)

    if query:
        search_term = f"%{query}%"
        stmt = stmt.filter(
            or_(
                MemoryEntry.title.ilike(search_term),
                MemoryEntry.content.ilike(search_term),
                MemoryEntry.agent.ilike(search_term),
            )
        )

    if type:
        stmt = stmt.filter(MemoryEntry.type == type)

    if agent:
        stmt = stmt.filter(MemoryEntry.agent == agent)

    if project_id:
        stmt = stmt.filter(MemoryEntry.project_id == project_id)

    return list(stmt.order_by(MemoryEntry.created_at.desc()).limit(limit).all())


def get_memory_entry(session: Session, entry_id: str) -> MemoryEntry | None:
    return session.get(MemoryEntry, entry_id)


def delete_memory_entry(session: Session, entry_id: str) -> bool:
    entry = session.get(MemoryEntry, entry_id)
    if entry is None:
        return False
    session.delete(entry)
    return True


def delete_memory_by_project(session: Session, project_id: str) -> int:
    entries = session.query(MemoryEntry).filter(MemoryEntry.project_id == project_id).all()
    count = len(entries)
    for entry in entries:
        session.delete(entry)
    return count
