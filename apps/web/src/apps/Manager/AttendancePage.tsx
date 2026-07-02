import React, { useState, useEffect, useMemo } from "react";
import SharedLayout from "./SharedLayout";
import {
  type AttendanceStatus,
  type ManagerAttendanceRecord,
  type Employee,
  type DateRangeKey,
  STATUS_COLORS,
  badgeStyle,
  fmtTime,
  pad2,
  addDays,
  isWeekend,
  useManagerAttendance,
} from "../../shared/utils/attendance";
import { API_URL, C } from "../../shared/utils/employee";

// ─── Utilities ────────────────────────────────────────────────────────────────

// Safely convert a value that might be a string OR a populated Mongo object into a string
const asText = (v: any, fallback = "—"): string => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    return (
      v.full_name ||
      [v.firstName, v.lastName].filter(Boolean).join(" ") ||
      v.name ||
      v.title ||
      v.code ||
      fallback
    );
  }
  return fallback;
};

// ─── Style Tokens ─────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec", padding: 24,
};

const INPUT: React.CSSProperties = {
  height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #d0d5dd",
  fontSize: 14, color: "#344054", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box" as const, cursor: "pointer",
};

const AVATAR_COLORS = [
  C.coral, "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#DC2626", "#0891B2", "#4F46E5", "#9333EA", "#C026D3",
  "#0D9488", "#CA8A04", "#DB2777", "#EA580C", "#65A30D",
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  UserX: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
      <line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Printer: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Info: ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; type: "success" | "error" | "info"; onClose: () => void }> = ({ message, type, onClose }) => {
  const cfg = {
    success: { bg: "#ecfdf3", border: "#6ee7b7", color: "#065f46", icon: <Icon.Check /> },
    error:   { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", icon: <Icon.AlertCircle /> },
    info:    { bg: "#eff6ff", border: "#93c5fd", color: "#1e40af", icon: <Icon.Info /> },
  }[type];
  return (
    <div style={{
      position: "fixed", top: 88, right: 24, zIndex: 9999,
      minWidth: 300, maxWidth: 420,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 12, padding: "14px 16px",
      display: "flex", alignItems: "flex-start", gap: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      animation: "toastIn 0.22s ease",
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <p style={{ margin: 0, fontSize: 14, color: cfg.color, flex: 1, lineHeight: 1.5 }}>{message}</p>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: cfg.color, padding: 0, display: "flex" }}><Icon.Close /></button>
    </div>
  );
};

// ─── Live Clock ───────────────────────────────────────────────────────────────

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", borderRadius: 16, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>{now.toLocaleDateString("en-ZA", { weekday: "long" })}</p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>{now.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2 }}>Current Time</p>
        <p style={{ margin: 0, fontSize: 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: -1.5, color: C.coral }}>{`${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`}</p>
      </div>
    </div>
  );
};

// ─── KPI Stat Card ────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; accentBg: string; accentColor: string }> = ({ label, value, sub, icon, accentBg, accentColor }) => (
  <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 16 }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, flexShrink: 0 }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1d2939", letterSpacing: -0.5 }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{sub}</p>}
    </div>
  </div>
);

// ─── Punctuality Board ────────────────────────────────────────────────────────

