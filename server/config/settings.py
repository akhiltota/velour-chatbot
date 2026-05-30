"""
config/settings.py
──────────────────
All secrets come from .env — NEVER hard-coded in Python files.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── API Credentials ───────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    # ── App ───────────────────────────────────
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    ADMIN_PASSWORD: str = "velour-admin-2025"

    # ── CORS ──────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ── Rate Limiting ─────────────────────────
    RATE_LIMIT_REQUESTS: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # ── NVIDIA NIM / OpenAI-compatible model ──
    OPENAI_MODEL: str = "openai/gpt-oss-120b"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 1.0

    # ── Chat ──────────────────────────────────
    MAX_CONVERSATION_TURNS: int = 30
    MAX_USER_MESSAGE_LENGTH: int = 1000

    # ── Logging ───────────────────────────────
    LOG_CHAT_TO_FILE: bool = True
    CHAT_LOG_FILE: str = "logs/chat_history.jsonl"
    LEADS_LOG_FILE: str = "logs/leads.jsonl"

    # ── Google Sheets ─────────────────────────
    GOOGLE_CREDENTIALS_FILE: str = "config/google_credentials.json"
    GOOGLE_CREDENTIALS_JSON: str = ""
    GOOGLE_SHEET_ID: str = ""
    GOOGLE_SHEET_NAME: str = "Leads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
