"""
routes/chat.py
───────────────
POST /api/chat         — non-streaming (lead capture flow)
POST /api/chat/stream  — SSE streaming (main AI conversation)

NVIDIA NIM model: openai/gpt-oss-120b
Handles both content and reasoning_content tokens in the stream.
"""

import json
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from openai import OpenAI

from controllers.chat_controller import process_message, get_session
from services.prompt_engine import build_system_prompt, build_fallback_response
from utils.validators import is_spam, sanitise_text
from config.settings import settings

router = APIRouter()
logger = logging.getLogger("velour.routes.chat")


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: str = Field(default="", max_length=64)

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        return v

    @field_validator("session_id")
    @classmethod
    def normalise_session_id(cls, v: str) -> str:
        return v.strip()


class ChatResponse(BaseModel):
    reply: str
    step: str
    session_id: str
    user_name: Optional[str] = None
    lead_captured: bool = False
    lead_score: int = 0
    lead_temperature: str = "Cold"
    show_cta: bool = False
    cta_type: Optional[str] = None


# ──────────────────────────────────────────────
# Helper — build a shared NIM client
# ──────────────────────────────────────────────
def _nim_client() -> OpenAI:
    return OpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,   # https://integrate.api.nvidia.com/v1
    )


# ──────────────────────────────────────────────
# Non-streaming endpoint  (lead capture steps)
# ──────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, request: Request):
    if is_spam(body.message):
        raise HTTPException(status_code=400, detail="Message rejected.")

    session_id = body.session_id or str(uuid.uuid4())
    ip = request.client.host if request.client else None
    result = await process_message(
        session_id=session_id,
        user_message=body.message,
        ip_address=ip,
    )
    return ChatResponse(session_id=session_id, **result)


# ──────────────────────────────────────────────
# Streaming SSE endpoint  (main AI conversation)
# ──────────────────────────────────────────────
@router.post("/chat/stream")
async def chat_stream(body: ChatRequest, request: Request):
    """
    SSE stream using NVIDIA NIM openai/gpt-oss-120b.

    Event format:
      data: {"token": "..."}          — each streamed word/token
      data: {"done": true, "meta": {…}} — final event with session metadata
    """
    if is_spam(body.message):
        raise HTTPException(status_code=400, detail="Message rejected.")

    session_id = body.session_id or str(uuid.uuid4())
    ip = request.client.host if request.client else None

    session   = get_session(session_id)
    clean_msg = sanitise_text(body.message)
    lead      = session.get("lead", {})

    # ── Lead capture sub-flow: simulate streaming for scripted replies ──
    capture_stage = session.get("lead_capture_stage")
    if capture_stage and capture_stage != "done":
        result = await process_message(
            session_id=session_id,
            user_message=body.message,
            ip_address=ip,
        )

        async def fallback_stream():
            text  = result.get("reply", "")
            words = text.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'token': chunk})}\n\n"
            meta = {k: v for k, v in result.items() if k != "reply"}
            meta["session_id"] = session_id
            yield f"data: {json.dumps({'done': True, 'meta': meta})}\n\n"

        return StreamingResponse(
            fallback_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # ── Build messages for NIM ──────────────────────────────────────────
    history  = session.get("history", [])[-(settings.MAX_CONVERSATION_TURNS * 2):]
    messages = [
        {
            "role": "system",
            "content": build_system_prompt(
                user_name=lead.get("name"),
                lead_captured=bool(lead.get("email")),
                category_interest=session.get("category_interest"),
                occasion=session.get("occasion"),
            ),
        },
        *history,
        {"role": "user", "content": clean_msg},
    ]

    # ── SSE generator ──────────────────────────────────────────────────
    async def stream_generator():
        full_response = ""

        if not settings.OPENAI_API_KEY:
            # No key — stream the fallback response word by word
            fallback = build_fallback_response(clean_msg.lower(), lead.get("name"))
            for i, word in enumerate(fallback.split(" ")):
                chunk = word + (" " if i < len(fallback.split(" ")) - 1 else "")
                yield f"data: {json.dumps({'token': chunk})}\n\n"
            full_response = fallback
        else:
            try:
                client = _nim_client()
                stream = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,        # openai/gpt-oss-120b
                    messages=messages,
                    max_tokens=settings.OPENAI_MAX_TOKENS,  # 4096
                    temperature=settings.OPENAI_TEMPERATURE,
                    top_p=1,
                    stream=True,
                )

                for chunk in stream:
                    # Guard: some chunks have no choices (keep-alive pings)
                    if not getattr(chunk, "choices", None):
                        continue

                    delta = chunk.choices[0].delta

                    # reasoning_content — internal chain-of-thought, skip streaming to user
                    # (we capture it silently so it doesn't appear in chat bubbles)
                    reasoning = getattr(delta, "reasoning_content", None)
                    if reasoning:
                        # Optionally log reasoning for debugging
                        logger.debug(f"[reasoning] {reasoning}")
                        continue  # Don't send reasoning tokens to frontend

                    # Normal content token
                    token = delta.content or ""
                    if token:
                        full_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

            except Exception as e:
                logger.error(f"NIM streaming error: {e}", exc_info=True)
                fallback = build_fallback_response(clean_msg.lower(), lead.get("name"))
                for word in fallback.split(" "):
                    yield f"data: {json.dumps({'token': word + ' '})}\n\n"
                full_response = fallback

        # ── After stream ends: update session state & lead scoring ──────
        result = await process_message(
            session_id=session_id,
            user_message=body.message,
            ip_address=ip,
            ai_reply=full_response,
        )
        meta = {k: v for k, v in result.items() if k != "reply"}
        meta["session_id"] = session_id
        yield f"data: {json.dumps({'done': True, 'meta': meta})}\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
