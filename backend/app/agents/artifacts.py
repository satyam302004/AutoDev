ARTIFACT_RENDERERS: dict[str, callable] = {}


def register_renderer(name: str):
    def decorator(fn: callable) -> callable:
        ARTIFACT_RENDERERS[name] = fn
        return fn

    return decorator


def render_artifact(name: str, payload: dict) -> str:
    renderer = ARTIFACT_RENDERERS.get(name)
    if renderer is None:
        return f"# {name}\n\n{payload}"
    return renderer(payload)


def _items(items: list) -> list[str]:
    return [f"- {item}" for item in items]


def _requirement_lines(items: list) -> list[str]:
    return [
        f"- **{item.get('id', '')} - {item.get('title', '')}** "
        f"({item.get('priority', '')}): {item.get('description', '')}"
        for item in items
    ]


def _api_lines(apis: list) -> list[str]:
    return [
        f"- `{item.get('method', '')} {item.get('path', '')}` - {item.get('purpose', '')}"
        for item in apis
    ]


@register_renderer("project_manager")
def render_project_manager(payload: dict) -> str:
    lines = ["# Project Plan", ""]
    lines.append(f"- **Project:** {payload.get('project_name', '')}")
    lines.append(f"- **Complexity:** {payload.get('complexity', '')}")
    lines.append(f"- **Estimated agents:** {payload.get('estimated_agents', '')}")
    lines.append(f"- **Validated:** {payload.get('validated', '')}")
    lines.append("")
    lines.append("## Execution Plan")
    lines += _items(payload.get("execution_plan", []))
    lines.append("")
    lines.append(f"**Rationale:** {payload.get('rationale', '')}")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("requirements")
def render_requirements(payload: dict) -> str:
    lines = ["# Requirements", ""]
    lines.append("## Functional Requirements")
    lines += _requirement_lines(payload.get("functional_requirements", []))
    lines.append("")
    lines.append("## Non-functional Requirements")
    lines += _requirement_lines(payload.get("non_functional_requirements", []))
    lines.append("")
    lines.append("## User Stories")
    for story in payload.get("user_stories", []):
        lines.append(
            f"- **{story.get('id', '')}** As a {story.get('as_a', '')}, "
            f"I want {story.get('i_want', '')} so that {story.get('so_that', '')}"
        )
    lines.append("")
    lines.append("## Assumptions")
    lines += _items(payload.get("assumptions", []))
    lines.append("")
    lines.append("## Scope")
    lines += _items(payload.get("scope", []))
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("architecture")
def render_architecture(payload: dict) -> str:
    lines = ["# Architecture", ""]
    lines.append(f"- **Pattern:** {payload.get('architecture', '')}")
    lines.append(f"- **Database:** {payload.get('database', '')}")
    lines.append(f"- **Authentication:** {payload.get('authentication', '')}")
    lines.append("")
    lines.append("## Services")
    lines += _items(payload.get("services", []))
    lines.append("")
    lines.append("## APIs")
    lines += _api_lines(payload.get("apis", []))
    lines.append("")
    lines.append("## Deployment")
    lines += _items(payload.get("deployment", []))
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("planning")
def render_planning(payload: dict) -> str:
    lines = ["# Sprint Planning", ""]
    for sprint in payload.get("sprints", []):
        lines.append(f"## {sprint.get('id', '')} - {sprint.get('name', '')}")
        lines.append("**Goals:**")
        lines += _items(sprint.get("goals", []))
        lines.append("**Tasks:**")
        lines += _items(sprint.get("tasks", []))
        lines.append("")
    lines.append("## Timeline")
    for item in payload.get("timeline", []):
        lines.append(f"- **{item.get('phase', '')}** - {item.get('duration', '')}")
    lines.append("")
    lines.append("## Deliverables")
    lines += _items(payload.get("deliverables", []))
    lines.append("")
    lines.append("## Risks")
    for risk in payload.get("risks", []):
        lines.append(f"- **{risk.get('risk', '')}** - Mitigation: {risk.get('mitigation', '')}")
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("backend")
def render_backend(payload: dict) -> str:
    lines = ["# Backend Design", ""]
    lines.append("## Folder Structure")
    lines.append("```")
    lines += payload.get("folder_structure", [])
    lines.append("```")
    lines.append("")
    lines.append("## APIs")
    lines += _api_lines(payload.get("apis", []))
    lines.append("")
    lines.append("## Models")
    for model in payload.get("models", []):
        lines.append(f"### {model.get('name', '')}")
        for field in model.get("fields", []):
            lines.append(
                f"- `{field.get('name', '')}` {field.get('type', '')} - {field.get('constraints', '')}"
            )
        lines.append("")
    lines.append("## Endpoints")
    for endpoint in payload.get("endpoints", []):
        lines.append(
            f"- `{endpoint.get('method', '')} {endpoint.get('path', '')}` - {endpoint.get('description', '')}"
        )
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("frontend")
def render_frontend(payload: dict) -> str:
    lines = ["# Frontend Design", ""]
    lines.append("## Pages")
    for page in payload.get("pages", []):
        lines.append(
            f"- **{page.get('name', '')}** ({page.get('route', '')}) - {page.get('description', '')}"
        )
    lines.append("")
    lines.append("## Components")
    lines += _items(payload.get("components", []))
    lines.append("")
    lines.append("## Routes")
    for route in payload.get("routes", []):
        lines.append(f"- `{route.get('path', '')}` -> {route.get('page', '')}")
    lines.append("")
    lines.append(f"**State management:** {payload.get('state_management', '')}")
    lines.append("")
    lines.append(f"**UI layout:** {payload.get('ui_layout', '')}")
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("qa")
def render_qa(payload: dict) -> str:
    lines = ["# QA & Testing", ""]
    lines.append("## Test Cases")
    for test in payload.get("test_cases", []):
        lines.append(f"### {test.get('id', '')} - {test.get('title', '')}")
        lines.append("**Steps:**")
        lines += _items(test.get("steps", []))
        lines.append(f"**Expected:** {test.get('expected', '')}")
        lines.append("")
    lines.append("## Acceptance Criteria")
    lines += _items(payload.get("acceptance_criteria", []))
    lines.append("")
    lines.append("## Edge Cases")
    lines += _items(payload.get("edge_cases", []))
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)


@register_renderer("documentation")
def render_documentation(payload: dict) -> str:
    lines = ["# Documentation", ""]
    lines.append("## README")
    lines.append(payload.get("readme", ""))
    lines.append("")
    lines.append("## Installation")
    lines.append(payload.get("installation", ""))
    lines.append("")
    lines.append("## Setup Guide")
    lines.append(payload.get("setup_guide", ""))
    lines.append("")
    lines.append("## API Summary")
    lines.append(payload.get("api_summary", ""))
    lines.append("")
    lines.append(f"**Confidence:** {payload.get('confidence', '')}")
    return "\n".join(lines)
