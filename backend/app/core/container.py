from functools import lru_cache

from app.core.config import Settings, get_settings
from app.llm.base import LLMService
from app.llm.factory import build_provider, build_provider_from_db
from app.services.events import EventBus
from app.services.execution import ExecutionStore
from app.services.job_manager import JobManager
from app.workflows.graph import build_graph


class Container:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.execution_store = ExecutionStore()
        self.event_bus = EventBus()
        self._llm_service: LLMService | None = None
        self._job_manager: JobManager | None = None

    def get_llm_service(self) -> LLMService:
        if self._llm_service is None:
            db_provider = build_provider_from_db()
            provider = db_provider or build_provider(self.settings)
            self._llm_service = LLMService(provider=provider)
        return self._llm_service

    def set_llm_service(self, service: LLMService | None = None) -> None:
        self._llm_service = service
        self._job_manager = None

    def get_job_manager(self) -> JobManager:
        if self._job_manager is None:
            graph = build_graph(self.get_llm_service())
            self._job_manager = JobManager(
                graph,
                event_bus=self.event_bus,
                queue_size=self.settings.job_queue_size,
            )
            self._job_manager.start()
        return self._job_manager


@lru_cache
def get_container() -> Container:
    return Container(settings=get_settings())


def get_settings_dep() -> Settings:
    return get_container().settings


def get_llm_service_dep() -> LLMService:
    return get_container().get_llm_service()


def get_execution_store_dep() -> ExecutionStore:
    return get_container().execution_store


async def get_job_manager_dep() -> JobManager:
    return get_container().get_job_manager()
