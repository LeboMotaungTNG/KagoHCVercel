import React from "react";
import {
  Palmtree, Stethoscope, Users, Baby, CalendarDays, ClipboardList,
} from "lucide-react";
import { C } from "../../../shared/utils/employee";
import { LEAVE_TYPE_LABELS, STATUS_STYLES, formatDate, formatDateTime } from "../../../shared/utils/LeaveUtils";
import type { LeaveStatus, LeaveType } from "../../../shared/utils/LeaveUtils";

export const getLeaveTypeLabel = (type: string): string => {
  const key = type as LeaveType;
  if (LEAVE_TYPE_LABELS[key]) return LEAVE_TYPE_LABELS[key];
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ") + " Leave";
};

export const getLeaveTypeColor = (type: string): string => {
  const map: Record<string, string> = {
    annual: C.primary,
    sick: C.green,
    family: C.blue,
    maternity: C.purple,
    parental: C.ok,
    paternity: C.blue,
    study: "#6366f1",
    unpaid: C.amber,
    other: C.muted,
  };
  return map[type] || C.primary;
};

export const LeaveTypeIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 18 }) => {
  const props = { size, strokeWidth: 1.75 };
  switch (type) {
    case "annual": return <Palmtree {...props} />;
    case "sick": return <Stethoscope {...props} />;
    case "family": return <Users {...props} />;
    case "maternity":
    case "parental":
    case "paternity": return <Baby {...props} />;
    case "study": return <ClipboardList {...props} />;
    default: return <CalendarDays {...props} />;
  }
};

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const key = status as LeaveStatus;
  const style = STATUS_STYLES[key] || { background: C.surfaceAlt, color: C.muted };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
        ...style,
      }}
    >
      {status}
    </span>
  );
};

export const Section: React.FC<{
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ icon, iconColor, title, subtitle, right, children, style }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 22,
    boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
    padding: 24,
    ...style,
  }}>
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${iconColor}1a`, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>{title}</h2>
          {subtitle && <p style={{ color: C.muted, margin: "2px 0 0", fontSize: 12.5 }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    {children}
  </div>
);

export const Toast: React.FC<{ message: string; type: "success" | "error" }> = ({ message, type }) => (
  <div style={{
    position: "fixed", top: 84, right: 24, zIndex: 9999,
    padding: "12px 18px", borderRadius: 12,
    background: type === "success" ? C.okBg : C.badBg,
    color: type === "success" ? "#027a48" : "#b42318",
    border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
    display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500,
    boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
  }}>
    {message}
  </div>
);

export { formatDate, formatDateTime };
