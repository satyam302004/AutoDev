from typing import Type

from app.llm.base import LLMProvider

PROVIDER_REGISTRY: dict[str, Type[LLMProvider]] = {}


def register(name: str):
    def decorator(cls: Type[LLMProvider]) -> Type[LLMProvider]:
        PROVIDER_REGISTRY[name] = cls
        return cls

    return decorator
