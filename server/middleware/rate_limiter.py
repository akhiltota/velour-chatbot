"""
middleware/rate_limiter.py
──────────────────────────
In-memory rate limiter. Prevents API abuse and protects Claude API costs.
Per-IP: max N requests per window (configurable in settings).

For multi-instance production, replace with Redis-backed rate limiting
(e.g. slowapi + Redis).
"""

import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from config.settings import settings

logger = logging.getLogger("velour.rate_limiter")

# { ip_address: [timestamp, timestamp, ...] }
_request_log: dict[str, list[float]] = defaultdict(list)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only rate-limit the chat endpoint
        if not request.url.path.startswith("/api/chat"):
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = settings.RATE_LIMIT_WINDOW_SECONDS

        # Remove timestamps outside the current window
        _request_log[ip] = [ts for ts in _request_log[ip] if now - ts < window]

        if len(_request_log[ip]) >= settings.RATE_LIMIT_REQUESTS:
            logger.warning(f"Rate limit exceeded | ip={ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": f"Too many requests. Please wait a moment and try again.",
                    "retry_after": window,
                },
                headers={"Retry-After": str(window)},
            )

        _request_log[ip].append(now)
        return await call_next(request)
