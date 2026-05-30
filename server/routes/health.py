"""
routes/health.py
─────────────────
GET /api/health — used by Render/Railway health checks and uptime monitors.
Returns environment info (without secrets).
"""

from fastapi import APIRouter
from config.settings import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "Velour AI Chatbot API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "ai_configured": bool(settings.ANTHROPIC_API_KEY),
    }
