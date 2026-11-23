// "Company notices" dashboard section. Everyone sees the owner's notices; with
// `canManage` (owner dashboard) it also lets the owner post, edit and delete them.
// Render it inside the dashboard's own card.

import React, { useEffect, useState } from "react";
import { Megaphone, Pencil, Pin, Plus, Target, Trash2 } from "lucide-react";
import { C, R } from "../utils/employee";
import {
  NOTICE_KINDS,
  NOTICE_KIND_LABELS,
  type CompanyNotice,
  type NoticeInput,
  type NoticeKind,
  createNotice,
  deleteNotice,
  isNoticeExpired,
  updateNotice,
  useCompanyNotices,
} from "../utils/companyNotices";

export const NOTICE_STYLES: Record<NoticeKind, { bg: string; color: string; icon: React.ReactNode }> = {
  POLICY: { bg: C.accentBg, color: C.accent, icon: <Pin size={14} /> },
  NOTICE: { bg: C.blueBg,   color: C.blue,   icon: <Megaphone size={14} /> },
  ACTION: { bg: C.amberBg,  color: C.amber,  icon: <Target size={14} /> },
};

/** A read-only item shown alongside the owner's notices (e.g. live system reminders). */
export type ExtraNotice = { kind: NoticeKind; title: string; body: string };

const linkBtn: React.CSSProperties = {
  border: "none", background: "transparent", color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0,
};
const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
  border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const ghostBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
  border: `1px solid ${C.line}`, background: "#fff", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8,
  border: `1px solid ${C.line}`, background: "#fff", color: C.muted, cursor: "pointer",
};
const INPUT: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: `1px solid #e4e7ec`,
  fontSize: 14, color: C.ink, background: "#fff", fontFamily: "inherit",
};

const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};

