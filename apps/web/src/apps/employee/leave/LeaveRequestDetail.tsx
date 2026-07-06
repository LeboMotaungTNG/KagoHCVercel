import React, { useEffect } from "react";
import { X, Clock } from "lucide-react";
import type { LeaveRequest } from "./types";
import { C, labelStyle } from "./leaveStyles";
import {
  formatDate, formatDateTime, getLeaveTypeLabel,
  LeaveTypeIcon, StatusPill,
} from "./leaveUiHelpers";

interface Props {
  request: LeaveRequest;
  onClose: () => void;
}

const InfoCell: React.FC<{ label: string; value: React.ReactNode; full?: boolean }> = ({
  label, value, full,
}) => (
  <div style={full ? { gridColumn: "1 / -1" } : undefined}>
    <p style={{ ...labelStyle, marginBottom: 4 }}>{label}</p>
    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.5 }}>{value || "—"}</p>
  </div>
);

const LeaveRequestDetail: React.FC<Props> = ({ request, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2147483646,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
      />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", width: "100%", maxWidth: 440, maxHeight: "85vh",
          borderRadius: 18, background: C.surface,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${C.line}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.primaryBg, color: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LeaveTypeIcon type={request.leave_type} size={18} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink }}>
                {getLeaveTypeLabel(request.leave_type)}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Leave request details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderRadius: 12, background: C.surfaceAlt,
            border: `1px solid ${C.line}`,
          }}>
            <span style={{ fontSize: 13, color: C.muted }}>Status</span>
            <StatusPill status={request.status} />
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px",
            padding: "14px 16px", borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.surfaceAlt,
          }}>
            <InfoCell label="Start date" value={formatDate(request.start_date)} />
            <InfoCell label="End date" value={formatDate(request.end_date)} />
            <InfoCell label="Duration" value={`${request.total_days} day${request.total_days === 1 ? "" : "s"}`} />
            <InfoCell
              label="Submitted"
              value={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} color={C.muted} />
                  {formatDateTime(request.submitted_at)}
                </span>
              }
            />
            <InfoCell label="Reason" value={request.reason} full />
          </div>

          {request.status !== "pending" && (request.reviewer_name || request.reviewed_at || request.rejection_reason) && (
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              border: `1px solid ${C.line}`, background: C.surfaceAlt,
            }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>Review</p>
              {request.reviewer_name && (
                <p style={{ margin: "0 0 6px", fontSize: 13, color: C.ink }}>
                  Reviewed by <strong>{request.reviewer_name}</strong>
                </p>
              )}
              {request.reviewed_at && (
                <p style={{ margin: "0 0 6px", fontSize: 13, color: C.muted }}>
                  {formatDateTime(request.reviewed_at)}
                </p>
              )}
              {request.rejection_reason && (
                <p style={{ margin: "8px 0 0", fontSize: 13, color: C.bad, lineHeight: 1.45 }}>
                  {request.rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.line}` }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 10,
              border: `1px solid ${C.line}`, background: C.surface,
              fontSize: 14, fontWeight: 600, color: C.ink, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestDetail;
