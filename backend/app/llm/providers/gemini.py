import asyncio
from functools import partial
from time import perf_counter

from google import genai

from app.llm.base import LLMProvider
from app.llm.registry import register
from app.schemas.llm import LLMError, LLMResponse


@register("gemini")
class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, timeout_s: int = 60):
        self.api_key = api_key
        self.model = model
        self.timeout_ms = timeout_s * 1000
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = genai.Client(
                api_key=self.api_key,
                http_options=genai.types.HttpOptions(timeout=self.timeout_ms),
            )
        return self._client

    def _generate_sync(self, system: str, user: str):
        client = self._get_client()
        return client.models.generate_content(
            model=self.model,
            contents=user,
            config=genai.types.GenerateContentConfig(system_instruction=system),
        )

    async def generate(self, system: str, user: str) -> LLMResponse:
        started = perf_counter()
        try:
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None, partial(self._generate_sync, system, user)
            )
        except Exception as exc:
            raise LLMError(f"Gemini provider error: {exc}") from exc
        latency_ms = int((perf_counter() - started) * 1000)
        usage = getattr(response, "usage_metadata", None)
        return LLMResponse(
            text=response.text or "",
            input_tokens=usage.prompt_token_count if usage else 0,
            output_tokens=usage.candidates_token_count if usage else 0,
            latency_ms=latency_ms,
        )
