import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from time import perf_counter

from app.utils.ids import new_id

INPUT_PRICE_PER_M = 0.10
OUTPUT_PRICE_PER_M = 0.40


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ExecutionEvent:
    agent: str
    status: str
    ts: datetime
    execution_ms: int | None = None
    tokens: dict | None = None
    error: str | None = None


@dataclass
class Execution:
    id: str
    idea: str
    status: str = "running"
    started_at: datetime = field(default_factory=utcnow)
    finished_at: datetime | None = None
    events: list[ExecutionEvent] = field(default_factory=list)
    result: dict | None = None
    execution_time_ms: int | None = None
    execution_cost: float | None = None

    @property
    def timeline(self) -> list[str]:
        lines = [f"Execution {self.id} started {self.started_at.isoformat()}"]
        for event in self.events:
            mark = "OK" if event.status != "failed" else "FAILED"
            ms = f" ({event.execution_ms}ms)" if event.execution_ms is not None else ""
            error = f" - {event.error}" if event.error else ""
            lines.append(f"  {event.agent} {mark}{ms} status={event.status}{error}")
        lines.append(f"finished status={self.status}")
        if self.execution_time_ms is not None:
            lines.append(f"wall time={self.execution_time_ms}ms cost=${self.execution_cost}")
        return lines


class ExecutionStore:
    def __init__(self):
        self._executions: dict[str, Execution] = {}
        self._lock = threading.Lock()

    def start(self, idea: str) -> Execution:
        execution = Execution(id=new_id(), idea=idea)
        with self._lock:
            self._executions[execution.id] = execution
        return execution

    def get(self, execution_id: str) -> Execution | None:
        with self._lock:
            return self._executions.get(execution_id)

    def record(self, execution_id: str, event: ExecutionEvent) -> None:
        execution = self.get(execution_id)
        if execution:
            execution.events.append(event)

    def finish(self, execution_id: str, status: str, result: dict | None) -> None:
        execution = self.get(execution_id)
        if execution:
            execution.status = status
            execution.finished_at = utcnow()
            execution.result = result

    def list(self) -> list[Execution]:
        with self._lock:
            return list(self._executions.values())


async def run_execution(idea, graph, store: ExecutionStore, tech_preferences=None) -> Execution:
    started = perf_counter()
    execution = store.start(idea)
    try:
        state = await graph.ainvoke(
            {
                "idea": idea,
                "tech_preferences": tech_preferences,
                "execution_id": execution.id,
            }
        )
    except Exception as exc:
        store.finish(execution.id, "failed", {"status": "failed", "error": str(exc)})
        return store.get(execution.id)

    for entry in state.get("execution_log") or []:
        ts = utcnow()
        if entry.get("ts"):
            ts = datetime.fromisoformat(entry["ts"])
        store.record(
            execution.id,
            ExecutionEvent(
                agent=entry.get("agent", "?"),
                status=entry.get("status", "?"),
                ts=ts,
                execution_ms=entry.get("execution_ms"),
                tokens=entry.get("tokens"),
                error=entry.get("error"),
            ),
        )

    tokens_in = sum(
        (entry.get("tokens") or {}).get("input", 0) for entry in state.get("execution_log") or []
    )
    tokens_out = sum(
        (entry.get("tokens") or {}).get("output", 0) for entry in state.get("execution_log") or []
    )
    execution_cost = round(
        tokens_in / 1_000_000 * INPUT_PRICE_PER_M
        + tokens_out / 1_000_000 * OUTPUT_PRICE_PER_M,
        4,
    )

    execution = store.get(execution.id)
    execution.execution_time_ms = int((perf_counter() - started) * 1000)
    execution.execution_cost = execution_cost

    outcome = "failed" if state.get("validation_failed") else "completed"
    store.finish(execution.id, outcome, state.get("final_result"))
    return store.get(execution.id)
