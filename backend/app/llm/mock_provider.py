"""
Deterministic Rule-Based / Offline Mock Provider
Used when LLM API keys are not supplied or when LLM is unavailable.
Strictly labels outputs as 'Rule-based analysis' rather than pretending they were AI-generated.
"""

from typing import Optional, Dict, Any, Type
from pydantic import BaseModel
from app.llm.provider import LLMProvider, LLMResponse

class RuleBasedProvider(LLMProvider):
    def __init__(self, model: str = "deterministic_rule_based"):
        super().__init__(model=model, api_key=None, base_url=None)

    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: Optional[Type[BaseModel]] = None,
        temperature: float = 0.0
    ) -> LLMResponse:
        return LLMResponse(
            content="Deterministic rule-based analysis engine active. Real LLM key was not configured or offline mode was requested.",
            parsed_json=None,
            is_ai_generated=False,
            provider="deterministic_rule_based",
            model="rule_engine_v1",
            latency_ms=1,
            fallback_used=True,
            error=None
        )
