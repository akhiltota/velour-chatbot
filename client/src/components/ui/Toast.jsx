/**
 * components/ui/Toast.jsx
 * ─────────────────────────
 * Lightweight toast notification for cart adds, errors, etc.
 * Auto-dismisses after 2.5 seconds.
 */

import { useEffect } from "react";

const TOAST_STYLES = {
  success: { background: "#1A1A1A", color: "#fff", icon: "✓" },
  error:   { background: "#C44B4B", color: "#fff", icon: "✕" },
  info:    { background: "#4B7AC4", color: "#fff", icon: "ℹ" },
};

export default function Toast({ message, type = "success", onDismiss }) {
  const style = TOAST_STYLES[type] || TOAST_STYLES.success;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        background: style.background,
        color: style.color,
        padding: "12px 20px",
        borderRadius: 8,
        zIndex: 9999,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        gap: 8,
        animation: "toastIn 0.3s ease",
        maxWidth: 300,
      }}
      onClick={onDismiss}
    >
      <span>{style.icon}</span>
      <span>{message}</span>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>
  );
}
