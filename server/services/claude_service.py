"""
services/claude_service.py  —  NVIDIA NIM edition
───────────────────────────────────────────────────
All AI API communication lives here. The API key NEVER leaves the server.

Uses OpenAI-compatible SDK pointed at NVIDIA NIM:
  base_url : https://integrate.api.nvidia.com/v1
  model    : openai/gpt-oss-120b
  key      : loaded from .env → OPENAI_API_KEY
"""

import logging
from typing import Optional

from openai import OpenAI, RateLimitError, AuthenticationError, APIConnectionError

from config.settings import settings
from services.prompt_engine import build_system_prompt, build_fallback_response

logger = logging.getLogger("velour.ai_service")


class AIService:
    """
    Manages all interactions with the NVIDIA NIM API (OpenAI-compatible).
    Instantiated once at startup and reused across all requests.
    """

    def __init__(self):
        if not settings.OPENAI_API_KEY:
            logger.warning("⚠️  OPENAI_API_KEY not set — fallback responses only.")
            self._client = None
        else:
            self._client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,   # NVIDIA NIM endpoint
            )
            logger.info(
                f"✅ NVIDIA NIM client ready | "
                f"model={settings.OPENAI_MODEL} | "
                f"base={settings.OPENAI_BASE_URL}"
            )

    async def get_response(
        self,
        user_message: str,
        conversation_history: list[dict],
        user_name: Optional[str] = None,
        lead_captured: bool = False,
    ) -> tuple[str, bool]:
        """
        Get a response from the NVIDIA NIM model.
        Handles both normal content and reasoning_content tokens.

        Returns: (response_text, used_ai: bool)
        """
        if not self._client:
            return build_fallback_response(user_message.lower(), user_name), False

        # Trim history to control token costs
        trimmed_history = conversation_history[-(settings.MAX_CONVERSATION_TURNS * 2):]

        messages = [
            {
                "role": "system",
                "content": build_system_prompt(
                    user_name=user_name,
                    lead_captured=lead_captured,
                ),
            },
            *trimmed_history,
            {"role": "user", "content": user_message},
        ]

        try:
            # Non-streaming call for the controller path
            completion = self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                top_p=1,
                stream=False,
            )

            # gpt-oss-120b may return reasoning_content separately
            choice = completion.choices[0]
            reasoning = getattr(choice.message, "reasoning_content", None)
            content   = choice.message.content or ""

            # Use content for the reply; reasoning is internal chain-of-thought
            reply = content.strip()
            if not reply and reasoning:
                # Fallback: if only reasoning came back, use it
                reply = reasoning.strip()

            logger.info(
                f"NIM response | model={settings.OPENAI_MODEL} "
                f"| tokens={completion.usage.prompt_tokens}+{completion.usage.completion_tokens}"
            )
            return reply, True

        except RateLimitError:
            logger.warning("NIM rate limit hit")
            return (
                "I'm experiencing high traffic right now! Please try again in a moment, "
                "or email care@velour.in for immediate help. 😊",
                False,
            )
        except AuthenticationError:
            logger.error("NIM auth failed — check OPENAI_API_KEY in .env")
            return build_fallback_response(user_message.lower(), user_name), False
        except APIConnectionError:
            logger.error("NIM connection failed")
            return build_fallback_response(user_message.lower(), user_name), False
        except Exception as e:
            logger.error(f"NIM unexpected error: {e}", exc_info=True)
            return build_fallback_response(user_message.lower(), user_name), False


# ── Singleton ─────────────────────────────────
claude_service = AIService()
