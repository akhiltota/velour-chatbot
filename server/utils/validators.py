"""
utils/validators.py
────────────────────
Input validation and sanitisation helpers.
All user input is cleaned before being passed to services.
"""

import re
import html
from config.settings import settings


def sanitise_text(text: str) -> str:
    """
    Clean user input before processing.
    - HTML-escape to prevent injection
    - Strip leading/trailing whitespace
    - Truncate to max allowed length
    - Remove null bytes
    """
    if not isinstance(text, str):
        return ""
    # Remove null bytes
    text = text.replace("\x00", "")
    # Strip dangerous HTML
    text = html.escape(text)
    # Trim whitespace
    text = text.strip()
    # Enforce length limit
    text = text[:settings.MAX_USER_MESSAGE_LENGTH]
    return text


def is_spam(text: str) -> bool:
    """
    Basic spam/abuse detection.
    Returns True if the message looks like spam and should be rejected.
    """
    lower = text.lower()

    spam_patterns = [
        r"http[s]?://",          # URLs (usually spam)
        r"\b(viagra|casino|forex|crypto invest)\b",
        r"(.)\1{9,}",            # Repeated chars: "aaaaaaaaa"
    ]

    for pattern in spam_patterns:
        if re.search(pattern, lower):
            return True

    # Too short to be meaningful (but allow emoji/short greetings)
    if len(text.strip()) == 0:
        return True

    return False
