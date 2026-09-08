import React, { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "reactstrap";
import { ChevronLeft, ChevronRight, FileSearch, Search, X } from "lucide-react";
import { API_BASE } from "../../shared/utils/apiBase";
import { C } from "../../shared/utils/employee";
import AuditorSharedLayout from "./AuditorSharedLayout";

const PAGE_SIZE = 50;

const LOG_CATEGORIES = ["Leave", "Attendance", "Payroll", "Employee", "Authentication", "Compliance", "Other"] as const;

const HIDDEN_DETAIL_KEYS = new Set([
  "_id", "id", "__v", "action", "event", "message", "user", "userEmail",
  "createdAt", "timestamp", "updatedAt", "category", "type", "resource", "module", "details",
]);

interface AuditLog {
  _id?: string;
  id?: string;
  action?: string;
  event?: string;
  message?: string;
  user?: string;
  userEmail?: string;
  createdAt?: string;
  timestamp?: string;
  category?: string;
  type?: string;
  resource?: string;
  module?: string;
  details?: unknown;
  [key: string]: unknown;
}

interface AuditPagination {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  [key: string]: unknown;
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e4e7ec",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
};

const looksLikeEndpoint = (value: string): boolean =>
  /^(https?:)?\/+|^(get|post|put|patch|delete)\s+\//i.test(value.trim())
  || /\/api\//i.test(value)
  || /[{}\[\]]/.test(value);

const looksLikeCode = (value: string): boolean =>
  looksLikeEndpoint(value) || value.length > 140;

const getActorName = (log: AuditLog): string => {
  const user = String(log.user || "").trim();
  const email = String(log.userEmail || "").trim();
  const raw = user && !user.includes("@") && !looksLikeEndpoint(user) ? user : (email || user);
  if (!raw) return "Someone";
  const handle = raw.includes("@") ? raw.split("@")[0] : raw;
  const cleaned = handle.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Someone";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
};

const eventBlob = (log: AuditLog): string =>
  [
    log.action, log.event, log.resource, log.module, log.message, log.category, log.type,
    typeof log.method === "string" ? log.method : "",
    typeof log.path === "string" ? log.path : "",
    typeof log.url === "string" ? log.url : "",
  ].filter(Boolean).join(" ").toLowerCase();

const inferEvent = (log: AuditLog): string | null => {
  const blob = eventBlob(log);
  if (/log[-_ ]?out|sign[-_ ]?out/.test(blob)) return "logged out";
  if (/log[-_ ]?in|sign[-_ ]?in|auth\/login|\/login\b/.test(blob)) return "logged in";
  if (/clock[-_ ]?in|clockin/.test(blob)) return "clocked in";
  if (/clock[-_ ]?out|clockout/.test(blob)) return "clocked out";
  if (/break/.test(blob) && /(end|stop|out)/.test(blob)) return "ended a break";
  if (/break/.test(blob) && /(start|begin|in)/.test(blob)) return "started a break";
  if (/leave/.test(blob) && /(approv)/.test(blob)) return "approved a leave request";
  if (/leave/.test(blob) && /(reject|declin)/.test(blob)) return "rejected a leave request";
  if (/leave/.test(blob) && /(cancel|withdraw)/.test(blob)) return "cancelled a leave request";
  if (/leave/.test(blob) && /(apply|applied|create|request|post)/.test(blob)) return "applied for leave";
  if (/\bleave\b/.test(blob)) return "updated a leave request";
  if (/password|reset/.test(blob)) return "changed a password";
  if (/payroll/.test(blob)) return "updated payroll";
  if (/employee/.test(blob) && /(create|add|post|invite)/.test(blob)) return "added an employee";
  if (/employee/.test(blob) && /(delete|remove)/.test(blob)) return "removed an employee";
  if (/employee/.test(blob) && /(update|put|patch|edit)/.test(blob)) return "updated an employee";
  if (/attendance/.test(blob)) return "updated attendance";
  if (/evaluat|review|performance/.test(blob)) return "updated a performance review";
  return null;
};

const getActionLabel = (log: AuditLog): string => {
  const who = getActorName(log);
  const message = String(log.message || "").trim();
  if (message && !looksLikeCode(message) && !looksLikeEndpoint(message) && /\s/.test(message)) {
    return message;
  }
  const event = inferEvent(log);
  if (event) return `${who} ${event}`;
  return `${who} recorded activity`;
};

const getActor = (log: AuditLog): string => {
  const email = String(log.userEmail || "").trim();
  const user = String(log.user || "").trim();
  if (email) return email;
  if (user && !looksLikeEndpoint(user)) return user;
  return "—";
};

const getCategory = (log: AuditLog): string => {
  const explicit = String(log.category || "").trim();
  if (explicit) {
    const match = LOG_CATEGORIES.find((c) => c.toLowerCase() === explicit.toLowerCase());
    return match || explicit;
  }
  const value = [log.type, log.resource, log.module, log.action, log.event]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return LOG_CATEGORIES.find((item) => value.includes(item.toLowerCase())) || "Other";
};

const getWhen = (log: AuditLog): string => {
  const raw = log.createdAt || log.timestamp;
  if (!raw) return "—";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleString();
};

const formatLabel = (key: string): string =>
  key.replace(/[._-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());

const primitiveEntries = (source: Record<string, unknown>): { label: string; value: string }[] =>
  Object.entries(source)
    .filter(([key, value]) => !HIDDEN_DETAIL_KEYS.has(key) && value !== undefined && value !== null && value !== "")
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .filter(([key]) => !/id$/i.test(key) && key !== "_id" && !/^(path|url|endpoint|route|action)$/i.test(key))
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
    }))
    .filter((row) => !looksLikeEndpoint(row.value));

