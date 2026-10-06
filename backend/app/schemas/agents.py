from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TokenUsage(BaseModel):
    input: int = 0
    output: int = 0


class AgentMetadata(BaseModel):
    agent: str
    version: str = "1.0"
    timestamp: datetime
    execution_ms: int
    tokens: TokenUsage = Field(default_factory=TokenUsage)


class ValidatedInput(BaseModel):
    idea: str
    tech_preferences: Optional[str] = None


class ProjectPlan(BaseModel):
    project_name: str
    validated: bool = True
    complexity: Literal["Low", "Medium", "High"] = "Medium"
    estimated_agents: int
    execution_plan: list[str]
    rationale: str = ""
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class RequirementItem(BaseModel):
    id: str
    title: str
    description: str = ""
    priority: Literal["High", "Medium", "Low"] = "Medium"


class UserStory(BaseModel):
    id: str
    as_a: str
    i_want: str
    so_that: str = ""


class RequirementsOutput(BaseModel):
    functional_requirements: list[RequirementItem] = []
    non_functional_requirements: list[RequirementItem] = []
    user_stories: list[UserStory] = []
    assumptions: list[str] = []
    scope: list[str] = []
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class ApiEndpoint(BaseModel):
    method: str
    path: str
    purpose: str = ""


class ArchitectureOutput(BaseModel):
    architecture: str
    database: str
    authentication: str
    services: list[str] = []
    apis: list[ApiEndpoint] = []
    deployment: list[str] = []
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class Sprint(BaseModel):
    id: str
    name: str
    goals: list[str] = []
    tasks: list[str] = []


class TimelineItem(BaseModel):
    phase: str
    duration: str = ""


class RiskItem(BaseModel):
    risk: str
    mitigation: str = ""


class PlanningOutput(BaseModel):
    sprints: list[Sprint] = []
    timeline: list[TimelineItem] = []
    deliverables: list[str] = []
    risks: list[RiskItem] = []
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class FieldDef(BaseModel):
    name: str
    type: str = ""
    constraints: str = ""


class ModelDef(BaseModel):
    name: str
    fields: list[FieldDef] = []


class EndpointDef(BaseModel):
    method: str
    path: str
    description: str = ""


class BackendOutput(BaseModel):
    folder_structure: list[str] = []
    apis: list[ApiEndpoint] = []
    models: list[ModelDef] = []
    endpoints: list[EndpointDef] = []
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class PageDef(BaseModel):
    name: str
    route: str = ""
    description: str = ""


class RouteDef(BaseModel):
    path: str
    page: str


class FrontendOutput(BaseModel):
    pages: list[PageDef] = []
    components: list[str] = []
    routes: list[RouteDef] = []
    state_management: str = ""
    ui_layout: str = ""
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class TestCase(BaseModel):
    id: str
    title: str
    steps: list[str] = []
    expected: str = ""


class QAOutput(BaseModel):
    test_cases: list[TestCase] = []
    acceptance_criteria: list[str] = []
    edge_cases: list[str] = []
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class DocumentationOutput(BaseModel):
    readme: str = ""
    installation: str = ""
    setup_guide: str = ""
    api_summary: str = ""
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


AgentStatus = Literal["success", "retry", "failed"]


class AgentResult(BaseModel):
    agent: str
    status: AgentStatus
    next_agent: Optional[str] = None
    summary: str = ""
    metadata: AgentMetadata
    data: dict = Field(default_factory=dict)


AGENT_OUTPUT_SCHEMAS = {
    "project_manager": ProjectPlan,
    "requirements": RequirementsOutput,
    "architecture": ArchitectureOutput,
    "planning": PlanningOutput,
    "backend": BackendOutput,
    "frontend": FrontendOutput,
    "qa": QAOutput,
    "documentation": DocumentationOutput,
}
