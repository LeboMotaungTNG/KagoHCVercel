/**
 * Break tracking utilities & hook.
 *
 * Lets an employee step away for Tea / Lunch / Other breaks while clocked in
 * and resume work afterwards. Breaks are persisted per-employee, per-day in
 * localStorage so they survive refreshes and across the Attendance page and
 * Employee Dashboard. Break actions are also persisted through the attendance
 * API so exports and payroll use the recorded break times.
 *
 * Concepts:
 *  - `BreakType`     – tea | lunch | other
 *  - `BreakSession`  – one entry with start / end timestamps
 *  - "active" break  – a session with no `endedAt` yet
 *  - Daily total     – sum of completed + currently running break time
 */

import { useCallback, useEffect, useMemo, useState } from "react";

export type BreakType = "tea" | "lunch" | "other";

export interface BreakSession {
  id: string;
  type: BreakType;
  startedAt: string;        // ISO string
  endedAt?: string | null;  // ISO string, undefined while active
}

export interface BreakTypeMeta {
  type: BreakType;
  label: string;
  shortLabel: string;
  /** Suggested duration in minutes — used for the soft warning, not enforced. */
  suggestedMinutes: number;
  accent: string;           // hex
  accentSoft: string;       // hex
}

export const BREAK_TYPES: BreakTypeMeta[] = [
  { type: "tea",   label: "Tea break",   shortLabel: "Tea",   suggestedMinutes: 15, accent: "#0E9F6E", accentSoft: "#d1fae5" },
  { type: "lunch", label: "Lunch break", shortLabel: "Lunch", suggestedMinutes: 60, accent: "#D97706", accentSoft: "#fef3c7" },
  { type: "other", label: "Other",       shortLabel: "Other", suggestedMinutes: 10, accent: "#6366F1", accentSoft: "#e0e7ff" },
];

export function getBreakMeta(type: BreakType): BreakTypeMeta {
  return BREAK_TYPES.find(b => b.type === type) ?? BREAK_TYPES[0];
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const todayYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** Read the current employee id from localStorage (falls back to a constant). */
function readEmployeeId(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "self";
    const u = JSON.parse(raw);
    return String(u?.employee_id || u?.id || u?._id || u?.email || "self");
  } catch {
    return "self";
  }
}

function storageKey(date: string, employeeId: string): string {
  return `kagohc.breaks.${date}.${employeeId}`;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL
  || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1"
).replace(/\/+$/, "");

function authHeaders(): HeadersInit {
  const tokenKeys = ["token", "accessToken", "authToken", "jwt", "auth"];
  let token = tokenKeys
    .map(key => localStorage.getItem(key))
    .find(value => value?.trim()) || "";

  if (!token) {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      token = String(user?.token || user?.accessToken || "");
    } catch {
      token = "";
    }
  }

  // Some login flows persist the complete auth response instead of the JWT.
  if (token.startsWith("{") || token.startsWith("\"")) {
    try {
      const parsed = JSON.parse(token);
      token = typeof parsed === "string"
        ? parsed
        : String(parsed?.token || parsed?.accessToken || parsed?.data?.token || "");
    } catch {
      token = "";
    }
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function backendBreakType(type: BreakType): "lunch" | "short" | "other" {
  return type === "tea" ? "short" : type;
}

async function breakRequest(path: string, body?: unknown): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/attendance/breaks/${path}`, {
    method: "POST",
    headers: authHeaders(),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try { message = JSON.parse(text)?.message || JSON.parse(text)?.error || text; } catch { /* plain text */ }
    throw new Error(message || `Break request failed (${response.status})`);
  }
}

function fromBackendBreakType(type: unknown): BreakType {
  if (type === "lunch") return "lunch";
  if (type === "short" || type === "tea") return "tea";
  return "other";
}

/**
 * Today's breaks as the server has them — the single source of truth shared by
 * every device. Returns null if the server can't be reached (keep the cache then).
 */
async function fetchServerBreaks(): Promise<BreakSession[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/today`, { headers: authHeaders() });
    if (!response.ok) return null;
    const body = await response.json();
    const record = body?.data;
    if (!record) return []; // not clocked in today
    const list: any[] = Array.isArray(record.breaks) ? record.breaks : [];
    return list
      .filter(b => b && b.start)
      .map(b => {
        const startedAt = new Date(b.start).toISOString();
        return {
          id: `srv-${new Date(b.start).getTime()}`,
          type: fromBackendBreakType(b.type),
          startedAt,
          endedAt: b.end ? new Date(b.end).toISOString() : null,
        };
      });
  } catch {
    return null;
  }
}

