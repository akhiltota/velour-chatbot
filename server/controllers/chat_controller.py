"""
controllers/chat_controller.py
───────────────────────────────
Business logic: conversation flow, lead scoring, session management.
Now handles multi-step fashion discovery + natural lead capture.
"""

import logging
import re
from typing import Optional

from services.lead_service import (
    make_lead, apply_score, finalize_lead,
    extract_lead_with_ai, save_lead_to_file,
)
from services.sheets_service import push_lead_to_sheets
from services.chat_logger import chat_logger
from utils.validators import sanitise_text
from config.settings import settings

logger = logging.getLogger("velour.chat_controller")


# ──────────────────────────────────────────────
# In-Memory Session Store
# Production: swap for Redis
# ──────────────────────────────────────────────
_sessions: dict[str, dict] = {}


def get_session(session_id: str) -> dict:
    if session_id not in _sessions:
        _sessions[session_id] = {
            # Conversation flow
            "step": "greeting",
            "history": [],
            "message_count": 0,
            # Lead object
            "lead": make_lead(session_id),
            # Fashion context
            "category_interest": None,
            "occasion": None,
            # CTA state
            "show_cta": False,
            "cta_type": None,
            # Lead capture sub-steps
            "lead_capture_stage": None,  # None / "ask_share" / "name" / "email" / "phone"
        }
    return _sessions[session_id]


def get_session_lead(session_id: str) -> Optional[dict]:
    """Return the current lead for a session (for the admin API)."""
    return _sessions.get(session_id, {}).get("lead")


def _add_to_history(session: dict, role: str, content: str):
    session["history"].append({"role": role, "content": content})
    max_turns = settings.MAX_CONVERSATION_TURNS * 2
    if len(session["history"]) > max_turns:
        session["history"] = session["history"][-max_turns:]


