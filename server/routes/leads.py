"""
routes/leads.py
────────────────
Admin API endpoints — lead dashboard data.
Protected by a simple password header.
"""

import logging
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from controllers.chat_controller import get_all_sessions_summary
from services.lead_service import load_all_leads
from services.sheets_service import get_sheets_status
from config.settings import settings

router = APIRouter()
logger = logging.getLogger("velour.routes.leads")


def _auth(x_admin_password: Optional[str]):
    if x_admin_password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized.")


@router.get("/leads")
async def get_leads(x_admin_password: Optional[str] = Header(default=None)):
    _auth(x_admin_password)
    leads = load_all_leads()
    total = len(leads)
    hot   = sum(1 for l in leads if l.get("lead_temperature") == "Hot")
    warm  = sum(1 for l in leads if l.get("lead_temperature") == "Warm")
    cold  = sum(1 for l in leads if l.get("lead_temperature") == "Cold")

    # Category interest analytics
    cat_counts: dict[str, int] = {}
    for l in leads:
        cat = l.get("category_interest")
        if cat:
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

    return {
        "stats": {
            "total": total,
            "hot": hot,
            "warm": warm,
            "cold": cold,
        },
        "category_analytics": cat_counts,
        "sheets_status": get_sheets_status(),
        "recent_leads": leads[:50],          # latest 50
        "active_sessions": get_all_sessions_summary(),
    }


@router.get("/leads/health")
async def leads_health():
    """Public endpoint — just confirms the leads API is running."""
    return {"status": "ok", "sheets": get_sheets_status()}
