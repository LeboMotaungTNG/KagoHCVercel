import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Coffee, MapPin, Play, UtensilsCrossed } from "lucide-react";
import {
  C, FONT_NUM, R, SHADOW,
  fmtHMS, fmtTime, longDate, useLiveTick,
} from "../utils/employee";
import { useEmployeeAttendance } from "../utils/attendance";
import { BREAK_TYPES, fmtBreakClock, fmtBreakShort, totalBreakMs, useBreakSession } from "../utils/breaks";

const MyClockCard: React.FC<{ historyTo: string }> = ({ historyTo }) => {
  const navigate = useNavigate();
  const { clock, clockLoading, handleClockIn, handleClockOut } = useEmployeeAttendance();
  const { breaks, active: activeBreak, isOnBreak, totalMs: breakMs, startBreak, endBreak } = useBreakSession();

  const clockIn = clock.clockInTime;
  const clockOut = clock.clockOutTime;
  const active = clock.clockedIn;
  const clockedOut = !active && clockOut !== null;
  const tick = useLiveTick(active || isOnBreak);

  const elapsedSec = useMemo(() => {
    if (!clockIn) return 0;
    const [h, m] = clockIn.split(":").map(Number);
    const start = new Date(); start.setHours(h, m, 0, 0);
    const grossMs = Math.max(0, tick.getTime() - start.getTime());
    const workMs = Math.max(0, grossMs - totalBreakMs(breaks, tick.getTime()));
    return Math.floor(workMs / 1000);
  }, [clockIn, tick, breaks]);

  const progress = Math.min(100, (elapsedSec / (8 * 3600)) * 100);
  const statusPill = isOnBreak
    ? { label: "On break", bg: C.warnBg, color: "#b45309", dot: true }
    : active
      ? { label: "Active", bg: C.okBg, color: C.ok, dot: true }
      : clockedOut
        ? { label: "Wrapped", bg: "#eff6ff", color: "#1d4ed8", dot: false }
        : { label: "Idle", bg: C.surfaceAlt, color: C.faint, dot: false };

  const hoursLabel = clock.sessionHours != null ? `${clock.sessionHours.toFixed(1)}h` : "0.0h";
  const clockBusy = clockLoading || (active && isOnBreak) || clockedOut;

  const actionBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "12px 22px", borderRadius: 999, border: "none",
    fontSize: 14, fontWeight: 700, cursor: clockBusy && clockIn ? "not-allowed" : "pointer",
    background: clockLoading ? "#d1d5db" : clockedOut ? C.surfaceAlt : active ? C.bad : C.ink,
    color: clockedOut ? C.faint : "#fff",
    boxShadow: clockedOut || clockLoading ? "none" : "0 4px 14px rgba(16,24,40,0.16)",
  };

  const breakBtn = (enabled: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", borderRadius: 999,
    border: `1px solid ${C.line}`,
    background: C.surface, color: enabled ? C.ink : C.faint,
    fontSize: 13.5, fontWeight: 700,
    cursor: enabled ? "pointer" : "not-allowed",
  });

  return (
    <section
      style={{
        background: active ? "linear-gradient(180deg, #f0fdf4 0%, #fff 48%)" : C.surface,
        border: `1px solid ${active ? "#bbf7d0" : C.line}`,
        borderRadius: R.hero,
        padding: 28,
        boxShadow: SHADOW,
        marginBottom: 22,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: 1, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>
            Today's session
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, color: C.text, fontSize: 13.5, fontWeight: 600 }}>
            <MapPin size={14} color={C.primary} /> KagoHC HQ&nbsp;·&nbsp;{longDate()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: statusPill.bg, color: statusPill.color,
            borderRadius: 999, padding: "4px 10px",
            fontSize: 11.5, fontWeight: 700,
          }}>
            {statusPill.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusPill.color }} />}
            {statusPill.label}
          </span>
          <button
            type="button"
            onClick={() => navigate(historyTo)}
            style={{
              border: "none", background: "transparent",
              color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            My attendance →
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, lineHeight: 1, color: C.ink, ...FONT_NUM }}>
          {fmtHMS(elapsedSec)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.faint, ...FONT_NUM }}>/ 08:00:00 goal</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ height: 8, background: C.surfaceAlt, borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${progress}%`, height: "100%", background: active ? C.ok : C.primary, borderRadius: 999,
            transition: "width .35s ease",
          }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
        {!clockIn ? (
          <button type="button" onClick={handleClockIn} disabled={clockLoading} style={actionBtn}>
            <Clock size={16} style={{ marginRight: 8 }} />Clock in
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClockOut}
            disabled={clockBusy}
            style={actionBtn}
            title={isOnBreak ? "End your break before clocking out" : undefined}
          >
            <Clock size={16} style={{ marginRight: 8 }} />
            {clockedOut ? "Clocked out" : "Clock out"}
          </button>
        )}

        {isOnBreak && activeBreak ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "8px 8px 8px 14px", borderRadius: 999,
            background: C.warnBg, border: "1px solid #fde68a", color: "#92400e",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>On {activeBreak.type}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 800 }}>
              {fmtBreakClock(tick.getTime() - new Date(activeBreak.startedAt).getTime())}
            </span>
            <button
              type="button"
              onClick={() => endBreak()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 999, border: "none",
                background: "#fff", color: "#92400e", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
              }}
            >
              <Play size={13} /> Resume
            </button>
          </div>
        ) : (
          BREAK_TYPES.filter(m => m.type !== "other").map(meta => (
            <button
              key={meta.type}
              type="button"
              disabled={!active}
              onClick={() => startBreak(meta.type)}
              style={breakBtn(active)}
            >
              {meta.type === "tea" ? <Coffee size={15} /> : <UtensilsCrossed size={15} />}
              {meta.shortLabel}
            </button>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 28, marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.line}`, flexWrap: "wrap" }}>
        <FooterStat label="Clock in" value={fmtTime(clockIn)} />
        <FooterStat label="On break" value={breakMs > 0 ? fmtBreakShort(breakMs) : "0 min"} />
        <FooterStat label="Today" value={hoursLabel} />
        <FooterStat label="Status" value={clockedOut ? "Wrapped" : isOnBreak ? "On break" : active ? "Working" : "Idle"} />
      </div>
    </section>
  );
};

const FooterStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase", color: C.faint, fontWeight: 700 }}>
      {label}
    </div>
    <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 2, ...FONT_NUM }}>
      {value}
    </div>
  </div>
);

export default MyClockCard;
