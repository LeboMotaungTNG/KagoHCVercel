import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
 * Environment
 * ────────────────────────────────────────────────────────────────────────── */
declare global {
  interface ImportMetaEnv { readonly VITE_API_URL?: string }
  interface ImportMeta { readonly env: ImportMetaEnv }
}
export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

/* ─────────────────────────────────────────────────────────────────────────────
 * Design tokens (KagoHC brand)
 * ────────────────────────────────────────────────────────────────────────── */
export const C = {
  coral:    "#E6A79E",
  coralDk:  "#d88a7f",
  coralBg:  "rgba(230,167,158,0.12)",
  green:    "#7DC695",
  greenBg:  "rgba(125,198,149,0.12)",
  blue:     "#6B96E1",
  blueBg:   "rgba(107,150,225,0.12)",
  pink:     "#F096C3",
  pinkBg:   "rgba(240,150,195,0.14)",
  amber:    "#f59e0b",
  amberBg:  "rgba(245,158,11,0.12)",
  purple:   "#8b5cf6",
  purpleBg: "rgba(139,92,246,0.10)",

  ink:      "#1d2939",
  text:     "#344054",
  muted:    "#667085",
  faint:    "#98a2b3",
  line:     "#eef0f3",
  surface:  "#ffffff",
  surfaceAlt:"#f9fafb",

  ok:       "#10b981",
  warn:     "#f59e0b",
  bad:      "#ef4444",
} as const;

export const SHADOW   = "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)";
export const SHADOW_L = "0 10px 30px rgba(216,138,127,0.28)";
export const R        = { sm: 10, md: 14, lg: 18, xl: 22, hero: 28 } as const;
export const FONT_NUM: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */
export interface UserProfile {
  firstName: string; lastName: string; email: string;
  position?: string; department?: string | { name: string };
  phone?: string; joinDate?: string;
}
export interface TodayAttendance {
  status: string | null;
  clock_in: string | null;   // "HH:MM"
  clock_out: string | null;  // "HH:MM"
  work_hours: number | null;
}
export type LeaveStatus = "approved" | "pending" | "rejected";
export interface LeaveRecord {
  id: string; type: string; start_date: string; end_date: string;
  status: LeaveStatus; days: number;
}
export interface LeaveBalance     { type: string; used: number; total: number; color: string }
export interface AttendanceStats  { rate: number; present: number; late: number; total: number }
export interface BirthdayEntry    { name: string; dob: string; department: string; daysUntil: number }
export interface TeamOnLeave      { name: string; type: string; end_date: string; daysLeft: number; department: string }

export type PresenceState = "office" | "remote" | "leave";
export interface Colleague { id: string; name: string; department: string; email?: string }
export interface Teammate  { id: string; name: string; department: string; state: PresenceState; email?: string }

/* ─────────────────────────────────────────────────────────────────────────────
 * Constants
 * ────────────────────────────────────────────────────────────────────────── */
/** Demo directory used when the API returns no rows during a demo session. */
export const DEMO_COLLEAGUES: Colleague[] = [
  { id: "demo-owner",  name: "Olivia Owner",  department: "Executive",       email: "owner@kagohc.com"  },
  { id: "demo-admin",  name: "Adam Admin",    department: "Operations",      email: "admin@kagohc.com"  },
  { id: "demo-mgr",    name: "Mandy Manager", department: "Operations",      email: "manager@kagohc.com"},
  { id: "demo-hr",     name: "Henry HR",      department: "Human Resources", email: "hr@kagohc.com"     },
  { id: "demo-emp",    name: "Emma Employee", department: "People",          email: "employee@kagohc.com" },
];

export const LEAVE_PALETTE = [C.coral, C.green, C.blue, C.pink, C.purple];

export const LEAVE_TYPE_ORDER = [
  "annual", "vacation", "holiday", "sick", "personal", "family", "study", "other",
];

export const PRESENCE_STYLES: Record<PresenceState, { dot: string; label: string; color: string }> = {
  office: { dot: C.ok,    label: "In office", color: C.ok    },
  remote: { dot: C.blue,  label: "Remote",    color: C.blue  },
  leave:  { dot: C.amber, label: "On leave",  color: C.amber },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Date / time / format utilities
 * ────────────────────────────────────────────────────────────────────────── */
export const pad2 = (n: number) => String(n).padStart(2, "0");

export const iso = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
};
export const todayISO = () => iso(new Date());