const detailRows = (log: AuditLog): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = [];
  if (log.resource && !looksLikeEndpoint(String(log.resource))) {
    rows.push({ label: "Resource", value: String(log.resource) });
  }
  if (log.module && !looksLikeEndpoint(String(log.module))) {
    rows.push({ label: "Module", value: String(log.module) });
  }
  if (log.type && log.type !== log.category && !looksLikeEndpoint(String(log.type))) {
    rows.push({ label: "Type", value: String(log.type) });
  }

  if (typeof log.details === "string" && log.details.trim()) {
    rows.push({ label: "Note", value: log.details });
  } else if (log.details && typeof log.details === "object" && !Array.isArray(log.details)) {
    rows.push(...primitiveEntries(log.details as Record<string, unknown>));
  }

  rows.push(...primitiveEntries(log));
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.label}:${row.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseAuditResponse = (result: any): { logs: AuditLog[]; pagination: AuditPagination } => {
  const payload = result.data && !Array.isArray(result.data) ? result.data : result;
  const logs: AuditLog[] = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.logs)
      ? payload.logs
      : Array.isArray(result.data)
        ? result.data
        : [];
  const pagination: AuditPagination = payload.pagination || result.pagination || {};
  return { logs, pagination };
};

const AuditorPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AuditPagination>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    const loadAuditLogs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be signed in to view audit logs.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/logs/audit?page=${page}&limit=${PAGE_SIZE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`Audit log request failed with status ${response.status}`);
        }
        const result = await response.json();
        const parsed = parseAuditResponse(result);
        setLogs(parsed.logs);
        setPagination({
          ...parsed.pagination,
          page: parsed.pagination.page ?? page,
          total: parsed.pagination.total ?? parsed.logs.length,
        });
      } catch (requestError) {
        console.error("Failed to load audit logs:", requestError);
        setError("Unable to load audit logs.");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [page]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      const cat = getCategory(log);
      if (category && cat !== category) return false;
      if (!q) return true;
      const hay = [getActionLabel(log), getActor(log), cat, log.resource, log.module].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [logs, query, category]);

  const totalPages = Math.max(
    1,
    Number(pagination.pages || pagination.totalPages || Math.ceil(Number(pagination.total || logs.length) / PAGE_SIZE) || 1),
  );
  const canPrev = page > 1 && pagination.hasPrevPage !== false;
  const canNext = pagination.hasNextPage === true || page < totalPages;

  useEffect(() => {
    setShowRaw(false);
  }, [selected]);

  const selectedRows = selected ? detailRows(selected) : [];

  return (
    <AuditorSharedLayout>
      <div className="mt-3 mb-5" style={{ padding: "0 4px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          marginBottom: 16, justifyContent: "space-between",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#fff", border: "1px solid #e4e7ec", borderRadius: 20,
            padding: "10px 18px 10px 14px",
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: "50%", background: C.primary,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileSearch size={16} />
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1d2939", lineHeight: 1.2 }}>Audit Logs</div>
              <div style={{ fontSize: 11.5, color: "#667085" }}>Review activity recorded for your organization</div>
            </div>
          </div>
        </div>

        {error && <Alert color="danger">{error}</Alert>}
        {loading && (
          <div style={{ ...card, textAlign: "center", padding: 48, color: "#667085" }}>
            <Spinner color="primary" />
            <div style={{ marginTop: 12, fontSize: 13 }}>Loading audit logs…</div>
          </div>
        )}

        {!loading && !error && (
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{
              padding: 16, borderBottom: "1px solid #e4e7ec",
              display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
            }}>
              <div style={{ position: "relative", flex: "1 1 240px", minWidth: 220 }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this page…"
                  style={{
                    width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8,
                    border: "1px solid #d0d5dd", fontSize: 13, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: "9px 12px", borderRadius: 8, border: "1px solid #d0d5dd",
                  fontSize: 13, background: "#fff", cursor: "pointer",
                }}
              >
                <option value="">All categories</option>
                {LOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ fontSize: 12, color: "#667085", marginLeft: "auto" }}>
                Page {page}{pagination.total !== undefined ? ` · ${pagination.total} total` : ""}
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Category", "What happened", "User", "When"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px 16px", fontSize: 11,
                        fontWeight: 700, color: "#667085", textTransform: "uppercase",
                        letterSpacing: 0.3, borderBottom: "1px solid #e4e7ec",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#98a2b3", padding: 40 }}>
                        No audit logs found.
                      </td>
                    </tr>
                  ) : filtered.map((log, index) => (
                    <tr
                      key={log._id || log.id || index}
                      onClick={() => setSelected(log)}
                      style={{
                        borderBottom: "1px solid #f2f4f7",
                        cursor: "pointer",
                        background: selected && (selected._id || selected.id) === (log._id || log.id) ? "#f9f7f5" : undefined,
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#344054", whiteSpace: "nowrap" }}>{getCategory(log)}</td>
                      <td style={{ padding: "12px 16px", color: "#1d2939", fontWeight: 500 }}>{getActionLabel(log)}</td>
                      <td style={{ padding: "12px 16px", color: "#344054" }}>{getActor(log)}</td>
                      <td style={{ padding: "12px 16px", color: "#667085", whiteSpace: "nowrap" }}>{getWhen(log)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8,
              padding: "12px 16px", borderTop: "1px solid #e4e7ec",
            }}>
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  ...card, padding: "6px 10px", cursor: canPrev ? "pointer" : "not-allowed",
                  opacity: canPrev ? 1 : 0.45, display: "inline-flex", alignItems: "center",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 12.5, color: "#667085" }}>{page} / {totalPages}</span>
              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  ...card, padding: "6px 10px", cursor: canNext ? "pointer" : "not-allowed",
                  opacity: canNext ? 1 : 0.45, display: "inline-flex", alignItems: "center",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 4000, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setSelected(null)} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.35)" }} />
          <aside style={{
            position: "relative", width: "min(420px, 100%)", height: "100%",
            background: "#fff", boxShadow: "-12px 0 40px rgba(15,23,42,0.12)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "18px 20px", borderBottom: "1px solid #e4e7ec",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {getCategory(selected)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1d2939", marginTop: 4 }}>{getActionLabel(selected)}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ border: "none", background: "#f2f4f7", borderRadius: 8, padding: 6, cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <dl style={{ margin: 0 }}>
                {[
                  { label: "User", value: getActor(selected) },
                  { label: "When", value: getWhen(selected) },
                  ...selectedRows,
                ].map((row) => (
                  <div key={`${row.label}-${row.value}`} style={{ marginBottom: 14 }}>
                    <dt style={{ fontSize: 11, fontWeight: 700, color: "#98a2b3", textTransform: "uppercase", letterSpacing: 0.3 }}>{row.label}</dt>
                    <dd style={{ margin: "4px 0 0", fontSize: 13.5, color: "#344054", wordBreak: "break-word" }}>{row.value}</dd>
                  </div>
                ))}
              </dl>

              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                style={{
                  marginTop: 8, border: "none", background: "transparent",
                  color: C.primary, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0,
                }}
              >
                {showRaw ? "Hide technical payload" : "Show technical payload"}
              </button>
              {showRaw && (
                <pre style={{
                  marginTop: 10, padding: 12, borderRadius: 8, background: "#f9fafb",
                  border: "1px solid #e4e7ec", fontSize: 11, overflowX: "auto", color: "#344054",
                }}>
                  {JSON.stringify(selected, null, 2)}
                </pre>
              )}
            </div>
          </aside>
        </div>
      )}
    </AuditorSharedLayout>
  );
};

export default AuditorPage;