function PunctualityBoard({ attendance }: { attendance: ManagerAttendanceRecord[] }) {
  const top5 = useMemo(() =>
    attendance
      .filter(r => r.clock_in && (r.status === "present" || r.status === "late"))
      .sort((a, b) => (a.clock_in ?? "").localeCompare(b.clock_in ?? ""))
      .slice(0, 5),
    [attendance]
  );

  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const getInitials = (name: any) => asText(name, "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  if (top5.length === 0) return null;

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffaeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
          <Icon.Trophy />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1d2939" }}>Early Birds</h3>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>First to clock in today</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {top5.map((r, i) => (
          <div key={r.attendance_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: i === 0 ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" : "#f9fafb", border: i === 0 ? "1px solid #fde68a" : "1px solid transparent" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", background: i < 3 ? medals[i] : "#d1d5db" }}>
              {i + 1}
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: AVATAR_COLORS[String(r.employee_id ?? r.attendance_id ?? "0").split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) % AVATAR_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
              {getInitials(r.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1d2939", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asText(r.full_name, "?")}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{asText(r.department)}</p>
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1d2939", fontVariantNumeric: "tabular-nums" }}>{fmtTime(r.clock_in)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Status Donut ─────────────────────────────────────────────────────────────

function StatusDonut({ attendance }: { attendance: ManagerAttendanceRecord[] }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    attendance.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [attendance]);

  const total = attendance.length || 1;
  const segments = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (attendance.length === 0) return null;

  let cumPct = 0;
  const RADIUS = 40;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  return (
    <div style={CARD}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1d2939" }}>Status Breakdown</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          {segments.map(([status, count]) => {
            const pct = count / total;
            const strokeDasharray = `${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
            const strokeDashoffset = -cumPct * CIRCUMFERENCE;
            cumPct += pct;
            return (
              <circle
                key={status}
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke={(STATUS_COLORS as any)[status] || "#e4e7ec"}
                strokeWidth="18"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            );
          })}
          <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1d2939">{total}</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {segments.map(([status, count]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: (STATUS_COLORS as any)[status] || "#e4e7ec", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#667085", textTransform: "capitalize" }}>{status.replace("_", " ")}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1d2939", marginLeft: "auto" }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Details Modal ────────────────────────────────────────────────────────────

function DetailsModal({ row, onClose, onExport }: { row: ManagerAttendanceRecord; onClose: () => void; onExport?: (row: ManagerAttendanceRecord) => void }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const getInitials = (name: any) => asText(name, "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 440, borderRadius: 20, background: "#fff", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "24px 24px 32px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#fff", display: "flex" }}><Icon.Close /></button>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            {getInitials(row.full_name)}
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{asText(row.full_name)}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{asText(row.employee_code)} · {asText(row.department)}</p>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Position", value: asText(row.position) },
            { label: "Status", value: <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize", ...badgeStyle(row.status) }}>{row.status.replace("_", " ")}</span> },
            { label: "Clock In",  value: fmtTime(row.clock_in)  || "—" },
            { label: "Clock Out", value: fmtTime(row.clock_out) || "—" },
            { label: "Work Hours", value: row.work_hours != null ? `${row.work_hours.toFixed(1)}h` : "—" },
            { label: "Date", value: row.date || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1d2939" }}>{value}</span>
            </div>
          ))}
        </div>
        {onExport && (
          <div style={{ padding: "0 24px 24px" }}>
            <button onClick={() => onExport(row)} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon.Download /> Export Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Weekly Heatmap ─────────────────────────────────────────────────────────────

function WeeklyHeatmap({ history, employees }: { history: ManagerAttendanceRecord[]; employees: Employee[] }) {
  const { weekDays, grid } = useMemo(() => {
    const today = new Date();
    const wDays: { label: string; dateStr: string }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = addDays(today, -i);
      if (isWeekend(d)) continue;
      wDays.push({ label: d.toLocaleDateString("en-ZA", { weekday: "short" }), dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` });
    }
    while (wDays.length < 5) {
      const d = addDays(today, -(5 + (5 - wDays.length)));
      if (!isWeekend(d)) wDays.unshift({ label: d.toLocaleDateString("en-ZA", { weekday: "short" }), dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` });
    }

    const lookup: Record<string, Record<string, AttendanceStatus>> = {};
    history.forEach(r => {
      if (!lookup[r.date]) lookup[r.date] = {};
      lookup[r.date][r.employee_id] = r.status;
    });

    const g = employees.slice(0, 10).map(emp => ({
      id: emp.employee_id,
      name: asText(emp.full_name, "Unknown"),
      cells: wDays.map(wd => lookup[wd.dateStr]?.[emp.employee_id] || null),
    }));

    return { weekDays: wDays, grid: g };
  }, [history, employees]);

  return (
    <div style={CARD}>
      <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#1d2939" }}>Weekly Heatmap</h3>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9ca3af" }}>Attendance patterns this week</p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af" }} />
              {weekDays.map(wd => (
                <th key={wd.dateStr} style={{ padding: "6px 4px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{wd.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, idx) => (
              <tr key={row.id || idx}>
                <td style={{ padding: "4px 10px", fontSize: 12, fontWeight: 500, color: "#374151", whiteSpace: "nowrap" }}>{row.name}</td>
                {row.cells.map((status, ci) => (
                  <td key={ci} style={{ padding: 3, textAlign: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, margin: "0 auto",
                      background: status ? STATUS_COLORS[status] + "22" : "#f9fafb",
                      border: `2px solid ${status ? STATUS_COLORS[status] : "#e4e7ec"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "transform 0.15s",
                    }}
                      title={status ? status.replace("_", " ") : "No data"}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {status && (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status] }} />
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function AttendanceContent() {
  const {
    loading, todayAttendance, allHistory, employees,
    departments, stats,
    noClockInList, showNoClockIn, setShowNoClockIn,
    filters, setSearch, setStatus, setDateRange, setDept, clearFilters,
    filtered,
    quickFilterPresent, quickFilterAbsent, quickFilterWeek,
    handleRefresh, handleExportCSV, handlePrint, handleExportRecord,
    selectedRow, setSelectedRow,
    alert, clearAlert,
  } = useManagerAttendance();

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {alert && <Toast message={alert.message} type={alert.type} onClose={clearAlert} />}

      {loading ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <div style={{ display: "inline-block", width: 44, height: 44, border: "4px solid #f3f4f6", borderTopColor: C.coral, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ marginTop: 18, color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>Loading attendance data...</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#1d2939", letterSpacing: -0.5 }}>Attendance Dashboard</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>Monitor your team's attendance, track patterns, and manage daily records.</p>
            </div>
            <button onClick={handleRefresh}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
              <Icon.Refresh /> Refresh Data
            </button>
          </div>

          <LiveClock />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard label="Today's Attendance" value={`${stats.todayPresent}/${stats.totalEmployees}`} sub={`${stats.todayPercentage}% present`} icon={<Icon.Users />} accentBg="#f0fdf4" accentColor="#10b981" />
            <StatCard label="Late Arrivals"       value={stats.todayLate}     sub="Arrived after 09:00"  icon={<Icon.AlertCircle />} accentBg="#fffaeb" accentColor="#f59e0b" />
            <StatCard label="Absent Today"        value={stats.todayAbsent}   sub="On leave / sick"      icon={<Icon.UserX />}       accentBg="#fef3f2" accentColor="#ef4444" />
            <StatCard label="Monthly Average"     value={`${stats.monthlyAverage}%`} sub="Attendance rate" icon={<Icon.TrendUp />} accentBg="#eff6ff" accentColor="#3b82f6" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 24, marginBottom: 24, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Today's table */}
              <div style={CARD}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: "#1d2939" }}>Who Attended Today</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{todayAttendance.length} employee{todayAttendance.length !== 1 ? "s" : ""} recorded</p>
                  </div>
                </div>
                {todayAttendance.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No attendance records for today yet.</div>
                ) : (
                  <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
                    <table style={{ width: "100%", minWidth: 580, borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                        {["Employee", "Code", "Department", "Status", "Clock In", "Clock Out", "Hours"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {todayAttendance.map(row => (
                          <tr key={row.attendance_id} onClick={() => setSelectedRow(row)} style={{ borderBottom: "1px solid #f2f4f7", cursor: "pointer" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}>
                            <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 500, color: "#1d2939" }}>{asText(row.full_name)}</td>
                            <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085", fontVariantNumeric: "tabular-nums" }}>{asText(row.employee_code)}</td>
                            <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085" }}>{asText(row.department)}</td>
                            <td style={{ padding: "13px 16px" }}>
                              <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize", ...badgeStyle(row.status) }}>{row.status.replace("_", " ")}</span>
                            </td>
                            <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085", fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.clock_in)}</td>
                            <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085", fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.clock_out)}</td>
                            <td style={{ padding: "13px 16px", fontSize: 14 }}>
                              {row.work_hours != null ? <strong style={{ color: "#1d2939" }}>{row.work_hours.toFixed(1)}h</strong> : <span style={{ color: "#9ca3af" }}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Did not clock in */}
              {showNoClockIn && noClockInList.length > 0 && (
                <div style={{ ...CARD, background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)", border: "1px solid #fecaca" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", animation: "alertPulse 2s infinite" }} />
                      <style>{`@keyframes alertPulse{0%,100%{box-shadow:0 0 0 3px rgba(239,68,68,0.2)}50%{box-shadow:0 0 0 7px rgba(239,68,68,0.05)}}`}</style>
                      <div>
                        <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#991b1b" }}>Did Not Clock In</h3>
                        <p style={{ margin: 0, fontSize: 12, color: "#b42318" }}>{noClockInList.length} employee{noClockInList.length !== 1 ? "s" : ""} missing</p>
                      </div>
                    </div>
                    <button onClick={() => setShowNoClockIn(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b42318", padding: 4, display: "flex" }}><Icon.Close /></button>
                  </div>
                  <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #fecaca", background: "#fff" }}>
                    <table style={{ width: "100%", minWidth: 400, borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                        {["Employee", "Code", "Department", "Position"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#b42318", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {noClockInList.map(emp => (
                          <tr key={emp.employee_id || (emp as any)._id} style={{ borderBottom: "1px solid #fef2f2" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fef2f2"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}>
                            <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: "#1d2939" }}>{asText(emp.full_name, "Unknown")}</td>
                            <td style={{ padding: "12px 16px", fontSize: 14, color: "#667085" }}>{asText(emp.employee_code)}</td>
                            <td style={{ padding: "12px 16px", fontSize: 14, color: "#667085" }}>{asText(emp.department)}</td>
                            <td style={{ padding: "12px 16px", fontSize: 14, color: "#667085" }}>{asText(emp.position)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Filters + records */}
              <div style={CARD}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: "#1d2939" }}>Attendance Records</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Filter and explore employee records</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e4e7ec", background: "#fff", fontSize: 13, fontWeight: 600, color: "#344054", cursor: "pointer" }}><Icon.Download /> Export</button>
                    <button onClick={handlePrint}     style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e4e7ec", background: "#fff", fontSize: 13, fontWeight: 600, color: "#344054", cursor: "pointer" }}><Icon.Printer /> Print</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {[
                    { label: "Present Today", onClick: quickFilterPresent, color: "#10b981", bg: "#ecfdf3" },
                    { label: "Absent Today",  onClick: quickFilterAbsent,  color: "#ef4444", bg: "#fef3f2" },
                    { label: "This Week",     onClick: quickFilterWeek,    color: "#3b82f6", bg: "#eff6ff" },
                  ].map(pill => (
                    <button key={pill.label} onClick={pill.onClick} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: pill.bg, color: pill.color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>{pill.label}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}><Icon.Search /></span>
                    <input type="text" value={filters.search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..." style={{ ...INPUT, paddingLeft: 34 }} />
                  </div>
                  <select value={filters.status} onChange={e => setStatus(e.target.value as AttendanceStatus | "")} style={INPUT}>
                    <option value="">All Statuses</option>
                    {(["present", "absent", "late", "leave", "holiday", "half_day"] as AttendanceStatus[]).map(s => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                  <select value={filters.dateRange} onChange={e => setDateRange(e.target.value as DateRangeKey)} style={INPUT}>
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="year">This Year</option>
                  </select>
                  <select value={filters.dept} onChange={e => setDept(e.target.value)} style={INPUT}>
                    <option value="all">All Departments</option>
                    {departments.map((d: any, i) => {
                      const dName = asText(d);
                      return <option key={(d?._id || dName) + i} value={dName}>{dName}</option>;
                    })}
                  </select>
                  <button onClick={clearFilters} style={{ ...INPUT, cursor: "pointer", background: "#f9fafb", fontWeight: 500 }}>Clear Filters</button>
                </div>
                <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
                  <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                      {["Employee", "Department", "Status", "Clock In", "Hours"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "36px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>No records match your filters.</td></tr>
                      ) : filtered.map(row => (
                        <tr key={row.attendance_id} onClick={() => setSelectedRow(row)} style={{ borderBottom: "1px solid #f2f4f7", cursor: "pointer" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}>
                          <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 500, color: "#1d2939" }}>{asText(row.full_name)}</td>
                          <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085" }}>{asText(row.department)}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize", ...badgeStyle(row.status) }}>{row.status.replace("_", " ")}</span>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085", fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.clock_in)}</td>
                          <td style={{ padding: "13px 16px", fontSize: 14 }}>
                            {row.work_hours != null ? <strong style={{ color: "#1d2939" }}>{row.work_hours.toFixed(1)}h</strong> : <span style={{ color: "#9ca3af" }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f2f4f7", display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>
                  {(Object.entries(STATUS_COLORS) as [AttendanceStatus, string][]).map(([s, c]) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize" }}>{s.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 88 }}>
              <PunctualityBoard attendance={todayAttendance} />
              <StatusDonut attendance={todayAttendance} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <span style={{ color: "#1d4ed8", flexShrink: 0, marginTop: 1 }}><Icon.Info /></span>
            <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
              <strong>View Only:</strong> This dashboard is for observation only. Attendance records are managed through the main attendance system.
            </p>
          </div>

          {selectedRow && <DetailsModal row={selectedRow} onClose={() => setSelectedRow(null)} onExport={handleExportRecord} />}
        </>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const AttendancePage: React.FC = () => (
  <SharedLayout title="Attendance Tracker">
    <AttendanceContent />
  </SharedLayout>
);

export default AttendancePage;
