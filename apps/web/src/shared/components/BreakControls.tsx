import React from "react";
import { Coffee, UtensilsCrossed, Pause, Play, Trash2, Timer } from "lucide-react";
import {
  BREAK_TYPES,
  fmtBreakClock,
  fmtBreakShort,
  fmtClockTime,
  getBreakMeta,
  totalBreakMs,
  useBreakSession,
  type BreakSession,
  type BreakType,
} from "../utils/breaks";

/**
 * Reusable break controls.
 *
 * Two visual variants:
 *  - `variant="panel"`   → full white card for the Attendance page.
 *  - `variant="inline"`  → compact, dark-friendly row for the dashboard hero.
 *
 * The component is fully self-contained: it owns its own `useBreakSession`
 * state. Drop it anywhere; the Attendance page and Dashboard automatically
 * agree on the same break (both read/write the same localStorage key per
 * employee per day).
 */

export interface BreakControlsProps {
  /** Whether the employee is currently clocked in. */
  clockedIn: boolean;
  /** Whether today's session is already wrapped (clocked out). */
  clockedOut?: boolean;
  /** Visual style. */
  variant?: "panel" | "inline";
  /** Disable all interactions. */
  disabled?: boolean;
  /** Optional notification when the on-break state flips. */
  onChange?: (info: { isOnBreak: boolean; type?: BreakType }) => void;
}

const TYPE_ICON: Record<BreakType, React.ReactNode> = {
  tea:   <Coffee size={18} strokeWidth={2} />,
  lunch: <UtensilsCrossed size={18} strokeWidth={2} />,
  other: <Pause size={18} strokeWidth={2} />,
};

function changeSignal(
  prev: React.MutableRefObject<boolean>,
  isOnBreak: boolean,
  active: BreakSession | null,
  onChange?: BreakControlsProps["onChange"],
) {
  if (prev.current !== isOnBreak) {
    prev.current = isOnBreak;
    onChange?.({ isOnBreak, type: active?.type });
  }
}

const BreakControls: React.FC<BreakControlsProps> = ({
  clockedIn,
  clockedOut = false,
  variant = "panel",
  disabled = false,
  onChange,
}) => {
  const { breaks, active, isOnBreak, totalMs, startBreak, endBreak, removeBreak } = useBreakSession();
  const prevRef = React.useRef<boolean>(isOnBreak);

  React.useEffect(() => {
    changeSignal(prevRef, isOnBreak, active, onChange);
  }, [isOnBreak, active, onChange]);

  const interactable = clockedIn && !clockedOut && !disabled;

  if (variant === "inline") {
    return (
      <InlineVariant
        active={active}
        isOnBreak={isOnBreak}
        interactable={interactable}
        startBreak={startBreak}
        endBreak={endBreak}
      />
    );
  }

  return (
    <PanelVariant
      breaks={breaks}
      active={active}
      isOnBreak={isOnBreak}
      totalMs={totalMs}
      interactable={interactable}
      clockedIn={clockedIn}
      clockedOut={clockedOut}
      startBreak={startBreak}
      endBreak={endBreak}
      removeBreak={removeBreak}
    />
  );
};

export default BreakControls;

/* ────────────────────────────────  PANEL  ──────────────────────────────── */

interface PanelProps {
  breaks: BreakSession[];
  active: BreakSession | null;
  isOnBreak: boolean;
  totalMs: number;
  interactable: boolean;
  clockedIn: boolean;
  clockedOut: boolean;
  startBreak: (t: BreakType) => void;
  endBreak: () => void;
  removeBreak: (id: string) => void;
}

const CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #e4e7ec",
  padding: 24,
};

