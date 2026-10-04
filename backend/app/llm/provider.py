"""
MergeMind LLM Provider Abstraction
Defines interface for language model reasoning engines with prompt injection defense,
structured schema validation, and transparent error handling.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Type
from pydantic import BaseModel

class LLMResponse(BaseModel):
    content: str
    parsed_json: Optional[Dict[str, Any]] = None
    is_ai_generated: bool = True
    provider: str
    model: str
    latency_ms: int = 0
    token_usage: Dict[str, int] = {}
    fallback_used: bool = False
    error: Optional[str] = None

class LLMProvider(ABC):
    """Abstract base class for all LLM reasoning providers."""

    def __init__(self, model: str, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
        temperature: float = 0.2
    ) -> LLMResponse:
        """
        Executes reasoning call to the model and validates output against response_schema if provided.
        """
        pass
