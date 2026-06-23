/**
 * Break tracking utilities & hook.
 *
 * Lets an employee step away for Tea / Lunch / Other breaks while clocked in
 * and resume work afterwards. Breaks are persisted per-employee, per-day in
 * localStorage so they survive refreshes and across the Attendance page and
 * Employee Dashboard. (When a backend endpoint becomes available, swap the
 * `loadBreaks` / `persistBreaks` calls for API calls — UI stays the same.)
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
  startBreak: (type: BreakType) => void;
  /** End the currently running break (no-op if none). */
  endBreak: () => void;
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
  const [breaks, setBreaks] = useState<BreakSession[]>(() => loadBreaks());
  const [, forceTick] = useState(0);

  const active = useMemo(() => breaks.find(b => !b.endedAt) ?? null, [breaks]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => forceTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith("kagohc.breaks.")) return;
      setBreaks(loadBreaks());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const startBreak = useCallback((type: BreakType) => {
    setBreaks(prev => {
      if (prev.some(b => !b.endedAt)) return prev;
      const next: BreakSession[] = [
        ...prev,
        { id: genId(), type, startedAt: new Date().toISOString() },
      ];
      persistBreaks(next);
      return next;
    });
  }, []);

  const endBreak = useCallback(() => {
    setBreaks(prev => {
      const idx = prev.findIndex(b => !b.endedAt);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], endedAt: new Date().toISOString() };
      persistBreaks(next);
      return next;
    });
  }, []);

  const removeBreak = useCallback((id: string) => {
    setBreaks(prev => {
      const next = prev.filter(b => b.id !== id);
      persistBreaks(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => setBreaks(loadBreaks()), []);

  const totalMs = totalBreakMs(breaks);

  return { breaks, active, isOnBreak: !!active, totalMs, startBreak, endBreak, removeBreak, refresh };
}
