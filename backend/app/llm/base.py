from abc import ABC, abstractmethod
from time import perf_counter

from app.schemas.llm import LLMResponse, ParsedResult, SchemaValidationError


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, system: str, user: str) -> LLMResponse:
        pass


class LLMService:
    def __init__(self, provider: LLMProvider):
        self.provider = provider

    async def generate(self, system: str, user: str, response_schema) -> ParsedResult:
        started = perf_counter()
        response = await self.provider.generate(system, user)
        latency_ms = int((perf_counter() - started) * 1000)
        try:
            parsed = response_schema.model_validate_json(response.text)
        except Exception as exc:
            raise SchemaValidationError(
                f"Response did not match {response_schema.__name__}: {exc}"
            ) from exc
        return ParsedResult(
            raw=response.text,
            parsed=parsed.model_dump(),
            latency_ms=latency_ms,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
        )
