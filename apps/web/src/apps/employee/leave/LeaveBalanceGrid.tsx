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
          const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
          const color = type.color || getLeaveTypeColor(type.type);
          const low = remaining <= 3 && total > 0;
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
                {remaining}
                <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginLeft: 4 }}>days left</span>
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: C.muted }}>
                {used} of {total} days used
              </p>
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
