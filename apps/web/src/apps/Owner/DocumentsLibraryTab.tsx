/**
 * DocumentsLibraryTab
 * -------------------
 * Owner-facing manager for company-wide documents that every employee sees
 * on their `/employee/documents` page (employment conditions, policies,
 * benefits guides, compliance notices, etc.).
 *
 * Frontend-only for now: files are stored as base64 data URLs in
 * localStorage via `shared/utils/documentsLibrary`. When the backend is
 * ready, only that utility module needs to be swapped to a real API — the
 * component below stays the same.
 */

import React, { useMemo, useRef, useState } from "react";
import {
  FaCloudUploadAlt, FaSearch, FaPlus, FaTrash, FaPencilAlt,
  FaDownload, FaEye, FaFileAlt, FaTimes, FaCheckCircle,
} from "react-icons/fa";
import {
  ACCEPTED_MIME, CATEGORY_META, CATEGORY_ORDER, MAX_FILE_BYTES,
  type DocCategory, type OrgDocument,
  downloadDataUrl, fileToDataUrl, formatBytes, formatDate,
  loadOrgDocuments, newId, saveOrgDocuments,
} from "../../shared/utils/documentsLibrary";

/* ─────────────────────────────────────────────────────────────────────
 * Local design tokens — mirror OrganizationSettingsPage.tsx so the tab
 * feels native, no visual seam.
 * ────────────────────────────────────────────────────────────────── */
const BRAND = "#33A6CD";
const BRAND_DK = "#0369A1";
const INK = "#1A202C";
const MUTED = "#718096";
const LINE = "#E2E8F0";

const card: React.CSSProperties = {
  backgroundColor: "white", borderRadius: 12, border: `1px solid ${LINE}`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: 22, marginBottom: 18,
};
const label: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: MUTED,
  display: "block", marginBottom: 5,
};
const input: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: `1px solid #CBD5E0`, fontSize: 13, color: "#2D3748",
  backgroundColor: "white", outline: "none",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "none",
  backgroundColor: BRAND_DK, color: "white",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const btnGhost: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 8, border: `1px solid #CBD5E0`,
  backgroundColor: "white", color: "#374151",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};

/* ─────────────────────────────────────────────────────────────────────
 * Upload / edit modal
 * ────────────────────────────────────────────────────────────────── */

interface EditorState {
  id: string | null;
  title: string;
  description: string;
  category: DocCategory;
  file: File | null;
  keepExistingFile: boolean;
  existingFileName?: string;
  existingSize?: number;
}

const emptyEditor: EditorState = {
  id: null,
  title: "",
  description: "",
  category: "Employment",
  file: null,
  keepExistingFile: false,
};

