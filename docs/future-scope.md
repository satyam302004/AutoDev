# Future Scope — AutoDev

Ideas for the next iteration of AutoDev. Use as slide content for the final presentation.

## Product Features

- **Multi-user collaboration** — shared workspaces, teams, comments on generated artifacts
- **GitHub generation** — push the generated project to a new GitHub repository, open PRs
- **CI/CD integration** — auto-run generated test suites, attach build badges to the report
- **Docker Compose** — one-click runnable container setup for every generated project
- **Kubernetes deployment** — helm charts and manifests for scaling generated services
- **Cloud cost estimator** — per-service cost forecast before anything is deployed
- **Jira / Linear integration** — turn generated plans into trackable tickets
- **Slack notifications** — agent lifecycle events pushed to a channel
- **WebSockets** — replace 1s polling with a push-based live event stream

## Platform Improvements

- **Parallel agents** — run independent agents (backend / frontend / QA) concurrently to cut pipeline time
- **Human-in-the-loop checkpoints** — approve architecture or API design before generation continues
- **Agent memory** — retain cross-project learnings to improve planning quality over time
- **Interactive chat** — talk to the project manager agent to iterate on requirements
- **Versioning** — compare artifacts across runs, roll back to earlier decisions
- **More LLM providers** — pluggable backends (OpenAI / Anthropic / Gemini / local models)
