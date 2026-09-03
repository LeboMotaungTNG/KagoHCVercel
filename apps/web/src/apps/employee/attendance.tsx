

import React, { useState, useEffect, useMemo } from "react";
import SharedLayout from "./SharedLayout";
import { C } from "../../shared/utils/employee";
import {
  type AttendanceStatus,
  type AttendanceRecord,
  type ClockState,
  type MonthStats,
  STATUS_COLORS,
  badgeStyle,
  fmtTime,
  pad2,
  exportEmployeeCSV,
  useEmployeeAttendance,
} from "../../shared/utils/attendance";
import BreakControls from "../../shared/components/BreakControls";
import { useBreakSession, fmtBreakShort } from "../../shared/utils/breaks";


const CARD: React.CSSProperties = {
  background: "#fff", borderRadius: 16, border: "1px solid #e4e7ec", padding: 24,
};

const INPUT: React.CSSProperties = {
  height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #d0d5dd",
  fontSize: 14, color: "#344054", outline: "none", background: "#fff",
  width: "100%", boxSizing: "border-box" as const, cursor: "pointer",
};


/* Declared as a namespace so they're typed components, not just JSX.
   This avoids re-creating them on every render while keeping the file self-contained. */
const Icon = {
  Login: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Clock: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Check: ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertCircle: ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
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
};


interface ToastProps {
  message: string;
  type:    "success" | "error" | "info";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
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
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: cfg.color, padding: 0, display: "flex" }}>
        <Icon.Close />
      </button>
    </div>
  );
};

// ” Live Clock Banner ” 

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background:     "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
      borderRadius:   16,
      padding:        "22px 28px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      flexWrap:       "wrap",
      gap:            16,
      marginBottom:   24,
    }}>
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
          {now.toLocaleDateString("en-ZA", { weekday: "long" })}
        </p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>
          {now.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2 }}>Current Time</p>
        <p style={{ margin: 0, fontSize: 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: -1.5, color: C.primary }}>
          {`${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`}
        </p>
      </div>
    </div>
  );
};

// ” Clock Panel ”

interface ClockPanelProps {
  state:      ClockState;
  onClockIn:  () => void;
  onClockOut: () => void;
  loading:    boolean;
  onBreak?:   boolean;
  breakTotalMs?: number;
    includeLocation?: boolean;
  onToggleLocation?: (v: boolean) => void;
}

