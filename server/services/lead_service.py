"""
services/lead_service.py
─────────────────────────
Lead scoring, structured lead object creation, AI-powered extraction,
and persistence to the local JSONL leads log.

Lead temperature:  0–39 = Cold | 40–79 = Warm | 80–100 = Hot
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from openai import OpenAI
from config.settings import settings

logger = logging.getLogger("velour.lead_service")


# ──────────────────────────────────────────────
# Lead Object Schema
# ──────────────────────────────────────────────
def make_lead(session_id: str) -> dict:
    return {
        "session_id": session_id,
        "timestamp": None,
        "name": None,
        "email": None,
        "phone": None,
        "category_interest": None,   # Dresses / Co-ords / Office Wear …
        "occasion": None,            # Office / Party / Wedding …
        "buying_intent": "low",      # low / medium / high
        "lead_score": 0,
        "lead_temperature": "Cold",
        "chat_summary": None,
        "source": "Website Chatbot",
        "synced_to_sheets": False,
    }


# ──────────────────────────────────────────────
# Lead Scoring Rules
# ──────────────────────────────────────────────
SCORE_RULES = {
    "email_provided":        25,
    "phone_provided":        25,
    "requested_recs":        10,
    "asked_product_q":       10,
    "asked_pricing_q":       10,
    "requested_support":     20,
    "gave_category":          5,
    "gave_occasion":          5,
    "completed_flow":        15,
}


def apply_score(lead: dict, rule: str) -> dict:
    """Add points for a scoring event. Caps at 100."""
    pts = SCORE_RULES.get(rule, 0)
    lead["lead_score"] = min(100, lead["lead_score"] + pts)
    lead["lead_temperature"] = _temperature(lead["lead_score"])
    return lead


def _temperature(score: int) -> str:
    if score >= 80:
        return "Hot"
    if score >= 40:
        return "Warm"
    return "Cold"


def finalize_lead(lead: dict) -> dict:
    """Set timestamp and final temperature before saving."""
    lead["timestamp"] = datetime.now(timezone.utc).isoformat()
    lead["lead_temperature"] = _temperature(lead["lead_score"])
    return lead


# ──────────────────────────────────────────────
# AI Lead Extraction
# ──────────────────────────────────────────────
def extract_lead_with_ai(
    conversation_history: list[dict],
    current_lead: dict,
) -> dict:
    """
    Secondary GPT call: extract structured lead fields from conversation.
    Runs after lead capture is complete to fill in anything missed.
    Returns an updated lead dict.
    """
    if not settings.OPENAI_API_KEY:
        return current_lead

    transcript = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in conversation_history[-20:]
    )

    prompt = f"""Analyse this customer support chat transcript from a fashion e-commerce store.
Extract the following as a JSON object (use null if not found):
{{
  "name": string or null,
  "email": string or null,
  "phone": string or null,
  "category_interest": string or null,  // e.g. Dresses, Co-ords, Office Wear
  "occasion": string or null,           // e.g. Office, Party, Wedding, Casual
  "buying_intent": "low" | "medium" | "high",
  "chat_summary": string                // 1-2 sentence summary of what customer wants
}}

Transcript:
{transcript}

Respond ONLY with the JSON object. No explanation."""

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",  # cheap model for extraction
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0,
        )
        raw = resp.choices[0].message.content.strip()
        # Strip markdown fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        extracted = json.loads(raw)

        # Merge: only fill fields that are still None
        for field in ["name", "email", "phone", "category_interest", "occasion", "buying_intent", "chat_summary"]:
            if current_lead.get(field) is None and extracted.get(field) is not None:
                current_lead[field] = extracted[field]

        logger.info(f"AI extraction complete | session={current_lead['session_id'][:8]}")
    except Exception as e:
        logger.warning(f"AI lead extraction failed: {e}")

    return current_lead


# ──────────────────────────────────────────────
# Persistence
# ──────────────────────────────────────────────
def save_lead_to_file(lead: dict) -> None:
    """Append the lead to the JSONL leads log."""
    if not settings.LOG_CHAT_TO_FILE:
        return
    try:
        os.makedirs(os.path.dirname(settings.LEADS_LOG_FILE), exist_ok=True)
        with open(settings.LEADS_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(lead, ensure_ascii=False) + "\n")
        logger.info(f"Lead saved | score={lead['lead_score']} | temp={lead['lead_temperature']}")
    except Exception as e:
        logger.error(f"Lead save failed: {e}")


def load_all_leads() -> list[dict]:
    """Read all leads from the JSONL file."""
    path = settings.LEADS_LOG_FILE
    if not os.path.exists(path):
        return []
    leads = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    leads.append(json.loads(line))
                except Exception:
                    pass
    return sorted(leads, key=lambda x: x.get("timestamp", ""), reverse=True)
