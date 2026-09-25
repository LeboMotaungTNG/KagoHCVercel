import React, { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { C, R, SHADOW_L } from "../utils/employee";
import {
  type OrgDocument,
  downloadDataUrl,
  formatBytes,
  formatDate,
  getEmployeeDocument,
} from "../utils/documentsLibrary";

type PreviewKind = "pdf" | "image" | "text" | "unsupported";

const previewKind = (mimeType: string, fileName: string): PreviewKind => {
  const mime = (mimeType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return "image";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("text/") || /\.(txt|csv|md|log)$/.test(name)) return "text";
  return "unsupported";
};

const decodeTextDataUrl = (dataUrl: string): string => {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return dataUrl;
    const meta = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    if (meta.includes(";base64")) {
      const binary = atob(payload);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(payload);
  } catch {
    return "";
  }
};

const openInNewTab = (doc: OrgDocument) => {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  if ((doc.mimeType || "").startsWith("image/")) {
    w.document.write(
      `<title>${doc.title}</title>` +
      `<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh">` +
      `<img src="${doc.dataUrl}" style="max-width:100%;max-height:100vh"/></body>`,
    );
  } else {
    w.location.href = doc.dataUrl;
  }
};

export const DocumentPreviewModal: React.FC<{
  doc: OrgDocument | null;
  onClose: () => void;
}> = ({ doc, onClose }) => {
  const [resolved, setResolved] = useState<OrgDocument | null>(doc);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResolved(doc);
    if (!doc) return;
    if (doc.dataUrl) return;
    let cancelled = false;
    setLoading(true);
    getEmployeeDocument(doc.id)
      .then((full) => {
        if (!cancelled && full) setResolved(full);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [doc, onClose]);

  const kind = useMemo(
    () => (resolved ? previewKind(resolved.mimeType, resolved.fileName) : "unsupported"),
    [resolved],
  );
  const textBody = useMemo(
    () => (kind === "text" && resolved?.dataUrl ? decodeTextDataUrl(resolved.dataUrl) : ""),
    [kind, resolved],
  );

  if (!doc) return null;
  const current = resolved || doc;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${current.title}`}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 5000,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(960px, 100%)",
          height: "min(86vh, 820px)",
          background: C.surface,
          borderRadius: R.xl,
          boxShadow: SHADOW_L,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <header style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 12, padding: "14px 16px", borderBottom: `1px solid ${C.line}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1.3 }}>
              {current.title}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {current.fileName} · {formatBytes(current.size)} · {formatDate(current.uploadedAt)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {current.dataUrl && (
              <>
                <HeaderBtn onClick={() => downloadDataUrl(current.dataUrl, current.fileName)}>
                  <Download size={14} /> Download
                </HeaderBtn>
                <HeaderBtn onClick={() => openInNewTab(current)}>
                  <ExternalLink size={14} /> Open
                </HeaderBtn>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              style={{
                width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.line}`,
                background: C.surface, color: C.text, cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, background: C.surfaceAlt }}>
          {loading && (
            <Fallback
              title="Loading preview…"
              body="Fetching the document so you can look at it here."
            />
          )}
          {!loading && !current.dataUrl && (
            <Fallback
              title="Preview unavailable"
              body="This file could not be loaded for a quick look. Try downloading it instead."
            />
          )}
          {!loading && current.dataUrl && kind === "image" && (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16, overflow: "auto",
            }}>
              <img
                src={current.dataUrl}
                alt={current.title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          )}
          {!loading && current.dataUrl && kind === "pdf" && (
            <iframe
              title={current.title}
              src={current.dataUrl}
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
            />
          )}
          {!loading && current.dataUrl && kind === "text" && (
            <pre style={{
              margin: 0, height: "100%", overflow: "auto", padding: 18,
              fontSize: 13, lineHeight: 1.5, color: C.ink, whiteSpace: "pre-wrap",
            }}>
              {textBody || "This text file could not be decoded for preview."}
            </pre>
          )}
          {!loading && current.dataUrl && kind === "unsupported" && (
            <Fallback
              title="Quick look isn’t available for this file type"
              body="Word and similar files can’t be previewed in the browser. Download or open them in a new tab instead."
              icon
            />
          )}
        </div>
      </div>
    </div>
  );
};

const HeaderBtn: React.FC<React.PropsWithChildren<{ onClick: () => void }>> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "8px 12px", borderRadius: 10,
      border: `1px solid ${C.line}`, background: C.surface, color: C.text,
      fontSize: 12, fontWeight: 700, cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const Fallback: React.FC<{ title: string; body: string; icon?: boolean }> = ({ title, body, icon }) => (
  <div style={{
    height: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32,
  }}>
    {icon && <div style={{ color: C.primary, marginBottom: 12 }}><FileText size={36} /></div>}
    <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{title}</div>
    <p style={{ margin: "8px 0 0", fontSize: 13, color: C.muted, maxWidth: 420 }}>{body}</p>
  </div>
);
