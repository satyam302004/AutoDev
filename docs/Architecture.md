# AutoDev - System Architecture

## 1. Agent Pipeline (LangGraph)

```
User Input
   -> Validation Agent        validate/normalize idea, project name, tech prefs (ValidatedInput)
   -> Project Manager         execution plan: agents, order, rationale (ProjectPlan)
   -> Requirements Agent      FR / NFR / user stories / use cases
   -> Planner Agent           sprints, milestones, timeline
   -> Architecture Agent      tech stack, layers, DB schema, API design, Mermaid
   -> Backend Agent           folder structure, models, endpoint skeletons, sample code
   -> Frontend Agent          pages, components, routing, UI notes
   -> QA Agent                test cases, edge cases, acceptance criteria, traceability
   -> Documentation Agent     README, setup guide, user manual
   -> Report Generator        deterministic composer -> final Markdown report
```

11 graph nodes, linear chain. Backend || Frontend parallelism is a future fan-out optimization.

## 2. Layer View

```
CLIENT (React + Vite + Tailwind)         dashboard, pipeline view, report viewer, history
        |  HTTP/JSON (CORS-restricted)
API LAYER (FastAPI)                      /api/generate, /api/projects/{id}/status|report|artifacts,
                                         /api/projects, /api/projects/{id}/export/pdf, /api/health
ORCHESTRATION (services/job_manager)     asyncio queue, per-job worker, status transitions
AGENT LAYER (agents/)                    one module per node; prompt + schema + retry
WORKFLOWS (workflows/)                   LangGraph StateGraph: ProjectState + compile_graph()
LLM ADAPTERS (llm/)                      provider ABC: gemini / openai / ollama (OpenAI-compatible)
INFRA                                       SQLite/Postgres (SQLAlchemy), ReportLab, prompts/ (markdown)
```

## 3. Architecture Invariant

Every agent returns **structured JSON validated by a Pydantic model - never free text**. Per node:

1. Load prompt template from `prompts/{agent}.md` + `system.md`
2. Call LLM adapter: "Return STRICT JSON matching this schema"
3. Validate against `schemas/agents.py`; on failure re-prompt once with parse-error feedback
4. Typed artifact written to `ProjectState` + DB (content_json + rendered content_md)
5. `prompts/summarizer.md` compresses context between agents (token control)

## 4. Data Flow

```
idea -> POST /api/generate -> 202 {project_id}
  -> JobManager enqueues -> LangGraph graph runs -> nodes call LLM adapter
  -> artifacts persisted (JSON + MD) -> status transitions -> frontend polls every 2s
  -> Report Generator composes markdown -> download MD / PDF
```

## 5. API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/generate | Accept idea, create job (202) |
| GET | /api/projects/{id}/status | Per-agent status |
| GET | /api/projects/{id} | Meta + artifacts |
| GET | /api/projects/{id}/report | Composed markdown |
| GET | /api/projects/{id}/artifacts/{agent} | Single agent output |
| GET | /api/projects/{id}/export/pdf | PDF download |
| GET | /api/projects | History |
| POST | /api/projects/{id}/regenerate | Re-run pipeline |
| GET | /api/health | App + LLM provider status |

## 6. Backend Folder Structure

```
backend/
  app/
    agents/          one module per node (base.py + validation.py, project_manager.py, ...)
    api/             routes: generate, projects, export, health
    core/            config.py (pydantic-settings), container.py (DI), db.py, logging.py, middleware.py
    services/        job_manager, generation, report composer, export, summarizer
    models/          SQLAlchemy ORM (projects, project_versions, agent_runs, artifacts,
                     conversations, messages, execution_logs)
    schemas/         api.py + agents.py (ValidatedInput, ProjectPlan, artifacts, CompiledReport)
    prompts/         loader.py - reads ../../prompts/*.md
    workflows/       state.py (ProjectState) + graph.py (compile_graph)
    utils/           ids, markdown helpers, retry
  requirements.txt
```

## 7. Database (summary - see docs/Database.md)

7 tables: `projects`, `project_versions`, `agent_runs`, `artifacts`, `conversations`, `messages`, `execution_logs`. UUID PKs, FK ON DELETE CASCADE, indexes on (project, created_at), (project, status). Dev: SQLite. Prod-ready: Postgres (JSONB, partitions, pgvector for idea similarity).

## 8. Technology Justification

| Choice | Why |
|---|---|
| FastAPI | Async, Pydantic v2 validation, auto OpenAPI docs, Depends DI |
| LangGraph | Stateful graphs, retry, checkpointing, parallel branches |
| React + Vite + Tailwind | Fast SPA dev, typed, utility styling |
| SQLAlchemy + Alembic | SQLite dev -> Postgres prod portability |
| LLM adapter pattern | gemini/openai/ollama one-line switch via .env |
| ReportLab | Deterministic PDF rendering |
| asyncio JobManager | No Redis needed for MVP |

## 9. Middleware & Cross-Cutting

- CORS (restricted to dashboard origin)
- RequestID (X-Request-ID, propagated to LLM calls for traceability)
- Timing (X-Process-Time)
- Global exception handler -> JSON 500 with request_id
- Structured logging (per-module loggers, log level from env, no secrets)
