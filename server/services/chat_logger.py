"""
services/chat_logger.py
────────────────────────
Logs every conversation turn to a JSONL file for analytics.
Each line is a valid JSON object — easy to stream into BigQuery, Supabase, etc.

In a production SaaS setup, swap this for a database (Postgres/Supabase).
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from config.settings import settings

logger = logging.getLogger("velour.chat_logger")


class ChatLogger:
    def __init__(self):
        if settings.LOG_CHAT_TO_FILE:
            os.makedirs(os.path.dirname(settings.CHAT_LOG_FILE), exist_ok=True)

    def log(
        self,
        session_id: str,
        user_message: str,
        bot_response: str,
        user_name: Optional[str],
        used_ai: bool,
        ip_address: Optional[str] = None,
    ) -> None:
        """Append a chat turn to the JSONL log file."""
        if not settings.LOG_CHAT_TO_FILE:
            return

        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "ip": ip_address,
            "user_name": user_name,
            "user_msg": user_message,
            "bot_msg": bot_response,
            "used_ai": used_ai,
        }

        try:
            with open(settings.CHAT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Chat log write failed: {e}")


# ── Singleton ─────────────────────────────────
chat_logger = ChatLogger()
