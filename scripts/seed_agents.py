import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.llm.base import LLMService
from app.llm.factory import build_provider
from app.prompts.loader import PromptLoader
from app.services.execution import ExecutionStore, run_execution
from app.workflows.graph import build_graph


async def main() -> None:
    settings = get_settings()
    idea = sys.argv[1] if len(sys.argv) > 1 else "Build a Library Management System"

    if settings.llm_configured:
        service = LLMService(provider=build_provider(settings))
        print(f"[seed] using real provider: {settings.llm_provider}")
    else:
        from tests.fake_llm import FakeLLM
        from tests.samples import ALL_SAMPLES

        service = LLMService(provider=FakeLLM(samples=ALL_SAMPLES))
        print("[seed] LLM not configured - using FakeLLM")

    store = ExecutionStore()
    graph = build_graph(service, PromptLoader())
    execution = await run_execution(idea, graph, store)

    print("\n".join(execution.timeline))
    print("\nArtifacts produced:")
    for artifact in execution.result.get("report", {}):
        print(f"  - {artifact}")
    print("\nFinal JSON (summary):")
    summary = {
        "status": execution.result.get("status"),
        "project_name": execution.result.get("project_name"),
        "quality_score": execution.result.get("quality_score"),
        "execution_time_ms": execution.result.get("execution_time_ms"),
        "execution_cost": execution.result.get("execution_cost"),
        "sections": sorted(execution.result.get("report", {}).keys()),
    }
    print(json.dumps(summary, indent=2))
    print(f"\nStored executions: {len(store.list())}")


if __name__ == "__main__":
    asyncio.run(main())
