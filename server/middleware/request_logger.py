"""
middleware/request_logger.py
─────────────────────────────
Logs every incoming request with timing for performance monitoring.
"""

import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("velour.requests")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000)

        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} [{duration_ms}ms]"
        )
        return response
