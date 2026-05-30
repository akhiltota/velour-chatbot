/**
 * components/chat/TypingIndicator.jsx
 * ──────────────────────────────────────
 * "Aria is typing" with avatar and animated dots.
 */

export default function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, animation: "msgSlideIn 0.2s ease" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: "linear-gradient(135deg, #C8B89A, #A0785A)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, flexShrink: 0,
      }}>
        ✦
      </div>
      <div style={{
        background: "#F5F2EE",
        borderRadius: "4px 16px 16px 16px",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: "#B0A090",
            display: "inline-block",
            animation: "velourTyping 1.2s infinite",
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes velourTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
