"""
Tiger AI Gateway Client
Stack AI Foundation – Agentic AI Explorer – Level 2
Handles LLM calls via Tiger's AI Gateway or fallback providers.
"""

from typing import List, Dict, Any, Optional
from openai import OpenAI
from src.config import config

class TigerGatewayClient:
    def __init__(self):
        self.base_url = config.tiger_gateway_url
        self.api_key = config.tiger_gateway_key or "placeholder_key"
        self.user_email = config.user_email
        self.project_id = config.project_id
        self.model_name = config.model_name

        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            default_headers={
                "X-User-Email": self.user_email,
                "X-Project-Id": self.project_id,
                "X-Gateway-Route": "retail-operations"
            }
        )

    def generate_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.0,
        max_tokens: int = 1500
    ) -> str:
        """Invokes the LLM via Tiger AI Gateway."""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            # Fallback or informative exception handling
            raise RuntimeError(f"Tiger AI Gateway Call Failed: {str(e)}")

# Singleton instance
gateway_client = TigerGatewayClient()
