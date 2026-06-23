
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PAGE_SIZE,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  STATUS_STYLES,
  AVATAR_COLORS,
  formatDate,
  formatDateTime,
  getInitials,
  type LeaveStatus,
  type LeaveType,
  type LeaveRequest,
  type Filters,
  type Stats,
  filterLeaves,
  paginateLeaves,
  computeStats,
  hasActiveFilters,
} from "../utils/LeaveUtils";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

type AlertType = "success" | "error" | "info";

// ─── Icons ────────────────────────────────────────────────────────────────────

const Ic = {
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Table:    () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  Close:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Check:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Eye:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#f2f4f7", color: "#344054", ...style }}>
      {children}
    </span>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

function AlertBanner({ message, type, onClose }: { message: string; type: AlertType; onClose: () => void }) {
  const styles: Record<AlertType, React.CSSProperties> = {
    success: { background: "#ecfdf3", border: "1px solid #bbf7d0", color: "#027a48" },
    error:   { background: "#fef2f2", border: "1px solid #fecaca", color: "#b42318" },
    info:    { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" },
  };
  return (
    <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", ...styles[type] }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><Ic.Close/></button>
    </div>
  );
}

// ─── Leave Details Modal ──────────────────────────────────────────────────────

function LeaveDetailsModal({
  leave, onClose, onApprove, onReject, approving, getLabel,
}: {
  leave: LeaveRequest;
  onClose: () => void;
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
  approving: boolean;
  getLabel: (t: string) => string;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const InfoGrid = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>{children}</div>
  );
  const InfoCell = ({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) => (
    <div style={full ? { gridColumn: "1 / -1" } : {}}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#98a2b3", textTransform: "uppercase", letterSpacing: .3 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1d2939" }}>{value || "—"}</p>
    </div>
  );
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ borderRadius: 10, border: "1px solid #e4e7ec", background: "#f9fafb", padding: "12px 14px" }}>
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, color: "#98a2b3" }}>{title}</p>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 420, maxHeight: "80vh", borderRadius: 16, background: "#fff", boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)", display: "flex", flexDirection: "column", animation: "leaveModalIn .2s ease-out" }}>
        <style>{`@keyframes leaveModalIn { from { opacity:0; transform:scale(.93); } to { opacity:1; transform:scale(1); } }`}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f2f4f7", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1d2939" }}>Leave Request</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085", padding: 4, borderRadius: 6 }}><Ic.Close/></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Section title="Employee">
            <InfoGrid>
              <InfoCell label="Name"       value={leave.full_name || "—"}/>
              <InfoCell label="Code"       value={leave.employee_code || "—"}/>
              <InfoCell label="Department" value={leave.department || "—"}/>
              <InfoCell label="Position"   value={leave.position || "—"}/>
            </InfoGrid>
          </Section>

          <Section title="Leave Details">
            <InfoGrid>
              <InfoCell label="Type"     value={getLabel(leave.leave_type)}/>
              <InfoCell label="Duration" value={`${leave.total_days} day(s)`}/>
              <InfoCell label="Dates"    value={`${formatDate(leave.start_date)} – ${formatDate(leave.end_date)}`} full/>
              <InfoCell label="Reason"   value={leave.reason} full/>
              {leave.attachment_path && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#98a2b3", textTransform: "uppercase", letterSpacing: .3 }}>Document</p>
                  <a href={leave.attachment_path} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#E6A79E", fontWeight: 500, textDecoration: "none" }}>
                    📎 View attachment
                  </a>
                </div>
              )}
            </InfoGrid>
          </Section>

          <Section title="Status">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#667085" }}>Status</span>
                <Badge style={STATUS_STYLES[leave.status]}>{leave.status}</Badge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#667085" }}>Submitted</span>
                <span style={{ fontWeight: 500, color: "#1d2939" }}>{formatDateTime(leave.submitted_at)}</span>
              </div>
              {leave.status !== "pending" && (
                <>
                  <div style={{ borderTop: "1px solid #f2f4f7", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#667085" }}>Reviewed by</span>
                    <span style={{ fontWeight: 500, color: "#1d2939" }}>{leave.reviewer_name || "Administrator"}</span>
                  </div>
                  {leave.reviewed_at && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#667085" }}>Reviewed at</span>
                      <span style={{ fontWeight: 500, color: "#1d2939" }}>{formatDateTime(leave.reviewed_at)}</span>
                    </div>
                  )}
                  {leave.rejection_reason && (
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#98a2b3", textTransform: "uppercase", letterSpacing: .3 }}>Rejection reason</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#1d2939" }}>{leave.rejection_reason}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #f2f4f7", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 13, fontWeight: 500, color: "#344054", cursor: "pointer" }}>Close</button>
          {leave.status === "pending" && (
            <>
              <button
                onClick={() => onApprove(leave)}
                disabled={approving}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#10b981", fontSize: 13, fontWeight: 500, color: "#fff", cursor: approving ? "not-allowed" : "pointer", opacity: approving ? 0.6 : 1 }}
              >
                {approving ? "Approving…" : "Approve"}
              </button>
              <button onClick={() => onReject(leave)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#ef4444", fontSize: 13, fontWeight: 500, color: "#fff", cursor: "pointer" }}>Reject</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ onClose, onConfirm, loading }: { onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) {
  const [reason, setReason] = useState("");
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 480, borderRadius: 16, background: "#fff", boxShadow: "0 20px 40px rgba(0,0,0,.15)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f2f4f7" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1d2939" }}>Reject Leave Request</h3>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>Please provide a reason for rejecting this leave request.</p>
        </div>
        <div style={{ padding: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: "#344054" }}>Rejection Reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            placeholder="Provide a clear reason for rejection..."
            style={{ width: "100%", borderRadius: 8, border: "1px solid #d1d5db", padding: "10px 12px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", color: "#1d2939" }}
          />
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid #f2f4f7", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#ef4444", fontSize: 14, fontWeight: 500, color: "#fff", cursor: reason.trim() && !loading ? "pointer" : "not-allowed", opacity: !reason.trim() || loading ? .5 : 1 }}
          >
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Pending Requests", value: stats.pending,  color: "#b54708", icon: <Ic.Calendar /> },
    { label: "Approved",         value: stats.approved, color: "#027a48", icon: <Ic.Check />   },
    { label: "Denied",           value: stats.rejected, color: "#b42318", icon: <Ic.X />       },
    { label: "Total Requests",   value: stats.total,    color: "#1d4ed8", icon: <Ic.Table />   },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ borderRadius: 16, border: "1px solid #e4e7ec", background: "#ffffff", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: c.color, fontWeight: 500 }}>{c.label}</p>
              <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700, color: "#1d2939" }}>{c.value}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f2f4f7", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d2939" }}>
              {c.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ icon, label, onClick, color, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string; disabled?: boolean }) {
  const hasColor = !!color;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${hasColor ? color : "#d0d5dd"}`, background: hasColor ? `${color}15` : "#fff", color: hasColor ? color : "#344054", whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hasColor ? `${color}30` : "#f9fafb"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = hasColor ? `${color}15` : "#fff"; }}
    >
      {icon} {label}
    </button>
  );
}

// ─── Main shared component ──────────────────────────────────────────────────

export interface LeaveManagementProps {
  /** Accent color for the active pagination button (defaults to manager pink). */
  accent?: string;
  /** Whether the current user may approve/reject (managers/owner/admin/hr). */
  canReview?: boolean;
  title?: string;
  subtitle?: string;
}

export function LeaveManagement({ accent = "#E6A79E", canReview = true, title = "Leave Requests Management", subtitle = "Home › Leave Requests" }: LeaveManagementProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const token   = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) { navigate("/"); return; }
    try { JSON.parse(userStr); } catch { navigate("/"); }
  }, [navigate]);

  const card: React.CSSProperties = { background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec" };

  const [leaves, setLeaves]               = useState<LeaveRequest[]>([]);
  // Dynamic label/style maps so custom owner-defined leave types render with
  // their proper name + color on the manager/owner side instead of raw slugs.
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});
  const [dynamicStyles, setDynamicStyles] = useState<Record<string, React.CSSProperties>>({});
  const labelFor = (t: string) => LEAVE_TYPE_LABELS[t as LeaveType] || dynamicLabels[t] || t;
  const styleFor = (t: string) => LEAVE_TYPE_STYLES[t as LeaveType] || dynamicStyles[t] || { background: "#f3f4f6", color: "#374151" };
  const [loading, setLoading]             = useState(true);
  const [approving, setApproving]         = useState(false);
  const [alert, setAlert]                 = useState<{ message: string; type: AlertType } | null>(null);
  const [filters, setFilters]             = useState<Filters>({ status: "", leave_type: "", start_date: "", end_date: "", search: "" });
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<LeaveRequest | null>(null);
  const [rejecting, setRejecting]         = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const searchTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => filterLeaves(leaves, filters), [leaves, filters]);
  const { data: paginated, totalPages } = useMemo(() => paginateLeaves(filtered, currentPage, PAGE_SIZE), [filtered, currentPage]);
  const hasFilters = hasActiveFilters(filters);
  const stats: Stats = useMemo(() => computeStats(leaves), [leaves]);

  useEffect(() => setCurrentPage(1), [filters]);

  const showAlert = (message: string, type: AlertType) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLeaves = async (silent?: boolean) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/leave`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      const rows: LeaveRequest[] =
        Array.isArray(data)            ? data :
        Array.isArray(data.data?.data) ? data.data.data :
        Array.isArray(data.data)       ? data.data :
        [];

      const mappedRows = rows.map(row => ({
        ...row,
        submitted_at: row.submitted_at || (row as any).createdAt || new Date().toISOString(),
        total_days: row.total_days || (row as any).daysRequested || (row as any).totalDays || 1,
      }));

      setLeaves(mappedRows);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      showAlert("Failed to load leave requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // Pull the canonical leave types from the backend (LeavePolicyModel) so any
  // custom company-defined types show up with proper names and colours here.
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/leave/types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          const labels: Record<string, string> = {};
          const styles: Record<string, React.CSSProperties> = {};
          data.data.forEach((t: any) => {
            labels[t.type] = t.name || t.type;
            if (t.color) styles[t.type] = { background: `${t.color}22`, color: t.color };
          });
          setDynamicLabels(labels);
          setDynamicStyles(styles);
        }
      } catch (err) {
        console.warn("Failed to load leave types for display:", err);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => { if (!document.hidden) fetchLeaves(true); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // ── Approve (dedicated endpoint, records reviewer) ───────────────────────────

  const approveLeave = async (leave: LeaveRequest) => {
    setApproving(true);
    try {
      const token = localStorage.getItem("token");
      const mongoId = (leave as any)._id;
      if (!mongoId) { showAlert("Cannot find leave record ID.", "error"); return; }

      const response = await fetch(`${API_URL}/leave/${mongoId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setSelectedLeave(null);
        showAlert("Leave request approved successfully.", "success");
        await fetchLeaves(true);
      } else {
        showAlert(data.message || data.error?.message || "Failed to approve leave request.", "error");
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      showAlert("Failed to approve leave request.", "error");
    } finally {
      setApproving(false);
    }
  };

  // ── Reject (dedicated endpoint, keeps original reason) ───────────────────────

  const rejectLeave = async (reason: string) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const token = localStorage.getItem("token");
      const mongoId = (rejectTarget as any)._id;
      if (!mongoId) { showAlert("Cannot find leave record ID.", "error"); return; }

      const response = await fetch(`${API_URL}/leave/${mongoId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setRejectTarget(null);
        setSelectedLeave(null);
        showAlert("Leave request denied successfully.", "success");
        await fetchLeaves(true);
      } else {
        showAlert(data.message || data.error?.message || "Failed to reject leave request.", "error");
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      showAlert("Failed to reject leave request.", "error");
    } finally {
      setRejecting(false);
    }
  };

  // ── Cancel ───────────────────────────────────────────────────────────────────

  const cancelLeave = async (leave: LeaveRequest) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      const token = localStorage.getItem("token");
      const mongoId = (leave as any)._id;
      if (!mongoId) { showAlert("Cannot find leave record ID.", "error"); return; }

      const response = await fetch(`${API_URL}/leave/${mongoId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (response.ok && data.success !== false) {
        showAlert("Leave request cancelled successfully.", "success");
        await fetchLeaves(true);
      } else {
        showAlert(data.message || data.error?.message || "Failed to cancel leave request.", "error");
      }
    } catch (error) {
      console.error("Error cancelling leave:", error);
      showAlert("Failed to cancel leave request.", "error");
    }
  };

  const openRejectModal = (leave: LeaveRequest) => {
    setSelectedLeave(null);
    setRejectTarget(leave);
  };

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters(f => ({ ...f, [key]: value }));

  const handleSearchChange = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setFilter("search", value), 400);
  };

  const inputStyle: React.CSSProperties = { height: 40, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 12px", fontSize: 14, outline: "none", color: "#344054", background: "#fff" };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1d2939", margin: 0 }}>{title}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>{subtitle}</p>
      </div>

      {alert && <AlertBanner message={alert.message} type={alert.type} onClose={() => setAlert(null)}/>}

      <StatCards stats={stats}/>

      {/* Filters */}
      <div style={{ ...card, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1d2939" }}>Leave Requests</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667085" }}>
              Showing {filtered.length} of {leaves.length} requests
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <select defaultValue="" onChange={e => setFilter("status", e.target.value as LeaveStatus | "")} style={inputStyle}>
              <option value="">All Status</option>
              {(["pending","approved","rejected","cancelled"] as LeaveStatus[]).map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            <select defaultValue="" onChange={e => setFilter("leave_type", e.target.value as LeaveType | "")} style={inputStyle}>
              <option value="">All Types</option>
              {Object.entries({ ...LEAVE_TYPE_LABELS, ...dynamicLabels }).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>

            <input type="date" onChange={e => setFilter("start_date", e.target.value)} style={inputStyle} title="From date"/>
            <input type="date" onChange={e => setFilter("end_date",   e.target.value)} style={inputStyle} title="To date"/>

            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#98a2b3", pointerEvents: "none" }}><Ic.Search/></span>
              <input type="text" placeholder="Search employee…" onChange={e => handleSearchChange(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, width: 200 }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f2f4f7" }}>
                {["Employee", "Leave Type", "Date Range", "Days", "Status", "Submitted", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#667085", fontSize: 14 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #e4e7ec", borderTop: `2px solid ${accent}`, animation: "spin 1s linear infinite" }}/>
                    Loading leave requests…
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </td></tr>
              )}

              {!loading && paginated.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 32, margin: "0 0 8px" }}>📋</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1d2939" }}>No leave requests found</p>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#667085" }}>{hasFilters ? "Try adjusting your filters." : "No leave requests have been submitted yet."}</p>
                </td></tr>
              )}

              {!loading && paginated.map((leave, idx) => (
                <tr
                  key={leave.leave_id}
                  style={{ borderBottom: "1px solid #f9fafb", transition: "background .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                        {getInitials(leave.full_name || "Unknown")}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1d2939" }}>{leave.full_name || "—"}</div>
                        <div style={{ fontSize: 12, color: "#98a2b3" }}>{leave.employee_code || "—"}</div>
                        <div style={{ fontSize: 12, color: "#98a2b3" }}>{leave.department || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge style={styleFor(leave.leave_type)}>{labelFor(leave.leave_type)}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 14, color: "#1d2939" }}>{formatDate(leave.start_date)} – {formatDate(leave.end_date)}</div>
                    <div style={{ fontSize: 12, color: "#98a2b3" }}>Duration: {leave.total_days || 0} day(s)</div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1d2939" }}>{leave.total_days || 0}</div>
                    <div style={{ fontSize: 11, color: "#98a2b3" }}>day(s)</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge style={STATUS_STYLES[leave.status]}>{leave.status}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, color: "#1d2939" }}>{leave.reason || "—"}</div>
                    <div style={{ fontSize: 11, color: "#98a2b3", marginTop: 4 }}>
                      Requested: {leave.submitted_at ? new Date(leave.submitted_at).toLocaleString() : "Date pending"}
                    </div>
                    {leave.reviewer_name && <div style={{ fontSize: 11, color: "#98a2b3" }}>Reviewed by: {leave.reviewer_name}</div>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <ActionBtn icon={<Ic.Eye/>}   label="View"    onClick={() => setSelectedLeave(leave)}/>
                      {canReview && leave.status === "pending" && (
                        <>
                          <ActionBtn icon={<Ic.Check/>} label="Approve" color="#10b981" disabled={approving} onClick={() => approveLeave(leave)}/>
                          <ActionBtn icon={<Ic.X/>}     label="Reject"  color="#ef4444" onClick={() => openRejectModal(leave)}/>
                          <ActionBtn icon={<Ic.Trash/>} label="Cancel"                  onClick={() => cancelLeave(leave)}/>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div style={{ borderTop: "1px solid #f2f4f7", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#667085" }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 13, fontWeight: 500, color: "#344054", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? .5 : 1 }}>
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setCurrentPage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #d0d5dd", fontSize: 13, fontWeight: 500, cursor: "pointer", background: p === currentPage ? accent : "#fff", color: p === currentPage ? "#fff" : "#344054" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d0d5dd", background: "#fff", fontSize: 13, fontWeight: 500, color: "#344054", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? .5 : 1 }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onApprove={approveLeave}
          onReject={openRejectModal}
          approving={approving}
          getLabel={labelFor}
        />
      )}
      {rejectTarget && (
        <RejectModal
          onClose={() => setRejectTarget(null)}
          onConfirm={rejectLeave}
          loading={rejecting}
        />
      )}
    </div>
  );
}

export default LeaveManagement;
