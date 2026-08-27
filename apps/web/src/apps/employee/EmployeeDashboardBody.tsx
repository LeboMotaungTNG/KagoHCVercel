import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowUp, Award, Calendar, Clock, FileText,
  GraduationCap, Heart, MapPin, Megaphone, MessageCircle, Palmtree, Pin,
  Plane, Plus, Receipt, Search, Sparkles, Star, Target, TrendingUp, Users,
  Video, Zap,
  Cake,
} from "lucide-react";
import {
  C, SHADOW, SHADOW_L, R, FONT_NUM,
  type UserProfile, type TodayAttendance, type LeaveStatus, type LeaveRecord,
  type LeaveBalance, type AttendanceStats, type BirthdayEntry,
  type PresenceState, type Teammate,
  PRESENCE_STYLES,
  greetingFor, longDate, fmtTime, fmtHMS, fmtDateRange,
  getInitials, avatarBg,
  sortLeaveBalances, buildTeammateRoster,
  useLiveTick,
} from "../../shared/utils/employee";
import BreakControls from "../../shared/components/BreakControls";
import { useBreakSession, fmtBreakShort, totalBreakMs } from "../../shared/utils/breaks";


type DashboardMode = "employee" | "manager" | "owner";

type Props = {
  mode: DashboardMode;
  user: UserProfile | null;
  today: TodayAttendance;
  stats: AttendanceStats;
  balances: LeaveBalance[];
  activeLeave: unknown;
  recentLeaves: LeaveRecord[];
  teamOnLeave: unknown[];
  birthdays: BirthdayEntry[];
  colleagues: any[];
  loading: boolean;
  error: string | null;
  clockIn: () => void;
  clockOut: () => void;
};

const Card: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties; pad?: number }>> = ({
  children, style, pad = 22,
}) => (
  <section
    style={{
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: R.xl,
      boxShadow: SHADOW,
      padding: pad,
      ...style,
    }}
  >
    {children}
  </section>
);

