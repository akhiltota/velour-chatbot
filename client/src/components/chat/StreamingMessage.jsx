/**
 * components/chat/StreamingMessage.jsx
 * ──────────────────────────────────────
 * Renders a bot message with a blinking cursor while streaming.
 * Supports **bold** markdown for product highlights.
 */

function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function StreamingMessage({ text, streaming, isError }) {
  return (
    <span style={{ display: "inline" }}>
      {parseBold(text)}
      {streaming && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "#888",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            animation: "cursorBlink 0.7s steps(1) infinite",
          }}
        />
      )}
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
