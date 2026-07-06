/**
 * Only accessible to users with role === 'platform_admin'.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE } from "../../shared/utils/apiBase";
const API = API_BASE;
const BRAND = "#E6A79E";
const BRAND_DARK = "#c47b72";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  inviteEmail: string;
  status: "pending_owner" | "Active" | "Inactive" | "Suspended";
  country: string;
  createdAt: string;
  hasOwner: boolean;
  inviteExpiresAt?: string;
}

interface InviteResult {
  token: string;
  inviteLink: string;
  expiresAt: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    padding: 24,
    background: "#f9f7f5",
    minHeight: "100vh",
    fontFamily: "inherit",
  } as React.CSSProperties,

  card: {
    background: "#fff",
    border: "1px solid #e4e7ec",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#344054",
    marginBottom: 5,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    color: "#1d2939",
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    color: "#1d2939",
    appearance: "none",
  } as React.CSSProperties,

  fieldGroup: { marginBottom: 16 } as React.CSSProperties,

  btn: (
    variant: "primary" | "secondary" | "danger" | "ghost" = "primary",
    disabled = false
  ): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    border: variant === "secondary" ? "1px solid #d0d5dd" : "none",
    background:
      disabled
        ? "#e4e7ec"
        : variant === "primary"
        ? BRAND
        : variant === "danger"
        ? "#fee2e2"
        : "#fff",
    color:
      disabled
        ? "#98a2b3"
        : variant === "primary"
        ? "#fff"
        : variant === "danger"
        ? "#b91c1c"
        : "#344054",
    opacity: 1,
  }),

  badge: (status: Company["status"]): React.CSSProperties => {
    const map = {
      pending_owner: { bg: "#fffaeb", color: "#b45309" },
      Active: { bg: "#ecfdf3", color: "#166534" },
      Inactive: { bg: "#f9fafb", color: "#667085" },
      Suspended: { bg: "#fee2e2", color: "#b91c1c" },
    };
    const c = map[status] || map.Inactive;
    return {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: c.bg,
      color: c.color,
    };
  },

  notice: (type: "info" | "success" | "warn" | "error"): React.CSSProperties => {
    const map = {
      info: { bg: "#eff8ff", border: "#b2d4f5", color: "#0c4a6e" },
      success: { bg: "#ecfdf3", border: "#abefc6", color: "#166534" },
      warn: { bg: "#fffaeb", border: "#fedf89", color: "#92400e" },
      error: { bg: "#fee2e2", border: "#fca5a5", color: "#b91c1c" },
    };
    const c = map[type];
    return {
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 16,
    };
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Building: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  ),
  Mail: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Copy: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Globe: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

// ─── Countries ────────────────────────────────────────────────────────────────
const COUNTRIES = [
  "South Africa", "Zimbabwe", "Nigeria", "Kenya", "Botswana",
  "Namibia", "Zambia", "Tanzania", "Uganda", "Ghana",
  "United Kingdom", "United States", "Germany", "Other",
];

// ─── Main Component ───────────────────────────────────────────────────────────
const PlatformAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [lastInvite, setLastInvite] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    companyName: "",
    ownerEmail: "",
    country: "South Africa",
  });

  // Guard: platform_admin only
  useEffect(() => {
    if (!token || user?.role !== "platform_admin") {
      navigate("/");
    }
  }, [token, user, navigate]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "all"
          ? `${API}/platform/companies`
          : `${API}/platform/companies?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCompanies(data.data);
      else setError(data.message);
    } catch {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const upd = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    setFormError("");
    if (!form.companyName.trim()) { setFormError("Company name is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) {
      setFormError("Enter a valid owner email."); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/platform/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setLastInvite(data.data.invite);
        setForm({ companyName: "", ownerEmail: "", country: "South Africa" });
        fetchCompanies();
      } else {
        setFormError(data.message || "Failed to create company.");
      }
    } catch {
      setFormError("Couldn't connect. Please check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (companyId: string) => {
    setResendingId(companyId);
    try {
      const res = await fetch(
        `${API}/platform/companies/${companyId}/resend-invite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setLastInvite(data.data);
        fetchCompanies();
      }
    } catch {
      setError("Failed to resend invite.");
    } finally {
      setResendingId(null);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
    });

  const filteredCompanies =
    statusFilter === "all"
      ? companies
      : companies.filter((c) => c.status === statusFilter);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ ...S.card, padding: "20px 28px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1d2939", margin: 0 }}>
            Platform Admin
          </h1>
          <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
            Onboard new companies and manage owner invites
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...S.badge("Active"), fontSize: 12 }}>
            {companies.filter((c) => c.status === "Active").length} active
          </span>
          <span style={{
            background: "#fffaeb", color: "#b45309",
            padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            {companies.filter((c) => c.status === "pending_owner").length} pending
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, alignItems: "start" }}>

        {/* Left — Create Company Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...S.card, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Icon.Building />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1d2939", margin: 0 }}>
                Create company
              </p>
            </div>
            <p style={{ fontSize: 12, color: "#667085", margin: "0 0 20px" }}>
              The owner completes company details after accepting the invite.
            </p>

            <div style={S.fieldGroup}>
              <label style={S.label}>Company name <span style={{ color: "#f04438" }}>*</span></label>
              <input
                style={S.input}
                placeholder="Acme Logistics (Pty) Ltd"
                value={form.companyName}
                onChange={upd("companyName")}
              />
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Owner email <span style={{ color: "#f04438" }}>*</span></label>
              <input
                style={S.input}
                type="email"
                placeholder="owner@company.com"
                value={form.ownerEmail}
                onChange={upd("ownerEmail")}
              />
              <p style={{ fontSize: 11, color: "#98a2b3", margin: "4px 0 0" }}>
                The invite link will be sent here. They set their name and password when they accept.
              </p>
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Country <span style={{ fontSize: 11, color: "#98a2b3" }}>(optional)</span></label>
              <select style={S.select} value={form.country} onChange={upd("country")}>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {formError && (
              <div style={S.notice("error")}>{formError}</div>
            )}

            <button
              onClick={handleCreate}
              disabled={submitting}
              style={{ ...S.btn("primary", submitting), width: "100%", justifyContent: "center" }}
            >
              <Icon.Plus />
              {submitting ? "Creating..." : "Create company & generate invite"}
            </button>
          </div>

          {/* Invite link result */}
          {lastInvite && (
            <div style={{ ...S.card, padding: "16px 20px" }}>
              <div style={S.notice("success")}>
                <strong>Invite link ready.</strong> Share this link with the owner — it expires in 48 hours and can only be used once.
              </div>
              <div style={{
                background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8,
                padding: "10px 12px", fontSize: 12, color: "#344054",
                wordBreak: "break-all", marginBottom: 10,
              }}>
                {lastInvite.inviteLink}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => copyLink(lastInvite.inviteLink)}
                  style={{ ...S.btn("secondary"), flex: 1, justifyContent: "center" }}
                >
                  {copied ? <Icon.Check /> : <Icon.Copy />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button
                  onClick={() => setLastInvite(null)}
                  style={{ ...S.btn("ghost"), padding: "9px 12px" }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#98a2b3", margin: "8px 0 0" }}>
                Expires: {formatDate(lastInvite.expiresAt)}
              </p>
            </div>
          )}
        </div>

        {/* Right — Companies List */}
        <div style={S.card}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f2f4f7", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1d2939", margin: 0 }}>
              All companies
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "pending_owner", "Active", "Inactive"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12,
                    cursor: "pointer", fontWeight: statusFilter === s ? 600 : 400,
                    border: `1px solid ${statusFilter === s ? BRAND : "#e4e7ec"}`,
                    background: statusFilter === s ? BRAND + "18" : "#fff",
                    color: statusFilter === s ? BRAND_DARK : "#667085",
                  }}
                >
                  {s === "all" ? "All" : s === "pending_owner" ? "Pending" : s}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ ...S.notice("error"), margin: "16px 20px 0" }}>{error}</div>}

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#98a2b3", fontSize: 13 }}>
              Loading companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: "0 0 12px" }}>🏢</p>
              <p style={{ fontWeight: 600, color: "#344054", margin: "0 0 4px" }}>No companies yet</p>
              <p style={{ fontSize: 13, color: "#98a2b3", margin: 0 }}>
                Create a company using the form to get started.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Company", "Owner email", "Country", "Status", "Created", ""].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left", fontWeight: 600,
                        color: "#344054", borderBottom: "1px solid #e4e7ec", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f2f4f7" }}>
                        <p style={{ fontWeight: 600, color: "#1d2939", margin: 0 }}>{c.name}</p>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f2f4f7", color: "#667085" }}>
                        {c.inviteEmail || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f2f4f7", color: "#667085" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon.Globe />{c.country || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f2f4f7" }}>
                        <span style={S.badge(c.status)}>
                          {c.status === "pending_owner" ? "Invite pending" : c.status}
                        </span>
                        {c.status === "pending_owner" && c.inviteExpiresAt && (
                          <p style={{ fontSize: 11, color: "#98a2b3", margin: "3px 0 0" }}>
                            Expires {formatDate(c.inviteExpiresAt)}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f2f4f7", color: "#667085", whiteSpace: "nowrap" }}>
                        {formatDate(c.createdAt)}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f2f4f7" }}>
                        {c.status === "pending_owner" && (
                          <button
                            onClick={() => handleResend(c.id)}
                            disabled={resendingId === c.id}
                            style={{ ...S.btn("secondary", resendingId === c.id), whiteSpace: "nowrap" }}
                          >
                            <Icon.Refresh />
                            {resendingId === c.id ? "Resending..." : "Resend invite"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer tip */}
      <div style={{
        marginTop: 20, background: "linear-gradient(135deg, #ecf3ff, #dde9ff)",
        padding: "12px 20px", borderRadius: 12, display: "flex", alignItems: "center",
        gap: 8, color: "#3641f5", fontSize: 13, fontWeight: 500, border: "1px solid #9cb9ff",
      }}>
        <Icon.Mail />
        Invite links expire after 48 hours. If the owner hasn't accepted, use "Resend invite" to generate a fresh link.
      </div>
    </div>
  );
};

export default PlatformAdminPage;
