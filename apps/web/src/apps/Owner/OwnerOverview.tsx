
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award, Building2, Calendar, ChevronRight, Clock,
  FileText, MessageCircle, PenTool, Plus, Search, Settings,
  Sparkles, Star, Target, TrendingUp, Users, Zap,
} from "lucide-react";
import { C as TOKENS } from "../../shared/utils/employee";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = TOKENS;

const SHADOW   = "0 1px 4px rgba(16,24,40,0.06), 0 2px 8px rgba(16,24,40,0.04)";
const SHADOW_L = "0 8px 24px rgba(16,24,40,0.12)";
const R        = { sm: 8, md: 12, lg: 16, xl: 20, hero: 24 } as const;
const FONT_NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";
const token   = () => localStorage.getItem("token") || "";

/* ─── Primitives ─────────────────────────────────────────────────────────── */
const Card: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties; pad?: number }>> = (
  { children, style, pad = 22 },
) => (
  <section style={{
    background: C.surface, border: `1px solid ${C.line}`,
    borderRadius: R.xl, boxShadow: SHADOW, padding: pad, ...style,
  }}>
    {children}
  </section>
);

const IconBubble: React.FC<{ bg: string; color: string; size?: number; children: React.ReactNode }> = (
  { bg, color, size = 40, children },
) => (
  <div style={{
    width: size, height: size, borderRadius: 12,
    background: bg, color,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    {children}
  </div>
);

const SectionHead: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = (
  { title, subtitle, right },
) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>{title}</h3>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

const AVATAR_COLORS = [C.primary, C.blue, C.green, C.purple, C.amber, C.teal, C.muted];
const avatarBg = (n: string) =>
  AVATAR_COLORS[n.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const getInitials = (n: string) =>
  n.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: avatarBg(name),
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: Math.round(size * 0.36), fontWeight: 700, flexShrink: 0,
  }}>
    {getInitials(name)}
  </div>
);

const StatusPill: React.FC<{ bg: string; color: string; dot?: boolean; children: React.ReactNode }> = (
  { bg, color, dot, children },
) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    background: bg, color, borderRadius: 999, padding: "4px 10px",
    fontSize: 11.5, fontWeight: 700,
  }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
    {children}
  </span>
);

