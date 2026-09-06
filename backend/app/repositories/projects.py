from sqlalchemy.orm import Session

from app.models.entities import Project
from app.utils.ids import new_id


def create_project(session: Session, project_id: str, title: str = "") -> Project:
    project = Project(id=project_id, title=title)
    session.add(project)
    return project


def get_project(session: Session, project_id: str) -> Project | None:
    return session.get(Project, project_id)


def list_projects(session: Session) -> list[Project]:
    return list(
        session.query(Project).order_by(Project.created_at.desc()).all()
    )


def update_project(session: Session, project_id: str, **fields) -> Project | None:
    project = session.get(Project, project_id)
    if project is None:
        return None
    for key, value in fields.items():
        setattr(project, key, value)
    return project


def delete_project(session: Session, project_id: str) -> bool:
    project = session.get(Project, project_id)
    if project is None:
        return False
    session.delete(project)
    return True
