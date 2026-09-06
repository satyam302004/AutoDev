import logging

from app.core.config import Settings
from app.core.db import session_factory
from app.llm.base import LLMProvider
from app.llm.providers import gemini, ollama, openai
from app.llm.registry import PROVIDER_REGISTRY
from app.repositories import settings as settings_repo

logger = logging.getLogger("app.llm.factory")


def build_provider(settings: Settings) -> LLMProvider:
    name = settings.llm_provider
    cls = PROVIDER_REGISTRY.get(name)
    if cls is None:
        raise ValueError(
            f"Unknown LLM provider: {name!r}. Available: {sorted(PROVIDER_REGISTRY)}"
        )
    if name == "gemini":
        return cls(
            api_key=settings.gemini_api_key,
            model=settings.model_main,
            timeout_s=settings.llm_timeout_s,
        )
    if name == "ollama":
        return cls(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            timeout_s=settings.llm_timeout_s,
        )
    return cls(
        api_key=settings.openai_api_key,
        model=settings.model_main,
        base_url=settings.openai_base_url or None,
        timeout_s=settings.llm_timeout_s,
    )


def build_provider_from_db() -> LLMProvider | None:
    """Build LLM provider from database settings if configured."""
    try:
        with session_factory() as session:
            all_settings = settings_repo.get_all_settings(session)

        if not all_settings:
            return None

        provider = all_settings.get("llm_provider", "")
        if not provider:
            return None

        cls = PROVIDER_REGISTRY.get(provider)
        if cls is None:
            logger.warning("Unknown provider in DB: %s", provider)
            return None

        model = all_settings.get("model_main", "")

        if provider == "gemini":
            api_key = all_settings.get("gemini_api_key", "")
            if not api_key:
                return None
            return cls(api_key=api_key, model=model, timeout_s=300)

        if provider == "ollama":
            base_url = all_settings.get("ollama_base_url", "http://localhost:11434/v1")
            return cls(base_url=base_url, model=model or "qwen2.5:7b", timeout_s=300)

        # OpenAI-compatible (openai, opencode, etc.)
        api_key = all_settings.get("openai_api_key", "")
        if not api_key:
            return None
        base_url = all_settings.get("openai_base_url", "") or "https://opencode.ai/zen/v1"
        # Ensure OpenCode Zen base URL has the full path
        if "opencode.ai" in base_url and "/zen/v1" not in base_url:
            base_url = base_url.rstrip("/") + "/zen/v1"
        return cls(api_key=api_key, model=model, base_url=base_url, timeout_s=300)

    except Exception as exc:
        logger.debug("Could not load DB settings: %s", exc)
        return None