const KindPill: React.FC<{ kind: NoticeKind }> = ({ kind }) => {
  const s = NOTICE_STYLES[kind];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: s.bg, color: s.color, borderRadius: 999, padding: "4px 10px", fontSize: 11.5, fontWeight: 700 }}>
      {s.icon}{kind}
    </span>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; width?: number }> = ({ title, onClose, children, width = 560 }) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div role="presentation" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        style={{ background: C.surface, borderRadius: R.xl, maxWidth: width, width: "100%", maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", fontSize: 26, lineHeight: 1, cursor: "pointer", color: C.muted }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
};

/* ── Owner's add / edit form ──────────────────────────────────────── */

const NoticeForm: React.FC<{
  initial?: CompanyNotice;
  onCancel: () => void;
  onSaved: (notice: CompanyNotice) => void;
}> = ({ initial, onCancel, onSaved }) => {
  const [form, setForm] = useState<NoticeInput>({
    kind: initial?.kind ?? "NOTICE",
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    expiresAt: initial?.expiresAt ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: NoticeInput = { ...form, title: form.title.trim(), body: form.body.trim(), expiresAt: form.expiresAt || null };
    if (!input.title) { setError("Add a title."); return; }
    if (!input.body) { setError("Add the notice text."); return; }
    setSaving(true);
    setError(null);
    try {
      onSaved(initial ? await updateNotice(initial.id, input) : await createNotice(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the notice.");
    } finally {
      setSaving(false);
    }
  };

  const label = (text: string, hint?: string) => (
    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
      {text}{hint && <span style={{ fontWeight: 400, color: C.faint }}> · {hint}</span>}
    </span>
  );

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        {label("Type")}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {NOTICE_KINDS.map((k) => {
            const active = form.kind === k;
            const s = NOTICE_STYLES[k];
            return (
              <button key={k} type="button" onClick={() => setForm({ ...form, kind: k })} aria-pressed={active}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  border: `1px solid ${active ? s.color : C.line}`, background: active ? s.bg : "#fff", color: active ? s.color : C.muted }}>
                {s.icon}{NOTICE_KIND_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>
      <label>
        {label("Title")}
        <input value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Office closed on Monday" style={INPUT} />
      </label>
      <label>
        {label("Notice")}
        <textarea value={form.body} rows={4} maxLength={1000} onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="What does everyone need to know?" style={{ ...INPUT, resize: "vertical" }} />
      </label>
      <label>
        {label("Show until", "optional — leave empty to keep it up")}
        <input type="date" value={form.expiresAt ?? ""} onChange={(e) => setForm({ ...form, expiresAt: e.target.value || null })}
          style={{ ...INPUT, maxWidth: 220 }} />
      </label>
      {error && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#b42318" }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={saving} style={ghostBtn}>Cancel</button>
        <button type="submit" disabled={saving} style={{ ...primaryBtn, background: saving ? C.faint : C.primary }}>
          {saving ? "Saving…" : initial ? "Save changes" : "Post notice"}
        </button>
      </div>
    </form>
  );
};

/* ── One notice ───────────────────────────────────────────────────── */

const NoticeTile: React.FC<{
  notice: CompanyNotice | ExtraNotice;
  large?: boolean;
  actions?: React.ReactNode;
}> = ({ notice, large, actions }) => {
  const full = "id" in notice ? notice : null;
  const expired = full ? isNoticeExpired(full) : false;
  const meta = full
    ? [full.createdAt && `Posted ${fmtDay(full.createdAt)}`, full.createdByName && `by ${full.createdByName}`, full.expiresAt && `${expired ? "Ended" : "Until"} ${fmtDay(full.expiresAt)}`]
        .filter(Boolean).join(" · ")
    : "";
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: R.lg, padding: 16, background: C.surfaceAlt, opacity: expired ? 0.65 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <KindPill kind={notice.kind} />
        {actions}
      </div>
      <div style={{ fontSize: large ? 15 : 14, fontWeight: 800, color: C.ink, marginTop: 10 }}>{notice.title}</div>
      <div style={{ fontSize: large ? 13 : 12.5, color: C.muted, marginTop: 4, lineHeight: 1.5, whiteSpace: "pre-line" }}>{notice.body}</div>
      {meta && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 8 }}>{meta}</div>}
    </div>
  );
};

/* ── Section ──────────────────────────────────────────────────────── */

export const CompanyNotices: React.FC<{
  /** Owner dashboard: post, edit and delete notices. */
  canManage?: boolean;
  /** Read-only items listed before the owner's notices. */
  extra?: ExtraNotice[];
  /** How many notices the card shows before "All notices". */
  limit?: number;
}> = ({ canManage = false, extra = [], limit = 3 }) => {
  const { notices, setNotices, loading, error, unavailable } = useCompanyNotices();
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState<CompanyNotice | "new" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Readers only see current notices; the owner also sees ended ones in "All notices".
  const current = notices.filter((n) => !isNoticeExpired(n));
  const cardItems: Array<CompanyNotice | ExtraNotice> = [...extra, ...current];
  const allItems: Array<CompanyNotice | ExtraNotice> = [...extra, ...(canManage ? notices : current)];

  const saved = (notice: CompanyNotice) => {
    setNotices((list) => {
      const rest = list.filter((n) => n.id !== notice.id);
      return [notice, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    setEditing(null);
  };

  const remove = async (notice: CompanyNotice) => {
    if (!window.confirm(`Delete the notice "${notice.title}"? Everyone will stop seeing it.`)) return;
    setActionError(null);
    try {
      await deleteNotice(notice.id);
      setNotices((list) => list.filter((n) => n.id !== notice.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't delete the notice.");
    }
  };

  const manageActions = (n: CompanyNotice | ExtraNotice) =>
    canManage && "id" in n ? (
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" style={iconBtn} aria-label={`Edit ${n.title}`} title="Edit" onClick={() => setEditing(n)}><Pencil size={14} /></button>
        <button type="button" style={{ ...iconBtn, color: "#b42318" }} aria-label={`Delete ${n.title}`} title="Delete" onClick={() => remove(n)}><Trash2 size={14} /></button>
      </div>
    ) : null;

  const status = loading
    ? "Loading notices…"
    : unavailable
      ? canManage
        ? "The server doesn't have company notices yet, so new notices can't be saved until it's updated."
        : "No company notices right now."
      : error
        ? error
        : null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>Company notices</h3>
          {canManage && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.muted }}>Everyone in the company sees these on their dashboard.</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {allItems.length > 0 && <button type="button" style={linkBtn} onClick={() => setShowAll(true)}>All notices</button>}
          {canManage && (
            <button type="button" style={primaryBtn} onClick={() => setEditing("new")}>
              <Plus size={14} /> New notice
            </button>
          )}
        </div>
      </div>

      {actionError && <p role="alert" style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#b42318" }}>{actionError}</p>}

      {cardItems.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          {cardItems.slice(0, limit).map((n, i) => (
            <NoticeTile key={"id" in n ? n.id : `extra-${i}`} notice={n} actions={manageActions(n)} />
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, padding: "18px 0", textAlign: "center", fontSize: 13.5, color: C.faint }}>
          {status ?? (canManage ? "No notices yet. Post one to share it with everyone." : "No company notices right now.")}
        </p>
      )}
      {cardItems.length > 0 && status && !loading && (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: C.faint }}>{status}</p>
      )}

      {showAll && (
        <Modal title="All company notices" onClose={() => setShowAll(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allItems.map((n, i) => (
              <NoticeTile key={"id" in n ? n.id : `extra-${i}`} notice={n} large actions={manageActions(n)} />
            ))}
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={editing === "new" ? "New company notice" : "Edit notice"} onClose={() => setEditing(null)} width={520}>
          <NoticeForm initial={editing === "new" ? undefined : editing} onCancel={() => setEditing(null)} onSaved={saved} />
        </Modal>
      )}
    </>
  );
};

export default CompanyNotices;
