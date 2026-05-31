"""
services/sheets_service.py
───────────────────────────
Google Sheets integration via Service Account.
Supports both base64-encoded and plain JSON credentials.
"""

import json
import base64
import logging
import time
from typing import Optional

from config.settings import settings

logger = logging.getLogger("velour.sheets_service")

SHEET_HEADERS = [
    "Timestamp", "Name", "Email", "Phone",
    "Category Interest", "Occasion", "Lead Score",
    "Lead Temperature", "Buying Intent", "Chat Summary",
    "Session ID", "Source",
]

_sheets_available = False
_gspread = None
_google_auth = None


def _lazy_import():
    global _gspread, _google_auth, _sheets_available
    if _sheets_available:
        return True
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        _gspread = gspread
        _google_auth = Credentials
        _sheets_available = True
        return True
    except ImportError:
        logger.warning("gspread / google-auth not installed.")
        return False


def _get_client():
    if not _lazy_import():
        return None

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    try:
        if settings.GOOGLE_CREDENTIALS_JSON:
            raw = settings.GOOGLE_CREDENTIALS_JSON.strip()
            # Try base64 decode first
            try:
                decoded = base64.b64decode(raw).decode("utf-8")
                info = json.loads(decoded)
            except Exception:
                # Fallback: plain JSON string
                info = json.loads(raw)
            creds = _google_auth.from_service_account_info(info, scopes=scopes)

        elif settings.GOOGLE_CREDENTIALS_FILE:
            creds = _google_auth.from_service_account_file(
                settings.GOOGLE_CREDENTIALS_FILE, scopes=scopes
            )
        else:
            logger.warning("No Google credentials configured.")
            return None

        return _gspread.authorize(creds)
    except Exception as e:
        logger.error(f"Google auth failed: {e}")
        return None


def _get_worksheet():
    if not settings.GOOGLE_SHEET_ID:
        return None
    client = _get_client()
    if not client:
        return None
    try:
        sheet = client.open_by_key(settings.GOOGLE_SHEET_ID)
        try:
            ws = sheet.worksheet(settings.GOOGLE_SHEET_NAME)
        except _gspread.exceptions.WorksheetNotFound:
            ws = sheet.add_worksheet(
                title=settings.GOOGLE_SHEET_NAME,
                rows=1000,
                cols=len(SHEET_HEADERS)
            )
        if ws.row_count == 0 or ws.cell(1, 1).value != SHEET_HEADERS[0]:
            ws.insert_row(SHEET_HEADERS, index=1)
        return ws
    except Exception as e:
        logger.error(f"Worksheet access failed: {e}")
        return None


def push_lead_to_sheets(lead: dict) -> bool:
    row = [
        lead.get("timestamp", ""),
        lead.get("name", ""),
        lead.get("email", ""),
        lead.get("phone", ""),
        lead.get("category_interest", ""),
        lead.get("occasion", ""),
        lead.get("lead_score", 0),
        lead.get("lead_temperature", "Cold"),
        lead.get("buying_intent", "low"),
        lead.get("chat_summary", ""),
        lead.get("session_id", "")[:16],
        lead.get("source", "Website Chatbot"),
    ]
    for attempt in range(1, 4):
        try:
            ws = _get_worksheet()
            if not ws:
                return False
            ws.append_row(row, value_input_option="USER_ENTERED")
            logger.info(f"✅ Lead pushed to Sheets | email={lead.get('email')}")
            return True
        except Exception as e:
            logger.warning(f"Sheets push attempt {attempt} failed: {e}")
            if attempt < 3:
                time.sleep(2 ** attempt)
    return False


def get_sheets_status() -> dict:
    if not settings.GOOGLE_SHEET_ID:
        return {"configured": False, "status": "Not configured"}
    if not _lazy_import():
        return {"configured": False, "status": "Library not installed"}
    try:
        ws = _get_worksheet()
        if ws:
            rows = max(0, ws.row_count - 1)
            return {"configured": True, "status": "Connected", "rows": rows}
        return {"configured": True, "status": "Auth failed"}
    except Exception as e:
        return {"configured": True, "status": f"Error: {str(e)[:60]}"}