/**
 * components/chat/ChatButton.jsx
 * ────────────────────────────────
 * Floating chat toggle with unread pulse animation.
 */

export default function ChatButton({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close chat" : "Chat with Aria"}
      style={{
        position: "fixed", bottom: 28, right: 28,
        width: 60, height: 60, borderRadius: "50%",
        background: isOpen
          ? "#333"
          : "linear-gradient(135deg, #1A1A1A 0%, #3A2A1A 100%)",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
        zIndex: 1000,
        transition: "transform 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {isOpen ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Pulse indicator */}
          <span style={{
            position: "absolute", top: 3, right: 3,
            width: 13, height: 13, background: "#C8B89A",
            borderRadius: "50%", border: "2px solid #1A1A1A",
            animation: "chatPulse 2s infinite",
          }} />
        </>
      )}
      <style>{`
        @keyframes chatPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </button>
  );
}
