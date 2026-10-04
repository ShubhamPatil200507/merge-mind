"""
LLM Provider Factory
Constructs the active provider according to environment variables:
LLM_PROVIDER ('openai', 'groq', 'ollama', 'openrouter', 'mock', 'rule_based')
LLM_MODEL
LLM_API_KEY
LLM_BASE_URL
"""

import os
from typing import Optional
from app.llm.provider import LLMProvider
from app.llm.openai_provider import OpenAIProvider
from app.llm.mock_provider import RuleBasedProvider

def get_llm_provider(
    provider_override: Optional[str] = None,
    model_override: Optional[str] = None,
    api_key_override: Optional[str] = None,
    base_url_override: Optional[str] = None
) -> LLMProvider:
    provider = (provider_override or os.getenv("LLM_PROVIDER", "mock")).lower().strip()
    model = model_override or os.getenv("LLM_MODEL", "gpt-4o-mini").strip()
    api_key = api_key_override or os.getenv("LLM_API_KEY", "").strip()
    base_url = base_url_override or os.getenv("LLM_BASE_URL", "").strip()

    if provider in ["openai", "groq", "ollama", "openrouter", "deepseek"]:
        if not base_url:
            if provider == "groq":
                base_url = "https://api.groq.com/openai/v1"
            elif provider == "ollama":
                base_url = "http://localhost:11434/v1"
            elif provider == "openrouter":
                base_url = "https://openrouter.ai/api/v1"
            elif provider == "deepseek":
                base_url = "https://api.deepseek.com/v1"
            else:
                base_url = "https://api.openai.com/v1"

        return OpenAIProvider(model=model, api_key=api_key or None, base_url=base_url)

    # Default to transparent rule-based deterministic provider
    return RuleBasedProvider()
