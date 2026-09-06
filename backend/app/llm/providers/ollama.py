from app.llm.base import LLMProvider
from app.llm.providers.openai import OpenAIProvider
from app.llm.registry import register


@register("ollama")
class OllamaProvider(OpenAIProvider):
    def __init__(self, base_url: str, model: str, api_key: str = "ollama", timeout_s: int = 60):
        super().__init__(api_key=api_key, model=model, base_url=base_url, timeout_s=timeout_s)
