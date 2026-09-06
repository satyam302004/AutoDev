from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    idea: str = Field(min_length=10, max_length=10_000)
    tech_preferences: str | None = Field(default=None, max_length=2_000)


class ProjectCreateResponse(BaseModel):
    job_id: str
    project_id: str
    status: str


class JobStatusResponse(BaseModel):
    job_id: str
    project_id: str
    status: str
    current_agent: str | None = None
    completed: int = 0
    total: int = 0
    progress: float = 0.0
    error: str | None = None


class ProjectSummaryOut(BaseModel):
    id: str
    title: str
    status: str
    quality: float | None = None
    cost: float | None = None
    created_at: datetime
    updated_at: datetime


class ExecutionOut(BaseModel):
    id: str
    started: datetime
    finished: datetime | None = None
    duration: int | None = None
    tokens: dict = Field(default_factory=dict)
    cost: float | None = None


class AgentRunOut(BaseModel):
    agent_name: str
    status: str
    confidence: float | None = None
    execution_ms: int | None = None
    tokens: dict = Field(default_factory=dict)
    summary: str = ""


class ArtifactMetaOut(BaseModel):
    type: str
    filename: str


class ArtifactOut(BaseModel):
    type: str
    filename: str
    content: str


class ProjectDetailOut(BaseModel):
    id: str
    title: str
    status: str
    quality: float | None = None
    cost: float | None = None
    created_at: datetime
    updated_at: datetime
    execution: ExecutionOut | None = None
    agent_runs: list[AgentRunOut] = Field(default_factory=list)
    artifacts: list[ArtifactMetaOut] = Field(default_factory=list)


class ReportOut(BaseModel):
    project_id: str
    title: str
    quality: float | None = None
    cost: float | None = None
    execution_time_ms: int | None = None
    tokens: dict = Field(default_factory=dict)
    markdown: str = ""


class SettingsOut(BaseModel):
    llm_provider: str = "openai"
    api_key_set: bool = False
    base_url: str = ""
    model_main: str = ""


class SettingsUpdateRequest(BaseModel):
    llm_provider: str = Field(pattern=r"^(gemini|openai|ollama)$")
    api_key: str = Field(min_length=1, max_length=500)
    base_url: str = Field(default="", max_length=500)
    model_main: str = Field(min_length=1, max_length=100)


class MemoryEntryOut(BaseModel):
    id: str
    type: str
    title: str
    content: str
    agent: str | None = None
    project_id: str | None = None
    timestamp: str
    quality: float | None = None


class ActivityStepOut(BaseModel):
    id: str
    tool: str | None = None
    action: str
    result: str | None = None
    timestamp: str
    duration_ms: int | None = None
    tokens: dict | None = None


class AgentActivityOut(BaseModel):
    name: str
    status: str
    duration_ms: int | None = None


class ProjectActivityOut(BaseModel):
    steps: list[ActivityStepOut] = Field(default_factory=list)
    agents: list[AgentActivityOut] = Field(default_factory=list)
