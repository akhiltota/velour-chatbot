/**
 * hooks/useChat.js
 * ─────────────────
 * All chat state: streaming, lead capture, CTAs, session management.
 */

import { useState, useCallback, useRef } from "react";
import { sendChatMessageStream, RateLimitError } from "@/services/chatApi";
import { getOrCreateSessionId } from "@/utils/session";

const INITIAL_MESSAGE = {
  role: "bot",
  text: "Hi! 👋 I'm **Aria**, Velour's personal styling assistant.\n\nI can help you discover the perfect outfit, find your size, answer any questions about shipping or returns, and send personalised recommendations straight to your inbox.\n\nWhat are you shopping for today?",
  id: "init",
  streaming: false,
};

// Quick-reply sets by context
export const QUICK_REPLY_SETS = {
  default: ["Dresses", "Co-ords", "Office Wear", "Casual Wear", "Party Wear", "New Arrivals"],
  occasion: ["Office", "Daily Wear", "Vacation", "Wedding", "Party"],
  help: ["Shipping info", "Return policy", "Size guide", "Track my order"],
};

export function useChat() {
  const [messages, setMessages]       = useState([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping]       = useState(false);
  const [error, setError]             = useState(null);
  const [chatStep, setChatStep]       = useState("main");
  const [userName, setUserName]       = useState(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadScore, setLeadScore]     = useState(0);
  const [leadTemperature, setLeadTemperature] = useState("Cold");
  const [showCta, setShowCta]         = useState(false);
  const [ctaType, setCtaType]         = useState(null);
  const [quickReplies, setQuickReplies] = useState(QUICK_REPLY_SETS.default);

  const sessionIdRef = useRef(getOrCreateSessionId());
  const streamingMsgIdRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  const _applyMeta = useCallback((meta) => {
    if (!meta) return;
    if (meta.user_name)       setUserName(meta.user_name);
    if (meta.lead_captured)   setLeadCaptured(true);
    if (meta.lead_score != null)    setLeadScore(meta.lead_score);
    if (meta.lead_temperature)      setLeadTemperature(meta.lead_temperature);
    if (meta.show_cta != null)      setShowCta(meta.show_cta);
    if (meta.cta_type != null)      setCtaType(meta.cta_type);
    if (meta.session_id)            sessionIdRef.current = meta.session_id;
    // Evolve quick replies based on step
    if (meta.lead_captured && !meta.category_interest) {
      setQuickReplies(QUICK_REPLY_SETS.occasion);
    } else if (meta.lead_captured) {
      setQuickReplies(QUICK_REPLY_SETS.help);
    }
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setIsTyping(true);
    setError(null);
    setShowCta(false);

    // Add user bubble
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { role: "user", text: trimmed, id: userMsgId }]);

    // Add empty streaming bot bubble
    const botMsgId = Date.now() + 1;
    streamingMsgIdRef.current = botMsgId;
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "", id: botMsgId, streaming: true },
    ]);

    let accumulatedText = "";

    sendChatMessageStream(
      trimmed,
      sessionIdRef.current,
      // onToken
      (token) => {
        accumulatedText += token;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, text: accumulatedText } : m
          )
        );
      },
      // onDone
      (meta) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, streaming: false } : m
          )
        );
        _applyMeta(meta);
        setIsTyping(false);
        streamingMsgIdRef.current = null;
      },
      // onError
      (err) => {
        let msg = "I had a connection issue. Please try again!";
        if (err instanceof RateLimitError)
          msg = "You're typing fast! Give me a moment to catch up. 😊";
        else if (!navigator.onLine)
          msg = "No internet connection. Please check your network.";

        setError({ message: msg });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, text: "I had a connection issue — please try again or email care@velour.in 😊", streaming: false, isError: true }
              : m
          )
        );
        setIsTyping(false);
      }
    );
  }, [isTyping, _applyMeta]);

  const resetChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setChatStep("main");
    setUserName(null);
    setLeadCaptured(false);
    setLeadScore(0);
    setLeadTemperature("Cold");
    setIsTyping(false);
    setError(null);
    setShowCta(false);
    setCtaType(null);
    setQuickReplies(QUICK_REPLY_SETS.default);
  }, []);

  return {
    messages, isTyping, error, clearError,
    chatStep, userName, leadCaptured,
    leadScore, leadTemperature,
    showCta, ctaType,
    quickReplies, setQuickReplies,
    sendMessage, resetChat,
  };
}
