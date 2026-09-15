import React, { useCallback, useEffect, useState } from "react";
import { C } from "../utils/employee";
import { orgApi, type OvertimeRequest } from "../utils/organizationSettings";

export const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #e4e7ec",
  padding: 24,
};

export const INPUT: React.CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
  color: "#344054",
  outline: "none",
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

export const TH: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "#667085",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

export const TD: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#667085",
};

const AVATAR_COLORS = [C.coral, "#12b76a", "#f79009", "#ee46bc", "#7a5af8", "#f04438", "#0891b2", "#059669"];

export const normalizeOvertimeRequests = (data: any): OvertimeRequest[] => {
  const rows = Array.isArray(data) ? data : data?.requests;
  return (rows || []).map((request: any) => ({
    ...request,
    id: request.id || request._id,
    employeeName: request.employeeName || request.employee?.name || request.employee?.firstName,
    hours: Number(request.hours || 0),
    rate: Number(request.rate || 1.5),
    status: request.status || "pending",
  }));
};

export const hoursBetween = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  return minutes > 0 ? Math.round((minutes / 60) * 100) / 100 : 0;
};

export const overtimeStatusPill = (status: OvertimeRequest["status"]) => {
  const map = {
    approved: { bg: C.okBg, color: "#027a48" },
    rejected: { bg: C.badBg, color: "#b42318" },
    pending: { bg: C.warnBg, color: "#b54708" },
  }[status] || { bg: "#f2f4f7", color: "#667085" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: map.bg,
      color: map.color,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
};

export const nameInitials = (name?: string) => {
  const parts = String(name || "Employee").trim().split(/\s+/);
  return `${parts[0]?.[0] || "E"}${parts[1]?.[0] || ""}`.toUpperCase();
};

export const PageHeader: React.FC<{ title: string; subtitle: string; right?: React.ReactNode }> = ({
  title, subtitle, right,
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>{title}</h2>
      <p style={{ margin: "4px 0 0", fontSize: 14, color: C.muted }}>{subtitle}</p>
    </div>
    {right}
  </div>
);

export const StatTiles: React.FC<{ items: { label: string; value: string | number; color: string }[] }> = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
    {items.map((item) => (
      <div key={item.label} style={{ borderRadius: 16, border: "1px solid #e4e7ec", padding: 20, background: "#fff" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: item.color }}>{item.label}</p>
        <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 700, color: C.ink }}>{item.value}</p>
      </div>
    ))}
  </div>
);

export const LoadingBlock: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ padding: "48px 0", textAlign: "center" }}>
    <div style={{
      display: "inline-block", width: 36, height: 36,
      border: "3px solid #f3f4f6", borderTopColor: C.coral, borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <p style={{ marginTop: 12, color: "#9ca3af" }}>{label}</p>
  </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: C.badBg, border: "1px solid #fca5a5", color: "#dc2626", fontSize: 14 }}>
    {message}
  </div>
);

export const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
  <div style={{ padding: "12px 16px", marginBottom: 16, borderRadius: 8, background: C.okBg, border: "1px solid #a6f4c5", color: "#027a48", fontSize: 14 }}>
    {message}
  </div>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "5px 12px",
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 500,
      cursor: props.disabled ? "not-allowed" : "pointer",
      border: "1px solid #d0d5dd",
      background: "#fff",
      color: "#344054",
      ...style,
    }}
  >
    {children}
  </button>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => (
  <button
    {...props}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      border: "none",
      background: props.disabled ? "#98a2b3" : C.coral,
      color: "#fff",
      fontSize: 14,
      fontWeight: 500,
      cursor: props.disabled ? "not-allowed" : "pointer",
      ...style,
    }}
  >
    {children}
  </button>
);

export const PersonCell: React.FC<{ name?: string; index: number; sub?: string }> = ({ name, index, sub }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{
      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
      background: AVATAR_COLORS[index % AVATAR_COLORS.length], color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13,
    }}>
      {nameInitials(name)}
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{name || "Employee"}</div>
      {sub ? <div style={{ fontSize: 12, color: C.faint }}>{sub}</div> : null}
    </div>
  </div>
);

export function useOvertimeRequests() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orgApi.loadOvertimeRequests();
      if (response.success) setRequests(normalizeOvertimeRequests(response.data));
      else setMessage(response.message || "Could not load overtime requests.");
    } catch {
      setMessage("Could not load overtime requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { requests, setRequests, loading, message, setMessage, load };
}
