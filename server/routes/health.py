"""
routes/health.py
─────────────────
GET /api/health — used by Render health checks and uptime monitors.
"""

from fastapi import APIRouter
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