const PanelVariant: React.FC<PanelProps> = ({
  breaks, active, isOnBreak, totalMs, interactable, clockedIn, clockedOut,
  startBreak, endBreak, removeBreak,
}) => {
  const activeMeta = active ? getBreakMeta(active.type) : null;
  const completed = breaks.filter(b => !!b.endedAt);

  return (
    <div style={{
      ...CARD,
      background: isOnBreak
        ? `linear-gradient(135deg, ${activeMeta?.accentSoft ?? "#fef3c7"} 0%, #ffffff 70%)`
        : "#fff",
      border: isOnBreak ? `1px solid ${activeMeta?.accent ?? "#f59e0b"}` : "1px solid #e4e7ec",
      transition: "background .2s ease, border-color .2s ease",
    }}>
      <style>{`
        @keyframes kgBreakPulse { 0%,100%{transform:scale(1);opacity:.95} 50%{transform:scale(1.04);opacity:1} }
        @keyframes kgBreakRipple { 0%{box-shadow:0 0 0 0 rgba(245,158,11,.35)} 100%{box-shadow:0 0 0 14px rgba(245,158,11,0)} }
        .kg-break-btn { transition: transform .12s ease, box-shadow .12s ease, background .12s ease, border-color .12s ease; }
        .kg-break-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,24,40,.10); }
        .kg-break-btn:disabled { cursor: not-allowed; opacity: .55; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1d2939" }}>
            Breaks
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#9ca3af" }}>
            Step away for tea or lunch — your work timer pauses while you're out.
          </p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 999,
          background: "#f9fafb", border: "1px solid #e4e7ec",
          fontSize: 12.5, fontWeight: 700, color: "#344054",
        }}>
          <Timer size={14} color="#6b7280" />
          Total today: <span style={{ color: "#1d2939", fontVariantNumeric: "tabular-nums" }}>{fmtBreakShort(totalMs)}</span>
        </div>
      </div>

      {/* Active / actions */}
      {isOnBreak && active && activeMeta ? (
        <ActiveBreakBanner active={active} onEnd={endBreak} />
      ) : (
        <BreakStartGrid
          interactable={interactable}
          clockedIn={clockedIn}
          clockedOut={clockedOut}
          onStart={startBreak}
        />
      )}

      {/* Today's log */}
      <div style={{ marginTop: 22 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 10.5, letterSpacing: 1.4, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>
            Today's break log
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {breaks.length} entr{breaks.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {breaks.length === 0 ? (
          <div style={{
            padding: "22px 16px", textAlign: "center",
            background: "#f9fafb", borderRadius: 12, border: "1px dashed #e4e7ec",
            color: "#9ca3af", fontSize: 13,
          }}>
            No breaks taken yet today. When you do, they'll appear here.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {breaks.map(b => {
              const meta = getBreakMeta(b.type);
              const running = !b.endedAt;
              const dur = running
                ? Date.now() - new Date(b.startedAt).getTime()
                : new Date(b.endedAt!).getTime() - new Date(b.startedAt).getTime();
              return (
                <li
                  key={b.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    background: running ? meta.accentSoft : "#fff",
                    border: `1px solid ${running ? meta.accent : "#e4e7ec"}`,
                    borderRadius: 12,
                  }}
                >
                  <span style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: meta.accentSoft, color: meta.accent,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {TYPE_ICON[b.type]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1d2939" }}>
                      {meta.label}
                      {running && (
                        <span style={{
                          marginLeft: 8, padding: "1px 8px", borderRadius: 999,
                          background: meta.accent, color: "#fff",
                          fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}>
                          Live
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                      {fmtClockTime(b.startedAt)} – {b.endedAt ? fmtClockTime(b.endedAt) : "ongoing"}
                      <span style={{ color: "#d0d5dd", margin: "0 8px" }}>·</span>
                      {running ? fmtBreakClock(dur) : fmtBreakShort(dur)}
                    </div>
                  </div>
                  {!running && (
                    <button
                      type="button"
                      onClick={() => removeBreak(b.id)}
                      title="Remove entry"
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: "1px solid #e4e7ec", background: "#fff",
                        cursor: "pointer", color: "#9ca3af",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff";    e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#e4e7ec"; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Daily summary */}
        {completed.length > 0 && (
          <div style={{
            marginTop: 12, padding: "10px 14px",
            background: "#f9fafb", borderRadius: 10,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12.5,
          }}>
            <span style={{ color: "#6b7280" }}>
              {BREAK_TYPES.map(meta => {
                const count = completed.filter(b => b.type === meta.type).length;
                if (count === 0) return null;
                return `${count} ${meta.shortLabel.toLowerCase()}`;
              }).filter(Boolean).join(" · ")}
            </span>
            <span style={{ color: "#1d2939", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {fmtBreakShort(totalBreakMs(completed))} total
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ────────────────────────────────  PIECES  ─────────────────────────────── */

const ActiveBreakBanner: React.FC<{ active: BreakSession; onEnd: () => void }> = ({ active, onEnd }) => {
  const meta = getBreakMeta(active.type);
  const elapsed = Date.now() - new Date(active.startedAt).getTime();
  const suggested = meta.suggestedMinutes * 60 * 1000;
  const overrun = elapsed > suggested;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "18px 20px", borderRadius: 14,
      background: `linear-gradient(135deg, ${meta.accent} 0%, ${meta.accent}dd 100%)`,
      color: "#fff",
      boxShadow: `0 10px 24px ${meta.accent}33`,
      flexWrap: "wrap",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "rgba(255,255,255,0.22)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        animation: "kgBreakPulse 2.2s ease-in-out infinite",
      }}>
        {TYPE_ICON[active.type]}
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 11.5, letterSpacing: 1, fontWeight: 800, textTransform: "uppercase", opacity: 0.92 }}>
          On {meta.label.toLowerCase()}
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
          {fmtBreakClock(elapsed)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
          Started {fmtClockTime(active.startedAt)} ·{" "}
          {overrun ? (
            <strong>Past the suggested {meta.suggestedMinutes} min</strong>
          ) : (
            <>Suggested {meta.suggestedMinutes} min</>
          )}
        </div>
      </div>
      <button
        type="button"
        className="kg-break-btn"
        onClick={onEnd}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 22px", borderRadius: 999, border: "none",
          background: "#fff", color: meta.accent,
          fontSize: 14, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
        }}
      >
        <Play size={16} />
        Resume work
      </button>
    </div>
  );
};

const BreakStartGrid: React.FC<{
  interactable: boolean;
  clockedIn: boolean;
  clockedOut: boolean;
  onStart: (t: BreakType) => void;
}> = ({ interactable, clockedIn, clockedOut, onStart }) => {
  const hint = clockedOut
    ? "Today's session is wrapped. You'll be able to take breaks again next time you clock in."
    : !clockedIn
      ? "Clock in first, then choose a break when you need one."
      : "Tap a break to pause your work timer. Tap Resume work when you're back.";

  return (
    <>
      <div style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      }}>
        {BREAK_TYPES.map(meta => (
          <button
            key={meta.type}
            type="button"
            className="kg-break-btn"
            disabled={!interactable}
            onClick={() => onStart(meta.type)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px",
              borderRadius: 14,
              border: `1px solid ${interactable ? meta.accent : "#e4e7ec"}`,
              background: interactable ? "#fff" : "#f9fafb",
              color: interactable ? meta.accent : "#9ca3af",
              cursor: interactable ? "pointer" : "not-allowed",
              fontSize: 14, fontWeight: 700, textAlign: "left",
            }}
            title={meta.label}
          >
            <span style={{
              width: 38, height: 38, borderRadius: 10,
              background: meta.accentSoft, color: meta.accent,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {TYPE_ICON[meta.type]}
            </span>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ color: interactable ? "#1d2939" : "#9ca3af", fontWeight: 800 }}>
                {meta.label}
              </span>
              <span style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 500 }}>
                Suggested {meta.suggestedMinutes} min
              </span>
            </div>
          </button>
        ))}
      </div>
      <p style={{ margin: "12px 2px 0", fontSize: 12, color: "#9ca3af" }}>
        {hint}
      </p>
    </>
  );
};

/* ────────────────────────────────  INLINE  ─────────────────────────────── */

const InlineVariant: React.FC<{
  active: BreakSession | null;
  isOnBreak: boolean;
  interactable: boolean;
  startBreak: (t: BreakType) => void;
  endBreak: () => void;
}> = ({ active, isOnBreak, interactable, startBreak, endBreak }) => {
  if (isOnBreak && active) {
    const meta = getBreakMeta(active.type);
    const elapsed = Date.now() - new Date(active.startedAt).getTime();
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "8px 8px 8px 14px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.35)",
        color: "#fff",
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "rgba(255,255,255,0.22)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
        }}>
          {TYPE_ICON[active.type]}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          On {meta.shortLabel.toLowerCase()}
        </span>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 800, opacity: 0.95 }}>
          {fmtBreakClock(elapsed)}
        </span>
        <button
          type="button"
          onClick={endBreak}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 999, border: "none",
            background: "#fff", color: meta.accent,
            fontSize: 12.5, fontWeight: 800, cursor: "pointer",
          }}
        >
          <Play size={13} /> Resume
        </button>
      </div>
    );
  }

  const baseBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "10px 16px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.5)",
    background: "transparent", color: "#fff",
    fontSize: 13.5, fontWeight: 700,
    cursor: interactable ? "pointer" : "not-allowed",
    opacity: interactable ? 1 : 0.45,
    transition: "background .15s ease",
  };

  return (
    <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
      {BREAK_TYPES.filter(m => m.type !== "other").map(meta => (
        <button
          key={meta.type}
          type="button"
          disabled={!interactable}
          onClick={() => startBreak(meta.type)}
          style={baseBtn}
          onMouseEnter={e => { if (interactable) e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          {TYPE_ICON[meta.type]}
          {meta.shortLabel}
        </button>
      ))}
    </div>
  );
};
