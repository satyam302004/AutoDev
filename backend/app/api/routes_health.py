from fastapi import APIRouter, Depends

from app.core.config import Settings
from app.core.container import get_settings_dep

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
def health(settings: Settings = Depends(get_settings_dep)) -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.version,
        "environment": settings.env,
        "llm_provider": settings.llm_provider,
        "llm_configured": settings.llm_configured,
    }
