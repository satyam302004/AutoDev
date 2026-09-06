import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone

logger = logging.getLogger("app.events")

AGENT_STARTED = "agent_started"
AGENT_COMPLETED = "agent_completed"
AGENT_FAILED = "agent_failed"
ARTIFACT_GENERATED = "artifact_generated"
REPORT_GENERATED = "report_generated"

Subscriber = Callable[["Event"], Awaitable[None]]


@dataclass
class Event:
    type: str
    project_id: str
    execution_id: str
    data: dict = field(default_factory=dict)
    ts: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class EventBus:
    def __init__(self) -> None:
        self._subscribers: list[Subscriber] = []
        self._lock = asyncio.Lock()

    def subscribe(self, callback: Subscriber) -> None:
        self._subscribers.append(callback)

    async def publish(self, event: Event) -> None:
        for callback in list(self._subscribers):
            try:
                await callback(event)
            except Exception:
                logger.exception("Event subscriber failed for event=%s", event.type)