const ClockPanel: React.FC<ClockPanelProps> = ({ state, onClockIn, onClockOut, loading, onBreak = false, breakTotalMs = 0, includeLocation = false, onToggleLocation }) => {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!state.clockedIn || !state.clockInTime) { setElapsed("00:00:00"); return; }
    const [h, m] = state.clockInTime.split(":").map(Number);
    const startMs = new Date().setHours(h, m, 0, 0);

    const tick = () => {
      const diffS = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsed(`${pad2(Math.floor(diffS / 3600))}:${pad2(Math.floor((diffS % 3600) / 60))}:${pad2(diffS % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.clockedIn, state.clockInTime]);

  const active    = state.clockedIn;
  const done      = !active && state.clockOutTime !== null;
  const disabled  = loading || done || (active && onBreak);

  return (
    <div style={{
      ...CARD,
      background: active ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#fff",
      border:     active ? "1px solid #86efac" : "1px solid #e4e7ec",
    }}>
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background:  active ? "#10b981" : "#d1d5db",
            boxShadow:   active ? "0 0 0 3px rgba(16,185,129,0.25)" : "none",
            animation:   active ? "clockPulse 2s infinite" : "none",
          }}/>
          <style>{`@keyframes clockPulse{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,0.25)}50%{box-shadow:0 0 0 7px rgba(16,185,129,0.06)}}`}</style>
          <span style={{ fontSize: 14, fontWeight: 700, color: active ? "#065f46" : "#6b7280" }}>
            {active ? "Session in progress" : done ? "Session complete" : "Not clocked in"}
          </span>
        </div>
        <span style={{
          padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          letterSpacing: 0.6, textTransform: "uppercase",
          background: active ? "#d1fae5" : done ? "#eff6ff" : "#f3f4f6",
          color:      active ? "#065f46" : done ? "#1d4ed8" : "#9ca3af",
        }}>
          {active ? "Active" : done ? "Done" : "Idle"}
        </span>
      </div>

      {/* Time summary cells */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Clock In",  value: fmtTime(state.clockInTime),  color: "#10b981" },
          { label: "Clock Out", value: fmtTime(state.clockOutTime), color: "#ef4444" },
          { label: "Elapsed",   value: active ? elapsed : state.sessionHours != null ? `${state.sessionHours.toFixed(2)}h` : "", color: C.primary },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(4px)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.9, fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: 19, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{value}</p>
          </div>
        ))}
      </div>
           {!done && onToggleLocation && (
        <label style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.6)",
          cursor: "pointer", fontSize: 13, color: "#374151",
        }}>
          <input
            type="checkbox"
            checked={includeLocation}
            onChange={e => onToggleLocation(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          Include my location {active ? "when I clock out" : "when I clock in"}
        </label>
      )}

      {/* Action button */}
      <button
        disabled={disabled}
        onClick={active ? onClockOut : onClockIn}
        style={{
          width:          "100%",
          height:         50,
          borderRadius:   12,
          border:         "none",
          fontSize:       15,
          fontWeight:     700,
          letterSpacing:  0.3,
          cursor:         disabled ? "not-allowed" : "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            9,
          transition:     "transform 0.12s, box-shadow 0.12s",
          background:     loading ? "#d1d5db" : done ? "#f3f4f6" : active ? "#ef4444" : "#1a1a1a",
          color:          done ? "#9ca3af" : "#fff",
          boxShadow:      active ? "0 4px 14px rgba(239,68,68,0.28)" : "0 4px 14px rgba(0,0,0,0.18)",
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          if (!b.disabled) {
            b.style.transform  = "translateY(-1px)";
            b.style.boxShadow  = active ? "0 6px 20px rgba(239,68,68,0.38)" : "0 6px 20px rgba(0,0,0,0.26)";
          }
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.transform = "";
          b.style.boxShadow = active ? "0 4px 14px rgba(239,68,68,0.28)" : "0 4px 14px rgba(0,0,0,0.18)";
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Processing¦
          </>
        ) : done ? (
          "Session complete for today"
        ) : active ? (
          <><Icon.Logout /> Clock Out</>
        ) : (
          <><Icon.Login /> Clock In</>
        )}
      </button>

      {/* On-break notice */}
      {active && onBreak && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "#fff7ed", borderRadius: 10, border: "1px solid #fed7aa" }}>
          <span style={{ color: "#c2410c", flexShrink: 0 }}><Icon.Info /></span>
          <p style={{ margin: 0, fontSize: 13, color: "#9a3412" }}>
            You're currently on a break. Resume work below before clocking out.
          </p>
        </div>
      )}

      {/* Post-session summary */}
      {state.clockInTime && state.clockOutTime && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
          <span style={{ color: "#1d4ed8", flexShrink: 0 }}><Icon.Info /></span>
          <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
            Session complete · <strong>{state.sessionHours?.toFixed(2) ?? ""}h</strong> logged today
            {breakTotalMs > 0 && <> · <strong>{fmtBreakShort(breakTotalMs)}</strong> on breaks</>}.
          </p>
        </div>
      )}
    </div>
  );
};

// ” KPI Stat Card ”

interface StatCardProps {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accentBg: string; accentColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, accentBg, accentColor }) => (
  <div
    style={{ ...CARD, display: "flex", alignItems: "center", gap: 16, transition: "box-shadow 0.15s" }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
  >
    <div style={{ width: 48, height: 48, borderRadius: 12, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1d2939", letterSpacing: -0.5 }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{sub}</p>}
    </div>
  </div>
);

// ” Mini Calendar ”

const MiniCalendar: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => {
  const today = new Date();
  const [curr, setCurr] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year    = curr.getFullYear();
  const month   = curr.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMo = new Date(year, month + 1, 0).getDate();

  const dateMap = useMemo(() => {
    const m: Record<string, AttendanceStatus> = {};
    records.forEach(r => { m[r.date] = r.status; });
    return m;
  }, [records]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1d2939" }}>
          {curr.toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <div style={{ display: "flex", gap: 6 }}>
          {(["",""] as const).map((arrow, i) => (
            <button key={arrow}
              onClick={() => setCurr(new Date(year, month + (i === 0 ? -1 : 1), 1))}
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e4e7ec", background: "#fff", cursor: "pointer", fontSize: 16, color: "#667085", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {arrow}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${pad2(month + 1)}-${pad2(day)}` : "";
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const status  = dateStr ? dateMap[dateStr] : undefined;

          return (
            <div key={`row-${i}`} style={{
              height: 36, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              borderRadius: 8, background: isToday ? "#1a1a1a" : "transparent", position: "relative",
            }}>
              {day && (
                <>
                  <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : "#374151" }}>{day}</span>
                  {status && !isToday && (
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_COLORS[status], position: "absolute", bottom: 3 }}/>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f2f4f7", display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>
        {(Object.entries(STATUS_COLORS) as [AttendanceStatus, string][]).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize" }}>{s.replace("_"," ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ” Monthly Breakdown ”

const MonthlyBreakdown: React.FC<{ stats: MonthStats }> = ({ stats }) => {
  const s = stats;

  const bars = [
    { label: "Present",  days: s.present, color: "#10b981" },
    { label: "Late",     days: s.late,    color: "#f59e0b" },
    { label: "Absent",   days: s.absent,  color: "#ef4444" },
    { label: "On Leave", days: s.leave,   color: "#3b82f6" },
  ];

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#1d2939" }}>This Month</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Attendance breakdown</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 1px", fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Rate</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1.2, color: s.rate >= 80 ? "#10b981" : "#ef4444" }}>
            {s.rate}%
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {bars.map(({ label, days, color }) => {
          const pct = s.total ? (days / s.total) * 100 : 0;
          return (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{days}d</span>
              </div>
              <div style={{ height: 7, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}/>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 18, padding: "12px 14px", background: "#f9fafb", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Avg daily hours</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1d2939" }}>{s.avgHours.toFixed(1)}h</span>
      </div>
    </div>
  );
};

// ” Record Detail Modal ”

const RecordModal: React.FC<{ record: AttendanceRecord; onClose: () => void }> = ({ record, onClose }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(16,24,40,0.5)", backdropFilter: "blur(4px)" }}/>
    <div style={{ position: "relative", width: "100%", maxWidth: 480, background: "#fff", borderRadius: 20, boxShadow: "0 24px 48px rgba(0,0,0,0.18)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #f2f4f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1d2939" }}>Attendance Record</h3>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9ca3af" }}>
            {new Date(record.date).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, display: "flex" }}>
          <Icon.Close />
        </button>
      </div>

      {/* Status badge */}
      <div style={{ padding: "18px 24px 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, ...badgeStyle(record.status) }}>
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: "capitalize" }}>{record.status.replace("_"," ")}</span>
          {record.note && <span style={{ fontSize: 13, opacity: 0.75 }}>” {record.note}</span>}
        </div>
      </div>

      {/* Detail grid */}
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: "Clock In",   value: fmtTime(record.clock_in)  },
          { label: "Clock Out",  value: fmtTime(record.clock_out) },
          { label: "Work Hours", value: record.work_hours != null ? `${record.work_hours.toFixed(2)}h` : "" },
          { label: "Date",       value: record.date },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.9, fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1d2939", fontVariantNumeric: "tabular-nums" }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#1a1a1a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  </div>
);

// ” History Table ”

interface HistoryTableProps {
  records:  AttendanceRecord[];
  onSelect: (r: AttendanceRecord) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ records, onSelect }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [range,  setRange]  = useState("month");

  const filtered = useMemo(() => records.filter(r => {
    if (status && r.status !== status)      return false;
    if (search && !r.date.includes(search)) return false;
    const d   = new Date(r.date);
    const now = new Date();
    if (range === "week") {
      const wk = new Date(); wk.setDate(now.getDate() - 7);
      if (d < wk) return false;
    } else if (range === "month") {
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    } else if (range === "last_month") {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      if (d.getMonth() !== lm.getMonth() || d.getFullYear() !== lm.getFullYear()) return false;
    } else if (range === "year") {
      if (d.getFullYear() !== now.getFullYear()) return false;
    }
    return true;
  }), [records, status, search, range]);

  const exportCSV = () => exportEmployeeCSV(filtered);

  return (
    <div style={CARD}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 700, color: "#1d2939" }}>Attendance History</h3>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e4e7ec", background: "#fff", fontSize: 13, fontWeight: 600, color: "#344054", cursor: "pointer" }}>
          <Icon.Download /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}><Icon.Search /></span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search date¦"
            style={{ ...INPUT, paddingLeft: 34 }}/>
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as AttendanceStatus | "")} style={INPUT}>
          <option value="">All Statuses</option>
          {(["present","absent","late","leave","holiday","half_day"] as AttendanceStatus[]).map(s => (
            <option key={s} value={s}>{s.replace("_"," ")}</option>
          ))}
        </select>
        <select value={range} onChange={e => setRange(e.target.value)} style={INPUT}>
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #e4e7ec" }}>
        <table style={{ width: "100%", minWidth: 500, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
              {["Date","Status","Clock In","Clock Out","Hours"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "36px 16px", textAlign: "center", fontSize: 14, color: "#9ca3af" }}>
                  No records match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row)}
                  style={{ borderBottom: "1px solid #f2f4f7", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}
                >
                  <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 500, color: "#1d2939" }}>
                    {new Date(row.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "capitalize", ...badgeStyle(row.status) }}>
                      {row.status.replace("_"," ")}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085", fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.clock_in)}</td>
                  <td style={{ padding: "13px 16px", fontSize: 14, color: "#667085", fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.clock_out)}</td>
                  <td style={{ padding: "13px 16px", fontSize: 14 }}>
                    {row.work_hours != null
                      ? <strong style={{ color: "#1d2939" }}>{row.work_hours.toFixed(2)}h</strong>
                      : <span style={{ color: "#9ca3af" }}>”</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ” Page Content (state orchestration) ”

const EmployeeAttendanceContent: React.FC = () => {
  const {
    
    records, todayRecord,
    clock, clockLoading,
    handleClockIn, handleClockOut,
    includeLocation, setIncludeLocation, locationTrackingAvailable,
    monthStats,
    selectedRecord, setSelectedRecord,
    toast, clearToast,
  } = useEmployeeAttendance();

  const { isOnBreak, totalMs: breakTotalMs } = useBreakSession();

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}

      {/* Page heading */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#1d2939", letterSpacing: -0.5 }}>
            My Attendance
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>
            Track your working hours and view your personal attendance history.
          </p>
        </div>
        {todayRecord && (
          <span style={{ ...badgeStyle(todayRecord.status), padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, textTransform: "capitalize", alignSelf: "center" }}>
            Today: {todayRecord.status.replace("_"," ")}
          </span>
        )}
      </div>

      {/* Live clock */}
      <LiveClock />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Attendance Rate"  value={`${monthStats.rate}%`}                  sub="This month"                         icon={<Icon.TrendUp />}        accentBg="#f0fdf4" accentColor="#10b981"/>
        <StatCard label="Days Present"     value={monthStats.present}                      sub={`of ${monthStats.total} work days`} icon={<Icon.Check />}          accentBg="#eff6ff" accentColor="#3b82f6"/>
        <StatCard label="Avg Hours / Day"  value={`${monthStats.avgHours.toFixed(1)}h`}   sub="This month"                         icon={<Icon.Clock size={20} />} accentBg="#fff7ed" accentColor="#f97316"/>
        <StatCard label="Late Arrivals"    value={monthStats.late}                         sub="This month"                         icon={<Icon.AlertCircle />}    accentBg="#fffaeb" accentColor="#f59e0b"/>
      </div>

      {/* Two-column content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 24, marginBottom: 24, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <ClockPanel
                      state={clock}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            loading={clockLoading}
            onBreak={isOnBreak}
            breakTotalMs={breakTotalMs}
                        includeLocation={includeLocation}
            onToggleLocation={locationTrackingAvailable ? setIncludeLocation : undefined}
          />
          
          <BreakControls
            clockedIn={clock.clockedIn}
            clockedOut={!clock.clockedIn && clock.clockOutTime !== null}
            variant="panel"
          />
          
          <HistoryTable records={records} onSelect={setSelectedRecord}/>
        </div>
        

        {/* Right column ” sticky */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 88 }}>
          <MiniCalendar records={records}/>
          <MonthlyBreakdown stats={monthStats}/>
        </div>
        
      </div>

      {/* Policy notice */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <span style={{ color: "#1d4ed8", flexShrink: 0, marginTop: 1 }}><Icon.Info /></span>
        <p style={{ margin: 0, fontSize: 13, color: "#1e40af" }}>
          <strong>Attendance Policy:</strong> Clock in daily before 09:00. Late arrivals are automatically flagged.
          Raise any discrepancies with your line manager or HR within 48 hours.
        </p>
      </div>

      {selectedRecord && <RecordModal record={selectedRecord} onClose={() => setSelectedRecord(null)}/>}
    </div>
    
  );
};


const EmployeeAttendancePage: React.FC = () => (
  <SharedLayout title="My Attendance">
    <EmployeeAttendanceContent />
  </SharedLayout>
);

export default EmployeeAttendancePage;
