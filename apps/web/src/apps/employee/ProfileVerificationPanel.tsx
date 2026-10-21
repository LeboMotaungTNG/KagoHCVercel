import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Clock3, FileCheck2, FileUp, LockKeyhole, Send, ShieldCheck } from "lucide-react";
import {
  fetchProfileCompletion,
  profileFormFromExisting,
  saveVerificationProfile,
  submitProfileForVerification,
  uploadVerificationDocument,
  type ProfileCompletion,
  type ProfileFormData,
} from "../../shared/utils/profileVerification";

const API = (import.meta as any).env?.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";
const colors = { ink: "#1d2939", muted: "#667085", line: "#e4e7ec", teal: "#167d8d", tealSoft: "#e8f5f5", red: "#b42318", redSoft: "#fef3f2", green: "#067647", greenSoft: "#ecfdf3", amber: "#b54708", amberSoft: "#fffaeb" };

const inputStyle: React.CSSProperties = { width: "100%", minWidth: 0, boxSizing: "border-box", border: `1px solid ${colors.line}`, borderRadius: 8, padding: "9px 11px", font: "inherit", fontSize: 13, color: colors.ink, background: "#fff" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 5, fontSize: 11, fontWeight: 700, color: colors.muted };

const Field: React.FC<{ label: string; value: string; type?: string; disabled?: boolean; onChange: (value: string) => void }> = ({ label, value, type, disabled, onChange }) => (
  <label style={{ display: "block", minWidth: 0 }}>
    <span style={labelStyle}>{label}</span>
    <input style={{ ...inputStyle, background: disabled ? "#f8fafc" : "#fff" }} type={type || "text"} value={value} disabled={disabled} onChange={event => onChange(event.target.value)} />
  </label>
);

const statusCopy: Record<string, { title: string; text: string; color: string; bg: string }> = {
  incomplete: { title: "Complete your profile", text: "Fill in the required details and upload your ID and proof of address. HR must verify them before the other sections unlock.", color: colors.amber, bg: colors.amberSoft },
  rejected: { title: "Updates requested by HR", text: "Review the notes below, correct the requested information or document, and submit again.", color: colors.red, bg: colors.redSoft },
  pending_verification: { title: "Waiting for HR verification", text: "Your profile is submitted. You can still view its status here while HR reviews your information.", color: colors.teal, bg: colors.tealSoft },
  verified: { title: "Profile verified", text: "Your required profile details and documents have been approved.", color: colors.green, bg: colors.greenSoft },
};