def _is_valid_email(text: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", text.strip()))


def _is_valid_phone(text: str) -> bool:
    digits = re.sub(r"\D", "", text)
    return 10 <= len(digits) <= 13


def _detect_buying_signals(text: str) -> bool:
    signals = ["buy", "purchase", "order", "how much", "price", "cost",
               "add to cart", "want this", "love this", "recommend", "suggest"]
    return any(s in text.lower() for s in signals)


def _detect_category(text: str) -> Optional[str]:
    lower = text.lower()
    mapping = {
        "dress": "Dresses", "frock": "Dresses",
        "co-ord": "Co-ords", "coord": "Co-ords", "set": "Co-ords",
        "top": "Tops", "blouse": "Tops", "shirt": "Tops",
        "trouser": "Bottoms", "skirt": "Bottoms", "pant": "Bottoms",
        "blazer": "Outerwear", "jacket": "Outerwear", "coat": "Outerwear",
        "office": "Office Wear", "work wear": "Office Wear",
        "casual": "Casual Wear", "party": "Party Wear",
    }
    for kw, cat in mapping.items():
        if kw in lower:
            return cat
    return None


def _detect_occasion(text: str) -> Optional[str]:
    lower = text.lower()
    mapping = {
        "office": "Office", "work": "Office", "corporate": "Office",
        "party": "Party", "club": "Party", "night out": "Party",
        "wedding": "Wedding", "shaadi": "Wedding", "reception": "Wedding",
        "casual": "Daily Wear", "daily": "Daily Wear", "everyday": "Daily Wear",
        "vacation": "Vacation", "holiday": "Vacation", "travel": "Vacation",
        "date": "Date Night",
    }
    for kw, occ in mapping.items():
        if kw in lower:
            return occ
    return None


# ──────────────────────────────────────────────
# Determine CTA to show
# ──────────────────────────────────────────────
def _determine_cta(session: dict) -> Optional[str]:
    lead = session["lead"]
    score = lead["lead_score"]
    has_email = lead["email"] is not None

    if not has_email and score >= 20 and session["message_count"] >= 3:
        return "get_recommendations"  # nudge to share email
    if has_email and score >= 50:
        return "view_products"
    if session["category_interest"] and not has_email:
        return "send_to_email"
    return None


# ──────────────────────────────────────────────
# Non-streaming: lead capture steps
# ──────────────────────────────────────────────
async def process_lead_capture_message(
    session: dict,
    clean_msg: str,
    ip_address: Optional[str],
) -> Optional[dict]:
    """
    Handle the name/email/phone capture sub-flow.
    Returns a response dict if we handled it, None if we should fall through to AI.
    """
    stage = session["lead_capture_stage"]
    lead = session["lead"]

    if stage == "ask_share":
        # User responded to "Want me to send picks to your inbox?"
        lower = clean_msg.lower()
        yes_signals = ["yes", "sure", "ok", "okay", "please", "yeah", "yep", "sounds good", "great"]
        if any(s in lower for s in yes_signals):
            session["lead_capture_stage"] = "name"
            reply = "Lovely! 😊 What's your name so I can personalise it for you?"
        else:
            session["lead_capture_stage"] = None
            reply = "No worries at all! Feel free to ask me anything about our collection. 😊"
        return {"reply": reply, "step": "main", "show_cta": False, "cta_type": None}

    if stage == "name":
        name = clean_msg.strip().split()[0].capitalize() if clean_msg.strip() else None
        if name and len(name) >= 2:
            lead["name"] = name
            session["lead_capture_stage"] = "email"
            reply = f"Great to meet you, {name}! 🌸 What's your email? I'll send your curated picks right there."
        else:
            reply = "Could you share your name? Just your first name is fine! 😊"
        return {"reply": reply, "step": "main", "show_cta": False, "cta_type": None}

    if stage == "email":
        if _is_valid_email(clean_msg):
            lead["email"] = clean_msg.strip().lower()
            lead = apply_score(lead, "email_provided")
            session["lead_capture_stage"] = "phone"
            name = lead.get("name", "")
            reply = f"Perfect{', ' + name if name else ''}! ✅ One last thing — want WhatsApp updates on new drops and exclusive deals? If yes, share your number (totally optional!)."
        else:
            reply = "Hmm, that email doesn't look right. Could you double-check? 📧"
        return {"reply": reply, "step": "main", "show_cta": False, "cta_type": None}

    if stage == "phone":
        lower = clean_msg.lower()
        skip_signals = ["no", "skip", "later", "next", "nope", "no thanks", "nah"]
        if any(s in lower for s in skip_signals) or (len(clean_msg) < 7 and not clean_msg.isdigit()):
            session["lead_capture_stage"] = "done"
        elif _is_valid_phone(clean_msg):
            lead["phone"] = re.sub(r"\D", "", clean_msg)
            lead = apply_score(lead, "phone_provided")
            session["lead_capture_stage"] = "done"
        else:
            reply = "Could you share a valid 10-digit phone number? Or type 'skip' to continue without it."
            return {"reply": reply, "step": "main", "show_cta": False, "cta_type": None}

        # Lead capture complete — finalise and save
        lead = apply_score(lead, "completed_flow")
        lead = finalize_lead(lead)

        # AI extraction pass
        lead = extract_lead_with_ai(session["history"], lead)
        save_lead_to_file(lead)

        # Async push to Sheets (fire and forget)
        if settings.GOOGLE_SHEET_ID:
            push_lead_to_sheets(lead)
            lead["synced_to_sheets"] = True

        session["lead"] = lead
        session["lead_capture_stage"] = "done"

        name = lead.get("name", "")
        reply = (
            f"You're all set{', ' + name if name else ''}! 🎉 I'll send your personalised picks shortly.\n\n"
            f"Is there anything else I can help you with — sizing, styling tips, or finding more pieces?"
        )
        return {
            "reply": reply,
            "step": "main",
            "show_cta": True,
            "cta_type": "view_products",
            "lead_captured": True,
        }

    return None  # Not in a capture stage — let AI handle it


# ──────────────────────────────────────────────
# Main Entry Point
# ──────────────────────────────────────────────
async def process_message(
    session_id: str,
    user_message: str,
    ip_address: Optional[str] = None,
    ai_reply: Optional[str] = None,  # Pre-generated (streaming path)
) -> dict:
    """
    Processes a chat turn. If ai_reply is provided (streaming was used),
    skip the AI call and just update state.
    """
    session = get_session(session_id)
    session["message_count"] += 1
    clean_msg = sanitise_text(user_message)
    lead = session["lead"]

    # ── Detect context from message ───────────
    cat = _detect_category(clean_msg)
    occ = _detect_occasion(clean_msg)
    if cat and not session["category_interest"]:
        session["category_interest"] = cat
        lead["category_interest"] = cat
        lead = apply_score(lead, "gave_category")
    if occ and not session["occasion"]:
        session["occasion"] = occ
        lead["occasion"] = occ
        lead = apply_score(lead, "gave_occasion")
    if _detect_buying_signals(clean_msg):
        lead["buying_intent"] = "high"
        lead = apply_score(lead, "asked_product_q")

    # ── Lead capture sub-flow ─────────────────
    if session.get("lead_capture_stage") and session["lead_capture_stage"] != "done":
        result = await process_lead_capture_message(session, clean_msg, ip_address)
        if result:
            chat_logger.log(
                session_id=session_id,
                user_message=clean_msg,
                bot_response=result["reply"],
                user_name=lead.get("name"),
                used_ai=False,
                ip_address=ip_address,
            )
            result.setdefault("user_name", lead.get("name"))
            result.setdefault("lead_captured", bool(lead.get("email")))
            result.setdefault("lead_score", lead["lead_score"])
            result.setdefault("lead_temperature", lead["lead_temperature"])
            return result

    # ── AI response path ──────────────────────
    # If streaming was used, ai_reply is already set
    bot_reply = ai_reply
    used_ai = bool(ai_reply)

    if not ai_reply:
        # Fallback for non-streaming path (e.g. tests, rate-limited)
        from services.prompt_engine import build_fallback_response
        bot_reply = build_fallback_response(clean_msg.lower(), lead.get("name"))

    _add_to_history(session, "user", clean_msg)
    if bot_reply:
        _add_to_history(session, "assistant", bot_reply)

    # ── Trigger lead capture offer ────────────
    show_cta = False
    cta_type = None
    if (
        session["message_count"] >= 4
        and not lead.get("email")
        and session["lead_capture_stage"] is None
        and session["message_count"] % 4 == 0   # every 4 messages
    ):
        session["lead_capture_stage"] = "ask_share"
        if bot_reply:
            bot_reply += "\n\nAlso — would you like me to send these recommendations to your inbox so you don't lose them? 📩"

    # Determine CTA
    cta_type = _determine_cta(session)
    show_cta = cta_type is not None

    chat_logger.log(
        session_id=session_id,
        user_message=clean_msg,
        bot_response=bot_reply or "",
        user_name=lead.get("name"),
        used_ai=used_ai,
        ip_address=ip_address,
    )

    return {
        "reply": bot_reply or "",
        "step": "main",
        "user_name": lead.get("name"),
        "lead_captured": bool(lead.get("email")),
        "lead_score": lead["lead_score"],
        "lead_temperature": lead["lead_temperature"],
        "show_cta": show_cta,
        "cta_type": cta_type,
    }


def get_all_sessions_summary() -> list[dict]:
    """Summary of all active sessions for the admin dashboard."""
    summaries = []
    for sid, s in _sessions.items():
        lead = s.get("lead", {})
        summaries.append({
            "session_id": sid[:12] + "...",
            "name": lead.get("name"),
            "email": lead.get("email"),
            "lead_score": lead.get("lead_score", 0),
            "lead_temperature": lead.get("lead_temperature", "Cold"),
            "category_interest": s.get("category_interest"),
            "occasion": s.get("occasion"),
            "message_count": s.get("message_count", 0),
        })
    return sorted(summaries, key=lambda x: x["lead_score"], reverse=True)
