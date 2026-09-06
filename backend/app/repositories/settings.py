from sqlalchemy.orm import Session

from app.models.entities import Setting


def get_setting(session: Session, key: str) -> str | None:
    setting = session.get(Setting, key)
    return setting.value if setting else None


def set_setting(session: Session, key: str, value: str) -> Setting:
    setting = session.get(Setting, key)
    if setting:
        setting.value = value
    else:
        setting = Setting(key=key, value=value)
        session.add(setting)
    return setting


def get_all_settings(session: Session) -> dict[str, str]:
    settings = session.query(Setting).all()
    return {s.key: s.value for s in settings}


def delete_setting(session: Session, key: str) -> bool:
    setting = session.get(Setting, key)
    if setting is None:
        return False
    session.delete(setting)
    return True
