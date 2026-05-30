/**
 * components/chat/QuickReplies.jsx
 * ──────────────────────────────────
 * Scrollable quick-reply pills with fashion category icons.
 */

const ICONS = {
  "Dresses": "👗", "Co-ords": "✨", "Office Wear": "💼",
  "Casual Wear": "☀️", "Party Wear": "🎉", "New Arrivals": "🆕",
  "Office": "💼", "Daily Wear": "☀️", "Vacation": "✈️",
  "Wedding": "💍", "Party": "🎉",
  "Shipping info": "🚚", "Return policy": "🔄",
  "Size guide": "📏", "Track my order": "📦",
};

export default function QuickReplies({ replies, onSelect, visible }) {
  if (!visible || !replies?.length) return null;

  return (
    <div
      style={{
        padding: "6px 12px 2px",
        display: "flex",
        gap: 6,
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`.qr-scroll::-webkit-scrollbar { display: none; }`}</style>
      {replies.map((q) => (
        <button
          key={q}
          className="qr-scroll"
          onClick={() => onSelect(q)}
          style={{
            fontSize: 12,
            padding: "7px 13px",
            border: "1.5px solid #DDD4C8",
            borderRadius: 20,
            background: "#FDFCFB",
            color: "#5A4A3A",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1A1A1A";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = "#1A1A1A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#FDFCFB";
            e.currentTarget.style.color = "#5A4A3A";
            e.currentTarget.style.borderColor = "#DDD4C8";
          }}
        >
          {ICONS[q] ? `${ICONS[q]} ${q}` : q}
        </button>
      ))}
    </div>
  );
}