const IconBubble: React.FC<{
  bg: string; color: string; size?: number; children: React.ReactNode;
}> = ({ bg, color, size = 40, children }) => (
  <div
    style={{
      width: size, height: size, borderRadius: 12,
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

const SectionHead: React.FC<{
  title: string; subtitle?: string; right?: React.ReactNode;
}> = ({ title, subtitle, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
    <div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>{title}</h3>
      {subtitle && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 38 }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatarBg(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 700, color: "#fff",
    }}
  >
    {getInitials(name)}
  </div>
);

const StatusPill: React.FC<{ bg: string; color: string; dot?: boolean; children: React.ReactNode }> = ({
  bg, color, dot, children,
}) => (
  <span
    style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: bg, color,
      borderRadius: 999, padding: "4px 10px",
      fontSize: 11.5, fontWeight: 700,
    }}
  >
    {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
    {children}
  </span>
);

const ProgressBar: React.FC<{ value: number; color: string; track?: string; height?: number }> = ({
  value, color, track = "rgba(255,255,255,0.35)", height = 6,
}) => (
  <div style={{ height, background: track, borderRadius: 999, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(100, Math.max(0, value))}%`,
      height: "100%", background: color, borderRadius: 999,
      transition: "width .35s ease",
    }} />
  </div>
);

const linkBtn: React.CSSProperties = {
  border: "none", background: "transparent",
  color: C.coral, fontSize: 13, fontWeight: 700, cursor: "pointer",
};

const GreetingHeader: React.FC<{ user: UserProfile | null; onLeave: boolean }> = ({ user, onLeave }) => (
  <header style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 20, flexWrap: "wrap", marginBottom: 22,
  }}>
    <div>
      <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: C.ink, letterSpacing: -0.9, lineHeight: 1.05 }}>
        {greetingFor()}, {user?.firstName || "there"} {onLeave ? "\ud83c\udf34" : "\ud83d\udc4b"}
      </h1>
      <p style={{ margin: "8px 0 0", color: C.muted, fontSize: 15 }}>
        {onLeave ? "You're currently on leave. Enjoy your time off!" : "Here's what's happening in your workspace today."}
      </p>
    </div>
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "9px 18px", borderRadius: 999,
      background: "#fff", border: `1px solid ${C.line}`,
      boxShadow: SHADOW,
      fontSize: 13.5, fontWeight: 600, color: C.text,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.ok, boxShadow: "0 0 0 4px rgba(16,185,129,0.18)" }} />
      <strong style={{ color: C.ink, fontWeight: 700 }}>All systems normal</strong>
      <span style={{ color: C.faint }}>·</span>
      <span style={{ color: C.muted }}>{longDate()}</span>
    </div>
  </header>
);

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  padding: "12px 22px", borderRadius: 999, border: "none",
  background: "#fff", color: C.coralDk,
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
};
const btnDisabled: React.CSSProperties = {
  ...btnPrimary, background: "rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.8)",
  cursor: "not-allowed", boxShadow: "none",
};
const TodaysSessionCard: React.FC<{
  today: TodayAttendance;
  canClock: boolean;
  onClockIn?: () => void;
  onClockOut?: () => void;
  location?: string;
}> = ({ today, canClock, onClockIn, onClockOut, location = "KagoHC HQ" }) => {
  const active = !!today.clock_in && !today.clock_out;
  const tick = useLiveTick(canClock && active);
  const { breaks, isOnBreak, totalMs: breakMs } = useBreakSession();
  const clockedOut = !active && !!today.clock_out;

  const elapsedSec = useMemo(() => {
    if (!today.clock_in) return 0;
    const [h, m] = today.clock_in.split(":").map(Number);
    const start = new Date(); start.setHours(h, m, 0, 0);
    const grossMs = Math.max(0, tick.getTime() - start.getTime());
    const workMs = Math.max(0, grossMs - totalBreakMs(breaks, tick.getTime()));
    return Math.floor(workMs / 1000);
  }, [today.clock_in, tick, breaks]);

  const goalSec = 8 * 3600;
  const progress = Math.min(100, (elapsedSec / goalSec) * 100);

  const statusPill = isOnBreak
    ? { label: "On break", bg: "rgba(255,255,255,0.22)", color: "#fff", dot: true }
    : active
    ? { label: "Active",   bg: "rgba(255,255,255,0.18)", color: "#fff", dot: true }
    : today.clock_out
      ? { label: "Wrapped", bg: "rgba(255,255,255,0.18)", color: "#fff", dot: false }
      : { label: "Not started", bg: "rgba(255,255,255,0.16)", color: "rgba(255,255,255,0.85)", dot: false };

  const FooterStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
      <div style={{ fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 2, ...FONT_NUM }}>
        {value}
      </div>
    </div>
  );

  const weekHours = today.work_hours ? today.work_hours.toFixed(1) : "0.0";

  return (
    <section
      style={{
        position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 60%, ${C.primaryLight} 100%)`,
        borderRadius: R.hero,
        padding: 28,
        boxShadow: "0 12px 32px rgba(42,47,122,0.35)",
        color: "#fff",
      }}
    >
      <div aria-hidden style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
      <div aria-hidden style={{ position: "absolute", right: 60, bottom: -100, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: 1, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" }}>
            Today's session
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, color: "rgba(255,255,255,0.92)", fontSize: 13.5, fontWeight: 600 }}>
            <MapPin size={14} /> {location}&nbsp;·&nbsp;{longDate()}
          </div>
        </div>
        <StatusPill bg={statusPill.bg} color={statusPill.color} dot={statusPill.dot}>{statusPill.label}</StatusPill>
      </div>

      <div style={{ position: "relative", marginTop: 22, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1, ...FONT_NUM }}>
          {fmtHMS(elapsedSec)}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, opacity: 0.8, ...FONT_NUM }}>/ 08:00:00 goal</div>
      </div>

      <div style={{ position: "relative", marginTop: 18 }}>
        <ProgressBar value={progress} color="#fff" track="rgba(255,255,255,0.25)" height={8} />
      </div>

      {canClock ? (
        <div style={{ position: "relative", display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          {!today.clock_in ? (
            <button onClick={onClockIn} style={btnPrimary}>
              <Clock size={16} style={{ marginRight: 8 }} />Clock in
            </button>
          ) : (
            <button
              onClick={onClockOut}
              disabled={!!today.clock_out || isOnBreak}
              style={(!!today.clock_out || isOnBreak) ? btnDisabled : btnPrimary}
              title={isOnBreak ? "End your break before clocking out" : undefined}
            >
              <Clock size={16} style={{ marginRight: 8 }} />
              {today.clock_out ? "Clocked out" : "Clock out"}
            </button>
          )}
          <BreakControls
            clockedIn={active}
            clockedOut={clockedOut}
            variant="inline"
          />
        </div>
      ) : (
        <div style={{ position: "relative", marginTop: 18, color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 700 }}>
          Clock controls are not available for your role.
        </div>
      )}

      <div style={{ position: "relative", display: "flex", gap: 28, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.18)", flexWrap: "wrap" }}>
        <FooterStat label="Clock in"   value={fmtTime(today.clock_in)} />
        <FooterStat label="On break"   value={breakMs > 0 ? fmtBreakShort(breakMs) : "0 min"} />
        <FooterStat label="This week"  value={`${weekHours}h`} />
        <FooterStat label="Status"     value={today.clock_out ? "Wrapped" : isOnBreak ? "On break" : active ? "Working" : "Idle"} />
      </div>
    </section>
  );
};

const StreakCard: React.FC<{ rate: number; days?: number; badges?: number }> = ({
  rate, days = 7, badges = 12,
}) => {
  const tier = rate >= 95 ? "Top 5%" : rate >= 85 ? "Top 15%" : "Rising star";
  return (
    <section
      style={{
        position: "relative", overflow: "hidden",
        background: `linear-gradient(155deg, ${C.coral} 0%, ${C.coralDk} 100%)`,
        borderRadius: R.hero,
        padding: 24,
        boxShadow: SHADOW_L,
        color: "#fff",
        display: "flex", flexDirection: "column",
        minHeight: 240,
      }}
    >
      <div aria-hidden style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
      <div aria-hidden style={{ position: "absolute", left: -40, bottom: -90, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
        <Award size={18} />
        <div style={{ fontSize: 11.5, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>
          You're on fire
        </div>
      </div>

      <div style={{ position: "relative", marginTop: 18 }}>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>
          {days}-day streak
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, opacity: 0.95, marginTop: 2 }}>
          of clocking in early
        </div>
      </div>

      <p style={{ position: "relative", margin: "14px 0 0", fontSize: 13, lineHeight: 1.45, opacity: 0.9, flex: 1 }}>
        Keep it up — earn the Punctuality badge in 3 more days.
      </p>

      <div style={{
        position: "relative", marginTop: 16, paddingTop: 14,
        borderTop: "1px solid rgba(255,255,255,0.22)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[<Star size={14} key="s" />, <Zap size={14} key="z" />, <Award size={14} key="a" />].map((ic, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{ic}</div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{badges} badges earned</div>
          <div style={{ fontSize: 11.5, opacity: 0.85 }}>{tier} in your team · {rate}% on-time</div>
        </div>
      </div>
    </section>
  );
};

const StatTile: React.FC<{
  label: string;
  value: string;
  delta?: { up: boolean; text: string };
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}> = ({ label, value, delta, sub, icon, iconBg, iconColor }) => (
  <Card style={{ padding: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <IconBubble bg={iconBg} color={iconColor}>{icon}</IconBubble>
      {delta && (
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: delta.up ? C.ok : C.bad,
          background: delta.up ? "#ecfdf3" : "#fef2f2",
          padding: "2px 8px", borderRadius: 999,
        }}>
          {delta.up ? "↑" : "↓"} {delta.text}
        </span>
      )}
    </div>
    <div style={{ marginTop: 16, fontSize: 13, color: C.muted, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, letterSpacing: -1, marginTop: 2, ...FONT_NUM }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</div>
  </Card>
);

const StatsGrid: React.FC<{
  balances: LeaveBalance[];
  today: TodayAttendance;
  stats: AttendanceStats;
  teamOnLeaveCount: number;
}> = ({ balances, today, stats, teamOnLeaveCount }) => {
  const totalLeave = balances.reduce((a, b) => a + Math.max(0, b.total - b.used), 0);
  const pendingLeave = balances.length;
  const monthHours = today.work_hours ? (today.work_hours * 22).toFixed(0) : "0";
  const target = 176;
  const pct = Math.min(999, Math.round((Number(monthHours) / target) * 100));

  return (
    <div className="kg-stats-grid">
      <StatTile
        label="Leave balance" value={`${totalLeave}d`}
        sub={`${pendingLeave} pending requests`}
        delta={{ up: true, text: `+${Math.max(0, totalLeave - 20)}` }}
        icon={<Calendar size={20} />} iconBg={C.coralBg} iconColor={C.coral}
      />
      <StatTile
        label="This month" value={`${monthHours}h`}
        sub={`${pct}% of target`}
        delta={{ up: pct >= 80, text: `${pct}%` }}
        icon={<TrendingUp size={20} />} iconBg={C.greenBg} iconColor={C.green}
      />
      <StatTile
        label="Team online" value={`${Math.max(0, 18 - teamOnLeaveCount)}/18`}
        sub={`${teamOnLeaveCount} on leave today`}
        icon={<Users size={20} />} iconBg={C.blueBg} iconColor={C.blue}
      />
      <StatTile
        label="Goals progress" value={`${stats.rate}%`}
        sub={`${stats.present} present · ${stats.late} late`}
        delta={{ up: stats.rate >= 80, text: `${stats.rate}%` }}
        icon={<Target size={20} />} iconBg={C.pinkBg} iconColor={C.pink}
      />
    </div>
  );
};

const PulseChart: React.FC<{ worked: number[]; focus: number[] }> = ({ worked, focus }) => {
  const W = 640, H = 160, P = 20;
  const max = Math.max(...worked, ...focus, 1);
  const x = (i: number) => P + (i * (W - 2 * P)) / (worked.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);

  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = (vals: number[]) =>
    `${path(vals)} L${x(vals.length - 1)},${H - P} L${x(0)},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
      <defs>
        <linearGradient id="g-worked" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.coral} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.coral} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g-focus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={P} x2={W - P} y1={H - P - p * (H - 2 * P)} y2={H - P - p * (H - 2 * P)}
          stroke={C.line} strokeDasharray="3 4" />
      ))}

      <path d={area(worked)} fill="url(#g-worked)" />
      <path d={path(worked)} fill="none" stroke={C.coral} strokeWidth={2.5} strokeLinecap="round" />

      <path d={area(focus)} fill="url(#g-focus)" />
      <path d={path(focus)} fill="none" stroke={C.green} strokeWidth={2.5} strokeLinecap="round" />

      {worked.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill="#fff" stroke={C.coral} strokeWidth={2} />
      ))}
    </svg>
  );
};

const ProductivityPulseCard: React.FC<{ todayHours: number | null }> = ({ todayHours }) => {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const baseW = [7.2, 8.1, 7.6, 8.4, 6.9, 0, 0];
  const baseF = [4.5, 5.2, 4.8, 5.5, 4.1, 0, 0];
  const worked = baseW.map((v, i) => (i === todayIdx && todayHours != null ? todayHours : v));
  const focus = baseF.map((v, i) => (i === todayIdx && todayHours != null ? Math.max(0, todayHours - 2.5) : v));

  return (
    <Card>
      <SectionHead
        title="Productivity pulse"
        subtitle="Hours worked vs deep focus, this week"
        right={(
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.muted }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.coral }} />Worked
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />Focus
            </span>
          </div>
        )}
      />
      <PulseChart worked={worked} focus={focus} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginTop: 8, fontSize: 11, color: C.faint, textAlign: "center", fontWeight: 600 }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d}>{d}</div>)}
      </div>
    </Card>
  );
};

const QUICK_ACTIONS: Array<{ label: string; icon: React.ReactNode; bg: string; color: string; badge?: string }> = [
  { label: "Payslip on WhatsApp", icon: <Receipt size={20} />, bg: C.coralBg, color: C.coral, badge: "NEW" },
  { label: "Book meeting room", icon: <Video size={20} />, bg: C.blueBg, color: C.blue },
  { label: "Submit expense", icon: <FileText size={20} />, bg: C.greenBg, color: C.green },
  { label: "Contact HR", icon: <MessageCircle size={20} />, bg: C.pinkBg, color: C.pink },
  { label: "Give kudos", icon: <Sparkles size={20} />, bg: C.amberBg, color: C.amber },
  { label: "Browse courses", icon: <GraduationCap size={20} />, bg: C.purpleBg, color: C.purple },
];

const QuickActionsCard: React.FC = () => (
  <Card>
    <SectionHead title="Quick actions" />
    <div className="kg-actions-grid">
      {QUICK_ACTIONS.map(a => (
        <button
          key={a.label}
          style={{
            border: `1px solid ${C.line}`, background: C.surface,
            borderRadius: R.lg, padding: "16px 12px", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            transition: "transform .15s, box-shadow .15s, border-color .15s",
            position: "relative",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(16,24,40,0.08)";
            e.currentTarget.style.borderColor = a.color;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "";
            e.currentTarget.style.borderColor = C.line;
          }}
        >
          {a.badge && (
            <span style={{
              position: "absolute", top: 10, right: 10,
              fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6,
              background: C.coral, color: "#fff",
              borderRadius: 999, padding: "2px 6px",
            }}>{a.badge}</span>
          )}
          <IconBubble bg={a.bg} color={a.color} size={44}>{a.icon}</IconBubble>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, textAlign: "center", lineHeight: 1.3 }}>
            {a.label}
          </span>
        </button>
      ))}
    </div>
  </Card>
);

function leaveCategoryIcon(type: string): React.ReactNode {
  const t = type.toLowerCase();
  if (/(sick|medical|illness)/.test(t)) return <Heart size={20} strokeWidth={2} aria-hidden />;
  if (/(personal|study|compassion|unpaid)/.test(t)) return <Palmtree size={20} strokeWidth={2} aria-hidden />;
  if (/(annual|vacation|holiday|pto)/.test(t)) return <Plane size={20} strokeWidth={2} aria-hidden />;
  return <Calendar size={20} strokeWidth={2} aria-hidden />;
}

const LeaveBalanceTile: React.FC<{ balance: LeaveBalance; gradient: string }> = ({ balance, gradient }) => {
  const remaining = Math.max(0, balance.total - balance.used);
  const pct = balance.total ? Math.min(100, (balance.used / balance.total) * 100) : 0;
  const label = balance.type.replace(/\s+leave$/i, "").trim();

  return (
    <div
      style={{
        position: "relative",
        background: gradient,
        borderRadius: R.lg,
        padding: "16px 16px 14px",
        color: "#fff",
        boxShadow: "0 8px 24px rgba(29,41,57,0.12)",
        minHeight: 142,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", right: -28, top: -28, width: 100, height: 100,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)",
        }}
      />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: "rgba(255,255,255,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {leaveCategoryIcon(balance.type)}
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase",
          opacity: 0.92, marginBottom: 6,
        }}>
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap", ...FONT_NUM }}>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1.4, lineHeight: 1 }}>
            {remaining}
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, opacity: 0.88 }}>
            /{balance.total}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, width: "100%", marginTop: 2 }}>
            days left · {balance.used} used
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={pct} color="rgba(255,255,255,0.95)" track="rgba(255,255,255,0.28)" height={6} />
        </div>
      </div>
    </div>
  );
};

const TimeOffCard: React.FC<{
  balances: LeaveBalance[];
  recent: LeaveRecord[];
  canApplyLeave: boolean;
  onApplyLeave?: () => void;
}> = ({ balances, recent, canApplyLeave, onApplyLeave }) => {
  const tilePalette = [
    `linear-gradient(145deg, #2d3a69 0%, #4a5fc1 55%, #5b6fd4 100%)`,
    `linear-gradient(145deg, #c75c5c 0%, #e07a6e 100%)`,
    `linear-gradient(145deg, #2a8a7a 0%, #3cb8a8 100%)`,
    `linear-gradient(135deg, ${C.purple} 0%, #7041e3 100%)`,
    `linear-gradient(135deg, ${C.pink} 0%, #dc7aa9 100%)`,
  ];

  const statusStyles: Record<LeaveStatus, { bg: string; color: string }> = {
    approved: { bg: "#ecfdf3", color: "#027a48" },
    pending: { bg: "#fffaeb", color: "#b54708" },
    rejected: { bg: "#fef2f2", color: "#b42318" },
  };

  const sortedBalances = useMemo(() => sortLeaveBalances(balances), [balances]);

  return (
    <Card>
      <SectionHead
        title="Time off"
        subtitle="Your balance & requests"
        right={
          canApplyLeave ? (
            <button
              type="button"
              onClick={() => onApplyLeave?.()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 999, border: "none",
                background: C.ink, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(29,41,57,0.14)",
                transition: "transform .15s, box-shadow .15s, background .15s",
              }}
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />Apply
            </button>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, paddingTop: 6 }}>
              Leave requests are not available for your role
            </span>
          )
        }
      />

      {sortedBalances.length === 0 ? (
        <div
          style={{
            padding: "28px 20px", textAlign: "center", borderRadius: R.md,
            background: C.surfaceAlt, border: `1px dashed ${C.line}`,
          }}
        >
          <Calendar size={32} color={C.faint} style={{ marginBottom: 10 }} aria-hidden />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>No leave balances yet</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted, lineHeight: 1.45 }}>
            Balances appear here when HR assigns your leave policy.
          </p>
        </div>
      ) : (
        <div className="kg-leave-grid" style={{ marginBottom: 4 }}>
          {sortedBalances.slice(0, 3).map((b, i) => (
            <LeaveBalanceTile key={b.type} balance={b} gradient={tilePalette[i % tilePalette.length]} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
        <div style={{
          fontSize: 10, letterSpacing: 1.6, fontWeight: 800, color: C.muted,
          textTransform: "uppercase", marginBottom: 12,
        }}>
          Recent requests
        </div>

        {recent.length === 0 ? (
          <div
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              textAlign: "center",
              padding: "26px 18px",
              borderRadius: R.md,
              background: C.surfaceAlt,
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#fff", border: `1px solid ${C.line}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <FileText size={22} color={C.coral} strokeWidth={1.75} aria-hidden />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>No recent requests</p>
            <p style={{ margin: "8px 0 16px", fontSize: 13, color: C.muted, lineHeight: 1.5, maxWidth: 260 }}>
              When you apply for leave, pending and past requests will appear in this list.
            </p>
            {canApplyLeave && (
              <button
                type="button"
                onClick={() => onApplyLeave?.()}
                style={{
                  border: `1px solid ${C.coral}`, background: "#fff", color: C.coralDk,
                  borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                }}
              >
                Submit a request
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.slice(0, 3).map(l => {
              const s = statusStyles[l.status];
              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 16px", background: "#fff", borderRadius: R.md,
                    border: `1px solid ${C.line}`,
                    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{l.type}</div>
                    <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
                      {fmtDateRange(l.start_date, l.end_date)}
                      <span style={{ color: C.faint }}> · </span>
                      {l.days} day{l.days === 1 ? "" : "s"}
                    </div>
                  </div>
                  <StatusPill bg={s.bg} color={s.color}>
                    {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                  </StatusPill>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

const WhosAroundCard: React.FC<{ roster: Teammate[]; onViewAll: () => void }> = ({ roster, onViewAll }) => {
  const preview = roster.slice(0, 8);

  const counts = roster.reduce(
    (a, r) => ((a[r.state]++), a),
    { office: 0, remote: 0, leave: 0 } as Record<PresenceState, number>,
  );

  return (
    <Card>
      <SectionHead
        title="Who's around today"
        subtitle={`${roster.length} teammates`}
        right={(
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {(Object.keys(PRESENCE_STYLES) as PresenceState[]).map(s => (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: C.muted }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRESENCE_STYLES[s].dot }} />
                  {counts[s]}
                </span>
              ))}
            </div>
            <button type="button" style={linkBtn} onClick={onViewAll}>View all</button>
          </div>
        )}
      />
      {roster.length === 0 ? (
        <p style={{ margin: 0, padding: "16px 0", textAlign: "center", color: C.faint, fontSize: 13 }}>
          No colleagues found. Your HR directory will appear here once employees are loaded.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {preview.map(m => {
            const s = PRESENCE_STYLES[m.state];
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 6px" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={m.name} size={36} />
                  <span style={{ position: "absolute", right: -1, bottom: -1, width: 11, height: 11, borderRadius: "50%", background: s.dot, border: "2px solid #fff" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.faint }}>{m.department}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.color, flexShrink: 0 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

const AI_PROMPTS = [
  "How do I claim my WFH stipend?",
  "What's the carry-over leave policy?",
  "When is the next payday?",
];

const AIAssistantCard: React.FC = () => {
  const [value, setValue] = useState("");
  return (
    <Card style={{ background: `linear-gradient(180deg, #fff 0%, ${C.coralBg} 220%)` }}>
      <SectionHead
        title="KagoHC AI"
        subtitle="Ask anything about HR policies, leave, or payroll."
        right={(
          <IconBubble bg={C.coralBg} color={C.coral} size={36}>
            <Sparkles size={16} />
          </IconBubble>
        )}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {AI_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => setValue(p)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: R.md,
              border: `1px solid ${C.line}`,
              background: C.surfaceAlt, color: C.text,
              fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
              transition: "border-color .15s, background .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.coral; e.currentTarget.style.background = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = C.surfaceAlt; }}
          >
            <MessageCircle size={14} color={C.coral} />{p}
          </button>
        ))}
      </div>
      <form
        onSubmit={e => { e.preventDefault(); setValue(""); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 8px 8px 16px", borderRadius: 999,
          background: "#fff", border: `1px solid ${C.line}`,
          boxShadow: SHADOW,
        }}
      >
        <Search size={16} color={C.faint} />
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Ask KagoHC AI…"
          style={{
            flex: 1, border: "none", outline: "none",
            background: "transparent", fontSize: 13.5, color: C.ink,
            padding: "8px 0",
          }}
        />
        <button
          type="submit"
          style={{
            border: "none", cursor: "pointer",
            width: 36, height: 36, borderRadius: "50%",
            background: C.coral, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </Card>
  );
};

type NoticeKind = "POLICY" | "NOTICE" | "ACTION";
const NOTICE_STYLES: Record<NoticeKind, { bg: string; color: string; icon: React.ReactNode }> = {
  POLICY: { bg: C.coralBg,  color: C.coral,  icon: <Pin size={14} /> },
  NOTICE: { bg: C.blueBg,   color: C.blue,   icon: <Megaphone size={14} /> },
  ACTION: { bg: C.amberBg,  color: C.amber,  icon: <Target size={14} /> },
};
const NOTICES: Array<{ kind: NoticeKind; title: string; body: string }> = [
  { kind: "POLICY", title: "New parental leave policy", body: "12 weeks fully paid for all parents, effective July 1." },
  { kind: "NOTICE", title: "Office closed Monday",      body: "Public holiday observance. Remote work optional." },
  { kind: "ACTION", title: "Q2 performance reviews open", body: "Self-assessments due by end of next week." },
];
const MORE_NOTICES: Array<{ kind: NoticeKind; title: string; body: string }> = [
  { kind: "NOTICE", title: "Parking garage maintenance", body: "Levels B2–B3 closed this weekend; plan alternate parking." },
  { kind: "ACTION", title: "Confirm emergency contacts", body: "HR requires an update in People — complete by Friday COB." },
  { kind: "POLICY", title: "Travel & per diem refresh", body: "Domestic nightly cap updated; see Finance policy hub." },
  { kind: "NOTICE", title: "IT security awareness drill", body: "Simulated phishing exercise runs next Thursday — stay alert." },
];
const ALL_NOTICES = [...NOTICES, ...MORE_NOTICES];

const CompanyNoticesCard: React.FC<{ onViewAll: () => void }> = ({ onViewAll }) => (
  <Card>
    <SectionHead
      title="Company notices"
      right={<button type="button" style={linkBtn} onClick={onViewAll}>All notices</button>}
    />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
      {NOTICES.map((n, i) => {
        const s = NOTICE_STYLES[n.kind];
        return (
          <div key={i} style={{
            border: `1px solid ${C.line}`, borderRadius: R.lg,
            padding: 16, background: C.surfaceAlt,
          }}>
            <StatusPill bg={s.bg} color={s.color}>{s.icon}{n.kind}</StatusPill>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginTop: 10 }}>{n.title}</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{n.body}</div>
          </div>
        );
      })}
    </div>
  </Card>
);

type BirthdayEntryLike = BirthdayEntry;

type AppEvent = { icon: React.ReactNode; bg: string; color: string; title: string; when: string };

function buildAllEvents(birthdays: BirthdayEntryLike[]): AppEvent[] {
  return [
    ...birthdays.map<AppEvent>(b => ({
      icon: <Cake size={18} />, bg: C.pinkBg, color: C.pink,
      title: `${b.name}'s birthday`,
      when: b.daysUntil === 0 ? "Today" : b.daysUntil === 1 ? "Tomorrow" : `In ${b.daysUntil} days`,
    })),
    { icon: <Users size={18} />, bg: C.blueBg, color: C.blue, title: "All-hands meeting", when: "Fri · 3:00 PM" },
    { icon: <GraduationCap size={18} />, bg: C.purpleBg, color: C.purple, title: "Leadership workshop", when: "Next Mon" },
    { icon: <Calendar size={18} />, bg: C.greenBg, color: C.green, title: "Benefits enrollment window", when: "Jun 15 · 5:00 PM" },
    { icon: <Cake size={18} />, bg: C.amberBg, color: C.amber, title: "Company anniversary lunch", when: "Jul 3 · 12:30 PM" },
    { icon: <Video size={18} />, bg: C.coralBg, color: C.coral, title: "Remote work policy webinar", when: "Jul 18 · 10:00 AM" },
  ];
}

const UpcomingEventsCard: React.FC<{ birthdays: BirthdayEntryLike[]; onViewAll: () => void }> = ({ birthdays, onViewAll }) => {
  const events = buildAllEvents(birthdays).slice(0, 4);
  return (
    <Card>
      <SectionHead title="Upcoming events" right={<button type="button" style={linkBtn} onClick={onViewAll}>View all</button>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((e, i) => (
          <div key={`${e.title}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconBubble bg={e.bg} color={e.color}>{e.icon}</IconBubble>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.title}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{e.when}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const SimpleModal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  const useEffect = React.useEffect;
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: "fixed", inset: 0, zIndex: 5000,
        background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kg-modal-title"
        style={{
          background: C.surface, borderRadius: R.xl,
          maxWidth: 560, width: "100%", maxHeight: "88vh",
          overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 25px 80px rgba(0,0,0,0.18)",
        }}
        onClick={e => { e.stopPropagation(); }}
      >
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 id="kg-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "transparent", fontSize: 26, lineHeight: 1, cursor: "pointer", color: C.muted }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
};

const EmployeeDashboardBody: React.FC<Props> = ({
  mode,
  user,
  today,
  stats,
  balances,
  activeLeave,
  recentLeaves,
  teamOnLeave,
  birthdays,
  colleagues,
  loading,
  error,
  clockIn,
  clockOut,
}) => {
  const navigate = useNavigate();

  const [modal, setModal] = useState<null | "events" | "notices" | "directory">(null);

  const teammateRoster = useMemo(
    () => buildTeammateRoster(
      colleagues,
      teamOnLeave as any,
      user?.email,
      user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : undefined,
    ),
    [colleagues, teamOnLeave, user],
  );

  const onLeave = !!activeLeave || today.status === "leave";
  const canClock = mode === "employee";
  const canApplyLeave = mode === "employee";

  // Align leave stats / history with the same leave API mapping used by apps/employee/leave.tsx
  // (EmployeeDashboardBody currently relies on useEmployeeData's inferred balances/history).
  // For now, reuse the exact leave data produced by useEmployeeData (recentLeaves/balances)
  // and only role-gate the CTA/controls.

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div style={{ width: 42, height: 42, border: `4px solid ${C.line}`, borderTopColor: C.coral, borderRadius: "50%", animation: "kgSpin .8s linear infinite" }} />
        <style>{`@keyframes kgSpin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: C.faint, fontSize: 14, margin: 0 }}>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{mode === "employee" ? "Employee Dashboard" : `${mode[0].toUpperCase()}${mode.slice(1)} Dashboard`} | Kago HC</title>
      </Helmet>

      <style>{`
        .kg-stats-grid   { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .kg-actions-grid { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .kg-leave-grid   { display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .kg-row          { display: grid; gap: 20px; margin-bottom: 22px; }
        .kg-row-hero     { grid-template-columns: 1fr; }
        .kg-row-pulse    { grid-template-columns: 1fr; }
        .kg-row-trio     { grid-template-columns: 1fr; }
        .kg-row-pair     { grid-template-columns: 1fr; }
        @media (max-width: 420px) {
          .kg-stats-grid,
          .kg-leave-grid   { grid-template-columns: 1fr; }
          .kg-actions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1100px) {
          .kg-stats-grid   { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .kg-row-hero     { grid-template-columns: 2fr 1fr; }
          .kg-row-pulse    { grid-template-columns: 2fr 1fr; }
          .kg-row-trio     { grid-template-columns: 1fr 1fr 1fr; }
          .kg-row-pair     { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1500px) {
          .kg-actions-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", marginBottom: 18,
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: R.md,
          }}>
            <AlertCircle size={18} color={C.bad} />
            <span style={{ fontSize: 13, color: "#b42318" }}>{error}</span>
          </div>
        )}

        <GreetingHeader user={user} onLeave={onLeave} />

        <div className="kg-row kg-row-hero">
          <TodaysSessionCard
            today={today}
            canClock={canClock}
            onClockIn={clockIn}
            onClockOut={clockOut}
            location={typeof user?.department === "object" ? (user?.department as any)?.name : (user?.department as any) || "KagoHC HQ"}
          />
          <StreakCard rate={stats.rate || 92} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <StatsGrid balances={balances} today={today} stats={stats} teamOnLeaveCount={(teamOnLeave as any[]).length} />
        </div>

        <div className="kg-row kg-row-pulse">
          <ProductivityPulseCard todayHours={today.work_hours} />
          <QuickActionsCard />
        </div>

        <div className="kg-row kg-row-trio">
          <TimeOffCard
            balances={balances}
            recent={recentLeaves}
            canApplyLeave={canApplyLeave}
            onApplyLeave={() => navigate("/employee/leave")}
          />
          <WhosAroundCard
            roster={teammateRoster}
            onViewAll={() => setModal("directory")}
          />
          <AIAssistantCard />
        </div>

        <div className="kg-row kg-row-pair">
          <UpcomingEventsCard birthdays={birthdays} onViewAll={() => setModal("events")} />
          <CompanyNoticesCard onViewAll={() => setModal("notices")} />
        </div>

        <SimpleModal open={modal === "events"} title="Upcoming events" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {buildAllEvents(birthdays).map((e, i) => (
              <div key={`${e.title}-${e.when}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IconBubble bg={e.bg} color={e.color}>{e.icon}</IconBubble>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{e.title}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{e.when}</div>
                </div>
              </div>
            ))}
          </div>
        </SimpleModal>

        <SimpleModal open={modal === "notices"} title="All company notices" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ALL_NOTICES.map((n, i) => {
              const s = NOTICE_STYLES[n.kind];
              return (
                <div key={`${n.title}-${i}`} style={{ border: `1px solid ${C.line}`, borderRadius: R.lg, padding: 16, background: C.surfaceAlt }}>
                  <StatusPill bg={s.bg} color={s.color}>{s.icon}{n.kind}</StatusPill>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 10 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                </div>
              );
            })}
          </div>
        </SimpleModal>

        <SimpleModal open={modal === "directory"} title="Who’s around — full directory" onClose={() => setModal(null)}>
          {teammateRoster.length === 0 ? (
            <p style={{ margin: 0, color: C.faint, fontSize: 14 }}>No colleagues to show.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {teammateRoster.map(m => {
                const s = PRESENCE_STYLES[m.state];
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Avatar name={m.name} size={40} />
                      <span style={{ position: "absolute", right: -1, bottom: -1, width: 12, height: 12, borderRadius: "50%", background: s.dot, border: "2px solid #fff" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: C.faint }}>{m.department}</div>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </SimpleModal>

        <p style={{ textAlign: "center", color: C.faint, fontSize: 12.5, margin: "8px 0 24px" }}>
          KagoHC · Crafted for happier teams
        </p>
      </div>
    </>
  );
};

export default EmployeeDashboardBody;
