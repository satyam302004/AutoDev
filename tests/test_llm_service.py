import pytest

from app.core.config import Settings
from app.llm.base import LLMService
from app.llm.factory import build_provider
from app.llm.registry import PROVIDER_REGISTRY
from app.schemas.agents import ProjectPlan
from app.schemas.llm import LLMError, SchemaValidationError
from tests.fake_llm import FakeLLM

SAMPLE_PLAN = {
    "project_name": "Food Delivery App",
    "validated": True,
    "complexity": "Medium",
    "estimated_agents": 7,
    "execution_plan": [
        "Requirements",
        "Planner",
        "Architecture",
        "Backend",
        "Frontend",
        "QA",
        "Documentation",
    ],
    "rationale": "Standard CRUD with delivery logistics.",
}


def test_registry_contains_all_providers():
    assert {"gemini", "openai", "ollama"} <= set(PROVIDER_REGISTRY)


def test_factory_builds_gemini():
    provider = build_provider(Settings(llm_provider="gemini"))
    assert provider.__class__.__name__ == "GeminiProvider"


def test_factory_builds_openai():
    provider = build_provider(Settings(llm_provider="openai"))
    assert provider.__class__.__name__ == "OpenAIProvider"


def test_factory_builds_ollama():
    provider = build_provider(Settings(llm_provider="ollama"))
    assert provider.__class__.__name__ == "OllamaProvider"
    assert provider.model == Settings(llm_provider="ollama").ollama_model


def test_factory_unknown_provider_raises(monkeypatch):
    from app.llm import factory

    monkeypatch.delitem(factory.PROVIDER_REGISTRY, "ollama")
    with pytest.raises(ValueError):
        build_provider(Settings(llm_provider="ollama"))


@pytest.mark.asyncio
async def test_generate_parses_and_validates():
    service = LLMService(provider=FakeLLM(sample=SAMPLE_PLAN))
    result = await service.generate("system", "user", ProjectPlan)
    assert result.parsed["project_name"] == "Food Delivery App"
    assert result.parsed["complexity"] == "Medium"
    assert result.input_tokens == 520
    assert result.output_tokens == 300


@pytest.mark.asyncio
async def test_invalid_json_raises_schema_error():
    service = LLMService(provider=FakeLLM(sample=SAMPLE_PLAN, mode="invalid_json"))
    with pytest.raises(SchemaValidationError):
        await service.generate("system", "user", ProjectPlan)


@pytest.mark.asyncio
async def test_empty_response_raises_schema_error():
    service = LLMService(provider=FakeLLM(sample=SAMPLE_PLAN, mode="empty"))
    with pytest.raises(SchemaValidationError):
        await service.generate("system", "user", ProjectPlan)


@pytest.mark.asyncio
async def test_timeout_propagates_llm_error():
    service = LLMService(provider=FakeLLM(sample=SAMPLE_PLAN, mode="timeout"))
    with pytest.raises(LLMError):
        await service.generate("system", "user", ProjectPlan)
