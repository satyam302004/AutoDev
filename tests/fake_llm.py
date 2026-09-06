import json

from app.schemas.llm import LLMError, LLMResponse


class FakeLLM:
    def __init__(self, sample=None, mode="perfect", samples=None):
        if samples is None:
            samples = [sample]
        self.samples = [samples] if isinstance(samples, dict) else list(samples)
        self.scenarios = [mode] if isinstance(mode, str) else list(mode)
        self.calls = 0

    async def generate(self, system: str, user: str) -> LLMResponse:
        self.calls += 1
        idx = self.calls - 1
        scenario = self.scenarios[min(idx, len(self.scenarios) - 1)]
        sample = self.samples[min(idx, len(self.samples) - 1)]
        if scenario == "timeout":
            raise LLMError("simulated timeout")
        if scenario == "invalid_json":
            return LLMResponse(text="This is not JSON at all")
        if scenario == "empty":
            return LLMResponse(text="")
        if scenario == "hallucinated_fields":
            return LLMResponse(
                text=json.dumps({"totally_wrong": True, "not_in_schema": [1, 2, 3]})
            )
        if scenario == "wrong_schema":
            return LLMResponse(text=json.dumps({"agent": "another_agent"}))
        return LLMResponse(
            text=json.dumps(sample),
            input_tokens=520,
            output_tokens=300,
            latency_ms=320,
        )
