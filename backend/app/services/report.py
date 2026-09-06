from app.services.execution import INPUT_PRICE_PER_M, OUTPUT_PRICE_PER_M

REPORT_SECTIONS = [
    "project_metadata",
    "requirements",
    "architecture",
    "planning",
    "backend",
    "frontend",
    "qa",
    "documentation",
]


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def generate_report(state: dict) -> tuple[dict, str, float, int, float]:
    report = {section: state.get(section) or {} for section in REPORT_SECTIONS}

    confidences = [
        float((state.get(section) or {}).get("confidence"))
        for section in REPORT_SECTIONS
        if (state.get(section) or {}).get("confidence") is not None
    ]
    quality_score = round(_mean(confidences), 2)

    log = state.get("execution_log") or []
    tokens_in = sum((entry.get("tokens") or {}).get("input", 0) for entry in log)
    tokens_out = sum((entry.get("tokens") or {}).get("output", 0) for entry in log)
    execution_cost = round(
        tokens_in / 1_000_000 * INPUT_PRICE_PER_M
        + tokens_out / 1_000_000 * OUTPUT_PRICE_PER_M,
        4,
    )
    execution_time_ms = sum(entry.get("execution_ms") or 0 for entry in log)

    markdown = build_report_markdown(report, state, quality_score, execution_cost, execution_time_ms)
    return report, markdown, quality_score, execution_time_ms, execution_cost


def build_report_markdown(
    report: dict, state: dict, quality_score: float, execution_cost: float, execution_time_ms: int
) -> str:
    lines = [
        "# AutoDev Project Report",
        "",
        f"**Project:** {(report.get('project_metadata') or {}).get('project_name', 'Untitled')}",
        "",
    ]
    for artifact in state.get("artifacts") or []:
        if artifact.get("agent") == "report":
            continue
        lines.append(f"<!-- section: {artifact.get('filename')} -->")
        lines.append(artifact.get("markdown", ""))
        lines.append("")
    lines.append("---")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Quality score:** {quality_score}")
    lines.append(f"- **Execution time:** {execution_time_ms} ms")
    lines.append(f"- **Estimated cost:** ${execution_cost}")
    lines.append("")
    return "\n".join(lines)
