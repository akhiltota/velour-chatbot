/**
 * components/chat/ChatMessage.jsx
 * ─────────────────────────────────
 * Single chat bubble — user or bot.
 * Bot bubbles use StreamingMessage for typewriter + cursor effect.
 */

import StreamingMessage from "./StreamingMessage";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "msgSlideIn 0.22s ease",
      }}
    >
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #C8B89A, #A0785A)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>
          ✦
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
          background: isUser
            ? "#1A1A1A"
            : message.isError ? "#FFF3F3" : "#F5F2EE",
          color: isUser ? "#fff" : message.isError ? "#C44B4B" : "#1A1A1A",
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "pre-line",
          border: message.isError ? "1px solid #FFCCCC" : "none",
          wordBreak: "break-word",
          boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {isUser
          ? message.text
          : <StreamingMessage text={message.text} streaming={message.streaming} isError={message.isError} />
        }
      </div>
      <style>{`
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
