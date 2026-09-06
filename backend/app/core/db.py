from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.models.entities import Base

_engine: Engine | None = None
_session_factory: sessionmaker | None = None


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    if dbapi_connection.__class__.__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def configure_database(url: str | None = None) -> None:
    global _engine, _session_factory
    url = url or get_settings().database_url
    _engine = create_engine(url, connect_args={"check_same_thread": False})
    _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)


configure_database()


def get_session() -> Iterator[Session]:
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def session_factory() -> Session:
    return _session_factory()


def init_db() -> None:
    Base.metadata.create_all(_engine)
