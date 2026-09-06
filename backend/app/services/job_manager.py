import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter

from app.core.db import session_factory
from app.repositories import agent_runs as agent_runs_repo
from app.repositories import artifacts as artifacts_repo
from app.repositories import executions as executions_repo
from app.repositories import projects as projects_repo
from app.services.events import (
    AGENT_COMPLETED,
    AGENT_FAILED,
    AGENT_STARTED,
    ARTIFACT_GENERATED,
    REPORT_GENERATED,
    Event,
    EventBus,
)
from app.utils.ids import new_id
from app.workflows.graph import AGENT_CHAIN

logger = logging.getLogger("app.jobs")

VALIDATE_STEP = "validation"
REPORT_STEP = "report"
STEP_TOTAL = len(AGENT_CHAIN) + 2

AGENT_STATE_KEYS = {agent.name: key for agent, key, _ in AGENT_CHAIN}
AGENT_STEP_ORDER = (
    [VALIDATE_STEP] + [agent.name for agent, _, _ in AGENT_CHAIN] + [REPORT_STEP]
)


def summarize_agent(agent_name: str, data: dict) -> str:
    if agent_name == "project_manager":
        return (
            f"Planned '{data.get('project_name', 'Untitled')}' "
            f"(complexity {data.get('complexity', 'Medium')})"
        )
    if agent_name == "requirements":
        return (
            f"{len(data.get('functional_requirements') or [])} functional, "
            f"{len(data.get('non_functional_requirements') or [])} non-functional requirements"
        )
    if agent_name == "architecture":
        return f"{data.get('architecture', '')} with {data.get('database', '')}"
    if agent_name == "planning":
        return (
            f"{len(data.get('sprints') or [])} sprints, "
            f"{len(data.get('timeline') or [])} timeline phases"
        )
    if agent_name == "backend":
        return f"{len(data.get('apis') or [])} APIs, {len(data.get('models') or [])} models"
    if agent_name == "frontend":
        return f"{len(data.get('pages') or [])} pages, {len(data.get('routes') or [])} routes"
    if agent_name == "qa":
        return f"{len(data.get('test_cases') or [])} test cases"
    if agent_name == "documentation":
        return "Documentation generated"
    if agent_name == "report":
        return "Final report generated"
    return ""


@dataclass
class Job:
    id: str
    project_id: str
    execution_id: str
    idea: str
    status: str = "pending"
    current_agent: str | None = None
    completed: int = 0
    total: int = STEP_TOTAL
    error: str | None = None

    @property
    def progress(self) -> float:
        return round(min(self.completed / max(self.total, 1), 1.0), 2)


