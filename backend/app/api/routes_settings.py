from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.core.container import get_container
from app.repositories import settings as settings_repo
from app.schemas.api import SettingsOut, SettingsUpdateRequest

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings(session: Session = Depends(get_session)) -> SettingsOut:
    all_settings = settings_repo.get_all_settings(session)
    api_key = all_settings.get("openai_api_key", "") or all_settings.get("gemini_api_key", "")
    return SettingsOut(
        llm_provider=all_settings.get("llm_provider", "openai"),
        api_key_set=bool(api_key),
        base_url=all_settings.get("openai_base_url", ""),
        model_main=all_settings.get("model_main", ""),
    )


@router.put("", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdateRequest,
    session: Session = Depends(get_session),
) -> SettingsOut:
    settings_repo.set_setting(session, "llm_provider", payload.llm_provider)

    if payload.llm_provider == "openai":
        settings_repo.set_setting(session, "openai_api_key", payload.api_key)
        settings_repo.set_setting(session, "openai_base_url", payload.base_url)
    elif payload.llm_provider == "gemini":
        settings_repo.set_setting(session, "gemini_api_key", payload.api_key)
    elif payload.llm_provider == "ollama":
        settings_repo.set_setting(session, "ollama_base_url", payload.base_url)

    settings_repo.set_setting(session, "model_main", payload.model_main)
    session.commit()

    # Invalidate cached LLM service so new settings take effect
    container = get_container()
    container.set_llm_service(None)

    return SettingsOut(
        llm_provider=payload.llm_provider,
        api_key_set=True,
        base_url=payload.base_url,
        model_main=payload.model_main,
    )
