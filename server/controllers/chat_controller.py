async def process_message(
    session_id: str,
    user_message: str,
    ip_address: Optional[str] = None,
    ai_reply: Optional[str] = None,
) -> dict:
    session = get_session(session_id)
    session["message_count"] += 1
    clean_msg = sanitise_text(user_message)
    lead = session["lead"]

    # ── Detect context ────────────────────────
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

    # ── Detect email/send intent from CTA clicks ──
    email_intent_phrases = [
        "send to my email", "send recommendations to my email",
        "email me", "send to email", "email these picks",
        "please send", "send personalized", "send personalised",
        "get personalised", "get personalized",
    ]
    if (
        any(phrase in clean_msg.lower() for phrase in email_intent_phrases)
        and not lead.get("email")
        and (not session.get("lead_capture_stage") or session.get("lead_capture_stage") == "done")
    ):
        session["lead_capture_stage"] = "name"
        reply = "I'd love to send those to you! 😊 What's your name so I can personalise it for you?"
        chat_logger.log(
            session_id=session_id,
            user_message=clean_msg,
            bot_response=reply,
            user_name=lead.get("name"),
            used_ai=False,
            ip_address=ip_address,
        )
        return {
            "reply": reply,
            "step": "main",
            "user_name": lead.get("name"),
            "lead_captured": bool(lead.get("email")),
            "lead_score": lead["lead_score"],
            "lead_temperature": lead["lead_temperature"],
            "show_cta": False,
            "cta_type": None,
        }

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
    bot_reply = ai_reply
    used_ai = bool(ai_reply)

    if not ai_reply:
        from services.prompt_engine import build_fallback_response
        bot_reply = build_fallback_response(clean_msg.lower(), lead.get("name"))

    _add_to_history(session, "user", clean_msg)
    if bot_reply:
        _add_to_history(session, "assistant", bot_reply)

    # ── Trigger lead capture offer every 5 messages ──
    show_cta = False
    cta_type = None
    if (
        session["message_count"] >= 3
        and not lead.get("email")
        and session.get("lead_capture_stage") is None
        and session["message_count"] % 5 == 0
    ):
        session["lead_capture_stage"] = "name"
        if bot_reply:
            bot_reply += "\n\nBy the way — would you like me to send these picks to your inbox? Just share your name and I'll set it up! 📩"

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