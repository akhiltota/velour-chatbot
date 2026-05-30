/**
 * utils/session.js
 * ──────────────────
 * Manages the chat session ID in localStorage so the conversation
 * persists across page reloads (within the same browser session).
 */

const SESSION_KEY = "velour_chat_session_id";

/**
 * Get the existing session ID or create and store a new one.
 * @returns {string} UUID-style session ID
 */
export function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Clear the session (e.g. on logout or "Start new chat" button).
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Helpers ──────────────────────────────────
function generateId() {
  // crypto.randomUUID is available in all modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
