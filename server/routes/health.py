"""
routes/health.py
─────────────────
GET + HEAD /api/health — supports both UptimeRobot (HEAD) and browser (GET)
"""

from fastapi import APIRouter, Response
from config.settings import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "Velour AI Chatbot API",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "ai_configured": bool(settings.OPENAI_API_KEY),
    }


@router.head("/health")
async def health_head():
    """UptimeRobot uses HEAD requests — return 200 with empty body."""
    return Response(status_code=200)