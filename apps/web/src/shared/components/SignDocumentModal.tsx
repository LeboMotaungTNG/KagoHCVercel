// apps/web/src/shared/components/SignDocumentModal.tsx
//
// Lets an employee sign a document: read it, type their full name, draw their
// signature (mouse, finger or stylus) and confirm they agree. The backend stores
// the signature with the time, IP address and a fingerprint of the exact file.

import React, { useEffect, useRef, useState } from "react";
import { FileText, PenLine, RotateCcw, X } from "lucide-react";
import { signDocument, type OrgDocument } from "../utils/documentsLibrary";

const INK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";
const ACCENT = "#0F766E";

/** Open the document in a new tab (blob URL: browsers block opening data: URLs directly). */
const openDocument = async (doc: OrgDocument) => {
  if (!doc.dataUrl) return;
  const blob = await (await fetch(doc.dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const SignaturePad: React.FC<{ onChange: (dataUrl: string | null) => void; resetKey: number }> = ({ onChange, resetKey }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  useEffect(() => {
    const c = ctx();
    if (!c || !canvasRef.current) return;
    c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    c.lineWidth = 2.6;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = INK;
    hasInk.current = false;
    onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const c = ctx();
    if (c && last.current) {
      c.beginPath();
      c.arc(last.current.x, last.current.y, 1.2, 0, Math.PI * 2);
      c.fillStyle = INK;
      c.fill();
    }
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = ctx();
    const p = point(e);
    if (c && last.current) {
      c.beginPath();
      c.moveTo(last.current.x, last.current.y);
      c.lineTo(p.x, p.y);
      c.stroke();
      hasInk.current = true;
    }
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (hasInk.current && canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={180}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      aria-label="Signature pad: draw your signature"
      style={{
        width: "100%", height: 150, display: "block",
        background: "#fff", border: `1.5px dashed ${LINE}`, borderRadius: 10,
        cursor: "crosshair", touchAction: "none",
      }}
    />
  );
};

export const SignDocumentModal: React.FC<{
  doc: OrgDocument | null;
  defaultName?: string;
  onClose: () => void;
  onSigned: (doc: OrgDocument, signedAt: string) => void;
}> = ({ doc, defaultName = "", onClose, onSigned }) => {
  const [name, setName] = useState(defaultName);
  const [signature, setSignature] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!doc) return;
    setName(defaultName);
    setAgree(false);
    setError(null);
    setResetKey(k => k + 1);
  }, [doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!doc) return null;

  const missing = !name.trim()
    ? "Type your full name."
    : !signature
      ? "Draw your signature in the box."
      : !agree
        ? 'Tick "I have read and agree".'
        : null;

  const submit = async () => {
    if (missing) { setError(missing); return; }
    setBusy(true);
    setError(null);
    try {
      const result = await signDocument(doc.id, { signerName: name.trim(), signatureImage: signature!, agree: true });
      onSigned(doc, result.signedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const due = doc.signatureDueDate ? new Date(doc.signatureDueDate) : null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Sign ${doc.title}`}
      onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000, background: "rgba(17,24,39,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}>
      <div style={{
        width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
        background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", padding: 22,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: ACCENT, textTransform: "uppercase" }}>
              <PenLine size={13} /> Sign document
            </div>
            <h2 style={{ margin: "6px 0 2px", fontSize: 19, color: INK }}>{doc.title}</h2>
            {due && (
              <div style={{ fontSize: 12.5, color: MUTED }}>
                Please sign by {due.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: MUTED, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <button type="button" onClick={() => void openDocument(doc)}
          style={{
            marginTop: 14, width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", borderRadius: 10, border: `1px solid ${LINE}`, background: "#F9FAFB",
            cursor: "pointer", textAlign: "left", color: INK, fontSize: 13.5, fontWeight: 600,
          }}>
          <FileText size={18} color={ACCENT} />
          <span style={{ flex: 1 }}>Read the document before signing<br />
            <span style={{ fontWeight: 400, color: MUTED, fontSize: 12 }}>{doc.fileName} · opens in a new tab</span>
          </span>
        </button>

        <label style={{ display: "block", marginTop: 16, fontSize: 12.5, fontWeight: 700, color: INK }}>
          Full name
          <input value={name} onChange={e => setName(e.target.value)} autoComplete="name"
            placeholder="Your full name"
            style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 14, boxSizing: "border-box" }} />
        </label>

        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>Signature</span>
            <button type="button" onClick={() => setResetKey(k => k + 1)}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>
              <RotateCcw size={12} /> Clear
            </button>
          </div>
          <SignaturePad onChange={setSignature} resetKey={resetKey} />
          <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6 }}>Draw with your mouse, finger or stylus.</div>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 14, fontSize: 13, color: INK, cursor: "pointer" }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
          <span>I have read and agree to this document, and I understand that this electronic signature is legally binding.</span>
        </label>

        {error && (
          <div role="alert" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#FEF2F2", color: "#B91C1C", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} disabled={busy}
            style={{ padding: "10px 16px", borderRadius: 999, border: `1px solid ${LINE}`, background: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Cancel
          </button>
          <button type="button" onClick={() => void submit()} disabled={busy}
            style={{
              padding: "10px 18px", borderRadius: 999, border: "none", cursor: busy ? "default" : "pointer",
              background: missing ? "#9CA3AF" : ACCENT, color: "#fff", fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
            <PenLine size={14} /> {busy ? "Signing…" : "Sign and submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignDocumentModal;
