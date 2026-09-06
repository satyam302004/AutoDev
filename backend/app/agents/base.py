import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from time import perf_counter

from pydantic import BaseModel

from app.agents.tools import Tool, describe_tools, run_tools
from app.llm.base import LLMService
from app.prompts.loader import PromptLoader
from app.schemas.agents import AgentMetadata, AgentResult, TokenUsage
from app.schemas.llm import LLMError, SchemaValidationError
from app.workflows.state import AutoDevState

logger = logging.getLogger("app.agents")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AgentBase(ABC):
    name: str
    display_name: str = ""
    version: str = "1.0"
    output_schema: type[BaseModel]
    fallback_payload: dict
    next_agent: str | None = None
    retries: int = 2
    tools: list[Tool] = []

    def __init__(self, llm: LLMService, loader: PromptLoader):
        self.llm = llm
        self.loader = loader

    @abstractmethod
    def build_user_prompt(self, state: AutoDevState) -> str:
        pass

    def context_block(self, state: AutoDevState, keys: list[str], max_section_len: int = 3000) -> str:
        parts = []
        for key in keys:
            payload = state.get(key)
            if payload:
                label = key.replace("_", " ").title()
                text = json.dumps(payload, indent=2)
                if len(text) > max_section_len:
                    text = text[:max_section_len] + "\n... (truncated)"
                parts.append(f"## {label}\n{text}")
        return "\n\n".join(parts)

    def build_fallback(self, state: AutoDevState) -> dict:
        return dict(self.fallback_payload)

    def _with_tool_context(self, user: str) -> str:
        if not self.tools:
            return user
        block = run_tools(self.tools)
        if not block:
            return user
        return (
            f"{user}\n\n## Available tools\n{describe_tools(self.tools)}\n"
            f"## Tool results (use as reference)\n{block}"
        )

    async def run(self, state: AutoDevState) -> AgentResult:
        started = perf_counter()
        system = self.loader.load_system(self.name)
        user = self._with_tool_context(self.build_user_prompt(state))
        attempts: list[dict] = []
        parsed: dict | None = None
        final_status = "failed"
        tokens = TokenUsage()

        for attempt in range(1, self.retries + 2):
            try:
                result = await self.llm.generate(system, user, self.output_schema)
                parsed = result.parsed
                tokens = TokenUsage(input=result.input_tokens, output=result.output_tokens)
                final_status = "success" if attempt == 1 else "retry"
                attempts.append({"attempt": attempt, "status": final_status, "error": None})
                break
            except SchemaValidationError as exc:
                logger.warning("agent=%s schema_error attempt=%d: %s", self.name, attempt, exc)
                attempts.append({"attempt": attempt, "status": "retry", "error": str(exc)})
                user = (
                    f"{user}\n\nFeedback: your previous response failed JSON/schema "
                    f"validation: {exc} Return STRICT JSON matching the schema. "
                    f"No markdown fences."
                )
            except LLMError as exc:
                attempts.append({"attempt": attempt, "status": "retry", "error": str(exc)})

        if parsed is None:
            parsed = self.build_fallback(state)
            attempts.append(
                {
                    "attempt": self.retries + 1,
                    "status": "failed",
                    "error": "Fallback payload used after retries exhausted.",
                }
            )

        summary = "ok" if final_status != "failed" else "Fallback used after retries exhausted."
        metadata = AgentMetadata(
            agent=self.name,
            version=self.version,
            timestamp=utcnow(),
            execution_ms=int((perf_counter() - started) * 1000),
            tokens=tokens,
        )
        logger.info(
            "agent=%s status=%s attempts=%d ms=%d",
            self.name,
            final_status,
            len(attempts),
            metadata.execution_ms,
        )
        return AgentResult(
            agent=self.name,
            status=final_status,
            next_agent=self.next_agent,
            summary=summary,
            metadata=metadata,
            data=parsed,
        )