export const greetingFor = (h = new Date().getHours()) =>
  h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

export const longDate = (d = new Date()) =>
  d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

export const fmtTime = (raw?: string | null) => {
  if (!raw) return "--:--";
  if (/^\d{2}:\d{2}/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m)} ${h >= 12 ? "PM" : "AM"}`;
};

export const fmtHMS = (totalSec: number) => {
  const t = Math.max(0, Math.floor(totalSec));
  return `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t / 60) % 60)}:${pad2(t % 60)}`;
};

export const daysBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1);

export const daysRemaining = (end: string) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((new Date(end).getTime() - t.getTime()) / 86400000));
};

export const daysUntilBirthday = (dob: string) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const b = new Date(dob);
  const next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
  if (next < t) next.setFullYear(t.getFullYear() + 1);
  return Math.round((next.getTime() - t.getTime()) / 86400000);
};

export const fmtDateRange = (a: string, b: string) => {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${new Date(a).toLocaleDateString("en-ZA", opts)} – ${new Date(b).toLocaleDateString("en-ZA", { ...opts, year: "numeric" })}`;
};

export const getInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase() || "?";

const AVATAR_BG = [C.coral, C.green, C.blue, C.pink, C.purple, C.amber];
export const avatarBg = (seed: string) =>
  AVATAR_BG[Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];

/* ─────────────────────────────────────────────────────────────────────────────
 * Network / data helpers
 * ────────────────────────────────────────────────────────────────────────── */
export const safeJson = async (url: string, init?: RequestInit) => {
  try { const r = await fetch(url, init); return r.ok ? r.json() : null; }
  catch { return null; }
};

/** Normalizes `/employees` list shapes from the API. */
export const normalizeEmployeeList = (d: unknown): any[] => {
  if (!d || typeof d !== "object") return [];
  const o = d as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as any[];
  const inner = o.data as Record<string, unknown> | undefined;
  if (inner && Array.isArray(inner.data)) return inner.data as any[];
  if (Array.isArray(o)) return o as any[];
  return [];
};

export const namesRoughlyMatch = (a: string, b: string) => {
  const na = a.toLowerCase().replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (!na || !nb) return false;
  if (na === nb) return true;
  const pa = na.split(" ");
  const pb = nb.split(" ");
  return pa[0] === pb[0] && pa[pa.length - 1] === pb[pb.length - 1];
};