class JobManager:
    def __init__(self, graph, event_bus: EventBus | None = None, queue_size: int = 100):
        self._graph = graph
        self.event_bus = event_bus or EventBus()
        self._queue_size = queue_size
        self._queue: asyncio.Queue | None = None
        self._jobs: dict[str, Job] = {}
        self._jobs_by_project: dict[str, Job] = {}
        self._workers: list[asyncio.Task] = []

    def start(self) -> None:
        if not self._workers:
            self._queue = asyncio.Queue(maxsize=self._queue_size)
            self._workers = [asyncio.create_task(self._worker(n)) for n in range(1)]
            logger.info("JobManager started with %d worker(s)", len(self._workers))

    async def stop(self) -> None:
        for task in self._workers:
            task.cancel()
        for task in self._workers:
            try:
                await task
            except asyncio.CancelledError:
                pass
        self._workers = []

    async def submit(self, idea: str, tech_preferences: str | None = None) -> Job:
        job = Job(id=new_id(), project_id=new_id(), execution_id=new_id(), idea=idea)
        with session_factory() as session:
            projects_repo.create_project(session, job.project_id, title=idea[:80])
            executions_repo.create_execution(session, job.execution_id, job.project_id)
            session.commit()
        self._jobs[job.id] = job
        self._jobs_by_project[job.project_id] = job
        if self._queue is None:
            raise RuntimeError("JobManager is not started")
        await self._queue.put(
            (job.id, job.project_id, job.execution_id, idea, tech_preferences)
        )
        return job
    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def get_by_project(self, project_id: str) -> Job | None:
        return self._jobs_by_project.get(project_id)

    def list_jobs(self) -> list[Job]:
        return list(self._jobs.values())

    def remove(self, project_id: str) -> None:
        job = self._jobs_by_project.pop(project_id, None)
        if job:
            self._jobs.pop(job.id, None)

    async def _worker(self, index: int) -> None:
        while True:
            job_id, project_id, execution_id, idea, tech_preferences = (
                await self._queue.get()
            )
            try:
                await self._run_job(job_id, project_id, execution_id, idea, tech_preferences)
            except Exception as exc:
                logger.exception("Job crashed: job=%s", job_id)
                await self._fail(project_id, execution_id, self._jobs.get(job_id), None, str(exc))
            finally:
                self._queue.task_done()

    async def _run_job(
        self,
        job_id: str,
        project_id: str,
        execution_id: str,
        idea: str,
        tech_preferences: str | None,
    ) -> None:
        job = self._jobs[job_id]
        job.status = "running"
        with session_factory() as session:
            projects_repo.update_project(session, project_id, status="running")
            session.commit()

        started = perf_counter()
        last_agent: str | None = None
        await self.event_bus.publish(
            Event(AGENT_STARTED, project_id, execution_id, {"agent": AGENT_STEP_ORDER[1]})
        )
        try:
            async for chunk in self._graph.astream(
                {
                    "idea": idea,
                    "tech_preferences": tech_preferences,
                    "execution_id": execution_id,
                    "project_id": project_id,
                },
                stream_mode="values",
            ):
                if chunk.get("validation_failed"):
                    error = (chunk.get("final_result") or {}).get(
                        "error", "Idea validation failed."
                    )
                    job.completed = len(chunk.get("execution_log") or [])
                    await self._fail(project_id, execution_id, job, "validation", error)
                    return
                agent = chunk.get("current_agent")
                if agent and agent != last_agent:
                    await self._record_step(
                        chunk, agent, project_id, execution_id, job,
                        int((perf_counter() - started) * 1000),
                    )
                    last_agent = agent
        except Exception as exc:
            logger.exception("Job execution failed: job=%s", job_id)
            await self._fail(project_id, execution_id, job, None, str(exc))
            return

        if job.status == "running":
            await self._fail(
                project_id, execution_id, job, None, "Graph finished without a report."
            )

    async def _record_step(
        self,
        chunk: dict,
        agent: str,
        project_id: str,
        execution_id: str,
        job: Job,
        wall_time_ms: int,
    ) -> None:
        job.current_agent = agent
        job.completed = len(chunk.get("execution_log") or [])
        log = chunk.get("execution_log") or []
        entry = log[-1] if log else {}
        status = entry.get("status", "success")
        tokens = entry.get("tokens") or {}

        if agent == VALIDATE_STEP:
            return

        if agent == REPORT_STEP:
            report = chunk.get("report") or {}
            quality = chunk.get("quality_score")
            cost = chunk.get("execution_cost")
            duration = chunk.get("execution_time_ms") or wall_time_ms
            total_tokens = {
                "input": sum((item.get("tokens") or {}).get("input", 0) for item in log),
                "output": sum((item.get("tokens") or {}).get("output", 0) for item in log),
            }
            with session_factory() as session:
                executions_repo.finish_execution(
                    session, execution_id, datetime.now(timezone.utc), duration, total_tokens, cost
                )
                title = (report.get("project_metadata") or {}).get(
                    "project_name", job.idea[:80]
                )
                projects_repo.update_project(
                    session, project_id, status="completed", title=title,
                    quality=quality, cost=cost,
                )
                if chunk.get("artifacts"):
                    artifact = chunk["artifacts"][-1]
                    artifacts_repo.create_artifact(
                        session, execution_id,
                        artifact.get("agent", REPORT_STEP),
                        artifact.get("filename", "report.md"),
                        artifact.get("markdown", ""),
                    )
                session.commit()
            job.status = "completed"
            await self.event_bus.publish(
                Event(AGENT_COMPLETED, project_id, execution_id,
                      {
                          "agent": REPORT_STEP,
                          "status": "success",
                          "execution_ms": duration,
                          "tokens": total_tokens,
                          "confidence": None,
                          "summary": summarize_agent(REPORT_STEP, report),
                      })
            )
            await self.event_bus.publish(
                Event(ARTIFACT_GENERATED, project_id, execution_id,
                      {"agent": REPORT_STEP, "filename": "report.md"})
            )
            await self.event_bus.publish(
                Event(REPORT_GENERATED, project_id, execution_id,
                      {
                          "quality": quality,
                          "cost": cost,
                          "execution_time_ms": duration,
                          "tokens": total_tokens,
                          "title": title,
                      })
            )
            return

        state_key = AGENT_STATE_KEYS.get(agent)
        data = (chunk.get(state_key) or {}) if state_key else {}
        summary = summarize_agent(agent, data)
        confidence = data.get("confidence")
        with session_factory() as session:
            agent_runs_repo.create_agent_run(
                session, execution_id, agent, status, confidence,
                entry.get("execution_ms"), tokens, summary,
            )
            if chunk.get("artifacts"):
                artifact = chunk["artifacts"][-1]
                artifacts_repo.create_artifact(
                    session, execution_id,
                    artifact.get("agent", agent),
                    artifact.get("filename", f"{agent}.md"),
                    artifact.get("markdown", ""),
                )
            session.commit()

        if status == "failed":
            job.error = entry.get("error")
            await self.event_bus.publish(
                Event(AGENT_FAILED, project_id, execution_id,
                      {"agent": agent, "error": entry.get("error")})
            )
        else:
            await self.event_bus.publish(
                Event(AGENT_COMPLETED, project_id, execution_id,
                      {
                          "agent": agent,
                          "status": status,
                          "execution_ms": entry.get("execution_ms"),
                          "tokens": tokens,
                          "confidence": confidence,
                          "summary": summary,
                      })
            )
        await self.event_bus.publish(
            Event(ARTIFACT_GENERATED, project_id, execution_id,
                  {"agent": agent, "filename": chunk["artifacts"][-1].get("filename")})
        )
        next_agent = self._next_agent(agent)
        if next_agent:
            await self.event_bus.publish(
                Event(AGENT_STARTED, project_id, execution_id, {"agent": next_agent})
            )

    def _next_agent(self, agent: str) -> str | None:
        if agent not in AGENT_STEP_ORDER:
            return None
        index = AGENT_STEP_ORDER.index(agent)
        if index >= len(AGENT_STEP_ORDER) - 1:
            return None
        return AGENT_STEP_ORDER[index + 1]

    async def _fail(self, project_id: str, execution_id: str, job: Job | None, agent: str | None, error: str) -> None:
        if job is not None:
            job.status = "failed"
            job.error = error
            job.current_agent = agent
        with session_factory() as session:
            projects_repo.update_project(session, project_id, status="failed")
            executions_repo.finish_execution(
                session, execution_id, datetime.now(timezone.utc), None, {}, None
            )
            session.commit()
        await self.event_bus.publish(
            Event(AGENT_FAILED, project_id, execution_id,
                  {"agent": agent or "unknown", "error": error})
        )
