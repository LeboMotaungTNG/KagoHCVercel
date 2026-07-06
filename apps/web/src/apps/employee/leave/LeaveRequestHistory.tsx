import React, { useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Inbox } from "lucide-react";
import type { LeaveRequest, StatusFilter } from "./types";
import { C, SHADOW } from "./leaveStyles";
import {
  formatDate, getLeaveTypeLabel, LeaveTypeIcon, Section, StatusPill,
} from "./leaveUiHelpers";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
];

interface Props {
  requests: LeaveRequest[];
  onSelect: (request: LeaveRequest) => void;
}

const LeaveRequestHistory: React.FC<Props> = ({ requests, onSelect }) => {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const sorted = [...requests].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
    );
    if (filter === "all") return sorted;
    return sorted.filter(r => r.status === filter);
  }, [requests, filter]);

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    cancelled: requests.filter(r => r.status === "cancelled").length,
  }), [requests]);

  return (
    <Section
      icon={<ClipboardList size={20} />}
      iconColor={C.purple}
      title="My leave requests"
      subtitle="Track submissions and approval status."
      style={{ marginTop: 0 }}
    >
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16,
      }}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          const count = counts[f.id];
          if (f.id !== "all" && count === 0) return null;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                background: active ? C.primary : C.surfaceAlt,
                color: active ? "#fff" : C.muted,
                boxShadow: active ? "0 2px 8px rgba(51,166,205,0.25)" : "none",
              }}
            >
              {f.label}
              {count > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700,
                  opacity: active ? 0.9 : 0.7,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          borderRadius: 14, border: `1px dashed ${C.line}`, background: C.surfaceAlt,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 12px",
            background: C.primaryBg, color: C.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Inbox size={22} />
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.ink }}>
            {filter === "all" ? "No leave requests yet" : `No ${filter} requests`}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            {filter === "all"
              ? "Submit your first request using the form above."
              : "Try another filter to see more requests."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(request => (
            <button
              key={request._id}
              type="button"
              onClick={() => onSelect(request)}
              style={{
                width: "100%", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                border: `1px solid ${C.line}`, background: C.surface,
                transition: "border-color .15s ease, box-shadow .15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${C.primary}55`;
                e.currentTarget.style.boxShadow = SHADOW;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.line;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: C.surfaceAlt, color: C.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <LeaveTypeIcon type={request.leave_type} size={18} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.ink }}>
                  {getLeaveTypeLabel(request.leave_type)}
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>
                  {formatDate(request.start_date)} – {formatDate(request.end_date)}
                  {" · "}{request.total_days} day{request.total_days === 1 ? "" : "s"}
                </p>
              </div>
              <StatusPill status={request.status} />
              <ChevronRight size={16} color={C.faint} style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </Section>
  );
};

export default LeaveRequestHistory;
