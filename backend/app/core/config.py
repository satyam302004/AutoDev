from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AutoDev"
    env: Literal["development", "testing", "production"] = "development"
    version: str = "0.1.0"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:5173"]

    database_url: str = "sqlite:///./autodev.db"

    llm_provider: Literal["gemini", "openai", "ollama"] = "gemini"
    gemini_api_key: str = ""
    openai_api_key: str = ""
    openai_base_url: str = ""
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "qwen2.5:7b"
    model_main: str = "gemini-2.0-flash"
    llm_timeout_s: int = 60
    llm_max_retries: int = 2

    job_queue_size: int = 100

    @property
    def llm_configured(self) -> bool:
        if self.llm_provider == "gemini":
            return bool(self.gemini_api_key)
        if self.llm_provider == "openai":
            return bool(self.openai_api_key)
        return True


@lru_cache
def get_settings() -> Settings:
    return Settings()
