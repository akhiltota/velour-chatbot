/**
 * components/chat/ChatWidget.jsx
 * ────────────────────────────────
 * Full chat panel — streaming messages, CTAs, lead score badge, quick replies.
 */

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import QuickReplies from "./QuickReplies";
import ChatInput from "./ChatInput";
import CTAButtons from "./CTAButtons";

const TEMP_COLORS = { Hot: "#E53935", Warm: "#F57C00", Cold: "#1976D2" };

export default function ChatWidget({ onClose }) {
  const {
    messages, isTyping, chatStep,
    userName, leadScore, leadTemperature,
    showCta, ctaType, quickReplies,
    sendMessage,
  } = useChat();

  const bottomRef = useRef(null);
  const messagesRef = useRef(null);

  // Smart auto-scroll: only if near bottom
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const threshold = 120;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  return (
    <div style={{
      position: "fixed", bottom: 100, right: 28,
      width: 370, maxHeight: 600,
      borderRadius: 18,
      background: "#fff",
      boxShadow: "0 12px 56px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08)",
      zIndex: 999,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      animation: "chatSlideIn 0.32s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Header ──────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #2D2420 100%)",
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 11,
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, #C8B89A 0%, #A0785A 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.15)",
        }}>
          ✦
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 15, fontFamily: "'Playfair Display', serif" }}>
            Aria{userName ? ` · Hi ${userName}!` : ""}
          </div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.6)",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 5, marginTop: 1,
          }}>
            <span style={{ width: 6, height: 6, background: "#4CAF50", borderRadius: "50%", display: "inline-block" }} />
            Velour Fashion Assistant
          </div>
        </div>

        {/* Lead score badge (visible if score > 0) */}
        {leadScore > 0 && (
          <div style={{
            fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            background: TEMP_COLORS[leadTemperature],
            color: "#fff", padding: "3px 8px", borderRadius: 20,
            letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
          }}>
            {leadTemperature}
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} aria-label="Close"
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, marginLeft: 4, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Messages ────────────────────────── */}
      <div
        ref={messagesRef}
        style={{
          flex: 1, overflowY: "auto", padding: "14px 14px 6px",
          display: "flex", flexDirection: "column", gap: 10, minHeight: 0,
          scrollbarWidth: "thin",
          scrollbarColor: "#E0D8D0 transparent",
        }}
      >
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        {isTyping && !messages[messages.length - 1]?.streaming && <TypingIndicator />}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* ── CTA Button ──────────────────────── */}
      <CTAButtons ctaType={ctaType} onSelect={sendMessage} visible={showCta && !isTyping} />

      {/* ── Quick Replies ────────────────────── */}
      <QuickReplies
        replies={quickReplies}
        onSelect={sendMessage}
        visible={!isTyping && messages.length <= 4}
      />

      {/* ── Input ───────────────────────────── */}
      <ChatInput onSend={sendMessage} disabled={isTyping} />

      {/* ── Footer ──────────────────────────── */}
      <div style={{
        textAlign: "center", padding: "5px 0 7px",
        fontSize: 10, color: "#C8C0B8",
        fontFamily: "'DM Sans', sans-serif",
        borderTop: "1px solid #F0EDE8",
      }}>
        Powered by OpenAI · Velour Customer Support
      </div>
    </div>
  );
}