const ProfileVerificationPanel: React.FC<{ profile: any }> = ({ profile }) => {
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [form, setForm] = useState<ProfileFormData>(() => profileFormFromExisting(profile));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const idInput = useRef<HTMLInputElement>(null);
  const addressInput = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const token = localStorage.getItem("token") || "";
    if (!token) throw new Error("Session expired. Please sign in again.");
    const [nextCompletion, freshProfile] = await Promise.all([
      fetchProfileCompletion(token),
      fetch(`${API}/employees/me`, { headers: { Authorization: `Bearer ${token}` } }).then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.message || "Could not load profile fields.");
        return body?.data || {};
      }),
    ]);
    setCompletion(nextCompletion);
    setForm(profileFormFromExisting({
      personal: {
        firstName: freshProfile.firstName,
        lastName: freshProfile.lastName,
        idNumber: freshProfile.idNumber,
        passportNumber: freshProfile.passportNumber,
        dateOfBirth: freshProfile.dateOfBirth,
        gender: freshProfile.gender,
        nationality: freshProfile.nationality,
      },
      contact: {
        personalPhone: freshProfile.phone,
        address: freshProfile.address?.street,
        city: freshProfile.address?.city,
        province: freshProfile.address?.province,
        postalCode: freshProfile.address?.postalCode,
        country: freshProfile.address?.country,
      },
      emergency: freshProfile.emergencyContact,
      banking: {
        bankName: freshProfile.bankName,
        accountNumber: freshProfile.bankAccountNumber,
        branchCode: freshProfile.bankBranchCode,
      },
    }));
  };

  useEffect(() => {
    let live = true;
    setLoading(true);
    reload().catch(error => {
      if (live) setNotice({ text: error instanceof Error ? error.message : "Could not load verification status.", error: true });
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const update = (path: string, value: string) => {
    setForm(previous => {
      const next = structuredClone(previous);
      const keys = path.split(".");
      let target: any = next;
      for (const key of keys.slice(0, -1)) target = target[key];
      target[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const token = localStorage.getItem("token") || "";
      const next = await saveVerificationProfile(token, form);
      setCompletion(next);
      setNotice({ text: "Profile details saved." });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Could not save profile.", error: true });
    } finally { setSaving(false); }
  };

  const upload = async (type: "identity" | "proof_of_address", file?: File) => {
    if (!file) return;
    setUploading(type);
    setNotice(null);
    try {
      const token = localStorage.getItem("token") || "";
      const next = await uploadVerificationDocument(token, type, file);
      setCompletion(next);
      setNotice({ text: `${type === "identity" ? "ID document" : "Proof of address"} uploaded.` });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Could not upload document.", error: true });
    } finally {
      setUploading(null);
      if (type === "identity" && idInput.current) idInput.current.value = "";
      if (type === "proof_of_address" && addressInput.current) addressInput.current.value = "";
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setNotice(null);
    try {
      const token = localStorage.getItem("token") || "";
      const next = await submitProfileForVerification(token);
      setCompletion(next);
      setNotice({ text: "Submitted to HR for verification." });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Could not submit profile.", error: true });
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ margin: "0 0 22px", border: `1px solid ${colors.line}`, borderRadius: 12, background: "#fff", padding: 20, color: colors.muted }}>Loading profile verification…</div>;
  if (!completion) return <div role="alert" style={{ margin: "0 0 22px", border: "1px solid #fecdca", borderRadius: 12, background: colors.redSoft, padding: 16, color: colors.red }}>{notice?.text || "Profile verification is unavailable."}</div>;

  const copy = statusCopy[completion.status] || statusCopy.incomplete;
  const editable = completion.canEdit;
  const checklistSections = ["personal", "contact", "emergency", "banking", "documents"];
  const groupNames: Record<string, string> = { personal: "Personal details", contact: "Contact and address", emergency: "Emergency contact", banking: "Bank details", documents: "Required documents" };
  const docTypes = [
    { type: "identity" as const, label: "ID document", input: idInput },
    { type: "proof_of_address" as const, label: "Proof of address", input: addressInput },
  ];

  return (
    <section style={{ margin: "0 0 22px", border: `1px solid ${colors.line}`, borderRadius: 12, background: "#fff", overflow: "hidden", boxShadow: "0 1px 3px rgba(16,24,40,.05)" }}>
      <div style={{ padding: "18px 20px", background: copy.bg, borderBottom: `1px solid ${colors.line}`, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: "#fff", color: copy.color }}>
            {completion.status === "verified" ? <ShieldCheck size={21} /> : completion.status === "pending_verification" ? <Clock3 size={21} /> : <LockKeyhole size={21} />}
          </span>
          <div><h2 style={{ margin: 0, fontSize: 17, color: colors.ink }}>{copy.title}</h2><p style={{ margin: "4px 0 0", fontSize: 12.5, color: colors.muted }}>{copy.text}</p></div>
        </div>
        <div style={{ minWidth: 160, textAlign: "right" }}>
          <strong style={{ color: copy.color }}>{completion.progress.percent}%</strong>
          <div style={{ height: 6, background: "rgba(16,24,40,.1)", borderRadius: 9, overflow: "hidden", marginTop: 6 }}><div style={{ height: "100%", width: `${completion.progress.percent}%`, background: copy.color }} /></div>
          <small style={{ color: colors.muted }}>{completion.progress.done} of {completion.progress.total} complete</small>
        </div>
      </div>

      {notice && <div role={notice.error ? "alert" : "status"} style={{ padding: "10px 20px", color: notice.error ? colors.red : colors.green, background: notice.error ? colors.redSoft : colors.greenSoft, fontSize: 13 }}>{notice.text}</div>}

      {completion.status === "rejected" && completion.rejectionReasons.length > 0 && (
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ borderRadius: 8, border: "1px solid #fecdca", background: colors.redSoft, padding: 12, color: colors.red, fontSize: 13 }}>
            <strong>HR requested these changes</strong>
            {completion.rejectionReasons.map((reason, index) => <div key={`${reason.item}-${index}`} style={{ marginTop: 6 }}>{reason.item}: {reason.reason}</div>)}
          </div>
        </div>
      )}

      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, .8fr)", gap: 22 }}>
        <div>
          {editable && <>
            <h3 style={{ margin: "0 0 12px", color: colors.ink, fontSize: 14 }}>Required information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              <Field label="First name" value={form.firstName} disabled={!editable} onChange={value => update("firstName", value)} />
              <Field label="Last name" value={form.lastName} disabled={!editable} onChange={value => update("lastName", value)} />
              <Field label="SA ID number" value={form.idNumber} disabled={!editable} onChange={value => update("idNumber", value)} />
              <Field label="Passport number" value={form.passportNumber} disabled={!editable} onChange={value => update("passportNumber", value)} />
              <Field label="Date of birth" type="date" value={form.dateOfBirth} disabled={!editable} onChange={value => update("dateOfBirth", value)} />
              <label><span style={labelStyle}>Gender</span><select style={inputStyle} value={form.gender} disabled={!editable} onChange={event => update("gender", event.target.value)}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
              <Field label="Nationality" value={form.nationality} disabled={!editable} onChange={value => update("nationality", value)} />
              <Field label="Phone number" value={form.phone} disabled={!editable} onChange={value => update("phone", value)} />
              <Field label="Street address" value={form.address.street} disabled={!editable} onChange={value => update("address.street", value)} />
              <Field label="Suburb" value={form.address.suburb} disabled={!editable} onChange={value => update("address.suburb", value)} />
              <Field label="City or town" value={form.address.city} disabled={!editable} onChange={value => update("address.city", value)} />
              <Field label="Province" value={form.address.province} disabled={!editable} onChange={value => update("address.province", value)} />
              <Field label="Postal code" value={form.address.postalCode} disabled={!editable} onChange={value => update("address.postalCode", value)} />
              <Field label="Country" value={form.address.country} disabled={!editable} onChange={value => update("address.country", value)} />
              <Field label="Emergency contact name" value={form.emergencyContact.name} disabled={!editable} onChange={value => update("emergencyContact.name", value)} />
              <Field label="Relationship" value={form.emergencyContact.relationship} disabled={!editable} onChange={value => update("emergencyContact.relationship", value)} />
              <Field label="Emergency phone" value={form.emergencyContact.phone} disabled={!editable} onChange={value => update("emergencyContact.phone", value)} />
              <Field label="Emergency email (optional)" value={form.emergencyContact.email} disabled={!editable} onChange={value => update("emergencyContact.email", value)} />
              <Field label="Bank name" value={form.bankName} disabled={!editable} onChange={value => update("bankName", value)} />
              <Field label="Bank account number" value={form.bankAccountNumber} disabled={!editable} onChange={value => update("bankAccountNumber", value)} />
              <Field label="Branch code" value={form.bankBranchCode} disabled={!editable} onChange={value => update("bankBranchCode", value)} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button type="button" disabled={saving} onClick={save} style={{ ...buttonStyle, background: colors.teal }}>{saving ? "Saving…" : "Save profile details"}</button>
            </div>
          </>}

          <h3 style={{ margin: editable ? "22px 0 12px" : "0 0 12px", color: colors.ink, fontSize: 14 }}>Completion checklist</h3>
          {checklistSections.map(section => {
            const items = completion.checklist.filter(item => item.section === section);
            if (!items.length) return null;
            return <div key={section} style={{ marginBottom: 12 }}><h4 style={{ margin: "0 0 6px", fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: .5 }}>{groupNames[section]}</h4>
              {items.map(item => <div key={item.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", color: item.done ? colors.green : colors.muted, fontSize: 12.5 }}><span style={{ width: 18, flexShrink: 0 }}>{item.done ? <Check size={15} /> : <AlertCircle size={15} />}</span><span>{item.label}{item.hint && !item.done && <small style={{ display: "block", color: colors.amber }}>{item.hint}</small>}</span></div>)}
            </div>;
          })}
        </div>

        <aside style={{ borderLeft: `1px solid ${colors.line}`, paddingLeft: 20 }}>
          <h3 style={{ margin: "0 0 8px", color: colors.ink, fontSize: 14 }}>Verification documents</h3>
          <p style={{ margin: "0 0 14px", color: colors.muted, fontSize: 12 }}>Upload a clear PDF, JPG or PNG. Proof of address should be no older than three months.</p>
          {docTypes.map(({ type, label, input }) => {
            const doc = completion.documents[type];
            return <div key={type} style={{ border: `1px solid ${colors.line}`, borderRadius: 9, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.ink, fontWeight: 600, fontSize: 12.5 }}><FileCheck2 size={16} />{label}</div>
              {doc ? <p style={{ margin: "8px 0", color: doc.verificationStatus === "rejected" ? colors.red : colors.muted, fontSize: 11.5 }}>{doc.fileName} · {doc.verificationStatus}{doc.rejectionReason ? ` · ${doc.rejectionReason}` : ""}</p> : <p style={{ margin: "8px 0", color: colors.muted, fontSize: 11.5 }}>Not uploaded</p>}
              <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" disabled={!editable || uploading === type} onChange={event => { void upload(type, event.target.files?.[0]); }} style={{ display: "none" }} />
              <button type="button" disabled={!editable || uploading === type} onClick={() => input.current?.click()} style={{ ...buttonStyle, width: "100%", justifyContent: "center", background: "#f8fafc", border: `1px solid ${colors.line}`, color: colors.ink }}><FileUp size={15} />{uploading === type ? "Uploading…" : doc ? "Replace document" : "Upload document"}</button>
            </div>;
          })}
          {completion.pendingBankDetails && <p style={{ borderRadius: 8, background: colors.amberSoft, color: colors.amber, padding: 10, fontSize: 12 }}>Bank details are waiting for HR approval. Current payroll details remain unchanged.</p>}
          <button type="button" disabled={!completion.canSubmit || submitting} onClick={submit} style={{ ...buttonStyle, width: "100%", justifyContent: "center", marginTop: 8, opacity: completion.canSubmit ? 1 : .5, background: colors.teal }}><Send size={15} />{submitting ? "Submitting…" : completion.status === "rejected" ? "Resubmit for verification" : "Submit for verification"}</button>
          {!completion.canSubmit && editable && <small style={{ display: "block", color: colors.muted, marginTop: 8 }}>Complete all checklist items and upload both documents to submit.</small>}
          {completion.status === "pending_verification" && <p style={{ marginTop: 12, color: colors.teal, fontSize: 12 }}><Clock3 size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Under HR review</p>}
          {completion.status === "verified" && <p style={{ marginTop: 12, color: colors.green, fontSize: 12 }}><CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Verified</p>}
        </aside>
      </div>
    </section>
  );
};

const buttonStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, border: 0, borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };

export default ProfileVerificationPanel;
