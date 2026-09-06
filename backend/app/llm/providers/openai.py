import logging
import re
from time import perf_counter

from openai import AsyncOpenAI

from app.llm.base import LLMProvider
from app.llm.registry import register
from app.schemas.llm import LLMError, LLMResponse

logger = logging.getLogger("app.llm.openai")


def _strip_markdown_fences(text: str) -> str:
    stripped = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    stripped = re.sub(r"\n?```\s*$", "", stripped)
    return stripped.strip()


@register("openai")
class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, base_url: str | None = None, timeout_s: int = 60):
        self.model = model
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=timeout_s)

    async def generate(self, system: str, user: str) -> LLMResponse:
        started = perf_counter()
        logger.info("LLM REQUEST START: model=%s system_len=%d user_len=%d", self.model, len(system), len(user))
        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
        except Exception as exc:
            logger.error("LLM REQUEST FAILED after %ds: %s", int(perf_counter() - started), exc)
            raise LLMError(f"OpenAI provider error: {exc}") from exc
        latency_ms = int((perf_counter() - started) * 1000)
        usage = getattr(response, "usage", None)
        raw_text = response.choices[0].message.content or ""
        cleaned = _strip_markdown_fences(raw_text)
        if cleaned != raw_text.strip():
            logger.debug("Stripped markdown fences from LLM response")
        logger.info("LLM RESPONSE OK in %dms tokens=%d/%d", latency_ms, usage.prompt_tokens if usage else 0, usage.completion_tokens if usage else 0)
        return LLMResponse(
            text=cleaned,
            input_tokens=usage.prompt_tokens if usage else 0,
            output_tokens=usage.completion_tokens if usage else 0,
            latency_ms=latency_ms,
        )