const ProgressBar: React.FC<{ value: number; color: string; track?: string; height?: number }> = (
  { value, color, track = "rgba(255,255,255,0.35)", height = 6 },
) => (
  <div style={{ height, background: track, borderRadius: 999, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, Math.max(0, value))}%`, height: "100%",
      background: color, borderRadius: 999, transition: "width .4s ease",
    }} />
  </div>
);

const linkBtn: React.CSSProperties = {
  border: "none", background: "transparent",
  color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer",
};

/* ─── Greeting header ────────────────────────────────────────────────────── */
const GreetingHeader: React.FC<{ name: string }> = ({ name }) => {
  const h       = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const dateStr  = new Date().toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return (
    <header style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 20, flexWrap: "wrap", marginBottom: 24,
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, color: C.ink, letterSpacing: -0.8, lineHeight: 1.1 }}>
          {greeting}, {name} 👋
        </h1>
        <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 15 }}>
          Here's your organisation overview for today.
        </p>
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "9px 18px", borderRadius: 999,
        background: "#fff", border: `1px solid ${C.line}`, boxShadow: SHADOW,
        fontSize: 13.5, fontWeight: 600, color: C.text,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.ok, boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
        <strong style={{ color: C.ink, fontWeight: 700 }}>Owner portal</strong>
        <span style={{ color: C.faint }}>·</span>
        <span style={{ color: C.muted }}>{dateStr}</span>
      </div>
    </header>
  );
};

/* ─── Org health hero card ───────────────────────────────────────────────── */
const OrgHealthCard: React.FC<{
  counts: { employees: number; managers: number; presentToday: number; departments: number };
  loading: boolean;
}> = ({ counts, loading }) => {
  const presentPct = counts.employees > 0
    ? Math.round((counts.presentToday / counts.employees) * 100) : 0;
  const health    = presentPct >= 80 ? "Healthy" : presentPct >= 55 ? "Moderate" : "Needs attention";
  const healthDot = presentPct >= 80 ? "#86efac" : presentPct >= 55 ? "#fde68a" : "#fca5a5";

  const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
      <div style={{ fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.68)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2, ...FONT_NUM }}>{value}</div>
    </div>
  );

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 50%, ${C.primaryLight} 100%)`,
      borderRadius: R.hero, padding: 28,
      boxShadow: "0 12px 32px rgba(26,31,94,0.38)", color: "#fff",
    }}>
      <div aria-hidden style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <div aria-hidden style={{ position: "absolute", right: 80, bottom: -110, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      <div aria-hidden style={{ position: "absolute", left: -80, top: 40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: 1, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>
            Organisation overview
          </div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>
            {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.14)", color: "#fff",
          borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: healthDot }} />
          {loading ? "Loading…" : health}
        </span>
      </div>

      <div style={{ position: "relative", marginTop: 28 }}>
        <div style={{ fontSize: 13, opacity: 0.82, marginBottom: 10, fontWeight: 600 }}>
          Organisation attendance today
        </div>
        <ProgressBar value={loading ? 0 : presentPct} color="#fff" track="rgba(255,255,255,0.20)" height={10} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
          <span style={{ fontSize: 12.5, opacity: 0.72 }}>{loading ? "—" : `${counts.presentToday} of ${counts.employees} present`}</span>
          <span style={{ fontSize: 14, opacity: 0.95, fontWeight: 800, ...FONT_NUM }}>{loading ? "—" : `${presentPct}%`}</span>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: 28, marginTop: 26, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.16)", flexWrap: "wrap" }}>
        <Stat label="Employees"   value={loading ? "…" : String(counts.employees)} />
        <Stat label="Managers"    value={loading ? "…" : String(counts.managers)} />
        <Stat label="Departments" value={loading ? "…" : String(counts.departments)} />
        <Stat label="Attendance"  value={loading ? "…" : `${presentPct}%`} />
      </div>
    </section>
  );
};

