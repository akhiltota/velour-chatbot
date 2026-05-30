"""
Velour AI Chatbot — FastAPI Backend
====================================
Production-ready secure backend. OpenAI powers the chat;
API key stays server-side only.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from config.settings import settings
from middleware.rate_limiter import RateLimiterMiddleware
from middleware.request_logger import RequestLoggerMiddleware
from routes.chat import router as chat_router
from routes.health import router as health_router
from routes.leads import router as leads_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("velour.main")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Velour AI Chatbot API",
        description="Secure backend — OpenAI streams chat, leads go to Google Sheets",
        version="2.0.0",
        docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
        redoc_url=None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-Session-ID", "X-Admin-Password"],
    )
    app.add_middleware(RateLimiterMiddleware)
    app.add_middleware(RequestLoggerMiddleware)

    app.include_router(health_router, prefix="/api", tags=["Health"])
    app.include_router(chat_router,   prefix="/api", tags=["Chat"])
    app.include_router(leads_router,  prefix="/api", tags=["Leads"])

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error. Please try again later."},
        )

    logger.info(
        f"✅ Velour API v2.0 started | ENV={settings.ENVIRONMENT} "
        f"| AI=OpenAI {settings.OPENAI_MODEL} "
        f"| Sheets={'configured' if settings.GOOGLE_SHEET_ID else 'not configured'}"
    )
    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
