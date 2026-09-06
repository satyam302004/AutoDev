from datetime import datetime
from pydantic import BaseModel


class LLMError(Exception):
    pass


class SchemaValidationError(Exception):
    pass


class LLMResponse(BaseModel):
    text: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: int = 0


class ParsedResult(BaseModel):
    raw: str
    parsed: dict
    latency_ms: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