/* ─── Org growth card (mirrors StreakCard) ───────────────────────────────── */
const OrgGrowthCard: React.FC<{
  pendingLeave: number;
  onPayroll: number;
  employees: number;
}> = ({ pendingLeave, onPayroll, employees }) => {
  const payrollPct = employees > 0 ? Math.round((onPayroll / employees) * 100) : 0;
  const tier = payrollPct >= 90 ? "Excellent coverage" : payrollPct >= 70 ? "Good coverage" : "Review payroll";

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(155deg, ${C.teal} 0%, #0a7a70 100%)`,
      borderRadius: R.hero, padding: 24, boxShadow: SHADOW_L,
      color: "#fff", display: "flex", flexDirection: "column", minHeight: 240,
    }}>
      <div aria-hidden style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div aria-hidden style={{ position: "absolute", left: -40, bottom: -90, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
        <TrendingUp size={18} />
        <div style={{ fontSize: 11.5, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>Org health</div>
      </div>

      <div style={{ position: "relative", marginTop: 18 }}>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1, ...FONT_NUM }}>{payrollPct}%</div>
        <div style={{ fontSize: 17, fontWeight: 700, opacity: 0.92, marginTop: 4 }}>on payroll</div>
      </div>

      <p style={{ position: "relative", margin: "14px 0 0", fontSize: 13.5, lineHeight: 1.5, opacity: 0.9, flex: 1 }}>
        {pendingLeave > 0
          ? `${pendingLeave} leave request${pendingLeave !== 1 ? "s" : ""} pending across the organisation.`
          : "All leave requests are up to date organisation-wide."}
      </p>

      <div style={{ position: "relative", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.20)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[<Star size={14} key="s" />, <Award size={14} key="a" />, <Zap size={14} key="z" />].map((ic, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic}</div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{tier}</div>
          <div style={{ fontSize: 11.5, opacity: 0.85 }}>{onPayroll} of {employees} employees</div>
        </div>
      </div>
    </section>
  );
};

/* ─── Stat tile ──────────────────────────────────────────────────────────── */
const StatTile: React.FC<{
  label: string; value: string | number; sub: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  delta?: { up: boolean; text: string };
  onClick?: () => void;
}> = ({ label, value, sub, icon, iconBg, iconColor, delta, onClick }) => (
  <Card pad={20} style={{ cursor: onClick ? "pointer" : undefined }}>
    <div
      onClick={onClick}
      onMouseEnter={e => onClick && ((e.currentTarget.closest("section") as HTMLElement).style.boxShadow = SHADOW_L)}
      onMouseLeave={e => onClick && ((e.currentTarget.closest("section") as HTMLElement).style.boxShadow = SHADOW)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <IconBubble bg={iconBg} color={iconColor}>{icon}</IconBubble>
        {delta && (
          <span style={{ fontSize: 12, fontWeight: 700, color: delta.up ? C.ok : C.bad, background: delta.up ? C.okBg : C.badBg, padding: "2px 8px", borderRadius: 999 }}>
            {delta.up ? "↑" : "↓"} {delta.text}
          </span>
        )}
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, letterSpacing: -1, marginTop: 2, ...FONT_NUM }}>{value}</div>
      <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</div>
    </div>
  </Card>
);

/* ─── Department breakdown ───────────────────────────────────────────────── */
interface DeptStat { name: string; count: number; present: number }

const DepartmentsCard: React.FC<{ departments: DeptStat[]; loading: boolean }> = ({ departments, loading }) => {
  const total = departments.reduce((a, d) => a + d.count, 0);

  const DEPT_COLORS = [C.accent, C.blue, C.green, C.teal, C.amber, C.coral, C.purple];

  return (
    <Card>
      <SectionHead title="Departments" subtitle={`${departments.length} active departments`} />
      {loading ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>Loading departments…</p>
      ) : departments.length === 0 ? (
        <p style={{ margin: 0, padding: "20px 0", textAlign: "center", color: C.faint, fontSize: 13 }}>
          No department data available.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {departments.slice(0, 6).map((d, i) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            const color = DEPT_COLORS[i % DEPT_COLORS.length];
            return (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{d.count} people</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, ...FONT_NUM }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 5, background: C.line, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width .4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

/* ─── Managers list ──────────────────────────────────────────────────────── */
interface ManagerEntry { id: string; name: string; department: string; teamSize: number; email?: string }

const ManagersCard: React.FC<{ managers: ManagerEntry[]; loading: boolean }> = ({ managers, loading }) => {
  const navigate = useNavigate();
  return (
    <Card>
      <SectionHead
        title="Your managers"
        subtitle={`${managers.length} managers`}
        right={
          <button
            onClick={() => navigate("/owner/managers")}
            style={{ ...linkBtn, display: "flex", alignItems: "center", gap: 4 }}
          >
            View all <ChevronRight size={14} />
          </button>
        }
      />
      {loading ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>Loading managers…</p>
      ) : managers.length === 0 ? (
        <p style={{ margin: 0, padding: "20px 0", textAlign: "center", color: C.faint, fontSize: 13 }}>
          No managers found.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
          {managers.map(m => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 8px", borderRadius: R.md,
              border: `1px solid ${C.line}`, background: C.surfaceAlt,
            }}>
              <Avatar name={m.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.department}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, ...FONT_NUM }}>{m.teamSize}</div>
                <div style={{ fontSize: 11, color: C.faint }}>reports</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/* ─── Org-wide pending leave (read-only for owner) ───────────────────────── */
interface OrgLeave {
  id: string;
  employee_name?: string; employeeName?: string;
  type?: string; leaveType?: string;
  start_date?: string; startDate?: string;
  days?: number; status?: string;
  department?: string;
}

const OrgLeaveCard: React.FC<{ requests: OrgLeave[]; loading: boolean }> = ({ requests, loading }) => {
  const pending  = requests.filter(r => (r.status ?? "pending") === "pending");
  const approved = requests.filter(r => r.status === "approved");

  const getName  = (r: OrgLeave) => r.employee_name ?? r.employeeName ?? "Employee";
  const getType  = (r: OrgLeave) => r.type ?? r.leaveType ?? "Leave";
  const getStart = (r: OrgLeave) => r.start_date ?? r.startDate ?? "—";

  return (
    <Card>
      <SectionHead
        title="Leave overview"
        subtitle="Organisation-wide leave requests"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <StatusPill bg={C.warnBg} color={C.amber}>{pending.length} pending</StatusPill>
            <StatusPill bg={C.okBg}   color={C.ok}>{approved.length} approved</StatusPill>
          </div>
        }
      />
      {loading ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>Loading leave data…</p>
      ) : pending.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <FileText size={34} color={C.faint} style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>No pending leave org-wide</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>All leave has been reviewed by managers.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
          {pending.slice(0, 6).map(r => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: R.lg,
              border: `1px solid ${C.line}`, background: C.surfaceAlt,
            }}>
              <Avatar name={getName(r)} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getName(r)}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {getType(r)} · from {getStart(r)} · {r.days ?? "?"} days
                  {r.department ? ` · ${r.department}` : ""}
                </div>
              </div>
              <StatusPill bg={C.warnBg} color={C.amber}>Pending</StatusPill>
            </div>
          ))}
          {pending.length > 6 && (
            <p style={{ margin: 0, fontSize: 12.5, color: C.muted, textAlign: "center" }}>
              +{pending.length - 6} more pending across teams
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

/* ─── Attendance breakdown ───────────────────────────────────────────────── */
const AttendanceBreakdownCard: React.FC<{
  present: number; absent: number; late: number; loading: boolean;
}> = ({ present, absent, late, loading }) => {
  const total = present + absent + late || 1;

  const bars = [
    { label: "Present",  value: present, color: C.green,  bg: C.greenBg,  pct: Math.round((present / total) * 100) },
    { label: "Absent",   value: absent,  color: C.bad,    bg: C.badBg,    pct: Math.round((absent  / total) * 100) },
    { label: "Late",     value: late,    color: C.amber,  bg: C.amberBg,  pct: Math.round((late    / total) * 100) },
  ];

  return (
    <Card>
      <SectionHead title="Attendance breakdown" subtitle="Today's org-wide status" />
      {loading ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>Loading attendance…</p>
      ) : (
        <>
          {/* Big number summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
            {bars.map(b => (
              <div key={b.label} style={{
                padding: "14px 12px", borderRadius: R.lg,
                background: b.bg, textAlign: "center",
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: b.color, ...FONT_NUM }}>{b.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: b.color, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>

          {/* Stacked progress bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bars.map(b => (
              <div key={b.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{b.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: b.color, ...FONT_NUM }}>{b.pct}%</span>
                </div>
                <div style={{ height: 7, background: C.line, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${b.pct}%`, height: "100%", background: b.color, borderRadius: 999, transition: "width .4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

/* ─── Subscription status card ───────────────────────────────────────────── */
const SubscriptionCard: React.FC<{ employeeCount: number }> = ({ employeeCount }) => {
  const navigate = useNavigate();

  // Derive plan from headcount (can be replaced with real API data)
  const plan      = employeeCount > 200 ? "Enterprise" : employeeCount > 50 ? "Business" : "Starter";
  const planColor = plan === "Enterprise" ? C.accent : plan === "Business" ? C.teal : C.blue;
  const planBg    = plan === "Enterprise" ? C.accentBg : plan === "Business" ? C.tealBg : C.blueBg;
  const renewsIn  = 14; // days — replace with real data when available

  return (
    <Card style={{ background: `linear-gradient(180deg, #fff 0%, ${C.accentBg} 240%)` }}>
      <SectionHead
        title="Subscription"
        subtitle="Your current plan"
        right={
          <IconBubble bg={planBg} color={planColor} size={36}>
            <Award size={16} />
          </IconBubble>
        }
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderRadius: R.lg, background: planBg, border: `1px solid ${planColor}22`, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: planColor }}>{plan} Plan</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
            {employeeCount} active employees · Renews in {renewsIn} days
          </div>
        </div>
        <StatusPill bg={planBg} color={planColor} dot>Active</StatusPill>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Unlimited leave management",   on: true },
          { label: "AI-powered HR assistant",      on: true },
          { label: "Advanced payroll integration", on: plan !== "Starter" },
          { label: "Multi-department analytics",   on: plan === "Enterprise" },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: f.on ? C.okBg : C.line,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {f.on
                ? <span style={{ color: C.ok, fontSize: 12, fontWeight: 900 }}>✓</span>
                : <span style={{ color: C.faint, fontSize: 11, fontWeight: 700 }}>—</span>}
            </div>
            <span style={{ fontSize: 13, color: f.on ? C.text : C.faint, fontWeight: f.on ? 600 : 400 }}>{f.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/owner/subscriptions")}
        style={{
          marginTop: 18, width: "100%", padding: "11px 0",
          borderRadius: 999, border: `1px solid ${planColor}`,
          background: "transparent", color: planColor,
          fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          transition: "all .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = planBg; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        Manage subscription →
      </button>
    </Card>
  );
};

/* ─── Quick actions ──────────────────────────────────────────────────────── */
const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();
  const actions = [
    { label: "Dashboard",      path: "/owner",                       icon: <Users size={18} />,     bg: C.accentBg, color: C.accent  },
    { label: "Managers",       path: "/owner/managers",              icon: <Star size={18} />,      bg: C.blueBg,   color: C.blue    },
    { label: "Employees",      path: "/owner/employees",             icon: <Users size={18} />,     bg: C.greenBg,  color: C.green   },
    { label: "Emp. Review",    path: "/owner/employee-review",       icon: <PenTool size={18} />,   bg: C.coralBg,  color: C.coral   },
    { label: "Org Settings",   path: "/owner/organization-settings", icon: <Settings size={18} />,  bg: C.tealBg,   color: C.teal    },
    { label: "Subscriptions",  path: "/owner/subscriptions",         icon: <Award size={18} />,     bg: C.amberBg,  color: C.amber   },
    { label: "Onboarding",     path: "/owner/onboarding",            icon: <Plus size={18} />,      bg: C.purpleBg, color: C.purple  },
    { label: "Manage Emps",    path: "/owner/manage-employees",      icon: <Building2 size={18} />, bg: "#f1f5f9",  color: C.muted   },
  ];
  return (
    <Card>
      <SectionHead title="Quick navigation" subtitle="Jump to any section" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {actions.map(a => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            style={{ padding: "14px 10px", borderRadius: R.lg, border: `1px solid ${C.line}`, background: C.surface, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = SHADOW_L; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <IconBubble bg={a.bg} color={a.color} size={36}>{a.icon}</IconBubble>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: C.ink, textAlign: "center", lineHeight: 1.3 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

/* ─── AI assistant ───────────────────────────────────────────────────────── */
const OWNER_PROMPTS = [
  "How do I view org-wide attendance trends?",
  "What's the process to add a new manager?",
  "How do I export payroll data?",
];

const AIAssistantCard: React.FC = () => {
  const [value, setValue] = useState("");
  return (
    <Card style={{ background: `linear-gradient(180deg, #fff 0%, ${C.accentBg} 220%)` }}>
      <SectionHead
        title="KagoHC AI"
        subtitle="Ask anything about HR policies, org settings, or reporting."
        right={<IconBubble bg={C.accentBg} color={C.accent} size={36}><Sparkles size={16} /></IconBubble>}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {OWNER_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => setValue(p)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: R.md, border: `1px solid ${C.line}`, background: C.surfaceAlt, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "border-color .15s, background .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line;   e.currentTarget.style.background = C.surfaceAlt; }}
          >
            <MessageCircle size={14} color={C.accent} />{p}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 16px", borderRadius: 999, background: "#fff", border: `1px solid ${C.line}`, boxShadow: SHADOW }}>
        <Search size={16} color={C.faint} />
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Ask KagoHC AI…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: C.ink, padding: "8px 0" }} />
        <button type="button" onClick={() => setValue("")} style={{ border: "none", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", background: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
};

/* ─── Main ───────────────────────────────────────────────────────────────── */
interface Counts {
  employees: number; managers: number; departments: number;
  presentToday: number; pendingLeave: number; onPayroll: number;
  absent: number; late: number;
}

export const OwnerOverview: React.FC = () => {
  const navigate = useNavigate();

  const [counts, setCounts]           = useState<Counts>({ employees: 0, managers: 0, departments: 0, presentToday: 0, pendingLeave: 0, onPayroll: 0, absent: 0, late: 0 });
  const [deptStats, setDeptStats]     = useState<DeptStat[]>([]);
  const [managerList, setManagerList] = useState<ManagerEntry[]>([]);
  const [leaveList, setLeaveList]     = useState<OrgLeave[]>([]);
  const [user, setUser]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [leaveLoading, setLeaveLoading] = useState(true);

  /* Auth guard */
  useEffect(() => {
    const t = token(); const u = localStorage.getItem("user");
    if (!t || !u) { navigate("/"); return; }
    try { setUser(JSON.parse(u)); } catch { navigate("/"); }
  }, [navigate]);

  /* Main data fetch */
  useEffect(() => {
    const t = token(); if (!t) return;
    const headers = { Authorization: `Bearer ${t}` };
    const today   = new Date().toISOString().split("T")[0];

    const toArr = (p: any, keys: string[]): any[] => {
      for (const k of keys) {
        const v = k.split(".").reduce((o: any, key) => o?.[key], p);
        if (Array.isArray(v)) return v;
      }
      return Array.isArray(p) ? p : [];
    };

    Promise.all([
      fetch(`${API_URL}/employees`,   { headers }).then(r => r.json()),
      fetch(`${API_URL}/leave/stats`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/attendance`,  { headers }).then(r => r.json()),
    ]).then(([empData, leaveData, attData]) => {
      const emps = toArr(empData,  ["data.data","data","data.rows"]);
      const att  = toArr(attData,  ["data.data","data","data.records","data.attendance","data.rows"]);
      const ls   = leaveData?.data?.data ?? leaveData?.data ?? leaveData;

      const pendingLeave = Number(ls?.pending ?? ls?.pending_count ?? ls?.pendingLeave ?? 0) || 0;

      // Attendance today
      const todayAtt  = att.filter((r: any) => String(r?.date ?? r?.attendanceDate ?? "").split("T")[0] === today);
      const present   = todayAtt.filter((r: any) => ["present","half_day","half-day"].includes(String(r?.status ?? ""))).length;
      const late      = todayAtt.filter((r: any) => String(r?.status ?? "") === "late").length;
      const presentAndLate = present + late;
      const absent    = Math.max(0, emps.length - presentAndLate);
      const onPayroll = emps.filter((e: any) => e?.onPayroll === true || e?.on_payroll === true).length;

      // Departments from employees
      const deptMap: Record<string, number> = {};
      for (const e of emps) {
        const dept = String(e?.department ?? e?.departmentName ?? "Unknown").trim();
        deptMap[dept] = (deptMap[dept] ?? 0) + 1;
      }
      const departments = Object.entries(deptMap)
        .map(([name, count]) => ({ name, count, present: 0 }))
        .sort((a, b) => b.count - a.count);

      // Managers inferred from role field
      const mgrs = emps.filter((e: any) =>
        String(e?.role ?? e?.userRole ?? "").toLowerCase() === "manager" ||
        e?.isManager === true || e?.is_manager === true
      );

      const mgrList: ManagerEntry[] = mgrs.map((m: any) => {
        const name = [m?.firstName ?? m?.first_name ?? "", m?.lastName ?? m?.last_name ?? ""].filter(Boolean).join(" ") || m?.name || "Manager";
        const dept = String(m?.department ?? m?.departmentName ?? "—");
        const teamSize = emps.filter((e: any) => {
          const mId = String(m?.id ?? m?._id ?? "");
          return String(e?.managerId ?? e?.manager_id ?? e?.manager ?? "") === mId;
        }).length;
        return { id: String(m?.id ?? m?._id ?? Math.random()), name, department: dept, teamSize, email: m?.email };
      });

      setCounts({ employees: emps.length, managers: mgrs.length, departments: departments.length, presentToday: presentAndLate, pendingLeave, onPayroll, absent, late });
      setDeptStats(departments);
      setManagerList(mgrList);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  /* Leave requests */
  useEffect(() => {
    const t = token(); if (!t) return;
    const headers = { Authorization: `Bearer ${t}` };
    const extract = (d: any): OrgLeave[] =>
      Array.isArray(d?.data?.data) ? d.data.data : Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];

    fetch(`${API_URL}/leave/requests`, { headers })
      .then(r => r.json()).then(d => setLeaveList(extract(d)))
      .catch(() =>
        fetch(`${API_URL}/leave`, { headers }).then(r => r.json()).then(d => setLeaveList(extract(d)))
      )
      .finally(() => setLeaveLoading(false));
  }, []);

  const firstName = user?.firstName || "Admin";
  const presentPct = counts.employees > 0 ? Math.round((counts.presentToday / counts.employees) * 100) : 0;

  return (
    <>
      <style>{`
        .own-row  { display: grid; gap: 20px; margin-bottom: 22px; }
        .own-hero { grid-template-columns: 1fr; }
        .own-pair { grid-template-columns: 1fr; }
        .own-trio { grid-template-columns: 1fr; }
        .own-bot  { grid-template-columns: 1fr; }
        .own-kpi  { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); margin-bottom: 22px; }
        @media (min-width: 900px)  { .own-kpi  { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1100px) {
          .own-hero { grid-template-columns: 2fr 1fr; }
          .own-pair { grid-template-columns: 1fr 1fr; }
          .own-trio { grid-template-columns: 1fr 1fr 1fr; }
          .own-bot  { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <GreetingHeader name={firstName} />

        {/* Hero */}
        <div className="own-row own-hero">
          <OrgHealthCard
            counts={{ employees: counts.employees, managers: counts.managers, presentToday: counts.presentToday, departments: counts.departments }}
            loading={loading}
          />
          <OrgGrowthCard pendingLeave={counts.pendingLeave} onPayroll={counts.onPayroll} employees={counts.employees} />
        </div>

        {/* KPIs */}
        <div className="own-kpi">
          <StatTile label="Total Employees" value={loading ? "…" : counts.employees}    sub="Across all teams"      icon={<Users size={20} />}       iconBg={C.accentBg} iconColor={C.accent} onClick={() => navigate("/owner/employees")}     />
          <StatTile label="Managers"        value={loading ? "…" : counts.managers}     sub="Active team leads"     icon={<Star size={20} />}        iconBg={C.blueBg}   iconColor={C.blue}   onClick={() => navigate("/owner/managers")}      />
          <StatTile label="Pending Leave"   value={loading ? "…" : counts.pendingLeave} sub="Awaiting review"       icon={<Calendar size={20} />}    iconBg={C.warnBg}   iconColor={C.amber}  delta={{ up: counts.pendingLeave === 0, text: counts.pendingLeave === 0 ? "clear" : String(counts.pendingLeave) }} />
          <StatTile label="On Payroll"      value={loading ? "…" : counts.onPayroll}    sub={`${counts.employees > 0 ? Math.round((counts.onPayroll/counts.employees)*100) : 0}% coverage`} icon={<Target size={20} />} iconBg={C.tealBg} iconColor={C.teal} onClick={() => navigate("/owner/subscriptions")} />
        </div>

        {/* Departments + Managers */}
        <div className="own-row own-pair">
          <DepartmentsCard departments={deptStats} loading={loading} />
          <ManagersCard    managers={managerList}  loading={loading} />
        </div>

        {/* Leave overview + Attendance breakdown */}
        <div className="own-row own-pair">
          <OrgLeaveCard   requests={leaveList} loading={leaveLoading} />
          <AttendanceBreakdownCard present={counts.presentToday} absent={counts.absent} late={counts.late} loading={loading} />
        </div>

        {/* Quick nav + AI + Subscription */}
        <div className="own-row own-trio">
          <QuickActionsCard />
          <AIAssistantCard />
          <SubscriptionCard employeeCount={counts.employees} />
        </div>

        <p style={{ textAlign: "center", color: C.faint, fontSize: 12.5, margin: "8px 0 24px" }}>
          KagoHC · Crafted for happier teams
        </p>
      </div>
    </>
  );
};

export default OwnerOverview;
