from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.container import get_job_manager_dep
from app.core.db import get_session
from app.repositories import agent_runs as agent_runs_repo
from app.repositories import artifacts as artifacts_repo
from app.repositories import executions as executions_repo
from app.repositories import projects as projects_repo
from app.schemas.api import (
    ActivityStepOut,
    AgentActivityOut,
    AgentRunOut,
    ArtifactMetaOut,
    ArtifactOut,
    ExecutionOut,
    JobStatusResponse,
    ProjectActivityOut,
    ProjectCreateRequest,
    ProjectCreateResponse,
    ProjectDetailOut,
    ProjectSummaryOut,
    ReportOut,
)
from app.services.export import build_docx_bytes, build_pdf_bytes
from app.services.job_manager import STEP_TOTAL, JobManager

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _load_project_or_404(session: Session, project_id: str):
    project = projects_repo.get_project(session, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _load_report_bundle(session: Session, project_id: str) -> dict:
    project = _load_project_or_404(session, project_id)
    execution = executions_repo.get_execution_by_project(session, project_id)
    if execution is None:
        raise HTTPException(status_code=404, detail="No execution found for project")
    report_artifact = artifacts_repo.get_artifact(session, execution.id, "report.md")
    if report_artifact is None:
        raise HTTPException(status_code=404, detail="Report not generated yet")
    runs = agent_runs_repo.list_agent_runs(session, execution.id)
    return {
        "project": project,
        "execution": execution,
        "markdown": report_artifact.content,
        "agent_runs": runs,
    }


@router.post("", response_model=ProjectCreateResponse, status_code=202)
async def create_project(
    payload: ProjectCreateRequest,
    manager: JobManager = Depends(get_job_manager_dep),
) -> ProjectCreateResponse:
    job = await manager.submit(payload.idea.strip(), payload.tech_preferences)
    return ProjectCreateResponse(job_id=job.id, project_id=job.project_id, status=job.status)


@router.get("", response_model=list[ProjectSummaryOut])
def list_projects(session: Session = Depends(get_session)) -> list[ProjectSummaryOut]:
    projects = projects_repo.list_projects(session)
    return [
        ProjectSummaryOut.model_validate(project, from_attributes=True)
        for project in projects
    ]


@router.get("/{project_id}", response_model=ProjectDetailOut)
def get_project(
    project_id: str,
    session: Session = Depends(get_session),
) -> ProjectDetailOut:
    project = _load_project_or_404(session, project_id)
    execution = executions_repo.get_execution_by_project(session, project_id)
    execution_out = None
    runs: list[AgentRunOut] = []
    artifacts: list[ArtifactMetaOut] = []
    if execution is not None:
        execution_out = ExecutionOut.model_validate(execution, from_attributes=True)
        runs = [
            AgentRunOut.model_validate(run, from_attributes=True)
            for run in agent_runs_repo.list_agent_runs(session, execution.id)
        ]
        artifacts = [
            ArtifactMetaOut(type=artifact.type, filename=artifact.filename)
            for artifact in artifacts_repo.list_artifacts(session, execution.id)
        ]
    return ProjectDetailOut(
        id=project.id,
        title=project.title,
        status=project.status,
        quality=project.quality,
        cost=project.cost,
        created_at=project.created_at,
        updated_at=project.updated_at,
        execution=execution_out,
        agent_runs=runs,
        artifacts=artifacts,
    )


@router.get("/{project_id}/status", response_model=JobStatusResponse)
async def project_status(
    project_id: str,
    manager: JobManager = Depends(get_job_manager_dep),
    session: Session = Depends(get_session),
) -> JobStatusResponse:
    project = _load_project_or_404(session, project_id)
    job = manager.get_by_project(project_id)
    if job is not None:
        return JobStatusResponse(
            job_id=job.id,
            project_id=job.project_id,
            status=job.status,
            current_agent=job.current_agent,
            completed=job.completed,
            total=job.total,
            progress=job.progress,
            error=job.error,
        )
    completed = STEP_TOTAL if project.status in ("completed", "failed") else 0
    return JobStatusResponse(
        job_id="",
        project_id=project_id,
        status=project.status,
        current_agent=None,
        completed=completed,
        total=STEP_TOTAL,
        progress=round(completed / max(STEP_TOTAL, 1), 2),
    )


@router.get("/{project_id}/activity", response_model=ProjectActivityOut)
def project_activity(
    project_id: str,
    agent: str | None = None,
    session: Session = Depends(get_session),
) -> ProjectActivityOut:
    _load_project_or_404(session, project_id)
    execution = executions_repo.get_execution_by_project(session, project_id)
    if execution is None:
        return ProjectActivityOut(steps=[], agents=[])

    runs = agent_runs_repo.list_agent_runs(session, execution.id)

    # Filter by agent if specified
    if agent:
        runs = [r for r in runs if r.agent_name == agent]

    # Build activity steps from agent runs
    steps: list[ActivityStepOut] = []
    for run in runs:
        step = ActivityStepOut(
            id=run.id,
            tool=None,
            action=f"{run.agent_name} agent execution",
            result=run.summary if run.summary else None,
            timestamp=run.execution_ms and str(run.execution_ms) or "",
            duration_ms=run.execution_ms,
            tokens=run.tokens if run.tokens else None,
        )
        steps.append(step)

    # Build agent summaries
    agent_summaries: list[AgentActivityOut] = []
    agent_map: dict[str, list] = {}
    for run in runs:
        if run.agent_name not in agent_map:
            agent_map[run.agent_name] = []
        agent_map[run.agent_name].append(run)

    for agent_name, agent_runs in agent_map.items():
        total_ms = sum(r.execution_ms or 0 for r in agent_runs)
        status = "success" if all(r.status == "success" for r in agent_runs) else "partial"
        agent_summaries.append(
            AgentActivityOut(
                name=agent_name,
                status=status,
                duration_ms=total_ms,
            )
        )

    return ProjectActivityOut(steps=steps, agents=agent_summaries)


@router.get("/{project_id}/report", response_model=ReportOut)
def project_report(
    project_id: str,
    session: Session = Depends(get_session),
) -> ReportOut:
    bundle = _load_report_bundle(session, project_id)
    return ReportOut(
        project_id=project_id,
        title=bundle["project"].title,
        quality=bundle["project"].quality,
        cost=bundle["project"].cost,
        execution_time_ms=bundle["execution"].duration,
        tokens=bundle["execution"].tokens,
        markdown=bundle["markdown"],
    )


@router.get("/{project_id}/artifacts", response_model=list[ArtifactOut])
def project_artifacts(
    project_id: str,
    session: Session = Depends(get_session),
) -> list[ArtifactOut]:
    bundle = _load_report_bundle(session, project_id)
    return [
        ArtifactOut(type=artifact.type, filename=artifact.filename, content=artifact.content)
        for artifact in artifacts_repo.list_artifacts(session, bundle["execution"].id)
    ]


@router.get("/{project_id}/export/pdf")
def export_pdf(
    project_id: str,
    session: Session = Depends(get_session),
) -> Response:
    bundle = _load_report_bundle(session, project_id)
    metrics = {
        "quality": bundle["project"].quality,
        "cost": bundle["project"].cost,
        "execution_time_ms": bundle["execution"].duration,
        "tokens": bundle["execution"].tokens,
    }
    runs = [
        {
            "agent_name": run.agent_name,
            "status": run.status,
            "confidence": run.confidence,
            "execution_ms": run.execution_ms,
            "summary": run.summary,
        }
        for run in bundle["agent_runs"]
    ]
    pdf = build_pdf_bytes(bundle["project"].title, bundle["markdown"], metrics, runs)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="autodev-report-{project_id[:8]}.pdf"'
        },
    )


@router.get("/{project_id}/export/docx")
def export_docx(
    project_id: str,
    session: Session = Depends(get_session),
) -> Response:
    bundle = _load_report_bundle(session, project_id)
    metrics = {
        "quality": bundle["project"].quality,
        "cost": bundle["project"].cost,
        "execution_time_ms": bundle["execution"].duration,
        "tokens": bundle["execution"].tokens,
    }
    runs = [
        {
            "agent_name": run.agent_name,
            "status": run.status,
            "confidence": run.confidence,
            "execution_ms": run.execution_ms,
            "summary": run.summary,
        }
        for run in bundle["agent_runs"]
    ]
    docx = build_docx_bytes(bundle["project"].title, bundle["markdown"], metrics, runs)
    return Response(
        content=docx,
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="autodev-report-{project_id[:8]}.docx"'
        },
    )


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    session: Session = Depends(get_session),
    manager: JobManager = Depends(get_job_manager_dep),
) -> None:
    deleted = projects_repo.delete_project(session, project_id)
    session.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    manager.remove(project_id)
