/**
 * components/chat/CTAButtons.jsx
 * ────────────────────────────────
 * Contextual CTA buttons that appear based on lead score and intent.
 * Each CTA type maps to a different action / pre-filled message.
 */

const CTA_CONFIG = {
  get_recommendations: {
    label: "✨ Get Personalised Recommendations",
    msg: "I'd love personalised recommendations! Can you send them to my email?",
    style: { background: "linear-gradient(135deg, #C8A882 0%, #A0785A 100%)", color: "#fff" },
  },
  send_to_email: {
    label: "📧 Send Recommendations To My Email",
    msg: "Please send these recommendations to my email.",
    style: { background: "#1A1A1A", color: "#fff" },
  },
  view_products: {
    label: "🛍 View Recommended Products",
    msg: "Show me your top recommended products right now.",
    style: { background: "linear-gradient(135deg, #1A1A1A 0%, #333 100%)", color: "#fff" },
  },
  whatsapp: {
    label: "📱 Get WhatsApp Updates",
    msg: "I'd like to receive WhatsApp updates on new drops and offers.",
    style: { background: "#25D366", color: "#fff" },
  },
};

export default function CTAButtons({ ctaType, onSelect, visible }) {
  if (!visible || !ctaType) return null;
  const config = CTA_CONFIG[ctaType];
  if (!config) return null;

  return (
    <div style={{ padding: "8px 12px 4px", animation: "ctaFadeIn 0.4s ease" }}>
      <button
        onClick={() => onSelect(config.msg)}
        style={{
          width: "100%",
          padding: "11px 16px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.02em",
          transition: "opacity 0.2s, transform 0.15s",
          ...config.style,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {config.label}
      </button>
      <style>{`
        @keyframes ctaFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
