# AutoDev - Multi-Agent AI Software Development Team
## Product Requirements Document (PRD)

**Version:** 1.0 | **Status:** Approved for development

## 1. Product Vision

AutoDev is a multi-agent AI platform that transforms a software idea into a complete, production-ready project blueprint. A team of specialized AI agents - Project Manager, Requirements Engineer, Planner, Software Architect, Backend Engineer, Frontend Engineer, QA Engineer, and Documentation Engineer - collaborates via a LangGraph workflow to analyze an idea and generate requirements, architecture, database design, API contracts, UI plans, sprint plans, test cases, and documentation in minutes.

## 2. Problem Statement

Teams spend days translating a product idea into an actionable blueprint. Planning is fragmented (requirements, design, tests produced in isolation), new developers face the blank-page problem, and generic prompt tools return a single monolithic answer with no multi-perspective rigor or traceability.

AutoDev decomposes a high-level goal into subtasks, delegates each to a specialized agent with an explicit role, and composes the outputs into one cohesive, cross-referenced deliverable.

## 3. Objectives

| # | Objective | Success Metric |
|---|-----------|----------------|
| O1 | Generate a complete blueprint from a single idea | All 10 artifact types produced per run |
| O2 | Authentic agentic collaboration | 10-stage LangGraph pipeline with typed state |
| O3 | Consistent, cross-referenced output | Traceability matrix (Req <-> Design <-> Test) |
| O4 | Instant usable value | Report exportable as Markdown/PDF |
| O5 | Revisitable projects | Persistence + regeneration (Phase 4) |
| O6 | Feasible for 4 students / 8 weeks | MVP scoped in this PRD |

## 4. User Personas

| Persona | Description | Needs |
|---------|-------------|-------|
| Priya (Student Developer) | Final-year project with a vague idea | Credible starting point: requirements, ER diagram, folder structure, APIs |
| Rohan (Solo Founder) | Non-technical, feasibility check | Plain-language output, tech-stack rationale |
| Prof. Mehta (Evaluator) | Reviews student work | Traceability, standards, evidence of process |
| Neha (Team PM) | Leads a student team | Sprint plan, milestones, iteration |

## 5. Functional Requirements

**Idea Intake**
- FR-01 User enters a project idea as free text | M
- FR-02 Optional tech-stack preferences | M
- FR-03 Input validation with friendly errors | M

**Multi-Agent Engine**
- FR-10 Validation Agent normalizes input | M
- FR-11 Project Manager emits execution plan | M
- FR-12 Requirements Agent: FR/NFR/user stories/use cases | M
- FR-13 Planner Agent: sprints, milestones, timeline | M
- FR-14 Architect Agent: stack, layers, DB schema, APIs | M
- FR-15 Backend Agent: folder structure, models, endpoint skeletons | M
- FR-16 Frontend Agent: pages, components, routing | M
- FR-17 QA Agent: test cases, edge cases, acceptance criteria | M
- FR-18 Documentation Agent: README, setup guide, user manual | M
- FR-19 Report Generator: deterministic composition of all artifacts | M
- FR-20 Every agent returns Pydantic-validated structured JSON (never free text) | M

**Workflow & API**
- FR-21 Asynchronous job with unique project ID | M
- FR-22 Live per-agent status (pending/running/completed/failed) | M
- FR-23 Retry up to 2 attempts on failure, then degraded-but-complete report | M

**Persistence & Export**
- FR-30 Projects + artifacts saved to SQLite | M
- FR-31 List past projects, view reports | M
- FR-32 Regenerate a project | S
- FR-40 Markdown report | M
- FR-41 PDF export | S
- FR-43 Downloadable per-agent artifacts | S

**Frontend Dashboard**
- FR-50 Landing page with idea input | M
- FR-51 Live pipeline progress visualization | M
- FR-52 Report viewer with download buttons | M
- FR-53 History page | S

**System**
- FR-60 Health endpoint with LLM availability | M
- FR-61 Configurable LLM provider (gemini/openai/ollama) via env | M

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Report in ~3-5 min (LLM-bound); status polling <200 ms |
| NFR-02 | Concurrency | >=5 simultaneous jobs |
| NFR-03 | Scalability | Stateless agent engine; horizontal scaling possible |
| NFR-04 | Reliability | Retry with backoff; no data loss on partial failure |
| NFR-05 | Security | Keys only in .env, never exposed to frontend; CORS restricted |
| NFR-06 | Usability | Zero-config generation beyond the input form |
| NFR-07 | Maintainability | Modular monorepo; one module per agent |
| NFR-08 | Portability | Python 3.11+, Node 18+, Windows/macOS/Linux |
| NFR-09 | Testability | Agents testable with mocked LLM |
| NFR-10 | Documentation | README + 6 docs in docs/ |

## 7. Pipeline & Use Cases

Pipeline: `User Input -> Validation -> Project Manager -> Requirements -> Planner -> Architecture -> Backend -> Frontend -> QA -> Documentation -> Report Generator`

Key use cases: UC-01 Generate blueprint (primary), UC-02 View live progress, UC-03 Review past project, UC-04 Export PDF, UC-05 Agent failure handling (retry -> degrade -> "degraded" report), UC-06 Configure LLM provider.

## 8. Future Scope

GitHub repo initialization, Mermaid diagrams in reports, Gantt timelines, interactive agent chat, memory/revisit projects, runnable code skeleton (ZIP) download, multi-user accounts, eval harness across providers.
