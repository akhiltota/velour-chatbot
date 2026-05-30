/**
 * services/chatApi.js
 * ─────────────────────
 * All HTTP communication with the backend.
 * Supports both regular JSON and SSE streaming endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

// ── Non-streaming (lead capture steps) ───────
export async function sendChatMessage(message, sessionId) {
  let lastError;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId }),
      });
      if (res.status === 429) {
        const d = await res.json();
        throw new RateLimitError(d.error || "Too many requests.", d.retry_after);
      }
      if (res.status === 400) {
        const d = await res.json();
        throw new ValidationError(d.detail || "Invalid message.");
      }
      if (!res.ok) throw new ApiError(`Server error (${res.status}).`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (err instanceof RateLimitError || err instanceof ValidationError) throw err;
      if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
}

/**
 * Streaming chat via SSE.
 *
 * @param {string}   message      User text
 * @param {string}   sessionId    Session UUID
 * @param {Function} onToken      Called with each new text token string
 * @param {Function} onDone       Called with final metadata object
 * @param {Function} onError      Called with error
 */
export async function sendChatMessageStream(message, sessionId, onToken, onDone, onError) {
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    });

    if (res.status === 429) {
      const d = await res.json().catch(() => ({}));
      throw new RateLimitError(d.error || "Too many requests.", d.retry_after);
    }
    if (!res.ok) throw new ApiError(`Server error (${res.status}).`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.token !== undefined) {
            onToken(data.token);
          }
          if (data.done) {
            onDone(data.meta || {});
          }
        } catch {
          // malformed SSE chunk — skip
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch { return false; }
}

export async function fetchLeads(adminPassword) {
  const res = await fetch(`${API_BASE}/leads`, {
    headers: { "X-Admin-Password": adminPassword },
  });
  if (res.status === 401) throw new Error("Wrong admin password.");
  if (!res.ok) throw new Error("Failed to fetch leads.");
  return res.json();
}

// ── Custom Error Classes ──────────────────────
export class ApiError extends Error { constructor(m) { super(m); this.name = "ApiError"; } }
export class RateLimitError extends Error {
  constructor(m, r) { super(m); this.name = "RateLimitError"; this.retryAfter = r; }
}
export class ValidationError extends Error { constructor(m) { super(m); this.name = "ValidationError"; } }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