function loadBreaks(date = todayYMD(), employeeId = readEmployeeId()): BreakSession[] {
  try {
    const raw = localStorage.getItem(storageKey(date, employeeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BreakSession[]) : [];
  } catch {
    return [];
  }
}

function persistBreaks(list: BreakSession[], date = todayYMD(), employeeId = readEmployeeId()): void {
  try {
    localStorage.setItem(storageKey(date, employeeId), JSON.stringify(list));
  } catch {
    /* quota exceeded — ignore */
  }
}

function genId(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Sum of break time today, in milliseconds.
 * A running break counts up to `now`.
 */
export function totalBreakMs(breaks: BreakSession[], now: number = Date.now()): number {
  return breaks.reduce((total, b) => {
    const start = new Date(b.startedAt).getTime();
    const end   = b.endedAt ? new Date(b.endedAt).getTime() : now;
    return total + Math.max(0, end - start);
  }, 0);
}

export function fmtBreakClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
}

export function fmtBreakShort(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM ? `${h}h ${remM}m` : `${h}h`;
}

export function fmtClockTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad2(m)} ${suffix}`;
}

export interface BreakSessionState {
  breaks: BreakSession[];
  active: BreakSession | null;
  isOnBreak: boolean;
  totalMs: number;
  /** Start a new break (no-op if one is already running). */
  startBreak: (type: BreakType) => Promise<void>;
  /** End the currently running break (no-op if none). */
  endBreak: () => Promise<void>;
  /** Remove a recorded break entry (e.g. a mistaken one). */
  removeBreak: (id: string) => void;
  /** Force a re-read from localStorage. */
  refresh: () => void;
}

/**
 * Reactive hook around per-day break state.
 *
 * - Auto re-ticks once per second while a break is active so timers stay live.
 * - Listens to `storage` events so the Attendance page and Dashboard stay in
 *   sync when both are open in different tabs.
 */
export function useBreakSession(): BreakSessionState {
  // The cached list shows instantly; the server's list replaces it as soon as it loads.
  const [breaks, setBreaks] = useState<BreakSession[]>(() => loadBreaks());
  const [, forceTick] = useState(0);

  const active = useMemo(() => breaks.find(b => !b.endedAt) ?? null, [breaks]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => forceTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  /** Load today's breaks from the server and make them the truth on this device. */
  const sync = useCallback(async (): Promise<BreakSession[] | null> => {
    const server = await fetchServerBreaks();
    if (server) {
      persistBreaks(server);
      setBreaks(server);
    }
    return server;
  }, []);

  // Stay in step with other devices: on open, every 30 seconds while visible,
  // and whenever the tab/app comes back into focus or the connection returns.
  useEffect(() => {
    void sync();
    const whenVisible = () => { if (document.visibilityState !== "hidden") void sync(); };
    const always = () => { void sync(); }; // focus / back online: the page is in use
    const id = window.setInterval(whenVisible, 30_000);
    document.addEventListener("visibilitychange", whenVisible);
    window.addEventListener("focus", always);
    window.addEventListener("online", always);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", whenVisible);
      window.removeEventListener("focus", always);
      window.removeEventListener("online", always);
    };
  }, [sync]);

  // Other tabs in this browser.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith("kagohc.breaks.")) return;
      setBreaks(loadBreaks());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const startBreak = useCallback(async (type: BreakType) => {
    // Always ask the server — another device may have changed things.
    try {
      await breakRequest("start", { type: backendBreakType(type) });
    } catch (error) {
      await sync(); // e.g. a break already started on another device: show it
      throw error;
    }
    const server = await sync();
    if (!server) {
      // Server unreachable for the refresh: show the break we just started.
      setBreaks(prev => {
        if (prev.some(b => !b.endedAt)) return prev;
        const next: BreakSession[] = [...prev, { id: genId(), type, startedAt: new Date().toISOString() }];
        persistBreaks(next);
        return next;
      });
    }
  }, [sync]);

  const endBreak = useCallback(async () => {
    // Always ask the server — the break may have been started on another device.
    try {
      await breakRequest("end");
    } catch (error) {
      await sync(); // e.g. already ended on another device
      throw error;
    }
    const server = await sync();
    if (!server) {
      setBreaks(prev => {
        const idx = prev.findIndex(b => !b.endedAt);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], endedAt: new Date().toISOString() };
        persistBreaks(next);
        return next;
      });
    }
  }, [sync]);

  /**
   * Only removes breaks that never reached the server. Recorded breaks stay,
   * because they count towards worked hours; a manager corrects those.
   */
  const removeBreak = useCallback((id: string) => {
    setBreaks(prev => {
      if (id.startsWith("srv-")) return prev;
      const next = prev.filter(b => b.id !== id);
      persistBreaks(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => { void sync(); }, [sync]);

  const totalMs = totalBreakMs(breaks);

  return { breaks, active, isOnBreak: !!active, totalMs, startBreak, endBreak, removeBreak, refresh };
}
