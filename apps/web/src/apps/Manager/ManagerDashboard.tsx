/**
 * ManagerDashboard.tsx
 * Redesigned with the same visual DNA as employee.tsx:
 *  - Gradient hero cards, Card primitives, StatusPill, ProgressBar
 *  - Manager-specific privileges: live leave approval / rejection, searchable roster
 *  - All existing API calls retained + /leave/requests for pending approvals
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award, Calendar, Check, ChevronRight, Clock,
  FileText, MessageCircle, Plus, Search, Sparkles, Star,
  Target, TrendingUp, Users, X, Zap,
} from "lucide-react";
import SharedLayout from "./SharedLayout";
import { useManagerAttendance, badgeStyle, statusLabel } from "../../shared/utils/attendance";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  coral: "#E6614F", coralDk: "#c44a38", coralBg: "#fdf0ee",
  ink: "#1d2939",   text: "#344054",    muted: "#667085", faint: "#98a2b3",
  line: "#e4e7ec",  surface: "#ffffff", surfaceAlt: "#f9f7f5",
  ok: "#10b981",  okBg: "#ecfdf3",
  warn: "#f59e0b", warnBg: "#fffaeb",
  bad: "#ef4444",  badBg: "#fef2f2",
  blue: "#3182CE", blueBg: "#ebf8ff",
  green: "#48BB78", greenBg: "#f0fff4",
  purple: "#805AD5", purpleBg: "#f3f0ff",
  amber: "#D97706", amberBg: "#fffbeb",
} as const;

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

const AVATAR_COLORS = ["#E6614F","#3182CE","#48BB78","#805AD5","#D97706","#d53f8c","#2a8a7a"];
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
  color: C.coral, fontSize: 13, fontWeight: 700, cursor: "pointer",
};

/* ─── Greeting header ────────────────────────────────────────────────────── */
const GreetingHeader: React.FC<{ name: string }> = ({ name }) => {
  const h = new Date().getHours();
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
          Here's your team overview for today.
        </p>
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "9px 18px", borderRadius: 999,
        background: "#fff", border: `1px solid ${C.line}`, boxShadow: SHADOW,
        fontSize: 13.5, fontWeight: 600, color: C.text,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.ok, boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
        <strong style={{ color: C.ink, fontWeight: 700 }}>Manager portal</strong>
        <span style={{ color: C.faint }}>·</span>
        <span style={{ color: C.muted }}>{dateStr}</span>
      </div>
    </header>
  );
};

/* ─── Team ops hero card ─────────────────────────────────────────────────── */
const TeamOpsCard: React.FC<{
  counts: { employees: number; presentToday: number };
  loading: boolean;
}> = ({ counts, loading }) => {
  const presentPct = counts.employees > 0
    ? Math.round((counts.presentToday / counts.employees) * 100) : 0;
  const health    = presentPct >= 80 ? "Healthy" : presentPct >= 55 ? "Moderate" : "Low attendance";
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
      background: "linear-gradient(135deg, #2a2f7a 0%, #4f3da3 60%, #6a5cd8 100%)",
      borderRadius: R.hero, padding: 28,
      boxShadow: "0 12px 32px rgba(42,47,122,0.35)", color: "#fff",
    }}>
      <div aria-hidden style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
      <div aria-hidden style={{ position: "absolute", right: 60, bottom: -100, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: 1, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>Team operations</div>
          <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 13.5, fontWeight: 600, marginTop: 6 }}>
            {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.16)", color: "#fff",
          borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: healthDot }} />
          {loading ? "Loading…" : health}
        </span>
      </div>

      <div style={{ position: "relative", marginTop: 28 }}>
        <div style={{ fontSize: 13, opacity: 0.82, marginBottom: 10, fontWeight: 600 }}>Team attendance today</div>
        <ProgressBar value={loading ? 0 : presentPct} color="#fff" track="rgba(255,255,255,0.22)" height={10} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
          <span style={{ fontSize: 12.5, opacity: 0.72 }}>{loading ? "—" : `${counts.presentToday} of ${counts.employees} present`}</span>
          <span style={{ fontSize: 14, opacity: 0.95, fontWeight: 800, ...FONT_NUM }}>{loading ? "—" : `${presentPct}%`}</span>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: 28, marginTop: 26, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.18)", flexWrap: "wrap" }}>
        <Stat label="Total team" value={loading ? "…" : String(counts.employees)} />
        <Stat label="Present"    value={loading ? "…" : String(counts.presentToday)} />
        <Stat label="Absent"     value={loading ? "…" : String(Math.max(0, counts.employees - counts.presentToday))} />
        <Stat label="Rate"       value={loading ? "…" : `${presentPct}%`} />
      </div>
    </section>
  );
};