export function teammatePresence(email: string | undefined, id: string): "office" | "remote" {
  const seed = (email || id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return seed % 3 === 0 ? "remote" : "office";
}

export function sortLeaveBalances(list: LeaveBalance[]): LeaveBalance[] {
  return [...list].sort((a, b) => {
    const ai = LEAVE_TYPE_ORDER.findIndex(k => a.type.toLowerCase().includes(k));
    const bi = LEAVE_TYPE_ORDER.findIndex(k => b.type.toLowerCase().includes(k));
    const ao = ai === -1 ? 99 : ai;
    const bo = bi === -1 ? 99 : bi;
    if (ao !== bo) return ao - bo;
    return a.type.localeCompare(b.type);
  });
}

export function buildTeammateRoster(
  colleagues: Colleague[],
  teamOnLeave: TeamOnLeave[],
  currentEmail?: string,
  currentFullName?: string,
): Teammate[] {
  const isSelf = (c: Colleague) => {
    if (currentEmail && c.email && c.email.toLowerCase() === currentEmail.toLowerCase()) return true;
    if (currentFullName && namesRoughlyMatch(currentFullName, c.name)) return true;
    return false;
  };

  const roster: Teammate[] = colleagues
    .filter(c => !isSelf(c))
    .map(c => {
      const onLeave = teamOnLeave.some(t => namesRoughlyMatch(t.name, c.name));
      const state: PresenceState = onLeave ? "leave" : teammatePresence(c.email, c.id);
      return {
        id: c.id,
        name: c.name,
        department: c.department,
        state,
        email: c.email,
      };
    });

  roster.sort((a, b) => a.name.localeCompare(b.name));
  return roster;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Hooks
 * ────────────────────────────────────────────────────────────────────────── */
export function useLiveTick(active: boolean, intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

export function useEmployeeData() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = useMemo<HeadersInit>(
    () => ({ Authorization: `Bearer ${token || ""}`, "Content-Type": "application/json" }),
    [token],
  );

  const [user, setUser]                 = useState<UserProfile | null>(null);
  const [today, setToday]               = useState<TodayAttendance>({ status: null, clock_in: null, clock_out: null, work_hours: null });
  const [stats, setStats]               = useState<AttendanceStats>({ rate: 0, present: 0, late: 0, total: 0 });
  const [balances, setBalances]         = useState<LeaveBalance[]>([]);
  const [activeLeave, setActiveLeave]   = useState<LeaveRecord | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRecord[]>([]);
  const [teamOnLeave, setTeamOnLeave]   = useState<TeamOnLeave[]>([]);
  const [birthdays, setBirthdays]       = useState<BirthdayEntry[]>([]);
  const [colleagues, setColleagues]     = useState<Colleague[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); }
    catch { /* ignore */ }
  }, []);

  const loadProfile = useCallback(async () => {
    const d = await safeJson(`${API_URL}/auth/me`, { headers });
    const u = d?.data || d?.user || d;
    if (u?.firstName || u?.email) {
      setUser({
        firstName:  u.firstName || "",
        lastName:   u.lastName  || "",
        email:      u.email     || "",
        position:   u.position  || "",
        department: u.department,
        phone:      u.phone     || u.phoneNumber || "",
        joinDate:   u.joinDate  || u.createdAt   || "",
      });
    }
  }, [headers]);

  const loadToday = useCallback(async () => {
    const d = await safeJson(`${API_URL}/attendance/today`, { headers });
    const r = d?.data || d;
    if (!r || typeof r !== "object" || Array.isArray(r)) return;
    const norm = (raw?: string | null) => {
      if (!raw) return null;
      if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
      const x = new Date(raw);
      return isNaN(x.getTime()) ? null : `${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
    };
    setToday({
      status:     r.status || null,
      clock_in:   norm(r.clockInTime  || r.clock_in),
      clock_out:  norm(r.clockOutTime || r.clock_out),
      work_hours: r.totalHours ?? r.hours_worked ?? r.work_hours ?? null,
    });
  }, [headers]);

  const loadAttendance = useCallback(async () => {
    const d = await safeJson(`${API_URL}/attendance`, { headers });
    const records: any[] =
      d?.data?.data ?? (Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);

    const now = new Date();
    const month = records.filter((r: any) => {
      const ds = r.date ? iso(r.date) : "";
      if (!ds) return false;
      const x = new Date(ds);
      return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
    });
    const present = month.filter(r => r.status === "present" || r.status === "half_day").length;
    const late    = month.filter(r => r.status === "late").length;
    const total   = month.length;
    setStats({
      present, late, total,
      rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
    });

    const t = todayISO();
    setTeamOnLeave(records
      .filter((r: any) => (r.date ? iso(r.date) : "") === t && r.status === "leave")
      .map((r: any) => {
        const end = iso(r.endDate || r.end_date || t);
        return {
          name: r.employee_name || r.full_name || `${r.firstName || ""} ${r.lastName || ""}`.trim() || "Employee",
          type: r.leaveType || r.leave_type || "Leave",
          end_date: end,
          daysLeft: daysRemaining(end),
          department: typeof r.department === "object" ? r.department?.name : r.department || "—",
        };
      }));
  }, [headers]);

  const loadLeave = useCallback(async () => {
    const today = todayISO();
    const d = await safeJson(`${API_URL}/leaves`, { headers });
    const raw: any[] = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : d?.data?.data ?? [];

    const mapped: LeaveRecord[] = raw.map((l: any, i: number) => {
      const start = iso(l.startDate || l.start_date || today);
      const end   = iso(l.endDate   || l.end_date   || today);
      return {
        id:    l._id || l.id || String(i),
        type:  l.leaveType || l.type || l.leave_type || "Leave",
        start_date: start,
        end_date:   end,
        status: (l.status || "pending") as LeaveStatus,
        days:   l.numberOfDays || l.days || daysBetween(start, end),
      };
    });
    setActiveLeave(mapped.find(l => l.status === "approved" && l.start_date <= today && l.end_date >= today) || null);
    setRecentLeaves([...mapped].sort((a, b) => b.start_date.localeCompare(a.start_date)));

    const bd = await safeJson(`${API_URL}/leaves/balance`, { headers });
    const ba: any[] | null = Array.isArray(bd?.data) ? bd.data : Array.isArray(bd) ? bd : null;

    if (ba?.length) {
      setBalances(ba.map((b: any, i: number) => ({
        type:  b.leaveType || b.type || "Leave",
        used:  b.used  || b.usedDays  || 0,
        total: b.total || b.totalDays || b.allowance || 20,
        color: LEAVE_PALETTE[i % LEAVE_PALETTE.length],
      })));
      return;
    }

    const tally: Record<string, number> = {};
    mapped.filter(l => l.status === "approved").forEach(l => { tally[l.type] = (tally[l.type] || 0) + l.days; });
    const inferred = Object.entries(tally).map(([type, used], i) => ({
      type, used, total: Math.max(used, 20), color: LEAVE_PALETTE[i % LEAVE_PALETTE.length],
    }));
    setBalances(inferred.length ? inferred : [
      { type: "Annual",   used: 0, total: 22, color: C.coral },
      { type: "Sick",     used: 0, total: 12, color: C.pink  },
      { type: "Personal", used: 0, total: 5,  color: C.green },
    ]);
  }, [headers]);

  const loadEmployeeDirectory = useCallback(async () => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const isDemo = !!(t && t.startsWith("demo-token"));

    const d = await safeJson(`${API_URL}/employees?limit=200`, { headers });
    const emps = normalizeEmployeeList(d);

    const mapped: Colleague[] = emps.map((e: any, i: number) => ({
      id: String(e._id || e.id || e.email || `emp-${i}`),
      name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.full_name || e.email || "Unknown",
      department: typeof e.department === "object" ? e.department?.name : e.department || "—",
      email: e.email || undefined,
    }));

    if (mapped.length) setColleagues(mapped);
    else if (isDemo) setColleagues(DEMO_COLLEAGUES);
    else setColleagues([]);

    const list: BirthdayEntry[] = emps
      .filter((e: any) => e.dateOfBirth || e.dob || e.birthDate)
      .map((e: any) => {
        const dob = e.dateOfBirth || e.dob || e.birthDate;
        const dept = typeof e.department === "object" ? e.department?.name : e.department || "—";
        return {
          name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.full_name || "Unknown",
          dob, department: dept,
          daysUntil: daysUntilBirthday(dob),
        };
      })
      .filter(b => b.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
    setBirthdays(list);
  }, [headers]);

  const reload = useCallback(async () => {
    setError(null);
    const results = await Promise.allSettled([
      loadProfile(), loadToday(), loadAttendance(), loadLeave(), loadEmployeeDirectory(),
    ]);
    if (results.some(r => r.status === "rejected")) setError("Some data couldn't be loaded.");
    setLoading(false);
  }, [loadProfile, loadToday, loadAttendance, loadLeave, loadEmployeeDirectory]);

  useEffect(() => { reload(); }, [reload]);

  const setTodayPatch = (patch: Partial<TodayAttendance>) =>
    setToday(prev => ({ ...prev, ...patch }));

  const clockIn = useCallback(async () => {
    if (today.clock_in) return;
    const now = new Date();
    const hhmm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    setTodayPatch({ clock_in: hhmm, status: "present" });
    await safeJson(`${API_URL}/attendance/clock-in`, { method: "POST", headers });
  }, [headers, today.clock_in]);

  const clockOut = useCallback(async () => {
    if (!today.clock_in || today.clock_out) return;
    const now = new Date();
    const hhmm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const [hi, mi] = today.clock_in.split(":").map(Number);
    const worked = (now.getHours() + now.getMinutes() / 60) - (hi + mi / 60);
    setTodayPatch({ clock_out: hhmm, work_hours: Math.max(0, +worked.toFixed(2)) });
    await safeJson(`${API_URL}/attendance/clock-out`, { method: "POST", headers });
  }, [headers, today.clock_in, today.clock_out]);

  return {
    user, today, stats, balances, activeLeave, recentLeaves, teamOnLeave, birthdays, colleagues,
    loading, error, reload, clockIn, clockOut,
  };
}