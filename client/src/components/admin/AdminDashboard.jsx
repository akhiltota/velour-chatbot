/**
 * components/admin/AdminDashboard.jsx
 * ─────────────────────────────────────
 * Lead management dashboard — stats, Google Sheets status,
 * recent leads table, category analytics.
 * Access at: click the admin icon in the nav (password-protected).
 */

import { useState, useEffect, useCallback } from "react";
import { fetchLeads } from "@/services/chatApi";

const TEMP_COLORS = {
  Hot:  { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
  Warm: { bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B" },
  Cold: { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
};

const INTENT_COLORS = {
  high:   { bg: "#D1FAE5", text: "#065F46" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low:    { bg: "#F3F4F6", text: "#6B7280" },
};

export default function AdminDashboard({ onClose }) {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async (pw) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLeads(pw);
      setData(result);
      setAuthed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    load(password);
  };

  // ── Login Screen ────────────────────────────
  if (!authed) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ maxWidth: 380, margin: "0 auto", padding: "48px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
              Admin Dashboard
            </h2>
            <p style={{ fontSize: 14, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>
              Velour Lead Management Portal
            </p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 8,
                border: error ? "1.5px solid #EF4444" : "1.5px solid #DDD",
                fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                outline: "none", marginBottom: 12, boxSizing: "border-box",
                background: "#FAFAFA",
              }}
            />
            {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", background: "#1A1A1A", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Verifying…" : "Access Dashboard →"}
            </button>
          </form>
        </div>
      </Overlay>
    );
  }

  const { stats, category_analytics, sheets_status, recent_leads, active_sessions } = data;

  // ── Dashboard ───────────────────────────────
  return (
    <Overlay onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1A1A1A 0%, #2D2420 100%)",
          padding: "18px 28px", display: "flex", alignItems: "center",
          gap: 16, flexShrink: 0,
        }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>Velour Lead Dashboard</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Real-time lead intelligence
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => load(password)} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", padding: "7px 14px", borderRadius: 6, cursor: "pointer",
              fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            }}>↻ Refresh</button>
            <button onClick={onClose} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.7)", width: 32, height: 32, borderRadius: 6,
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, borderBottom: "1px solid #EBEBEB",
          background: "#fff", flexShrink: 0, padding: "0 28px",
        }}>
          {["overview", "leads", "sessions", "analytics"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "12px 18px", border: "none", background: "transparent",
              borderBottom: activeTab === tab ? "2px solid #1A1A1A" : "2px solid transparent",
              cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#1A1A1A" : "#888",
              fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize",
              transition: "color 0.15s",
            }}>{tab}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#F8F7F5" }}>

          {activeTab === "overview" && (
            <div>
              {/* Stats cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Leads" value={stats.total} icon="👥" color="#6366F1" />
                <StatCard label="🔥 Hot Leads" value={stats.hot} icon="" color="#EF4444"
                  sub={`${stats.total ? Math.round(stats.hot/stats.total*100) : 0}% of total`} />
                <StatCard label="Warm Leads" value={stats.warm} icon="🟡" color="#F59E0B"
                  sub={`${stats.total ? Math.round(stats.warm/stats.total*100) : 0}% of total`} />
                <StatCard label="Cold Leads" value={stats.cold} icon="❄️" color="#3B82F6" />
              </div>

              {/* Sheets status */}
              <div style={{
                background: "#fff", borderRadius: 12, padding: "18px 20px",
                border: "1px solid #EBEBEB", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ fontSize: 28 }}>📊</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>Google Sheets Sync</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#666" }}>
                    Status: <strong style={{ color: sheets_status.configured ? "#16A34A" : "#DC2626" }}>
                      {sheets_status.status}
                    </strong>
                    {sheets_status.rows != null && (
                      <span style={{ marginLeft: 12, color: "#888" }}>{sheets_status.rows} rows in sheet</span>
                    )}
                  </div>
                </div>
                {!sheets_status.configured && (
                  <div style={{
                    marginLeft: "auto", fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif",
                    background: "#FEF3C7", padding: "4px 10px", borderRadius: 20, fontWeight: 500,
                  }}>Set GOOGLE_SHEET_ID in .env</div>
                )}
              </div>

              {/* Recent leads preview */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EBEBEB", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0EDE8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent Leads</h3>
                  <button onClick={() => setActiveTab("leads")} style={{
                    fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>View all →</button>
                </div>
                <LeadsTable leads={recent_leads.slice(0, 8)} />
              </div>
            </div>
          )}

          {activeTab === "leads" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EBEBEB", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0EDE8" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  All Leads ({recent_leads.length})
                </h3>
              </div>
              <LeadsTable leads={recent_leads} showSummary />
            </div>
          )}

          {activeTab === "sessions" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EBEBEB", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0EDE8" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                  Active Sessions ({active_sessions.length})
                </h3>
              </div>
              <SessionsTable sessions={active_sessions} />
            </div>
          )}

          {activeTab === "analytics" && (
            <div>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>Category Interest</h3>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EBEBEB", padding: "20px" }}>
                {Object.keys(category_analytics).length === 0 ? (
                  <p style={{ color: "#888", fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: "20px 0" }}>
                    No category data yet.
                  </p>
                ) : (
                  Object.entries(category_analytics)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const maxVal = Math.max(...Object.values(category_analytics));
                      const pct = Math.round((count / maxVal) * 100);
                      return (
                        <div key={cat} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>{cat}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888" }}>{count} leads</span>
                          </div>
                          <div style={{ background: "#F0EDE8", borderRadius: 4, height: 8, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 4,
                              background: "linear-gradient(90deg, #C8B89A, #A0785A)",
                              width: `${pct}%`, transition: "width 0.6s ease",
                            }} />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ── Sub-components ───────────────────────────

function Overlay({ children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%",
        maxWidth: 900, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        animation: "dashIn 0.28s cubic-bezier(0.34,1.2,0.64,1)",
      }}>
        <style>{`@keyframes dashIn { from { opacity:0; transform:scale(0.95) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "18px 20px",
      border: "1px solid #EBEBEB",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
          {sub && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#AAA", marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 22 }}>{icon}</div>
      </div>
    </div>
  );
}

function TempBadge({ temp }) {
  const c = TEMP_COLORS[temp] || TEMP_COLORS.Cold;
  return (
    <span style={{
      background: c.bg, color: c.text, fontFamily: "'DM Sans',sans-serif",
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {temp}
    </span>
  );
}

function LeadsTable({ leads, showSummary }) {
  if (!leads.length) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#AAA", fontFamily: "'DM Sans',sans-serif" }}>
        No leads yet. Start some conversations!
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
        <thead>
          <tr style={{ background: "#F8F7F5" }}>
            {["Name", "Email", "Phone", "Category", "Score", "Temperature", "Intent", showSummary && "Summary"].filter(Boolean).map((h) => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #EBEBEB", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F5F5F5" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <td style={{ padding: "12px 16px", fontWeight: 500 }}>{lead.name || "—"}</td>
              <td style={{ padding: "12px 16px", color: "#555" }}>{lead.email || "—"}</td>
              <td style={{ padding: "12px 16px", color: "#555" }}>{lead.phone || "—"}</td>
              <td style={{ padding: "12px 16px", color: "#555" }}>{lead.category_interest || "—"}</td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ fontWeight: 700, color: lead.lead_score >= 80 ? "#EF4444" : lead.lead_score >= 40 ? "#F59E0B" : "#6B7280" }}>
                  {lead.lead_score}
                </span>
              </td>
              <td style={{ padding: "12px 16px" }}><TempBadge temp={lead.lead_temperature || "Cold"} /></td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{
                  ...INTENT_COLORS[lead.buying_intent || "low"],
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 20, textTransform: "capitalize",
                }}>
                  {lead.buying_intent || "low"}
                </span>
              </td>
              {showSummary && (
                <td style={{ padding: "12px 16px", color: "#888", maxWidth: 200 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lead.chat_summary || "—"}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionsTable({ sessions }) {
  if (!sessions.length) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#AAA", fontFamily: "'DM Sans',sans-serif" }}>No active sessions.</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
        <thead>
          <tr style={{ background: "#F8F7F5" }}>
            {["Session", "Name", "Email", "Score", "Temperature", "Category", "Occasion", "Messages"].map((h) => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #EBEBEB", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F5F5F5" }}>
              <td style={{ padding: "11px 16px", color: "#AAA", fontSize: 11 }}>{s.session_id}</td>
              <td style={{ padding: "11px 16px", fontWeight: 500 }}>{s.name || "—"}</td>
              <td style={{ padding: "11px 16px", color: "#555" }}>{s.email || "—"}</td>
              <td style={{ padding: "11px 16px", fontWeight: 700 }}>{s.lead_score}</td>
              <td style={{ padding: "11px 16px" }}><TempBadge temp={s.lead_temperature || "Cold"} /></td>
              <td style={{ padding: "11px 16px", color: "#555" }}>{s.category_interest || "—"}</td>
              <td style={{ padding: "11px 16px", color: "#555" }}>{s.occasion || "—"}</td>
              <td style={{ padding: "11px 16px", color: "#888" }}>{s.message_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
