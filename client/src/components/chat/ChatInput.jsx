/**
 * components/chat/ChatInput.jsx
 * ───────────────────────────────
 * Auto-growing textarea with character count and send button.
 */

import { useState, useRef, useEffect } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div style={{
      padding: "10px 14px 12px",
      borderTop: "1px solid #EBEBEB",
      background: "#fff",
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={disabled ? "Aria is typing…" : "Ask me anything about Velour…"}
        disabled={disabled}
        rows={1}
        maxLength={1000}
        style={{
          flex: 1,
          padding: "10px 14px",
          borderRadius: 20,
          background: disabled ? "#F5F5F5" : "#F8F6F3",
          fontSize: 14,
          color: "#1A1A1A",
          fontFamily: "'DM Sans', sans-serif",
          outline: "none",
          border: "1.5px solid transparent",
          resize: "none",
          lineHeight: 1.5,
          transition: "border-color 0.2s, background 0.2s",
          cursor: disabled ? "not-allowed" : "text",
          overflowY: "hidden",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#C8B89A")}
        onBlur={(e) => (e.target.style.borderColor = "transparent")}
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: canSend
            ? "linear-gradient(135deg, #1A1A1A 0%, #3A3A3A 100%)"
            : "#E0E0E0",
          border: "none",
          cursor: canSend ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.2s, transform 0.15s",
        }}
        onMouseDown={(e) => canSend && (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={canSend ? "#fff" : "#AAA"} strokeWidth="2.5">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
