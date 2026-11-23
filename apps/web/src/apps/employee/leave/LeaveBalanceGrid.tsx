import React from "react";
import { Wallet } from "lucide-react";
import type { LeaveBalanceMap, LeavePolicy } from "./types";
import { C, FONT_NUM } from "./leaveStyles";
import { getLeaveTypeColor, LeaveTypeIcon, Section } from "./leaveUiHelpers";

interface Props {
  types: LeavePolicy[];
  balance: LeaveBalanceMap;
  loading?: boolean;
}

const SkeletonCard = () => (
  <div style={{
    padding: 16, borderRadius: 14, border: `1px solid ${C.line}`,
    background: C.surfaceAlt, minHeight: 108,
  }}>
    <div style={{ width: "60%", height: 12, borderRadius: 6, background: C.line, marginBottom: 12 }} />
    <div style={{ width: "40%", height: 24, borderRadius: 6, background: C.line, marginBottom: 12 }} />
    <div style={{ height: 6, borderRadius: 999, background: C.line }} />
  </div>
);

const LeaveBalanceGrid: React.FC<Props> = ({ types, balance, loading }) => (
  <Section
    icon={<Wallet size={20} />}
    iconColor={C.primary}
    title="Leave balance"
    subtitle="Snapshot of your available days by leave type."
  >
    {loading || types.length === 0 ? (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    ) : (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 12,
      }}>
        {types.map(type => {
          const entry = balance[type.type];
          const total = entry?.total ?? type.total ?? 0;
          const remaining = entry?.remaining ?? total;
          const used = entry?.used ?? 0;
          const color = type.color || getLeaveTypeColor(type.type);
          const monthly = entry?.accrual === "monthly";
          const earned = entry?.earned;
          const carried = entry?.carriedOver ?? 0;
          // Progress: for monthly accrual, how much of the year's leave has been earned so far.
          const pct = total > 0
            ? Math.min(100, ((monthly && typeof earned === "number" ? earned : used) / total) * 100)
            : 0;
          // Someone still earning their leave isn't "low" — only warn once most of the year's leave is earned.
          const low = remaining <= 3 && total > 0 && !(monthly && typeof earned === "number" && earned < total * 0.75) && !entry?.note;
          const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));
          const fmtDate = (iso?: string | null) => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "";
          const displayName = type.label || type.name || type.type;

          return (
            <div
              key={type.type}
              style={{
                padding: 16,
                borderRadius: 14,
                border: `1px solid ${low ? C.warn : C.line}`,
                background: low ? C.warnBg : C.surfaceAlt,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: `${color}18`, color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LeaveTypeIcon type={type.type} size={16} />
                </span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
                  {displayName}
                </p>
              </div>
              <p style={{ ...FONT_NUM, margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: C.ink }}>
                {fmt(Math.max(0, remaining))}
                <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginLeft: 4 }}>days available</span>
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: C.muted }}>
                {monthly && typeof earned === "number"
                  ? <>Earned {fmt(earned)} of {fmt(total)} so far{carried > 0 ? ` + ${fmt(carried)} carried over` : ""} · {fmt(used)} used</>
                  : <>{fmt(used)} of {fmt(total)} days used{carried > 0 ? ` · ${fmt(carried)} carried over` : ""}</>}
              </p>
              {monthly && entry?.perMonth ? (
                <p style={{ margin: "0 0 8px", fontSize: 11.5, color: C.muted }}>
                  Builds up daily: {fmt(entry.perMonth)} days a month.
                </p>
              ) : <div style={{ height: 6 }} />}
              {carried > 0 && entry?.carryOverExpires && (
                <p style={{ margin: "0 0 8px", fontSize: 11.5, color: C.muted }}>
                  Use carried-over days by {fmtDate(entry.carryOverExpires)}.
                </p>
              )}
              {!!entry?.forfeited && entry.forfeited > 0 && (
                <p style={{ margin: "0 0 8px", fontSize: 11.5, color: C.muted }}>
                  {fmt(entry.forfeited)} carried-over day{entry.forfeited === 1 ? "" : "s"} expired unused.
                </p>
              )}
              {entry?.note && (
                <p style={{ margin: "0 0 8px", fontSize: 11.5, color: C.muted }}>{entry.note}</p>
              )}
              <div style={{ height: 6, borderRadius: 999, background: C.line, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Section>
);

export default LeaveBalanceGrid;
