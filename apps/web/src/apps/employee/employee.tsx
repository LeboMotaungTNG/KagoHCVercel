import React, { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import {
  Users, Calendar, ChevronRight,
  Award, Target, Clock,
  FileText, TrendingUp, MapPin, Mail, Phone,
  AlertCircle, CheckCircle, UserCheck,
} from "lucide-react";
import SharedLayout from "./SharedLayout";

// =============================================================================
// CONFIG
// =============================================================================
const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

// =============================================================================
// HELPERS
// =============================================================================
const pad2 = (n: number) => String(n).padStart(2, "0");

function toLocalDateStr(raw: string | Date): string {
  const d = typeof raw === "string" ? new Date(raw) : raw;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function todayISO(): string { return toLocalDateStr(new Date()); }

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 18) return "Good Afternoon";
  return "Good Evening";
};
const getMonthYear = (date = new Date()) =>
  date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

function fmtTime(raw: string | null | undefined): string {
  if (!raw) return "--:--";
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    const h = d.getHours(), m = d.getMinutes();
    return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
  }
  return raw;
}

function daysBetween(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}
function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${new Date(start).toLocaleDateString("en-ZA", opts)} – ${new Date(end).toLocaleDateString("en-ZA", { ...opts, year: "numeric" })}`;
}
function daysRemaining(end: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((new Date(end).getTime() - today.getTime()) / 86400000));
}
function daysUntilBirthday(dob: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const bDay = new Date(dob);
  const next = new Date(today.getFullYear(), bDay.getMonth(), bDay.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}
function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_PALETTE = [
  "#E6A79E","#7DC695","#6B96E1","#F096C3","#8b5cf6",
  "#f59e0b","#10b981","#3b82f6","#0891b2","#db2777",
];
function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length];
}

// =============================================================================
// TYPES
// =============================================================================
interface UserProfile { firstName: string; lastName: string; email: string; position?: string; department?: string | { name: string }; phone?: string; joinDate?: string; }
interface TodayAttendance { status: string | null; clock_in: string | null; clock_out: string | null; work_hours: number | null; }
interface LeaveRecord { id: string; type: string; start_date: string; end_date: string; status: "approved" | "pending" | "rejected"; days: number; }
interface LeaveBalance { type: string; used: number; total: number; color: string; }
interface AttendanceStats { rate: number; present: number; late: number; total: number; }
interface BirthdayEntry { name: string; dob: string; department: string; daysUntil: number; }
interface TeamOnLeave { name: string; type: string; end_date: string; daysLeft: number; department: string; }

// =============================================================================
// STYLE TOKENS
// =============================================================================
const STATUS_DOT: Record<string, string> = {
  present:"#10b981",absent:"#ef4444",late:"#f59e0b",
  leave:"#3b82f6",holiday:"#8b5cf6",half_day:"#f97316",
};
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  present:  { bg:"#ecfdf3", color:"#027a48", label:"Present" },
  absent:   { bg:"#fef2f2", color:"#b42318", label:"Absent" },
  late:     { bg:"#fffaeb", color:"#b54708", label:"Late" },
  leave:    { bg:"#eff6ff", color:"#1d4ed8", label:"On Leave" },
  holiday:  { bg:"#f5f3ff", color:"#6d28d9", label:"Holiday" },
  half_day: { bg:"#fff7ed", color:"#c2410c", label:"Half Day" },
};
const LEAVE_COLORS = ["#E6A79E","#7DC695","#6B96E1","#F096C3","#8b5cf6"];
const CARD: React.CSSProperties = {
  backgroundColor:"white", borderRadius:16, padding:24,
  boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #f0f2f5",
};

// =============================================================================
// SHARED SUB-COMPONENTS
// =============================================================================
const Avatar = ({ name, size = 38 }: { name: string; size?: number }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, background:avatarColor(name), display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, color:"#fff" }}>
    {getInitials(name)}
  </div>
);

const CardHeader = ({ icon, iconBg, iconColor, title, badge }: { icon: React.ReactNode; iconBg: string; iconColor: string; title: string; badge?: number }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:38, height:38, borderRadius:10, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", color:iconColor }}>{icon}</div>
      <h3 style={{ fontSize:15, fontWeight:700, color:"#1d2939", margin:0 }}>{title}</h3>
    </div>
    {badge !== undefined && (
      <span style={{ fontSize:12, fontWeight:700, color:iconColor, background:iconBg, borderRadius:20, padding:"3px 10px" }}>{badge}</span>
    )}
  </div>
);

// =============================================================================
// ON-LEAVE BANNER (my own leave)
// =============================================================================
const OnLeaveBanner = ({ leave }: { leave: LeaveRecord }) => {
  const remaining = daysRemaining(leave.end_date);
  const total = daysBetween(leave.start_date, leave.end_date);
  const pct = Math.min(100, total > 0 ? ((total - remaining) / total) * 100 : 0);
  return (
    <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #bfdbfe", borderRadius:16, padding:"20px 24px", marginBottom:24, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <div style={{ width:48, height:48, borderRadius:12, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Calendar size={24} color="white" />
      </div>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ background:"#3b82f6", color:"#fff", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700, textTransform:"uppercase" }}>On Leave</span>
          <span style={{ fontSize:14, fontWeight:600, color:"#1e40af" }}>{leave.type}</span>
        </div>
        <p style={{ margin:"0 0 8px", fontSize:13, color:"#1d4ed8" }}>{formatDateRange(leave.start_date, leave.end_date)} · {total} day{total!==1?"s":""}</p>
        <div style={{ height:6, background:"#bfdbfe", borderRadius:99, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"#3b82f6", borderRadius:99 }} />
        </div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <p style={{ margin:"0 0 2px", fontSize:11, color:"#60a5fa", textTransform:"uppercase", fontWeight:700 }}>Returns in</p>
        <p style={{ margin:0, fontSize:28, fontWeight:800, color:"#1e40af", letterSpacing:-1 }}>{remaining} <span style={{ fontSize:14, fontWeight:500 }}>day{remaining!==1?"s":""}</span></p>
      </div>
    </div>
  );
};

// =============================================================================
// WHO'S ON LEAVE TODAY  ← NEW
// =============================================================================
const TeamOnLeaveCard = ({ team }: { team: TeamOnLeave[] }) => (
  <div style={CARD}>
    <CardHeader icon={<UserCheck size={18}/>} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6" title="Team on Leave Today" badge={team.length} />
    {team.length === 0 ? (
      <div style={{ textAlign:"center", padding:"28px 0", color:"#9ca3af", fontSize:13 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
        Everyone is in today!
      </div>
    ) : (
      <>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {team.map((m, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:12, background:"#f9fafb", border:"1px solid #f0f2f5" }}>
              <Avatar name={m.name} size={38} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#1d2939", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</p>
                <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{m.department}</p>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <span style={{ display:"block", fontSize:11, fontWeight:700, background:"#eff6ff", color:"#1d4ed8", borderRadius:20, padding:"2px 8px", marginBottom:3 }}>{m.type}</span>
                <span style={{ fontSize:11, color: m.daysLeft <= 1 ? "#10b981" : "#9ca3af" }}>
                  {m.daysLeft === 0 ? "Back tomorrow" : `${m.daysLeft}d left`}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Earliest return date summary */}
        <div style={{ marginTop:14, padding:"10px 14px", background:"#f0f9ff", borderRadius:10, border:"1px solid #bae6fd", display:"flex", justifyContent:"space-between", fontSize:13 }}>
          <span style={{ color:"#0369a1" }}>Earliest return</span>
          <span style={{ fontWeight:700, color:"#0c4a6e" }}>
            {new Date(Math.min(...team.map(t => new Date(t.end_date).getTime())))
              .toLocaleDateString("en-ZA",{day:"numeric",month:"short",year:"numeric"})}
          </span>
        </div>
      </>
    )}
  </div>
);

// =============================================================================
// UPCOMING BIRTHDAYS  ← NEW
// =============================================================================
const UpcomingBirthdaysCard = ({ birthdays }: { birthdays: BirthdayEntry[] }) => {
  const todayBdays = birthdays.filter(b => b.daysUntil === 0);
  const upcoming   = birthdays.filter(b => b.daysUntil > 0);

  return (
    <div style={CARD}>
      <CardHeader icon={<span style={{fontSize:18}}>🎂</span>} iconBg="rgba(236,72,153,0.1)" iconColor="#db2777" title="Upcoming Birthdays" badge={birthdays.length || undefined} />

      {birthdays.length === 0 ? (
        <div style={{ textAlign:"center", padding:"28px 0", color:"#9ca3af", fontSize:13 }}>
          No birthdays in the next 30 days.
        </div>
      ) : (
        <>
          {/* Today's birthdays */}
          {todayBdays.map((b, i) => (
            <div key={`td-${i}`} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, padding:"12px 14px", borderRadius:14, background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a" }}>
              <Avatar name={b.name} size={44} />
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#92400e" }}>{b.name}</p>
                <p style={{ margin:0, fontSize:11, color:"#b45309" }}>{b.department}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:28 }}>🎂</div>
                <p style={{ margin:"2px 0 0", fontSize:11, fontWeight:700, color:"#b45309" }}>Today!</p>
              </div>
            </div>
          ))}

          {/* Upcoming */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {upcoming.map((b, i) => {
              const isThisWeek = b.daysUntil <= 7;
              const chip = b.daysUntil === 1
                ? { text:"Tomorrow",  bg:"#f5f3ff", color:"#7c3aed" }
                : isThisWeek
                ? { text:`In ${b.daysUntil} days`, bg:"#eff6ff", color:"#1d4ed8" }
                : { text:`In ${b.daysUntil} days`, bg:"#f9fafb", color:"#374151" };

              // Show birthday date (this year)
              const bDate = new Date(b.dob);
              const thisYear = new Date(new Date().getFullYear(), bDate.getMonth(), bDate.getDate());
              const dateLabel = thisYear.toLocaleDateString("en-ZA",{day:"numeric",month:"short"});

              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", borderRadius:12, background: isThisWeek ? "#faf5ff" : "#f9fafb", border:`1px solid ${isThisWeek ? "#e9d5ff" : "#f0f2f5"}` }}>
                  <Avatar name={b.name} size={36} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#1d2939", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</p>
                    <p style={{ margin:0, fontSize:11, color:"#9ca3af" }}>{b.department}</p>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <span style={{ display:"block", fontSize:11, fontWeight:700, background:chip.bg, color:chip.color, borderRadius:20, padding:"2px 8px", marginBottom:2 }}>{chip.text}</span>
                    <span style={{ fontSize:11, color:"#9ca3af" }}>{dateLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// METRICS
// =============================================================================
const MetricsCards = ({ stats, leaveBalance, todayStatus }: { stats: AttendanceStats; leaveBalance: LeaveBalance[]; todayStatus: TodayAttendance }) => {
  const totalLeave = leaveBalance.reduce((a, b) => a + (b.total - b.used), 0);
  const badge = todayStatus.status ? STATUS_BADGE[todayStatus.status] : null;
  const cards = [
    { title:"Attendance Rate", count:`${stats.rate}%`,   color:"#E6A79E", icon:<Clock size={22} color="white"/>,     sub:`${stats.present} present · ${stats.late} late` },
    { title:"Leave Balance",   count:`${totalLeave}d`,   color:"#7DC695", icon:<Calendar size={22} color="white"/>,  sub:"days remaining" },
    { title:"Today's Status",  count: badge?.label ?? "Not Recorded", color: todayStatus.status ? STATUS_DOT[todayStatus.status] : "#9ca3af", icon:<Target size={22} color="white"/>, sub: todayStatus.clock_in ? `In: ${fmtTime(todayStatus.clock_in)}` : "No clock-in yet" },
    { title:"Hours This Month",count: todayStatus.work_hours != null ? `${todayStatus.work_hours.toFixed(1)}h` : "0h", color:"#6B96E1", icon:<TrendingUp size={22} color="white"/>, sub:"today's session" },
  ];
  return (
    <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
      {cards.map((c,i)=>(
        <div key={i} style={{ flex:"1", backgroundColor:c.color, borderRadius:14, padding:"20px 22px", minWidth:180, color:"white", transition:"transform 0.18s,box-shadow 0.18s", cursor:"default" }}
          onMouseOver={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 10px 24px rgba(0,0,0,0.15)";}}
          onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:600, opacity:0.9 }}>{c.title}</span>{c.icon}
          </div>
          <div style={{ fontSize:36, fontWeight:800, letterSpacing:-1 }}>{c.count}</div>
          <div style={{ fontSize:12, opacity:0.75, marginTop:4 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// PROFILE CARD
// =============================================================================
const ProfileSummaryCard = ({ user }: { user: UserProfile }) => {
  const initials = `${user.firstName?.[0]??""}${user.lastName?.[0]??""}`.toUpperCase() || "?";
  const dept = typeof user.department === "object" ? user.department?.name : user.department;
  const joined = user.joinDate ? new Date(user.joinDate).toLocaleDateString("en-ZA",{month:"long",year:"numeric"}) : "—";
  return (
    <div style={CARD}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"rgba(230,167,158,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#E6A79E" }}><Users size={19}/></div>
          <h3 style={{ fontSize:15, fontWeight:700, color:"#1d2939", margin:0 }}>Profile Summary</h3>
        </div>
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#ecfdf3", color:"#027a48", borderRadius:20, padding:"3px 11px", fontSize:12, fontWeight:600 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#12b76a" }}/>Active
        </span>
      </div>
      <div style={{ display:"flex", gap:20 }}>
        <div style={{ width:76, height:76, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#e4e7ec,#f2f4f7)", border:"3px solid #E6A79E", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:26, color:"#1d2939", boxShadow:"0 0 0 4px rgba(230,167,158,0.15)" }}>{initials}</div>
        <div style={{ flex:1 }}>
          <h4 style={{ fontSize:18, fontWeight:700, color:"#1d2939", margin:"0 0 2px" }}>{user.firstName} {user.lastName}</h4>
          <p style={{ fontSize:13, color:"#667085", margin:"0 0 14px" }}>{user.position||"—"}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              {icon:<MapPin size={14} color="#E6A79E"/>,text:dept||"—"},
              {icon:<Mail size={14} color="#E6A79E"/>,text:user.email},
              {icon:<Phone size={14} color="#E6A79E"/>,text:user.phone||"—"},
              {icon:<Calendar size={14} color="#E6A79E"/>,text:`Joined ${joined}`},
            ].map(({icon,text},i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:"#667085" }}>
                {icon}<span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ATTENDANCE TODAY
// =============================================================================
const AttendanceTodayCard = ({ today }: { today: TodayAttendance }) => {
  const badge = today.status ? STATUS_BADGE[today.status] : null;
  const isActive = today.status === "present" || today.status === "late";
  return (
    <div style={CARD}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"rgba(125,198,149,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7DC695" }}><Clock size={19}/></div>
          <h3 style={{ fontSize:15, fontWeight:700, color:"#1d2939", margin:0 }}>Attendance Today</h3>
        </div>
        {badge
          ? <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:badge.bg, color:badge.color, borderRadius:20, padding:"3px 11px", fontSize:12, fontWeight:700 }}><span style={{ width:6, height:6, borderRadius:"50%", background:badge.color }}/>{badge.label}</span>
          : <span style={{ fontSize:12, color:"#9ca3af", fontWeight:600 }}>Not Recorded</span>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, background:"#f9fafb", borderRadius:12, border:"1px solid #f0f2f5", padding:18, marginBottom:18 }}>
        {[
          {label:"Clock In",   value:fmtTime(today.clock_in),  color:"#10b981"},
          {label:"Clock Out",  value:fmtTime(today.clock_out), color:"#ef4444"},
          {label:"Hours Worked",value:today.work_hours!=null?`${today.work_hours.toFixed(2)}h`:"--",color:"#1d2939"},
          {label:"Status",value:badge?.label??"—",color:badge?.color??"#9ca3af"},
        ].map(({label,value,color})=>(
          <div key={label}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"#9ca3af", marginBottom:6, letterSpacing:0.5 }}>{label}</div>
            <div style={{ fontSize:20, fontWeight:800, color, fontVariantNumeric:"tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>
      {isActive && !today.clock_out && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#ecfdf3", borderRadius:10, border:"1px solid #a7f3d0" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#10b981", flexShrink:0 }}/>
          <span style={{ fontSize:13, color:"#065f46", fontWeight:600 }}>Session in progress</span>
        </div>
      )}
      {today.status === "leave" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#eff6ff", borderRadius:10, border:"1px solid #bfdbfe" }}>
          <Calendar size={16} color="#3b82f6"/>
          <span style={{ fontSize:13, color:"#1e40af", fontWeight:600 }}>You are on approved leave today</span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// LEAVE OVERVIEW
// =============================================================================
const LeaveOverviewCard = ({ balances, activeLeave, recentLeaves }: { balances:LeaveBalance[]; activeLeave:LeaveRecord|null; recentLeaves:LeaveRecord[] }) => (
  <div style={CARD}>
    <CardHeader icon={<Calendar size={18}/>} iconBg="rgba(230,167,158,0.12)" iconColor="#E6A79E" title="My Leave" />
    {activeLeave && (
      <div style={{ marginBottom:16, padding:"12px 14px", background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #bfdbfe", borderRadius:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <span style={{ fontSize:11, fontWeight:700, color:"#3b82f6", textTransform:"uppercase" }}>Currently on leave</span>
            <p style={{ margin:"2px 0 0", fontSize:13, fontWeight:600, color:"#1e40af" }}>{activeLeave.type} · {formatDateRange(activeLeave.start_date,activeLeave.end_date)}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ margin:0, fontSize:22, fontWeight:800, color:"#1e40af" }}>{daysRemaining(activeLeave.end_date)}</p>
            <p style={{ margin:0, fontSize:11, color:"#60a5fa" }}>days left</p>
          </div>
        </div>
      </div>
    )}
    {balances.length===0
      ? <p style={{ fontSize:13, color:"#9ca3af", textAlign:"center", padding:"16px 0" }}>No leave balance data</p>
      : balances.map((l,i)=>(
        <div key={i} style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:600, color:"#1d2939" }}>{l.type}</span>
            <span style={{ fontSize:13, color:l.color, fontWeight:700 }}>{l.total-l.used} days left</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#9ca3af", marginBottom:5 }}>
            <span>{l.used} used</span><span>{l.total} total</span>
          </div>
          <div style={{ height:6, background:"#f0f2f5", borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:`${l.total?(l.used/l.total)*100:0}%`, height:"100%", background:l.color, borderRadius:99 }}/>
          </div>
        </div>
      ))}
    {recentLeaves.length>0 && (
      <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #f0f2f5" }}>
        <p style={{ fontSize:11, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Recent Requests</p>
        {recentLeaves.slice(0,3).map((l,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div>
              <span style={{ fontSize:12, fontWeight:600, color:"#344054" }}>{l.type}</span>
              <span style={{ fontSize:11, color:"#9ca3af", marginLeft:6 }}>{formatDateRange(l.start_date,l.end_date)}</span>
            </div>
            <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10, background:l.status==="approved"?"#ecfdf3":l.status==="pending"?"#fffaeb":"#fef2f2", color:l.status==="approved"?"#027a48":l.status==="pending"?"#b54708":"#b42318" }}>{l.status}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// =============================================================================
// PAYROLL
// =============================================================================
const PayrollSummaryCard = () => (
  <div style={CARD}>
    <CardHeader icon={<FileText size={18}/>} iconBg="rgba(125,198,149,0.12)" iconColor="#7DC695" title="Payroll Summary"/>
    <div style={{ padding:"20px 0", textAlign:"center", color:"#9ca3af", fontSize:13 }}>Payroll data not available from API yet.</div>
    <button style={{ width:"100%", padding:"11px 0", borderRadius:25, border:"1px solid #7DC695", background:"transparent", color:"#7DC695", fontSize:13, fontWeight:700, cursor:"pointer" }}>View Payslips</button>
  </div>
);

// =============================================================================
// PERFORMANCE
// =============================================================================
const PerformanceCard = ({ stats }: { stats: AttendanceStats }) => {
  const kpi  = Math.min(100, stats.rate);
  const onTime = stats.total > 0 ? Math.round((stats.present/stats.total)*100) : 0;
  return (
    <div style={CARD}>
      <CardHeader icon={<TrendingUp size={18}/>} iconBg="rgba(107,150,225,0.12)" iconColor="#6B96E1" title="Performance"/>
      {[
        stats.late===0 ? {text:"Zero late arrivals this month.",ok:true} : {text:`${stats.late} late arrival${stats.late>1?"s":""} this month.`,ok:false},
        {text:`${stats.present} days present out of ${stats.total} recorded.`,ok:true},
        {text:"Keep it up — performance review coming next quarter!",ok:true},
      ].map((item,i,arr)=>(
        <div key={i} style={{ display:"flex", gap:10, marginBottom:10, paddingBottom:10, borderBottom:i<arr.length-1?"1px solid #f0f2f5":"none" }}>
          {item.ok ? <CheckCircle size={15} color="#7DC695" style={{ flexShrink:0, marginTop:2 }}/> : <AlertCircle size={15} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }}/>}
          <span style={{ fontSize:13, color:"#344054", lineHeight:1.5 }}>{item.text}</span>
        </div>
      ))}
      <div style={{ padding:"12px 14px", background:"#f9fafb", borderRadius:10, marginTop:4 }}>
        {[{label:"Attendance score",value:`${kpi}%`,color:"#6B96E1",pct:kpi},{label:"On-time rate",value:`${onTime}%`,color:"#10b981",pct:onTime}].map(({label,value,color,pct},i)=>(
          <div key={i} style={{ marginBottom:i===0?12:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:"#667085" }}>{label}</span>
              <span style={{ fontSize:16, fontWeight:800, color }}>{value}</span>
            </div>
            <div style={{ height:6, background:"#f0f2f5", borderRadius:99, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99 }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN
// =============================================================================
const EmployeeDashboard = () => {
  const [user, setUser]                     = useState<UserProfile | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({ status:null, clock_in:null, clock_out:null, work_hours:null });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ rate:0, present:0, late:0, total:0 });
  const [leaveBalances, setLeaveBalances]   = useState<LeaveBalance[]>([]);
  const [activeLeave, setActiveLeave]       = useState<LeaveRecord | null>(null);
  const [recentLeaves, setRecentLeaves]     = useState<LeaveRecord[]>([]);
  const [teamOnLeave, setTeamOnLeave]       = useState<TeamOnLeave[]>([]);
  const [birthdays, setBirthdays]           = useState<BirthdayEntry[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const H = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };

  const fetchProfile = useCallback(async () => {
    try {
      const d = await fetch(`${API_URL}/auth/me`,{headers:H}).then(r=>r.json());
      const u = d.data||d.user||d;
      if (u?.firstName||u?.email) setUser({ firstName:u.firstName||"", lastName:u.lastName||"", email:u.email||"", position:u.position||"", department:u.department, phone:u.phone||u.phoneNumber||"", joinDate:u.joinDate||u.createdAt||"" });
    } catch { try { const s=localStorage.getItem("user"); if(s) setUser(JSON.parse(s)); } catch {} }
  },[token]);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const d = await fetch(`${API_URL}/attendance/today`,{headers:H}).then(r=>r.json());
      const rec = d.data||d;
      if (rec&&typeof rec==="object"&&!Array.isArray(rec)) {
        const fmt = (raw:string|null|undefined)=>{ if(!raw)return null; if(/^\d{2}:\d{2}/.test(raw))return raw.slice(0,5); const x=new Date(raw); return isNaN(x.getTime())?null:`${pad2(x.getHours())}:${pad2(x.getMinutes())}`; };
        setTodayAttendance({ status:rec.status||null, clock_in:fmt(rec.clockInTime||rec.clock_in), clock_out:fmt(rec.clockOutTime||rec.clock_out), work_hours:rec.totalHours||rec.hours_worked||rec.work_hours||null });
      }
    } catch(e){ console.warn(e); }
  },[token]);

  const fetchAttendanceStats = useCallback(async () => {
    try {
      const d = await fetch(`${API_URL}/attendance`,{headers:H}).then(r=>r.json());
      let records:any[] = d.data?.data??( Array.isArray(d.data)?d.data:(Array.isArray(d)?d:[]));
      const now=new Date();
      const month=records.filter((r:any)=>{ const ds=r.date?toLocalDateStr(r.date):""; if(!ds)return false; const x=new Date(ds); return x.getMonth()===now.getMonth()&&x.getFullYear()===now.getFullYear(); });
      const present=month.filter((r:any)=>r.status==="present"||r.status==="half_day").length;
      const late=month.filter((r:any)=>r.status==="late").length;
      const total=month.length;
      setAttendanceStats({ present, late, total, rate:total>0?Math.round(((present+late)/total)*100):0 });
    } catch(e){ console.warn(e); }
  },[token]);

  const fetchLeaveData = useCallback(async () => {
    try {
      const d = await fetch(`${API_URL}/leaves`,{headers:H}).then(r=>r.json());
      let leaves:any[] = Array.isArray(d.data)?d.data:(Array.isArray(d)?d:(d.data?.data??[]));
      const today=todayISO();
      const mapped:LeaveRecord[] = leaves.map((l:any,i:number)=>({
        id:l._id||l.id||String(i),
        type:l.leaveType||l.type||l.leave_type||"Leave",
        start_date:toLocalDateStr(l.startDate||l.start_date||today),
        end_date:toLocalDateStr(l.endDate||l.end_date||today),
        status:l.status||"pending",
        days:l.numberOfDays||l.days||daysBetween(toLocalDateStr(l.startDate||l.start_date||today),toLocalDateStr(l.endDate||l.end_date||today)),
      }));
      setActiveLeave(mapped.find(l=>l.status==="approved"&&l.start_date<=today&&l.end_date>=today)||null);
      setRecentLeaves([...mapped].sort((a,b)=>b.start_date.localeCompare(a.start_date)));

      // balances
      try {
        const bd=await fetch(`${API_URL}/leaves/balance`,{headers:H}).then(r=>r.json());
        const ba=Array.isArray(bd.data)?bd.data:(Array.isArray(bd)?bd:null);
        if(ba?.length){ setLeaveBalances(ba.map((b:any,i:number)=>({type:b.leaveType||b.type||"Leave",used:b.used||b.usedDays||0,total:b.total||b.totalDays||b.allowance||20,color:LEAVE_COLORS[i%LEAVE_COLORS.length]}))); return; }
      } catch {}

      const tm:Record<string,number>={};
      mapped.filter(l=>l.status==="approved").forEach(l=>{ tm[l.type]=(tm[l.type]||0)+l.days; });
      const bal=Object.entries(tm).map(([type,used],i)=>({type,used,total:Math.max(used,20),color:LEAVE_COLORS[i%LEAVE_COLORS.length]}));
      setLeaveBalances(bal.length?bal:[{type:"Annual Leave",used:0,total:20,color:LEAVE_COLORS[0]},{type:"Sick Leave",used:0,total:10,color:LEAVE_COLORS[1]}]);
    } catch(e){
      console.warn(e);
      setLeaveBalances([{type:"Annual Leave",used:0,total:20,color:LEAVE_COLORS[0]},{type:"Sick Leave",used:0,total:10,color:LEAVE_COLORS[1]}]);
    }
  },[token]);

  const fetchEmployeeData = useCallback(async () => {
    // --- birthdays from employee list ---
    try {
      const d = await fetch(`${API_URL}/employees`,{headers:H}).then(r=>r.json());
      let emps:any[] = Array.isArray(d.data)?d.data:(d.data?.data??( Array.isArray(d)?d:[]));
      const bdList:BirthdayEntry[] = emps
        .filter((e:any)=>e.dateOfBirth||e.dob||e.birthDate)
        .map((e:any)=>{
          const dob=e.dateOfBirth||e.dob||e.birthDate;
          const dept=typeof e.department==="object"?e.department?.name:e.department||"—";
          return { name:`${e.firstName||""} ${e.lastName||""}`.trim()||e.full_name||"Unknown", dob, department:dept, daysUntil:daysUntilBirthday(dob) };
        })
        .filter(b=>b.daysUntil<=30)
        .sort((a,b)=>a.daysUntil-b.daysUntil);
      setBirthdays(bdList);
    } catch(e){ console.warn("birthdays:",e); }

    // --- who's on leave today from attendance ---
    try {
      const d = await fetch(`${API_URL}/attendance`,{headers:H}).then(r=>r.json());
      let records:any[] = d.data?.data??(Array.isArray(d.data)?d.data:(Array.isArray(d)?d:[]));
      const today=todayISO();
      const onLeave:TeamOnLeave[] = records
        .filter((r:any)=>{ const ds=r.date?toLocalDateStr(r.date):""; return ds===today&&r.status==="leave"; })
        .map((r:any)=>{
          const name=r.employee_name||r.full_name||`${r.firstName||""} ${r.lastName||""}`.trim()||"Employee";
          const dept=typeof r.department==="object"?r.department?.name:r.department||"—";
          const endRaw=r.endDate||r.end_date||today;
          const end=toLocalDateStr(endRaw);
          return { name, type:r.leaveType||r.leave_type||"Leave", end_date:end, daysLeft:daysRemaining(end), department:dept };
        });
      setTeamOnLeave(onLeave);
    } catch(e){ console.warn("team leave:",e); }
  },[token]);

  useEffect(()=>{
    try { const s=localStorage.getItem("user"); if(s) setUser(JSON.parse(s)); } catch {}
    Promise.all([fetchProfile(),fetchTodayAttendance(),fetchAttendanceStats(),fetchLeaveData(),fetchEmployeeData()])
      .catch(()=>setError("Some data failed to load."))
      .finally(()=>setLoading(false));
  },[]);

  const firstName = user?.firstName||"there";
  const isOnLeave = !!activeLeave||todayAttendance.status==="leave";

  if(loading) return (
    <SharedLayout>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16 }}>
        <div style={{ width:40, height:40, border:"4px solid #f3f4f6", borderTopColor:"#E6A79E", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:"#9ca3af", fontSize:14 }}>Loading your dashboard…</p>
      </div>
    </SharedLayout>
  );

  return (
    <SharedLayout>
      <Helmet>
        <title>Employee Dashboard | Kago HC</title>
        <meta name="description" content="Kago HC Employee Portal"/>
      </Helmet>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, marginBottom:20 }}>
            <AlertCircle size={18} color="#ef4444"/>
            <span style={{ fontSize:13, color:"#b42318" }}>{error}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:30, margin:"0 0 6px", fontWeight:800, color:"#1d2939", letterSpacing:-0.5 }}>{getGreeting()}, {firstName} {isOnLeave?"🌴":"👋"}</h1>
            <p style={{ fontSize:14, color:"#667085", margin:0 }}>{isOnLeave?"You're currently on leave. Enjoy your time off!":"Welcome back! Here's your work summary for today."}</p>
          </div>
          <div style={{ padding:"8px 18px", borderRadius:25, backgroundColor:"#1a1a1a", color:"white", fontSize:13, fontWeight:600 }}>{getMonthYear()}</div>
        </div>

        {activeLeave && <OnLeaveBanner leave={activeLeave}/>}

        <MetricsCards stats={attendanceStats} leaveBalance={leaveBalances} todayStatus={todayAttendance}/>

        {/* Profile + Attendance */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))", gap:20, marginBottom:20 }}>
          {user && <ProfileSummaryCard user={user}/>}
          <AttendanceTodayCard today={todayAttendance}/>
        </div>

        {/* ← NEW: Who's on leave + Birthdays */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:20, marginBottom:20 }}>
          <TeamOnLeaveCard team={teamOnLeave}/>
          <UpcomingBirthdaysCard birthdays={birthdays}/>
        </div>

        {/* Leave + Payroll + Performance */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:20 }}>
          <LeaveOverviewCard balances={leaveBalances} activeLeave={activeLeave} recentLeaves={recentLeaves}/>
          <PayrollSummaryCard/>
          <PerformanceCard stats={attendanceStats}/>
        </div>
      </div>
    </SharedLayout>
  );
};

export default EmployeeDashboard;