const DocumentEditor: React.FC<{
  open: boolean;
  initial: EditorState;
  onClose: () => void;
  onSave: (doc: OrgDocument) => void;
}> = ({ open, initial, onClose, onSave }) => {
  const [state, setState] = useState<EditorState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) { setState(initial); setError(null); }
  }, [open, initial]);

  if (!open) return null;

  const acceptFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setError(`File is too large. Maximum size is ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    setError(null);
    setState(s => ({ ...s, file: f, keepExistingFile: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.title.trim()) { setError("Please provide a title."); return; }
    if (!state.file && !state.keepExistingFile) {
      setError("Please attach a file."); return;
    }
    setBusy(true);
    try {
      let dataUrl: string;
      let fileName: string;
      let mimeType: string;
      let size: number;

      if (state.file) {
        dataUrl = await fileToDataUrl(state.file);
        fileName = state.file.name;
        mimeType = state.file.type || "application/octet-stream";
        size = state.file.size;
      } else {
        // editing without replacing the file — reuse existing values
        const existing = loadOrgDocuments().find(d => d.id === state.id);
        if (!existing) { setError("Original file could not be found."); setBusy(false); return; }
        dataUrl = existing.dataUrl;
        fileName = existing.fileName;
        mimeType = existing.mimeType;
        size = existing.size;
      }

      const doc: OrgDocument = {
        id: state.id ?? newId(),
        title: state.title.trim(),
        description: state.description.trim() || undefined,
        category: state.category,
        fileName, mimeType, size, dataUrl,
        uploadedAt: state.id
          ? loadOrgDocuments().find(d => d.id === state.id)?.uploadedAt ?? new Date().toISOString()
          : new Date().toISOString(),
        audience: "all",
      };
      onSave(doc);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while reading the file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 3000, padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 14, width: "100%",
          maxWidth: 560, maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: `1px solid ${LINE}`,
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: INK }}>
            {state.id ? "Edit document" : "Upload document"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
            <FaTimes size={16} />
          </button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={label}>Title <span style={{ color: "#EF4444" }}>*</span></label>
            <input style={input} value={state.title}
              placeholder="e.g. Employment Conditions – Full-Time Staff"
              onChange={e => setState(s => ({ ...s, title: e.target.value }))} />
          </div>

          <div>
            <label style={label}>Category</label>
            <select style={input} value={state.category}
              onChange={e => setState(s => ({ ...s, category: e.target.value as DocCategory }))}>
              {CATEGORY_ORDER.filter(c => c !== "Payslip").map(c => (
                <option key={c} value={c}>{CATEGORY_META[c].label}</option>
              ))}
            </select>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9CA3AF" }}>
              {CATEGORY_META[state.category].blurb}
            </p>
          </div>

          <div>
            <label style={label}>Description (optional)</label>
            <textarea rows={3} style={{ ...input, resize: "vertical", minHeight: 72 }}
              placeholder="Short summary shown to employees under the document title."
              value={state.description}
              onChange={e => setState(s => ({ ...s, description: e.target.value }))} />
          </div>

          <div>
            <label style={label}>File {!state.id && <span style={{ color: "#EF4444" }}>*</span>}</label>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault(); setIsDragging(false);
                acceptFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? BRAND : "#CBD5E0"}`,
                borderRadius: 10, padding: "22px 16px", textAlign: "center",
                cursor: "pointer", background: isDragging ? "rgba(51,166,205,0.08)" : "#F8FAFC",
                transition: "all .15s ease",
              }}
            >
              <FaCloudUploadAlt size={26} color={BRAND_DK} />
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: INK }}>
                {state.file
                  ? state.file.name
                  : state.keepExistingFile && state.existingFileName
                  ? state.existingFileName
                  : "Drop a file here or click to browse"}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                {state.file
                  ? formatBytes(state.file.size)
                  : state.keepExistingFile && state.existingSize
                  ? `${formatBytes(state.existingSize)} · current file kept`
                  : `PDF, DOC, DOCX, TXT, PNG, JPG · up to ${formatBytes(MAX_FILE_BYTES)}`}
              </div>
              <input
                ref={fileRef} type="file" accept={ACCEPTED_MIME} hidden
                onChange={e => acceptFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C",
              padding: "10px 12px", borderRadius: 8, fontSize: 12.5,
            }}>{error}</div>
          )}
        </div>

        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "14px 22px", borderTop: `1px solid ${LINE}`,
          background: "#F8FAFC", borderRadius: "0 0 14px 14px",
        }}>
          <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.7 : 1 }}>
            {busy ? "Saving…" : state.id ? "Save changes" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────
 * Main tab
 * ────────────────────────────────────────────────────────────────── */

const DocumentsLibraryTab: React.FC = () => {
  const [docs, setDocs] = useState<OrgDocument[]>(() => loadOrgDocuments());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocCategory | "All">("All");
  const [editor, setEditor] = useState<{ open: boolean; initial: EditorState }>({
    open: false, initial: emptyEditor,
  });
  const [toast, setToast] = useState<string | null>(null);

  const persist = (next: OrgDocument[], msg?: string) => {
    setDocs(next);
    saveOrgDocuments(next);
    if (msg) {
      setToast(msg);
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter(d => filter === "All" ? true : d.category === filter)
      .filter(d => !q
        ? true
        : d.title.toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q))
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  }, [docs, query, filter]);

  const totalSize = useMemo(() => docs.reduce((a, d) => a + d.size, 0), [docs]);

  const handleUploadClick = () =>
    setEditor({ open: true, initial: emptyEditor });

  const handleEdit = (doc: OrgDocument) =>
    setEditor({
      open: true,
      initial: {
        id: doc.id,
        title: doc.title,
        description: doc.description ?? "",
        category: doc.category,
        file: null,
        keepExistingFile: true,
        existingFileName: doc.fileName,
        existingSize: doc.size,
      },
    });

  const handleSave = (doc: OrgDocument) => {
    const exists = docs.some(d => d.id === doc.id);
    const next = exists ? docs.map(d => d.id === doc.id ? doc : d) : [doc, ...docs];
    persist(next, exists ? "Document updated" : "Document uploaded");
    setEditor({ open: false, initial: emptyEditor });
  };

  const handleDelete = (doc: OrgDocument) => {
    if (!window.confirm(`Delete "${doc.title}"? Employees will no longer see it.`)) return;
    persist(docs.filter(d => d.id !== doc.id), "Document deleted");
  };

  const handleView = (doc: OrgDocument) => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    if (doc.mimeType.startsWith("image/")) {
      w.document.write(`<title>${doc.title}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${doc.dataUrl}" style="max-width:100%;max-height:100vh"/></body>`);
    } else {
      w.location.href = doc.dataUrl;
    }
  };

  /* ────────────── UI ────────────── */

  return (
    <div style={{ padding: 28, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: 0 }}>Documents Library</h3>
          <p style={{ fontSize: 14, color: MUTED, marginTop: 4, marginBottom: 0 }}>
            Upload documents once — every employee sees them under their Documents tab.
          </p>
        </div>
        <button type="button" onClick={handleUploadClick} style={btnPrimary}>
          <FaPlus size={12} /> Upload document
        </button>
      </div>

      {/* Overview strip */}
      <div style={{
        ...card, display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 18, padding: "18px 22px", marginBottom: 18,
      }}>
        <Stat label="Total documents" value={String(docs.length)} accent={BRAND_DK} />
        <Stat label="Storage used" value={formatBytes(totalSize)} accent="#7C3AED" />
        <Stat label="Categories" value={String(new Set(docs.map(d => d.category)).size)} accent="#059669" />
        <Stat label="Latest upload"
          value={docs[0] ? formatDate(docs[0].uploadedAt) : "—"} accent="#DB2777" />
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: "14px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED }} size={12} />
            <input
              style={{ ...input, paddingLeft: 34 }}
              placeholder="Search title, description or file name…"
              value={query} onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <FilterChip active={filter === "All"} onClick={() => setFilter("All")} label={`All (${docs.length})`} />
            {CATEGORY_ORDER.filter(c => c !== "Payslip").map(c => {
              const count = docs.filter(d => d.category === c).length;
              return (
                <FilterChip
                  key={c}
                  active={filter === c}
                  onClick={() => setFilter(c)}
                  label={`${CATEGORY_META[c].label} (${count})`}
                  tint={CATEGORY_META[c].color}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid / empty state */}
      {visible.length === 0 ? (
        <div style={{
          ...card, textAlign: "center", padding: "48px 24px",
          borderStyle: "dashed", background: "#F8FAFC",
        }}>
          <FaFileAlt size={30} color="#CBD5E0" />
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: INK }}>
            {docs.length === 0 ? "No documents yet" : "No documents match your filters"}
          </div>
          <p style={{ fontSize: 13, color: MUTED, margin: "6px 0 16px" }}>
            {docs.length === 0
              ? "Upload employment conditions, policies, or benefits guides — they'll appear on every employee's Documents page."
              : "Try a different search term or category."}
          </p>
          {docs.length === 0 && (
            <button type="button" onClick={handleUploadClick} style={btnPrimary}>
              <FaPlus size={11} /> Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid", gap: 14,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}>
          {visible.map(d => (
            <DocumentCard key={d.id} doc={d}
              onEdit={() => handleEdit(d)}
              onDelete={() => handleDelete(d)}
              onView={() => handleView(d)}
              onDownload={() => downloadDataUrl(d.dataUrl, d.fileName)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 26, right: 26, zIndex: 4000,
          background: INK, color: "white", padding: "10px 16px", borderRadius: 999,
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
        }}>
          <FaCheckCircle color="#34D399" /> {toast}
        </div>
      )}

      <DocumentEditor
        open={editor.open}
        initial={editor.initial}
        onClose={() => setEditor({ open: false, initial: emptyEditor })}
        onSave={handleSave}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────
 * Small building blocks
 * ────────────────────────────────────────────────────────────────── */

const Stat: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>
      {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: INK, marginTop: 2 }}>{value}</div>
    <div style={{ height: 3, width: 32, background: accent, borderRadius: 3, marginTop: 6 }} />
  </div>
);

const FilterChip: React.FC<{
  label: string; active: boolean; onClick: () => void; tint?: string;
}> = ({ label, active, onClick, tint = BRAND_DK }) => (
  <button type="button" onClick={onClick} style={{
    padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    border: `1px solid ${active ? tint : LINE}`,
    background: active ? tint : "white",
    color: active ? "white" : "#374151",
    cursor: "pointer", transition: "all .15s ease",
  }}>
    {label}
  </button>
);

const DocumentCard: React.FC<{
  doc: OrgDocument;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onDownload: () => void;
}> = ({ doc, onEdit, onDelete, onView, onDownload }) => {
  const meta = CATEGORY_META[doc.category];
  const Icon = meta.icon;
  return (
    <div style={{
      background: "white", border: `1px solid ${LINE}`, borderRadius: 12,
      padding: 16, display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: meta.bg, color: meta.color,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {doc.title}
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>
            {meta.label} · {formatDate(doc.uploadedAt)}
          </div>
        </div>
      </div>

      {doc.description && (
        <p style={{
          margin: 0, fontSize: 12.5, color: "#4B5563", lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {doc.description}
        </p>
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderTop: `1px solid ${LINE}`, paddingTop: 10, gap: 8,
      }}>
        <span style={{ fontSize: 11, color: MUTED }}>
          {doc.fileName} · {formatBytes(doc.size)}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn title="View"    onClick={onView}><FaEye size={12} /></IconBtn>
          <IconBtn title="Download" onClick={onDownload}><FaDownload size={12} /></IconBtn>
          <IconBtn title="Edit"    onClick={onEdit}><FaPencilAlt size={11} /></IconBtn>
          <IconBtn title="Delete"  onClick={onDelete} danger><FaTrash size={11} /></IconBtn>
        </div>
      </div>
    </div>
  );
};

const IconBtn: React.FC<React.PropsWithChildren<{
  title: string; onClick: () => void; danger?: boolean;
}>> = ({ title, onClick, danger, children }) => (
  <button
    type="button" title={title} aria-label={title} onClick={onClick}
    style={{
      width: 30, height: 30, borderRadius: 8,
      background: danger ? "#FEF2F2" : "#F1F5F9",
      color: danger ? "#B91C1C" : "#334155",
      border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background .15s ease",
    }}
    onMouseEnter={e => (e.currentTarget.style.background = danger ? "#FEE2E2" : "#E2E8F0")}
    onMouseLeave={e => (e.currentTarget.style.background = danger ? "#FEF2F2" : "#F1F5F9")}
  >
    {children}
  </button>
);

export default DocumentsLibraryTab;
