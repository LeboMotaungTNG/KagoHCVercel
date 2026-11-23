// Company notices: the owner posts them; everyone in the company sees them on
// their dashboard.
//
// Backend contract (not built yet — see the notes in the PR):
//   GET    /notices        → { success, data: CompanyNotice[] }   any signed-in user in the company
//   POST   /notices        → { success, data: CompanyNotice }     owner only
//   PUT    /notices/:id    → { success, data: CompanyNotice }     owner only
//   DELETE /notices/:id    → { success }                          owner only
// Body for POST/PUT: { kind, title, body, expiresAt? (YYYY-MM-DD or null) }

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "./apiBase";
import { authHeader, jsonHeaders } from "./organizationSettings/helpers";

export type NoticeKind = "POLICY" | "NOTICE" | "ACTION";
export const NOTICE_KINDS: NoticeKind[] = ["NOTICE", "POLICY", "ACTION"];
export const NOTICE_KIND_LABELS: Record<NoticeKind, string> = {
  NOTICE: "Notice",
  POLICY: "Policy",
  ACTION: "Action needed",
};

export interface CompanyNotice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  /** Last day the notice shows (YYYY-MM-DD), or null to keep it up. */
  expiresAt: string | null;
  createdAt: string;
  createdByName?: string;
}

export type NoticeInput = Pick<CompanyNotice, "kind" | "title" | "body" | "expiresAt">;

/** Thrown when the server has no notices API yet (404), so the UI can say so. */
export class NoticesUnavailableError extends Error {
  constructor() {
    super("Couldn't save: the server doesn't support company notices yet. It needs the /notices API before notices can be posted.");
    this.name = "NoticesUnavailableError";
  }
}

const toKind = (value: unknown): NoticeKind => {
  const k = String(value || "").toUpperCase();
  return k === "POLICY" || k === "ACTION" ? k : "NOTICE";
};

const toNotice = (raw: any): CompanyNotice => {
  const by = raw?.createdBy && typeof raw.createdBy === "object" ? raw.createdBy : null;
  return {
    id: String(raw?.id || raw?._id || ""),
    kind: toKind(raw?.kind || raw?.type),
    title: String(raw?.title || ""),
    body: String(raw?.body || raw?.message || ""),
    expiresAt: raw?.expiresAt ? String(raw.expiresAt).slice(0, 10) : null,
    createdAt: String(raw?.createdAt || ""),
    createdByName:
      raw?.createdByName ||
      (by ? `${by.firstName || ""} ${by.lastName || ""}`.trim() || by.name : undefined) ||
      undefined,
  };
};

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (res.status === 404) throw new NoticesUnavailableError();
  let body: any = null;
  try { body = await res.json(); } catch { /* empty body */ }
  if (!res.ok || body?.success === false) {
    throw new Error(body?.message || body?.error || `Request failed (${res.status}).`);
  }
  return (body?.data ?? body) as T;
}

export async function listNotices(): Promise<CompanyNotice[]> {
  const data = await call<any>("/notices", { headers: authHeader() });
  const rows = Array.isArray(data) ? data : Array.isArray(data?.notices) ? data.notices : [];
  return rows.map(toNotice).filter((n: CompanyNotice) => n.id && n.title);
}

export async function createNotice(input: NoticeInput): Promise<CompanyNotice> {
  return toNotice(await call<any>("/notices", { method: "POST", headers: jsonHeaders(), body: JSON.stringify(input) }));
}

export async function updateNotice(id: string, input: NoticeInput): Promise<CompanyNotice> {
  return toNotice(await call<any>(`/notices/${encodeURIComponent(id)}`, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(input) }));
}

export async function deleteNotice(id: string): Promise<void> {
  await call<unknown>(`/notices/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeader() });
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** True once the notice's last day has passed. */
export const isNoticeExpired = (n: CompanyNotice) => !!n.expiresAt && n.expiresAt < todayKey();

/** Newest first. */
const byNewest = (a: CompanyNotice, b: CompanyNotice) => b.createdAt.localeCompare(a.createdAt);

export function useCompanyNotices() {
  const [notices, setNotices] = useState<CompanyNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotices((await listNotices()).sort(byNewest));
      setUnavailable(false);
    } catch (err) {
      if (err instanceof NoticesUnavailableError) setUnavailable(true);
      else setError(err instanceof Error ? err.message : "Couldn't load company notices.");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { notices, setNotices, loading, error, unavailable, reload: load };
}
