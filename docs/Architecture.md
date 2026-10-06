# AutoDev - System Architecture

## 1. Agent Pipeline (LangGraph)

```
User Input
   -> Validation Agent        validate/normalize idea, project name, tech prefs (ValidatedInput)
   -> Project Manager         execution plan: agents, order, rationale (ProjectPlan)
   -> Requirements Agent      FR / NFR / user stories / use cases
   -> Planner Agent           sprints, milestones, timeline
   -> Architecture Agent      tech stack, layers, DB schema, API design
   -> Backend Agent           folder structure, models, endpoint skeletons, sample code
   -> Frontend Agent          pages, components, routing, UI notes
   -> QA Agent                test cases, edge cases, acceptance criteria, traceability
   -> Documentation Agent     README, setup guide, API summary
   -> Report Generator        deterministic composer -> final Markdown report
```

Linear chain: `START -> validate -> 8 agents -> report -> END` (10 pipeline steps, `STEP_TOTAL = 10`).
Backend || Frontend parallelism is a future fan-out optimization.

## 2. Layer View

```
CLIENT (React + Vite + CSS design tokens)  dashboard, pipeline view, report viewer, history
        |  HTTP/JSON (CORS-restricted)
API LAYER (FastAPI)                      /api/projects, /api/projects/{id}/status|report|artifacts,
                                         /api/projects/{id}/export/pdf|docx, /api/settings,
                                         /api/memory/search, /api/health
ORCHESTRATION (services/job_manager)     asyncio queue, single worker, status transitions
AGENT LAYER (agents/)                    one module per node; prompt + schema + retry + fallback
WORKFLOWS (workflows/)                   LangGraph StateGraph: AutoDevState + build_graph()
LLM ADAPTERS (llm/)                      provider registry: gemini / openai / ollama (OpenAI-compatible)
INFRA                                     SQLite (SQLAlchemy), ReportLab, prompts/ (markdown)
```

## 3. Architecture Invariant

Every agent returns **structured JSON validated by a Pydantic model - never free text**. Per node:

1. Load system prompt from `prompts/{agent}.system.md` (fallback `prompts/system.md`)
2. Call LLM adapter: "Return STRICT JSON matching this schema"
3. Validate against `schemas/agents.py`; on failure re-prompt with parse-error feedback
   (up to `retries + 1` attempts - normally 3, `documentation` uses 2)
4. Typed output written to `AutoDevState` + DB (`agent_runs`, `artifacts`), then rendered to Markdown
5. If all attempts fail, fall back to the agent's `fallback_payload` (degraded but complete report)

## 4. Data Flow

```
idea -> POST /api/projects -> 202 {job_id, project_id}
  -> JobManager enqueues -> LangGraph graph streams -> nodes call LLM adapter
  -> artifacts persisted (JSON + MD) -> EventBus transitions -> frontend polls every 1s
  -> Report Generator composes markdown -> download MD / PDF / DOCX
```

## 5. API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/projects | Accept idea, create job (202) |
| GET | /api/projects | History |
| GET | /api/projects/{id} | Meta + executions + agent runs + artifacts |
| GET | /api/projects/{id}/status | Job status, current agent, progress |
| GET | /api/projects/{id}/activity | Timeline steps per agent |
| GET | /api/projects/{id}/report | Composed markdown |
| GET | /api/projects/{id}/artifacts | Artifact list |
| GET | /api/projects/{id}/export/pdf | PDF download |
| GET | /api/projects/{id}/export/docx | DOCX download |
| DELETE | /api/projects/{id} | Delete project |
| GET / PUT | /api/settings | LLM provider configuration |
| GET | /api/memory/search | Search memory entries |
| GET | /api/health | App + LLM provider status |

## 6. Backend Folder Structure

```
backend/
  app/
    agents/          one module per node (base.py + project_manager.py, requirements.py, ...)
    api/             routes: health, projects, settings, memory
    core/            config.py (pydantic-settings), container.py (DI), db.py, logging.py, middleware.py
    llm/             base.py, registry.py, factory.py, providers/ (openai, ollama, gemini)
    services/        job_manager, events (EventBus), execution, report, export
    repositories/    projects, executions, agent_runs, artifacts, settings, memory
    models/          SQLAlchemy ORM (projects, executions, agent_runs, artifacts,
                     settings, memory_entries)
    schemas/         api.py + agents.py (ValidatedInput, ProjectPlan, per-agent outputs)
    prompts/         loader.py - reads ../../prompts/*.system.md
    workflows/       state.py (AutoDevState) + graph.py (build_graph)
    utils/           ids
  requirements.txt
```

## 7. Database (summary)

6 tables: `projects`, `executions`, `agent_runs`, `artifacts`, `settings`, `memory_entries`.
UUID PKs, FK ON DELETE CASCADE, indexes on (project, created_at), (project, status).
SQLite by default (`backend/autodev.db`); schema created via `Base.metadata.create_all`
(no migrations yet - Alembic is a prerequisite before schema changes).

## 8. Technology Justification

| Choice | Why |
|---|---|
| FastAPI | Async, Pydantic v2 validation, auto OpenAPI docs, Depends DI |
| LangGraph | Stateful graphs, retry, checkpointing, parallel branches |
| React + Vite + CSS design tokens | Fast SPA dev, typed, no styling framework lock-in |
| SQLAlchemy | SQLite dev -> Postgres prod portability |
| LLM adapter pattern | gemini/openai/ollama one-line switch via .env or /api/settings |
| ReportLab | Deterministic PDF rendering |
| asyncio JobManager | No Redis needed for MVP |

## 9. Middleware & Cross-Cutting

- CORS (restricted to dashboard origin)
- RequestID (X-Request-ID, propagated to LLM calls for traceability)
- Timing (X-Process-Time)
- Global exception handler -> JSON 500 with request_id
- Structured logging (per-module loggers, log level from env, no secrets)