/* ─── Team health card ───────────────────────────────────────────────────── */
const TeamHealthCard: React.FC<{ rate: number; pendingLeave: number }> = ({ rate, pendingLeave }) => {
  const tier = rate >= 90 ? "Excellent" : rate >= 75 ? "Good shape" : "Needs attention";
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(155deg, ${C.coral} 0%, ${C.coralDk} 100%)`,
      borderRadius: R.hero, padding: 24, boxShadow: SHADOW_L,
      color: "#fff", display: "flex", flexDirection: "column", minHeight: 240,
    }}>
      <div aria-hidden style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
      <div aria-hidden style={{ position: "absolute", left: -40, bottom: -90, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
        <TrendingUp size={18} />
        <div style={{ fontSize: 11.5, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>Team health</div>
      </div>

      <div style={{ position: "relative", marginTop: 18 }}>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1, ...FONT_NUM }}>{rate}%</div>
        <div style={{ fontSize: 17, fontWeight: 700, opacity: 0.92, marginTop: 4 }}>attendance rate</div>
      </div>

      <p style={{ position: "relative", margin: "14px 0 0", fontSize: 13.5, lineHeight: 1.5, opacity: 0.9, flex: 1 }}>
        {pendingLeave > 0
          ? `${pendingLeave} leave request${pendingLeave !== 1 ? "s" : ""} awaiting your approval.`
          : "All leave requests are up to date. Great job!"}
      </p>

      <div style={{ position: "relative", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[<Star size={14} key="s" />, <Award size={14} key="a" />, <Zap size={14} key="z" />].map((ic, i) => (
            <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>{ic}</div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{tier}</div>
          <div style={{ fontSize: 11.5, opacity: 0.85 }}>Team performance this month</div>
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
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: delta.up ? C.ok : C.bad,
            background: delta.up ? C.okBg : C.badBg,
            padding: "2px 8px", borderRadius: 999,
          }}>
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

/* ─── Pending leave approval card (new feature) ──────────────────────────── */
interface LeaveReq {
  id: string;
  employee_name?: string; employeeName?: string; full_name?: string;
  type?: string; leaveType?: string; leave_type?: string;
  start_date?: string; startDate?: string;
  end_date?: string; endDate?: string;
  days?: number; reason?: string; status?: string;
}

const PendingLeaveCard: React.FC<{
  requests: LeaveReq[];
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ requests, loading, onApprove, onReject }) => {
  const pending = requests.filter(r => (r.status ?? "pending") === "pending");

  const getName  = (r: LeaveReq) => r.employee_name ?? r.employeeName ?? r.full_name ?? "Employee";
  const getType  = (r: LeaveReq) => r.type ?? r.leaveType ?? r.leave_type ?? "Leave";
  const getStart = (r: LeaveReq) => r.start_date ?? r.startDate ?? "—";

  return (
    <Card>
      <SectionHead
        title="Leave requests"
        subtitle={`${pending.length} pending approval`}
        right={(
          <StatusPill bg={pending.length > 0 ? C.warnBg : C.okBg} color={pending.length > 0 ? C.amber : C.ok}>
            {pending.length > 0 ? `${pending.length} pending` : "All clear ✓"}
          </StatusPill>
        )}
      />

      {loading ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>Loading requests…</p>
      ) : pending.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center" }}>
          <FileText size={36} color={C.faint} style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>No pending requests</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>All leave requests have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pending.slice(0, 5).map(r => (
            <div key={r.id} style={{
              padding: "14px 16px", borderRadius: R.lg,
              border: `1px solid ${C.line}`, background: C.surfaceAlt,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={getName(r)} size={38} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getName(r)}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {getType(r)} · from {getStart(r)} · {r.days ?? "?"} day{r.days !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => onApprove(r.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 999, border: "none", background: C.okBg, color: C.ok, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.93)")}
                    onMouseLeave={e => (e.currentTarget.style.filter = "")}
                  >
                    <Check size={13} />Approve
                  </button>
                  <button
                    onClick={() => onReject(r.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 999, border: "none", background: C.badBg, color: C.bad, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.93)")}
                    onMouseLeave={e => (e.currentTarget.style.filter = "")}
                  >
                    <X size={13} />Reject
                  </button>
                </div>
              </div>
              {r.reason && (
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: R.sm, background: "#fff", border: `1px solid ${C.line}`, fontSize: 12.5, color: C.muted, lineHeight: 1.45, fontStyle: "italic" }}>
                  "{r.reason}"
                </div>
              )}
            </div>
          ))}
          {pending.length > 5 && (
            <button style={linkBtn}>View all {pending.length} requests →</button>
          )}
        </div>
      )}
    </Card>
  );
};

/* ─── Searchable team roster ─────────────────────────────────────────────── */
const TeamRosterCard: React.FC<{ roster: any[]; loading: boolean }> = ({ roster, loading }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const statuses = useMemo(() => {
    const s = new Set<string>(roster.map(r => String(r.status ?? "absent")));
    return ["all", ...Array.from(s)];
  }, [roster]);

  const filtered = useMemo(() =>
    roster.filter(r => {
      const matchSearch = r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || r.status === filter;
      return matchSearch && matchFilter;
    }),
    [roster, search, filter],
  );

  return (
    <Card>
      <SectionHead
        title="Who's around today"
        subtitle={`${roster.length} team members`}
        right={(
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { s: "present", color: C.ok },
              { s: "absent",  color: C.bad },
              { s: "late",    color: C.amber },
            ].map(({ s, color }) => {
              const count = roster.filter(r => r.status === s).length;
              return (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />{count}
                </span>
              );
            })}
          </div>
        )}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, padding: "8px 14px", borderRadius: 999, background: C.surfaceAlt, border: `1px solid ${C.line}` }}>
          <Search size={14} color={C.faint} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or department…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: C.ink, flex: 1 }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ border: `1px solid ${C.line}`, borderRadius: 999, padding: "8px 14px", fontSize: 12.5, color: C.text, background: C.surface, outline: "none", cursor: "pointer" }}>
          {statuses.map(s => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : statusLabel(s as any)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>Loading roster…</p>
      ) : filtered.length === 0 ? (
        <p style={{ margin: 0, padding: "20px 0", textAlign: "center", color: C.faint, fontSize: 13 }}>No results found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 340, overflowY: "auto" }}>
          {filtered.map(m => {
            const bStyle = badgeStyle(m.status);
            const lbl    = statusLabel(m.status as any);
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 6px", borderBottom: `1px solid ${C.line}` }}>
                <Avatar name={m.full_name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.full_name}</div>
                  <div style={{ fontSize: 11.5, color: C.faint }}>{m.department}</div>
                </div>
                <span style={{ ...bStyle, padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>{lbl}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

/* ─── Quick actions ──────────────────────────────────────────────────────── */
const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();
  const actions = [
    { label: "Add Employee",   path: "/manager/manage-employees", icon: <Plus size={18} />,     bg: C.coralBg,  color: C.coral  },
    { label: "All Employees",  path: "/manager/employees",        icon: <Users size={18} />,    bg: C.blueBg,   color: C.blue   },
    { label: "Attendance",     path: "/manager/attendance",       icon: <Clock size={18} />,    bg: C.greenBg,  color: C.green  },
    { label: "Leave Requests", path: "/manager/leave-requests",   icon: <Calendar size={18} />, bg: C.warnBg,   color: C.amber  },
    { label: "Payroll",        path: "/manager/payroll",          icon: <Target size={18} />,   bg: C.purpleBg, color: C.purple },
    { label: "Emp. Profile",   path: "/manager/profile",          icon: <Star size={18} />,     bg: "#f1f5f9",  color: C.muted  },
  ];
  return (
    <Card>
      <SectionHead title="Quick navigation" subtitle="Jump to any section" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {actions.map(a => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            style={{ padding: "14px 10px", borderRadius: R.lg, border: `1px solid ${C.line}`, background: C.surface, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = SHADOW_L; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <IconBubble bg={a.bg} color={a.color} size={38}>{a.icon}</IconBubble>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, textAlign: "center", lineHeight: 1.3 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

/* ─── AI assistant (same as employee) ───────────────────────────────────── */
const MANAGER_PROMPTS = [
  "How do I export an attendance report?",
  "What's the policy for rejecting leave?",
  "How do I add a new employee?",
];

const AIAssistantCard: React.FC = () => {
  const [value, setValue] = useState("");
  return (
    <Card style={{ background: `linear-gradient(180deg, #fff 0%, ${C.coralBg} 220%)` }}>
      <SectionHead
        title="KagoHC AI"
        subtitle="Ask anything about HR policies, attendance, or payroll."
        right={<IconBubble bg={C.coralBg} color={C.coral} size={36}><Sparkles size={16} /></IconBubble>}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {MANAGER_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => setValue(p)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: R.md, border: `1px solid ${C.line}`, background: C.surfaceAlt, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "border-color .15s, background .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.background = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line;  e.currentTarget.style.background = C.surfaceAlt; }}
          >
            <MessageCircle size={14} color={C.coral} />{p}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 16px", borderRadius: 999, background: "#fff", border: `1px solid ${C.line}`, boxShadow: SHADOW }}>
        <Search size={16} color={C.faint} />
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Ask KagoHC AI…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: C.ink, padding: "8px 0" }} />
        <button type="button" onClick={() => setValue("")} style={{ border: "none", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", background: C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </Card>
  );
};

/* ─── Main component ─────────────────────────────────────────────────────── */
const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts]               = useState({ employees: 0, pendingLeave: 0, presentToday: 0, onPayroll: 0 });
  const [leaveRequests, setLeaveRequests] = useState<LeaveReq[]>([]);
  const [loading, setLoading]             = useState(true);
  const [leaveLoading, setLeaveLoading]   = useState(true);
  const [user, setUser]                   = useState<any>(null);

  const { loading: rosterLoading, todayAttendance, noClockInList } = useManagerAttendance();

  useEffect(() => {
    const t = token(); const u = localStorage.getItem("user");
    if (!t || !u) { navigate("/"); return; }
    try { setUser(JSON.parse(u)); } catch { navigate("/"); }
  }, [navigate]);

  const handleLeaveAction = useCallback(async (id: string, action: "approved" | "rejected") => {
    try {
      await fetch(`${API_URL}/leave/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
      setCounts(prev => ({ ...prev, pendingLeave: Math.max(0, prev.pendingLeave - 1) }));
    } catch (err) { console.error(err); }
  }, []);

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
      const emps    = toArr(empData, ["data.data","data","data.rows"]);
      const att     = toArr(attData, ["data.data","data","data.records","data.attendance","data.rows"]);
      const ls      = leaveData?.data?.data ?? leaveData?.data ?? leaveData;
      const pending = Number(ls?.pending ?? ls?.pending_count ?? ls?.pendingLeave ?? 0) || 0;

      const todayAtt = att.filter((r: any) => String(r?.date ?? r?.attendanceDate ?? "").split("T")[0] === today);
      const present  = todayAtt.filter((r: any) =>
        ["present","late","half_day","half-day"].includes(String(r?.status ?? "").trim())
      ).length;
      const onPayroll = emps.filter((e: any) => e?.onPayroll === true || e?.on_payroll === true).length;

      setCounts({ employees: emps.length, pendingLeave: pending, presentToday: present, onPayroll });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = token(); if (!t) return;
    const headers = { Authorization: `Bearer ${t}` };
    const extract = (d: any): LeaveReq[] =>
      Array.isArray(d?.data?.data) ? d.data.data : Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];

    fetch(`${API_URL}/leave/requests`, { headers })
      .then(r => r.json()).then(d => setLeaveRequests(extract(d)))
      .catch(() =>
        fetch(`${API_URL}/leave`, { headers }).then(r => r.json()).then(d => setLeaveRequests(extract(d)))
      )
      .finally(() => setLeaveLoading(false));
  }, []);

  const roster = useMemo(() => {
    const byId: Record<string, any> = {};
    for (const r of todayAttendance as any[]) {
      const id = String(r.employee_id ?? r.employeeId ?? r.employee?.id ?? "").trim();
      if (!id) continue;
      byId[id] = { id, full_name: String(r.full_name ?? r.name ?? "Unknown"), department: String(r.department ?? "—"), status: String(r.status ?? "absent") };
    }
    for (const e of noClockInList as any[]) {
      const id = String(e.employee_id ?? e.id ?? "").trim();
      if (!id || byId[id]) continue;
      byId[id] = { id, full_name: String(e.full_name ?? e.name ?? "Unknown"), department: String(e.department ?? "—"), status: "absent" };
    }
    return Object.values(byId).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [todayAttendance, noClockInList]);

  const presentPct = counts.employees > 0 ? Math.round((counts.presentToday / counts.employees) * 100) : 0;
  const firstName  = user?.firstName || "Manager";

  return (
    <SharedLayout title="Dashboard">
      <style>{`
        .mgr-row  { display: grid; gap: 20px; margin-bottom: 22px; }
        .mgr-hero { grid-template-columns: 1fr; }
        .mgr-pair { grid-template-columns: 1fr; }
        .mgr-bot  { grid-template-columns: 1fr; }
        .mgr-kpi  { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); margin-bottom: 22px; }
        @media (min-width: 900px)  { .mgr-kpi  { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1100px) {
          .mgr-hero { grid-template-columns: 2fr 1fr; }
          .mgr-pair { grid-template-columns: 1fr 1fr; }
          .mgr-bot  { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <GreetingHeader name={firstName} />

        <div className="mgr-row mgr-hero">
          <TeamOpsCard counts={counts} loading={loading} />
          <TeamHealthCard rate={presentPct} pendingLeave={counts.pendingLeave} />
        </div>

        <div className="mgr-kpi">
          <StatTile label="Total Employees" value={loading ? "…" : counts.employees}    sub="In your team"          icon={<Users size={20} />}    iconBg={C.blueBg}   iconColor={C.blue}   onClick={() => navigate("/manager/employees")}     />
          <StatTile label="Present Today"   value={loading ? "…" : counts.presentToday} sub={`${presentPct}% rate`} icon={<Clock size={20} />}    iconBg={C.greenBg}  iconColor={C.green}  delta={{ up: presentPct >= 75, text: `${presentPct}%` }} onClick={() => navigate("/manager/attendance")}    />
          <StatTile label="Pending Leave"   value={loading ? "…" : counts.pendingLeave} sub="Awaiting approval"     icon={<Calendar size={20} />} iconBg={C.warnBg}   iconColor={C.amber}  onClick={() => navigate("/manager/leave-requests")} />
          <StatTile label="On Payroll"      value={loading ? "…" : counts.onPayroll}    sub="Active employees"      icon={<Target size={20} />}   iconBg={C.purpleBg} iconColor={C.purple} onClick={() => navigate("/manager/payroll")}       />
        </div>

        <div className="mgr-row mgr-pair">
          <PendingLeaveCard requests={leaveRequests} loading={leaveLoading} onApprove={id => handleLeaveAction(id, "approved")} onReject={id => handleLeaveAction(id, "rejected")} />
          <TeamRosterCard roster={roster} loading={rosterLoading} />
        </div>

        <div className="mgr-row mgr-bot">
          <QuickActionsCard />
          <AIAssistantCard />
        </div>

        <p style={{ textAlign: "center", color: C.faint, fontSize: 12.5, margin: "8px 0 24px" }}>
          KagoHC · Crafted for happier teams
        </p>
      </div>
    </SharedLayout>
  );
};

export default ManagerDashboard;
