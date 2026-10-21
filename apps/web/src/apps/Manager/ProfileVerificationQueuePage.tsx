import React, { useCallback, useEffect, useState } from "react";
import { Check, ChevronRight, Clock3, FileText, LockKeyhole, RefreshCw, ShieldCheck, UserRound, X } from "lucide-react";
import AppShell from "../../shared/components/AppShell";
import {
  fetchEmployeeVerification,
  fetchVerificationDocument,
  fetchVerificationQueue,
  grantEmployeeEarlyAccess,
  reviewEmployeeProfile,
  type VerificationQueueEmployee,
} from "../../shared/utils/profileVerification";

const API_URL = (import.meta as any).env?.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";
const ink = "#1d2939";
const muted = "#667085";
const line = "#e4e7ec";
const teal = "#167d8d";
const card: React.CSSProperties = { background: "#fff", border: `1px solid ${line}`, borderRadius: 10, padding: 18 };
const smallButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${line}`, background: "#fff", color: ink, borderRadius: 7, padding: "8px 10px", fontSize: 12, fontWeight: 650, cursor: "pointer" };

const HrProfileVerificationPage: React.FC = () => {
  const [rows, setRows] = useState<VerificationQueueEmployee[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Array<{ item: string; reason: string }>>([{ item: "general", reason: "" }]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const token = () => localStorage.getItem("token") || "";
  const reloadQueue = useCallback(async (keepSelection = true) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchVerificationQueue(token());
      setRows(result.employees);
      setCounts(result.counts || {});
      const nextSelected = keepSelection && result.employees.some(row => row.id === selectedId) ? selectedId : result.employees[0]?.id || "";
      setSelectedId(nextSelected);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load the verification queue.");
    } finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { void reloadQueue(false); }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); setDocumentUrls({}); return; }
    let active = true;
    setDetail(null);
    setDocumentUrls({});
    fetchEmployeeVerification(token(), selectedId).then(async result => {
      if (!active) return;
      setDetail(result);
      const docs = Object.values(result.documents || {}) as any[];
      const pairs = await Promise.all(docs.map(async doc => {
        const file = await fetchVerificationDocument(token(), selectedId, doc.id);
        return [doc.id, file.dataUrl] as const;
      }));
      if (active) setDocumentUrls(Object.fromEntries(pairs));
    }).catch(loadError => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Could not load employee details.");
    });
    return () => { active = false; };
  }, [selectedId]);

  const runReview = async (action: "approve" | "reject") => {
    if (!selectedId) return;
    if (action === "reject" && reasons.some(reason => reason.reason.trim().length < 5)) {
      setError("Add a clear reason of at least 5 characters, or remove the unused reason row.");
      return;
    }
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await reviewEmployeeProfile(token(), selectedId, action, action === "reject" ? reasons : undefined);
      setNotice(action === "approve" ? "Profile approved and access unlocked." : "Changes requested; employee notified.");
      await reloadQueue(false);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Review action failed.");
    } finally { setBusy(false); }
  };

  const toggleEarlyAccess = async (granted: boolean) => {
    if (!selectedId) return;
    setBusy(true);
    setError("");
    try {
      await grantEmployeeEarlyAccess(token(), selectedId, granted);
      setNotice(granted ? "Early access granted." : "Early access removed.");
      await reloadQueue(true);
      const nextDetail = await fetchEmployeeVerification(token(), selectedId);
      setDetail(nextDetail);
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : "Could not update early access.");
    } finally { setBusy(false); }
  };

  const addReason = () => setReasons(previous => [...previous, { item: "general", reason: "" }]);
  const updateReason = (index: number, key: "item" | "reason", value: string) => setReasons(previous => previous.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const removeReason = (index: number) => setReasons(previous => previous.length > 1 ? previous.filter((_, i) => i !== index) : [{ item: "general", reason: "" }]);

  return (
    <AppShell title="Profile Verification" role="manager">
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 8px 60px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <div><h1 style={{ color: ink, fontSize: 23, margin: 0 }}>Profile verification</h1><p style={{ color: muted, margin: "5px 0 0", fontSize: 13 }}>Review employee details and required documents before unlocking their modules.</p></div>
          <button type="button" style={smallButton} onClick={() => void reloadQueue(false)}><RefreshCw size={15} /> Refresh</button>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(275px, .75fr) minmax(0, 1.65fr)", gap: 16, alignItems: "start" }}>
          <section style={card}>
            <h2 style={{ color: ink, fontSize: 15, margin: "0 0 12px" }}>Needs review <span style={{ color: muted }}>({counts.needs_review ?? rows.length})</span></h2>
            {loading ? <p style={{ color: muted, fontSize: 13 }}>Loading queue…</p> : rows.length === 0 ? <div style={{ padding: "30px 10px", textAlign: "center", color: muted, fontSize: 13 }}><ShieldCheck size={28} style={{ color: teal, marginBottom: 8 }} /><div>No profiles need review.</div></div> : (
              <div style={{ display: "grid", gap: 7 }}>
                {rows.map(row => <button key={row.id} type="button" onClick={() => { setSelectedId(row.id); setReasons([{ item: "general", reason: "" }]); }} style={{ border: `1px solid ${selectedId === row.id ? teal : line}`, borderRadius: 8, background: selectedId === row.id ? "#f0fafa" : "#fff", textAlign: "left", padding: 11, cursor: "pointer", color: ink }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}><strong style={{ fontSize: 13 }}>{row.name}</strong><ChevronRight size={15} color={muted} /></div>
                  <div style={{ color: muted, fontSize: 11.5, marginTop: 4 }}>{row.department} · {row.position}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, fontSize: 11, color: row.hasPendingBankChange ? "#b54708" : muted }}><Clock3 size={12} />{row.hasPendingBankChange ? "Bank change" : row.status?.replaceAll("_", " ")}</div>
                </button>)}
              </div>
            )}
          </section>

          <main style={{ display: "grid", gap: 14 }}>
            {error && <div role="alert" style={{ background: "#fef3f2", border: "1px solid #fecdca", borderRadius: 8, padding: 11, color: "#b42318", fontSize: 13 }}>{error}</div>}
            {notice && <div role="status" style={{ background: "#ecfdf3", border: "1px solid #abefc6", borderRadius: 8, padding: 11, color: "#067647", fontSize: 13 }}>{notice}</div>}
            {!selectedId ? <section style={{ ...card, minHeight: 230, display: "grid", placeItems: "center", color: muted }}>Select a profile to review.</section> : !detail ? <section style={card}>Loading profile details…</section> : <>
              <section style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "start" }}>
                  <div><h2 style={{ margin: 0, color: ink, fontSize: 18 }}>{detail.employee?.firstName} {detail.employee?.lastName}</h2><p style={{ margin: "4px 0 0", color: muted, fontSize: 12.5 }}>{detail.employee?.email} · {detail.employee?.department} · {detail.employee?.position}</p></div>
                  <span style={{ background: detail.modulesUnlocked ? "#ecfdf3" : "#fffaeb", color: detail.modulesUnlocked ? "#067647" : "#b54708", padding: "5px 9px", borderRadius: 999, fontWeight: 700, fontSize: 11 }}>{detail.status?.replaceAll("_", " ")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "9px 18px", marginTop: 16, fontSize: 12.5 }}>
                  {Object.entries({ "ID number": detail.employee?.idNumber, Passport: detail.employee?.passportNumber, "Date of birth": detail.employee?.dateOfBirth?.slice?.(0, 10), Gender: detail.employee?.gender, Nationality: detail.employee?.nationality, Phone: detail.employee?.phone, "Street address": detail.employee?.address?.street, City: detail.employee?.address?.city, Province: detail.employee?.address?.province, "Postal code": detail.employee?.address?.postalCode, "Emergency contact": detail.employee?.emergencyContact?.name, "Emergency phone": detail.employee?.emergencyContact?.phone }).map(([label, value]) => <div key={label}><span style={{ color: muted }}>{label}</span><div style={{ color: ink, fontWeight: 600, marginTop: 2 }}>{String(value || "—")}</div></div>)}
                </div>
                {detail.pendingBankDetails && <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#fffaeb", border: "1px solid #fedf89" }}><strong style={{ color: "#92400e", fontSize: 12 }}>Bank details pending approval</strong><div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: ink, marginTop: 6 }}><span>{detail.pendingBankDetails.bankName || "Bank"}</span><span>Account: {detail.pendingBankDetails.bankAccountNumber}</span><span>Branch: {detail.pendingBankDetails.bankBranchCode || "—"}</span></div></div>}
              </section>

              <section style={card}>
                <h3 style={{ margin: "0 0 12px", fontSize: 14, color: ink }}>Documents and checklist</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                  {Object.values(detail.documents || {}).map((doc: any) => <DocumentPreview key={doc.id} doc={doc} src={documentUrls[doc.id]} />)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 7, marginTop: 14 }}>
                  {(detail.checklist || []).map((item: any) => <div key={item.key} style={{ display: "flex", gap: 7, alignItems: "start", color: item.done ? "#067647" : "#b54708", fontSize: 12 }}><span>{item.done ? <Check size={14} /> : <X size={14} />}</span><span>{item.label}{item.hint && !item.done ? ` · ${item.hint}` : ""}</span></div>)}
                </div>
              </section>

              <section style={card}>
                <h3 style={{ margin: "0 0 10px", fontSize: 14, color: ink }}>Request changes</h3>
                {reasons.map((reason, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(150px, .7fr) minmax(0, 1.3fr) auto", gap: 8, marginBottom: 8 }}>
                  <select value={reason.item} onChange={event => updateReason(index, "item", event.target.value)} style={inputStyle}><option value="general">General note</option>{(detail.checklist || []).map((item: any) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
                  <input value={reason.reason} onChange={event => updateReason(index, "reason", event.target.value)} placeholder="Explain what must be corrected" style={inputStyle} />
                  <button type="button" onClick={() => removeReason(index)} style={smallButton} aria-label="Remove reason"><X size={14} /></button>
                </div>)}
                <button type="button" onClick={addReason} style={{ ...smallButton, marginTop: 2 }}>Add another reason</button>
              </section>

              <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" disabled={busy || detail.status === "verified"} onClick={() => void toggleEarlyAccess(!detail.earlyAccessGranted)} style={{ ...smallButton, opacity: busy || detail.status === "verified" ? .5 : 1 }}><LockKeyhole size={15} />{detail.earlyAccessGranted ? "Remove early access" : "Grant early access"}</button>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" disabled={busy} onClick={() => void runReview("reject")} style={{ ...smallButton, color: "#b42318", borderColor: "#fecdca" }}><X size={15} />Request changes</button>
                  <button type="button" disabled={busy || !detail.checklist?.every((item: any) => item.done)} onClick={() => void runReview("approve")} style={{ ...smallButton, background: teal, borderColor: teal, color: "#fff", opacity: busy || !detail.checklist?.every((item: any) => item.done) ? .5 : 1 }}><Check size={15} />Approve profile</button>
                </div>
              </section>
            </>}
          </main>
        </div>
      </div>
    </AppShell>
  );
};

const inputStyle: React.CSSProperties = { width: "100%", minWidth: 0, boxSizing: "border-box", border: `1px solid ${line}`, borderRadius: 7, background: "#fff", padding: "9px 10px", font: "inherit", fontSize: 12.5, color: ink };

const DocumentPreview: React.FC<{ doc: any; src?: string }> = ({ doc, src }) => (
  <div style={{ border: `1px solid ${line}`, borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
    <div style={{ padding: "9px 11px", display: "flex", gap: 7, alignItems: "center", background: "#fff", borderBottom: `1px solid ${line}`, fontSize: 12, color: ink }}><FileText size={15} /><strong>{doc.type === "identity" ? "ID document" : "Proof of address"}</strong><span style={{ marginLeft: "auto", color: muted }}>{doc.verificationStatus}</span></div>
    <div style={{ height: 245, display: "grid", placeItems: "center", color: muted, fontSize: 12 }}>
      {!src ? "Loading document…" : doc.mimeType === "application/pdf" ? <iframe title={doc.fileName} src={src} style={{ border: 0, width: "100%", height: "100%" }} /> : <img src={src} alt={doc.fileName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}
    </div>
  </div>
);

export default HrProfileVerificationPage;
