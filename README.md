# AutoDev - Multi-Agent AI Software Development Team

AutoDev is a multi-agent AI platform that turns a software idea into a complete project blueprint. Specialized AI agents (Project Manager, Requirements, Planner, Architect, Backend, Frontend, QA, Documentation) collaborate via a LangGraph workflow to generate requirements, architecture, API design, test cases, and documentation.

## Pipeline

```
User Input
  -> Validation Agent
  -> Project Manager
  -> Requirements Agent
  -> Planner Agent
  -> Architecture Agent
  -> Backend Agent
  -> Frontend Agent
  -> QA Agent
  -> Documentation Agent
  -> Report Generator
```

## Repository Layout

```
autodev/
├── backend/        FastAPI app (agents, api, core, services, models, schemas, prompts, workflows)
├── frontend/       React + Vite + Tailwind dashboard (live pipeline, history, exports)
├── prompts/        Single source of truth for all agent prompt templates
├── docs/           PRD, Architecture, future-scope
├── tests/          Root-level pytest suite (backend/tests holds the API suite)
└── scripts/        run_backend.ps1, run_tests.ps1, seed_agents.py, smoke_api.py
```

## Backend Setup (Windows PowerShell)

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\run_backend.ps1
```

This creates `backend/.venv`, installs dependencies, and starts uvicorn on `http://localhost:8000`.

## Verify

```powershell
Invoke-RestMethod http://localhost:8000/api/health
# -> {status: ok, app: AutoDev, version: 0.1.0, llm_provider: ..., llm_configured: ...}
```

Run tests:

```powershell
.\scripts\run_tests.ps1
# or, from the repo root with backend/.venv active:
pytest
```

## Testing

### API smoke checks (scripts/smoke_api.py)

Spawns its own backend on a throwaway database and exercises validation errors, the full job
lifecycle, exports, 404s, deletes, and concurrent runs:

```powershell
backend\.venv\Scripts\python.exe scripts\smoke_api.py
```

### End-to-end (Playwright, frontend/tests/e2e)

Covers the dashboard (live pipeline states via mocked `/status` sequences, failure toasts,
delete/refresh flows, mid-run reloads and project switches), the history page (artifact tabs,
PDF/DOCX/JSON downloads), and mobile layout. Starts both servers automatically (reuses any that
are already running):

```powershell
cd frontend
npm run test:e2e
```

### Secret guard (githooks/pre-commit)

A tracked, dependency-free pre-commit hook refuses commits that stage an `.env` file
(`.env.example` is allowed) or add a line matching a known credential shape. Activate it
once per clone:

```powershell
git config core.hooksPath githooks
```

Reviewed false positive: `git commit --no-verify`.

## Frontend (dashboard)

```powershell
cd frontend
npm install
npm run dev
# http://localhost:5173  (proxies /api to the backend on :8000)
```

Production build: `npm run build` (outputs to `frontend/dist`).

## Configuration

Copy `backend/.env.example` to `backend/.env` and fill in the LLM provider of your choice (`gemini`, `openai`, or `ollama`). No key is required for `ollama` (local).

## Roadmap

- [x] Phase 1 - Backend skeleton: config, logging, DI, middleware, health endpoint, tests
- [x] Phase 2 - LLM abstraction + Project Manager Agent (LangGraph) + tests
- [x] Phase 3 - Full agent company: Requirements Engineer, Solution Architect, Technical Planner,
      Backend/Frontend/QA/Documentation Engineers, Report Generator, tools, artifacts, quality/cost
- [x] Phase 4.1 - JobManager + REST API (`/api/projects`), SQLite persistence (projects, executions,
      agent_runs, artifacts), event bus, PDF/DOCX export, API tests
- [x] Phase 4.2 - React dashboard (Vite + TypeScript, CSS design tokens): live pipeline view
      with 1s polling, isometric pixel-art office scene, agent cards, artifact viewer, metrics
      cards, projects history page, PDF/DOCX/JSON exports, toasts; `docs/future-scope.md`

## Architecture Invariant

Every agent returns structured JSON validated by a Pydantic model - never free text. Nodes communicate only through typed graph state.
