/**
 * EmployeeProfilePage – self-service profile for the logged-in employee.
 *
 * Visual language mirrors the new Owner OnboardingPage: gradient hero,
 * side-rail step nav, brand Section cards, lucide icons, brand tokens.
 * All logic lives in shared/utils/employeeProfile.ts. Saving writes back
 * to the real backend (`PUT /employees/:id`) and keeps a local cache for
 * skills / documents which the backend doesn't model.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Activity, Award, Briefcase, Building2, Calendar, Camera, Check, CheckCircle2,
  ChevronRight, Download, Edit3, FileText, Globe2, Heart, Landmark, Mail,
  MapPin, Phone, Plus, Save, Shield, Sparkles, Trash2, Upload, User as UserIcon, X,
} from "lucide-react";
import SharedLayout from "./SharedLayout";
import PhoneInput from "../../shared/components/PhoneInput";
import { C, FONT_NUM, R, SHADOW } from "../../shared/utils/employee";
import {
  type DocumentCategory,
  type DocumentEntry,
  type EmployeeProfileData,
  type ProfileSectionId,
  type SkillEntry,
  DOCUMENT_CATEGORIES,
  EMPTY_PROFILE,
  PROFILE_SECTIONS,
  SKILL_LEVEL_COLOR,
  SKILL_LEVELS,
  ageFromDob,
  createDocumentFromFile,
  documentIconFor,
  downloadDocument,
  formatDateLong,
  formatDateShort,
  formatDateTimeShort,
  formatFileSize,
  fullName,
  groupDocuments,
  initialsFor,
  loadEmployeeProfile,
  profileCompletion,
  pushActivity,
  readFileAsDataUrl,
  saveEmployeeProfileToApi,
  saveProfileLocal,
  yearsOfService,
} from "../../shared/utils/employeeProfile";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared inline styles
 * ─────────────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: R.xl,
  boxShadow: SHADOW,
  padding: 24,
};
const subtle: React.CSSProperties = { color: C.muted, fontSize: 13 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${C.line}`, background: "#fff",
  fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box",
  transition: "border-color .15s ease, box-shadow .15s ease",
};
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical", minHeight: 96, fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: 0.5,
  color: C.faint, marginBottom: 6,
};
const valueStyle: React.CSSProperties = {
  fontSize: 14, color: C.ink, fontWeight: 500, margin: 0,
  lineHeight: 1.5, wordBreak: "break-word",
};
const primaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, border: "none",
  background: "#0d9488", color: "#fff",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
  boxShadow: "0 4px 12px rgba(13,148,136,0.28)",
};
const secondaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10,
  border: `1px solid ${C.line}`, background: "#fff",
  color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const ghostBtn: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 8,
  border: "none", background: "transparent",
  color: C.muted, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};
const dash = <span style={{ color: C.faint }}>—</span>;

// Page-local accent: deep teal — more grounded/professional than the soft
// coral used by the rest of the employee app, while still complementing it.
const ACCENT    = "#0d9488";
const ACCENT_DK = "#0f766e";

/* ──────────────────────────────────────────────────────────────────────────
 * Section primitives – mirror the onboarding card pattern
 * ─────────────────────────────────────────────────────────────────────── */

const Section: React.FC<{
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, iconColor, title, subtitle, right, children }) => (
  <div style={card}>
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          width: 38, height: 38, borderRadius: 12,
          background: `${iconColor}1f`, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>{title}</h2>
          {subtitle && <p style={{ ...subtle, margin: "2px 0 0", fontSize: 12.5 }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Toast: React.FC<{ message: string; type: "success" | "error" }> = ({ message, type }) => (
  <div style={{
    position: "fixed", top: 84, right: 24, zIndex: 9999,
    padding: "12px 18px", borderRadius: 12,
    background: type === "success" ? "#ecfdf3" : "#fef2f2",
    color:      type === "success" ? "#027a48" : "#b42318",
    border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
    display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500,
    boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
  }}>
    {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
    {message}
  </div>
);

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string; accent: string }> = (
  { icon, label, value, accent },
) => (
  <div style={{
    background: C.surfaceAlt, border: `1px solid ${C.line}`,
    borderRadius: R.md, padding: 16,
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <span style={{
      width: 38, height: 38, borderRadius: 10,
      background: `${accent}1f`, color: accent,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{icon}</span>
    <div style={{ minWidth: 0 }}>
      <p style={{ ...subtle, margin: 0, fontSize: 12, fontWeight: 600 }}>{label}</p>
      <p style={{ ...FONT_NUM, margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{value}</p>
    </div>
  </div>
);

const Field: React.FC<{
  label: string; value?: string; editing: boolean;
  type?: string; placeholder?: string;
  onChange?: (v: string) => void;
}> = ({ label, value, editing, type = "text", placeholder, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {editing ? (
      type === "tel" ? (
        <PhoneInput value={value || ""} onChange={v => onChange?.(v)} />
      ) : (
        <input
          style={inputStyle}
          type={type}
          value={value || ""}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          onChange={e => onChange?.(e.target.value)}
        />
      )
    ) : (
      <p style={valueStyle}>{value || dash}</p>
    )}
  </div>
);

const FieldGrid: React.FC<{ cols?: number; children: React.ReactNode }> = ({ cols = 2, children }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 1 ? "100%" : "220px"}, 1fr))`,
    gap: 18,
  }}>{children}</div>
);

const EmptyHint: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div style={{
    padding: "36px 20px", textAlign: "center",
    background: C.surfaceAlt, borderRadius: R.md,
    border: `1px dashed ${C.line}`,
  }}>
    <div style={{ color: C.faint, marginBottom: 10 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</p>
    <p style={{ ...subtle, margin: "6px auto 0", maxWidth: 420 }}>{body}</p>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Section navigation rail config
 * ─────────────────────────────────────────────────────────────────────── */

const SECTION_META: Record<ProfileSectionId, {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  blurb: string;
}> = {
  overview:   { icon: Sparkles,  color: ACCENT,   blurb: "At-a-glance snapshot" },
  personal:   { icon: UserIcon,  color: C.purple, blurb: "Personal details" },
  employment: { icon: Briefcase, color: C.blue,   blurb: "Role & contract"   },
  contact:    { icon: Phone,     color: C.green,  blurb: "Reach you anywhere" },
  banking:    { icon: Landmark,  color: C.amber,  blurb: "Payroll information" },
  documents:  { icon: FileText,  color: C.pink,   blurb: "Uploads & paperwork" },
  skills:     { icon: Award,     color: C.green,  blurb: "Strengths and levels" },
  activity:   { icon: Activity,  color: C.blue,   blurb: "Recent profile changes" },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Main component
 * ─────────────────────────────────────────────────────────────────────── */

const userFromStorage = (): { _id?: string; email?: string; firstName?: string; lastName?: string } => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const EmployeeProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeProfileData>(EMPTY_PROFILE);
  const [draft, setDraft]     = useState<EmployeeProfileData>(EMPTY_PROFILE);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("overview");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("ID");
  const [skillDraft, setSkillDraft] = useState<{ name: string; level: SkillEntry["level"] }>({
    name: "", level: "Intermediate",
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const user = useMemo(userFromStorage, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const loaded = await loadEmployeeProfile(token, user);
        const { _meta, ...rest } = loaded;
        setProfile(rest);
        setDraft(rest);
        setEmployeeId(_meta.employeeId);
      } catch (err: any) {
        console.error(err);
        showToast(err?.message || "Could not load profile.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── Field editing helpers ──────────────────────────────────────────────
  const updateDraft = <K extends keyof EmployeeProfileData>(section: K, patch: Partial<EmployeeProfileData[K]>) =>
    setDraft(prev => ({ ...prev, [section]: { ...(prev[section] as any), ...patch } }));

  const startEdit  = () => { setDraft(profile); setEditing(true); };
  const cancelEdit = () => { setDraft(profile); setEditing(false); };

  const persist = (next: EmployeeProfileData, label?: string, description?: string) => {
    const stamped = label ? pushActivity(next, label, description) : { ...next, updatedAt: new Date().toISOString() };
    setProfile(stamped);
    setDraft(stamped);
    saveProfileLocal(stamped, user?.email);
    return stamped;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const next = pushActivity(draft, "Profile updated");
      if (employeeId) {
        const token = localStorage.getItem("token") || "";
        await saveEmployeeProfileToApi(employeeId, next, token);
        persist(next, "Profile updated", "Saved to KagoHC");
        showToast("Profile saved.", "success");
      } else {
        persist(next, "Profile updated", "Saved locally (no employee record found)");
        showToast("Saved locally – no backend employee record was found.", "success");
      }
      setEditing(false);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar ─────────────────────────────────────────────────────────────
  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next = { ...profile, avatarDataUrl: dataUrl };
      const stamped = persist(next, "Profile photo updated");
      setDraft(stamped);
      showToast("Photo updated.", "success");
    } catch {
      showToast("Could not read the image.", "error");
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // ── Documents ──────────────────────────────────────────────────────────
  const onDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    try {
      const created = await Promise.all(files.map(f => createDocumentFromFile(f, uploadCategory)));
      const next = { ...profile, documents: [...created, ...profile.documents] };
      persist(next, `Uploaded ${files.length} ${files.length === 1 ? "document" : "documents"}`,
        created.map(d => d.name).join(", "));
      showToast(`Uploaded ${files.length} document${files.length === 1 ? "" : "s"}.`, "success");
    } catch {
      showToast("Failed to read one or more files.", "error");
    } finally {
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const deleteDocument = (doc: DocumentEntry) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    const next = { ...profile, documents: profile.documents.filter(d => d.id !== doc.id) };
    persist(next, `Removed document`, doc.name);
    showToast("Document deleted.", "success");
  };

  // ── Skills ─────────────────────────────────────────────────────────────
  const addSkill = () => {
    const name = skillDraft.name.trim();
    if (!name) return;
    if (profile.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      showToast("You've already added that skill.", "error"); return;
    }
    const skill: SkillEntry = {
      id: `sk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name, level: skillDraft.level,
    };
    const next = { ...profile, skills: [skill, ...profile.skills] };
    persist(next, "Added skill", `${name} (${skill.level})`);
    setSkillDraft({ name: "", level: "Intermediate" });
  };

  const removeSkill = (skill: SkillEntry) => {
    const next = { ...profile, skills: profile.skills.filter(s => s.id !== skill.id) };
    persist(next, "Removed skill", skill.name);
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const completion = useMemo(() => profileCompletion(profile), [profile]);
  const name       = useMemo(() => fullName(profile.personal), [profile.personal]);
  const initials   = useMemo(() => initialsFor(profile), [profile]);
  const docsByCat  = useMemo(() => groupDocuments(profile.documents), [profile.documents]);
  const totalSize  = useMemo(() => profile.documents.reduce((acc, d) => acc + d.size, 0), [profile.documents]);

  const ageString  = useMemo(() => {
    const a = ageFromDob(profile.personal.dateOfBirth);
    return a ? `${a} yrs` : "—";
  }, [profile.personal.dateOfBirth]);

  const status     = profile.employment.employmentStatus || "Active";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SharedLayout>
      <Helmet>
        <title>{name} · My Profile · KagoHC</title>
      </Helmet>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{
        padding: 28, backgroundColor: C.surfaceAlt, minHeight: "100vh",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 96 }}>
          <HeroBanner
            name={name}
            initials={initials}
            avatarDataUrl={profile.avatarDataUrl}
            status={status}
            position={profile.employment.position}
            department={profile.employment.department}
            employeeCode={profile.employment.employeeCode}
            email={profile.contact.workEmail || profile.contact.personalEmail}
            city={profile.contact.city}
            completion={completion}
            onUploadAvatar={() => avatarInputRef.current?.click()}
          />
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange} style={{ display: "none" }} />

          {loading ? (
            <div style={{ ...card, marginTop: 24, textAlign: "center", color: C.muted }}>
              Loading profile…
            </div>
          ) : (
            <div style={{
              marginTop: 24, display: "grid",
              gridTemplateColumns: "minmax(0, 240px) minmax(0, 1fr)", gap: 22,
              alignItems: "flex-start",
            }}>
              <SectionRail
                active={activeSection}
                onSelect={setActiveSection}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {activeSection === "overview" && (
                  <OverviewSection
                    profile={profile}
                    ageString={ageString}
                    totalDocs={profile.documents.length}
                    totalSizeText={formatFileSize(totalSize)}
                    skillsCount={profile.skills.length}
                    completion={completion}
                    onJump={setActiveSection}
                  />
                )}
                {activeSection === "personal" && (
                  <EditableSection
                    title="Personal Information"
                    subtitle="Identity and demographic details."
                    icon={<UserIcon size={20} />} iconColor={C.purple}
                    editing={editing} saving={saving}
                    onEdit={startEdit} onCancel={cancelEdit} onSave={handleSave}
                  >
                    <FieldGrid>
                      <Field label="First Name"   value={(editing ? draft : profile).personal.firstName}  editing={editing}
                             onChange={v => updateDraft("personal", { firstName: v })} />
                      <Field label="Middle Name"  value={(editing ? draft : profile).personal.middleName} editing={editing}
                             onChange={v => updateDraft("personal", { middleName: v })} />
                      <Field label="Last Name"    value={(editing ? draft : profile).personal.lastName}   editing={editing}
                             onChange={v => updateDraft("personal", { lastName: v })} />
                      <Field label="Preferred Name" value={(editing ? draft : profile).personal.preferredName} editing={editing}
                             onChange={v => updateDraft("personal", { preferredName: v })} />
                      <Field label="Date of Birth" type="date" value={(editing ? draft : profile).personal.dateOfBirth || ""} editing={editing}
                             onChange={v => updateDraft("personal", { dateOfBirth: v })} />
                      <Field label="Gender" value={(editing ? draft : profile).personal.gender} editing={editing}
                             onChange={v => updateDraft("personal", { gender: v })} />
                      <Field label="Nationality" value={(editing ? draft : profile).personal.nationality} editing={editing}
                             onChange={v => updateDraft("personal", { nationality: v })} />
                      <Field label="ID Number" value={(editing ? draft : profile).personal.idNumber} editing={editing}
                             onChange={v => updateDraft("personal", { idNumber: v })} />
                      <Field label="Marital Status" value={(editing ? draft : profile).personal.maritalStatus} editing={editing}
                             onChange={v => updateDraft("personal", { maritalStatus: v })} />
                    </FieldGrid>
                  </EditableSection>
                )}
                {activeSection === "employment" && (
                  <EditableSection
                    title="Employment Details"
                    subtitle="Role, contract and reporting line."
                    icon={<Briefcase size={20} />} iconColor={C.blue}
                    editing={editing} saving={saving}
                    onEdit={startEdit} onCancel={cancelEdit} onSave={handleSave}
                  >
                    <FieldGrid>
                      <Field label="Employee Code" value={(editing ? draft : profile).employment.employeeCode} editing={false} />
                      <Field label="Position" value={(editing ? draft : profile).employment.position} editing={editing}
                             onChange={v => updateDraft("employment", { position: v })} />
                      <Field label="Department" value={(editing ? draft : profile).employment.department} editing={false} />
                      <Field label="Manager" value={(editing ? draft : profile).employment.manager} editing={false} />
                      <Field label="Hire Date" type="date" value={(editing ? draft : profile).employment.hireDate || ""} editing={editing}
                             onChange={v => updateDraft("employment", { hireDate: v })} />
                      <Field label="Employment Type" value={(editing ? draft : profile).employment.employmentType} editing={editing}
                             onChange={v => updateDraft("employment", { employmentType: v as any })} />
                      <Field label="Status" value={(editing ? draft : profile).employment.employmentStatus} editing={false} />
                      <Field label="Work Location" value={(editing ? draft : profile).employment.workLocation} editing={editing}
                             onChange={v => updateDraft("employment", { workLocation: v })} />
                      <Field label="Work Schedule" value={(editing ? draft : profile).employment.workSchedule} editing={editing}
                             onChange={v => updateDraft("employment", { workSchedule: v })} />
                      <Field label="Contract End" type="date" value={(editing ? draft : profile).employment.contractEnd || ""} editing={editing}
                             onChange={v => updateDraft("employment", { contractEnd: v })} />
                    </FieldGrid>

                    <div style={{
                      marginTop: 18, padding: "12px 14px", borderRadius: R.md,
                      background: C.blueBg, color: "#1e40af",
                      display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13,
                    }}>
                      <Calendar size={16} style={{ marginTop: 2 }} />
                      <span>
                        You've been with the company for <strong>{yearsOfService(profile.employment.hireDate)}</strong>
                        {profile.employment.hireDate && <> since {formatDateLong(profile.employment.hireDate)}</>}.
                      </span>
                    </div>
                  </EditableSection>
                )}
                {activeSection === "contact" && (
                  <EditableSection
                    title="Contact & Emergency"
                    subtitle="How to reach you and who to call in an emergency."
                    icon={<Phone size={20} />} iconColor={C.green}
                    editing={editing} saving={saving}
                    onEdit={startEdit} onCancel={cancelEdit} onSave={handleSave}
                  >
                    <h3 style={subHeadingStyle}>Contact</h3>
                    <FieldGrid>
                      <Field label="Personal Email" type="email" value={(editing ? draft : profile).contact.personalEmail} editing={editing}
                             onChange={v => updateDraft("contact", { personalEmail: v })} />
                      <Field label="Work Email" type="email" value={(editing ? draft : profile).contact.workEmail} editing={false} />
                      <Field label="Personal Phone" type="tel" value={(editing ? draft : profile).contact.personalPhone} editing={editing}
                             onChange={v => updateDraft("contact", { personalPhone: v })} />
                      <Field label="Work Phone" type="tel" value={(editing ? draft : profile).contact.workPhone} editing={editing}
                             onChange={v => updateDraft("contact", { workPhone: v })} />
                    </FieldGrid>

                    <h3 style={subHeadingStyle}>Address</h3>
                    <FieldGrid>
                      <Field label="Street Address" value={(editing ? draft : profile).contact.address} editing={editing}
                             onChange={v => updateDraft("contact", { address: v })} />
                      <Field label="City" value={(editing ? draft : profile).contact.city} editing={editing}
                             onChange={v => updateDraft("contact", { city: v })} />
                      <Field label="Province" value={(editing ? draft : profile).contact.province} editing={editing}
                             onChange={v => updateDraft("contact", { province: v })} />
                      <Field label="Postal Code" value={(editing ? draft : profile).contact.postalCode} editing={editing}
                             onChange={v => updateDraft("contact", { postalCode: v })} />
                      <Field label="Country" value={(editing ? draft : profile).contact.country} editing={editing}
                             onChange={v => updateDraft("contact", { country: v })} />
                    </FieldGrid>

                    <h3 style={subHeadingStyle}>Emergency Contact</h3>
                    <FieldGrid>
                      <Field label="Full Name" value={(editing ? draft : profile).emergency.name} editing={editing}
                             onChange={v => updateDraft("emergency", { name: v })} />
                      <Field label="Relationship" value={(editing ? draft : profile).emergency.relationship} editing={editing}
                             onChange={v => updateDraft("emergency", { relationship: v })} />
                      <Field label="Phone" type="tel" value={(editing ? draft : profile).emergency.phone} editing={editing}
                             onChange={v => updateDraft("emergency", { phone: v })} />
                      <Field label="Email" type="email" value={(editing ? draft : profile).emergency.email} editing={editing}
                             onChange={v => updateDraft("emergency", { email: v })} />
                    </FieldGrid>
                  </EditableSection>
                )}
                {activeSection === "banking" && (
                  <EditableSection
                    title="Banking & Tax"
                    subtitle="Used by payroll. Kept private."
                    icon={<Landmark size={20} />} iconColor={C.amber}
                    editing={editing} saving={saving}
                    onEdit={startEdit} onCancel={cancelEdit} onSave={handleSave}
                  >
                    <FieldGrid>
                      <Field label="Bank Name" value={(editing ? draft : profile).banking.bankName} editing={editing}
                             onChange={v => updateDraft("banking", { bankName: v })} />
                      <Field label="Account Holder" value={(editing ? draft : profile).banking.accountHolder} editing={editing}
                             onChange={v => updateDraft("banking", { accountHolder: v })} />
                      <Field label="Account Number" value={(editing ? draft : profile).banking.accountNumber} editing={editing}
                             onChange={v => updateDraft("banking", { accountNumber: v })} />
                      <Field label="Branch Code" value={(editing ? draft : profile).banking.branchCode} editing={editing}
                             onChange={v => updateDraft("banking", { branchCode: v })} />
                      <Field label="Account Type" value={(editing ? draft : profile).banking.accountType} editing={editing}
                             onChange={v => updateDraft("banking", { accountType: v as any })} />
                      <Field label="Tax Number" value={(editing ? draft : profile).banking.taxNumber} editing={editing}
                             onChange={v => updateDraft("banking", { taxNumber: v })} />
                      <Field label="UIF Number" value={(editing ? draft : profile).banking.uifNumber} editing={editing}
                             onChange={v => updateDraft("banking", { uifNumber: v })} />
                    </FieldGrid>
                  </EditableSection>
                )}
                {activeSection === "documents" && (
                  <DocumentsSection
                    docsByCat={docsByCat}
                    totalCount={profile.documents.length}
                    totalSizeText={formatFileSize(totalSize)}
                    uploadCategory={uploadCategory}
                    onCategoryChange={setUploadCategory}
                    onUploadClick={() => documentInputRef.current?.click()}
                    onDelete={deleteDocument}
                  />
                )}
                {activeSection === "skills" && (
                  <SkillsSection
                    skills={profile.skills}
                    draft={skillDraft}
                    onDraftChange={setSkillDraft}
                    onAdd={addSkill}
                    onRemove={removeSkill}
                  />
                )}
                {activeSection === "activity" && (
                  <ActivitySection items={profile.activity} />
                )}
              </div>
            </div>
          )}

          <input
            ref={documentInputRef}
            type="file"
            multiple
            onChange={onDocumentUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </SharedLayout>
  );
};

export default EmployeeProfilePage;

const subHeadingStyle: React.CSSProperties = {
  margin: "20px 0 12px", fontSize: 12, fontWeight: 700,
  color: ACCENT, textTransform: "uppercase", letterSpacing: 0.4,
};

/* ──────────────────────────────────────────────────────────────────────────
 * Hero banner – mirrors the onboarding gradient banner
 * ─────────────────────────────────────────────────────────────────────── */

const HeroBanner: React.FC<{
  name: string;
  initials: string;
  avatarDataUrl?: string;
  status: string;
  position?: string;
  department?: string;
  employeeCode?: string;
  email?: string;
  city?: string;
  completion: number;
  onUploadAvatar: () => void;
}> = ({ name, initials, avatarDataUrl, status, position, department, employeeCode, email, city, completion, onUploadAvatar }) => {
  const statusColor =
    status === "Active"    ? "#86efac" :
    status === "On leave"  ? "#fde68a" :
    status === "Suspended" ? "#fca5a5" :
    status === "Terminated"? "#fca5a5" : "#bae6fd";

  return (
    <div style={{
      borderRadius: R.hero,
      background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DK} 100%)`,
      color: "#fff", padding: "28px 32px",
      boxShadow: "0 14px 36px rgba(13,148,136,0.30)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 85% 0%, rgba(255,255,255,0.20) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", display: "flex", gap: 22,
        alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 92, height: 92, borderRadius: "50%",
            background: avatarDataUrl
              ? `center/cover no-repeat url(${avatarDataUrl})`
              : "rgba(255,255,255,0.22)",
            color: "#fff",
            fontSize: 30, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "3px solid rgba(255,255,255,0.85)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}>
            {!avatarDataUrl && initials}
          </div>
          <button
            type="button"
            onClick={onUploadAvatar}
            style={{
              position: "absolute", bottom: -4, right: -4,
              width: 30, height: 30, borderRadius: "50%",
              background: "#fff", color: ACCENT,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.20)",
            }}
            title="Change photo"
          >
            <Camera size={14} />
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,0.18)", fontSize: 12, fontWeight: 600 }}>
            <Sparkles size={14} /> My Profile
          </div>
          <h1 style={{ margin: "10px 0 4px", fontSize: 26, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 }}>
            {name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 14, opacity: 0.95 }}>
            <Briefcase size={14} />
            <span style={{ fontWeight: 600 }}>{position || "Team Member"}</span>
            {department && (
              <>
                <span style={{ opacity: 0.7 }}>·</span>
                <span style={{ opacity: 0.9 }}>{department}</span>
              </>
            )}
            <span style={{
              marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 999,
              background: "rgba(255,255,255,0.18)", fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
              {status}
            </span>
          </div>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12,
          }}>
            {employeeCode && <HeroChip icon={<Shield size={12} />}>{employeeCode}</HeroChip>}
            {email        && <HeroChip icon={<Mail   size={12} />}>{email}</HeroChip>}
            {city         && <HeroChip icon={<MapPin size={12} />}>{city}</HeroChip>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 200 }}>
          <span style={{ fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
            Profile completion
          </span>
          <span style={{ ...FONT_NUM, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{completion}%</span>
          <div style={{ width: 200, height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${completion}%`, height: "100%",
              background: "#fff", borderRadius: 999, transition: "width .3s ease",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroChip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    color: "#fff", fontSize: 12, fontWeight: 600,
  }}>{icon}{children}</span>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Section navigation rail
 * ─────────────────────────────────────────────────────────────────────── */

const SectionRail: React.FC<{
  active: ProfileSectionId;
  onSelect: (id: ProfileSectionId) => void;
}> = ({ active, onSelect }) => (
  <div style={card}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>
      Profile sections
    </h3>
    <p style={{ ...subtle, margin: "2px 0 18px", fontSize: 12.5 }}>Jump to any section.</p>

    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {PROFILE_SECTIONS.map(section => {
        const meta = SECTION_META[section.id];
        const Icon = meta.icon;
        const isActive = section.id === active;
        return (
          <li key={section.id}>
            <button
              onClick={() => onSelect(section.id)}
              style={{
                width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                background: isActive ? `${meta.color}14` : "transparent",
                border: `1px solid ${isActive ? `${meta.color}40` : "transparent"}`,
                transition: "background .15s ease, border-color .15s ease",
              }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: isActive ? `${meta.color}22` : C.surfaceAlt,
                color:      isActive ? meta.color       : C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={14} />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: isActive ? meta.color : C.ink }}>
                  {section.label}
                </span>
                <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 1 }}>
                  {meta.blurb}
                </span>
              </span>
              {isActive && <ChevronRight size={14} color={meta.color} />}
            </button>
          </li>
        );
      })}
    </ol>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Editable section wrapper (Edit/Save/Cancel buttons + Section)
 * ─────────────────────────────────────────────────────────────────────── */

const EditableSection: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, iconColor, editing, saving, onEdit, onCancel, onSave, children }) => (
  <Section
    title={title} subtitle={subtitle} icon={icon} iconColor={iconColor}
    right={editing ? (
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={secondaryBtn}><X size={14} /> Cancel</button>
        <button onClick={onSave} style={primaryBtn} disabled={saving}>
          <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    ) : (
      <button onClick={onEdit} style={primaryBtn}><Edit3 size={14} /> Edit</button>
    )}
  >
    {children}
  </Section>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Overview section
 * ─────────────────────────────────────────────────────────────────────── */

const OverviewSection: React.FC<{
  profile: EmployeeProfileData;
  ageString: string;
  totalDocs: number;
  totalSizeText: string;
  skillsCount: number;
  completion: number;
  onJump: (id: ProfileSectionId) => void;
}> = ({ profile, ageString, totalDocs, totalSizeText, skillsCount, completion, onJump }) => (
  <>
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 14,
    }}>
      <StatTile icon={<Heart    size={18} />} label="Age"               value={ageString} accent={ACCENT} />
      <StatTile icon={<Calendar size={18} />} label="Years of Service"  value={yearsOfService(profile.employment.hireDate)} accent={C.blue} />
      <StatTile icon={<FileText size={18} />} label="Documents"          value={`${totalDocs} · ${totalSizeText}`} accent={C.pink} />
      <StatTile icon={<Award    size={18} />} label="Skills"            value={String(skillsCount)} accent={C.green} />
    </div>

    <Section
      icon={<Sparkles size={20} />} iconColor={ACCENT}
      title="About You"
      subtitle="A quick snapshot of who you are at the company."
      right={<button onClick={() => onJump("personal")} style={secondaryBtn}>Edit details <ChevronRight size={14} /></button>}
    >
      <FieldGrid>
        <InfoRow icon={<UserIcon size={14} />} label="Full Name"  value={fullName(profile.personal)} />
        <InfoRow icon={<Globe2 size={14} />}   label="Nationality" value={profile.personal.nationality} />
        <InfoRow icon={<Calendar size={14} />} label="Date of Birth" value={formatDateLong(profile.personal.dateOfBirth)} />
        <InfoRow icon={<Shield size={14} />}   label="ID Number"   value={profile.personal.idNumber} />
      </FieldGrid>
    </Section>

    <Section
      icon={<Briefcase size={20} />} iconColor={C.blue}
      title="At Work"
      subtitle="Your role and where you sit in the org."
      right={<button onClick={() => onJump("employment")} style={secondaryBtn}>Edit details <ChevronRight size={14} /></button>}
    >
      <FieldGrid>
        <InfoRow icon={<Briefcase size={14} />} label="Position"    value={profile.employment.position} />
        <InfoRow icon={<Building2 size={14} />} label="Department"  value={profile.employment.department} />
        <InfoRow icon={<Calendar  size={14} />} label="Hire Date"   value={formatDateLong(profile.employment.hireDate)} />
        <InfoRow icon={<Shield    size={14} />} label="Employee ID" value={profile.employment.employeeCode} />
      </FieldGrid>
    </Section>

    <Section
      icon={<Phone size={20} />} iconColor={C.green}
      title="Reach You"
      subtitle="Primary contact channels."
      right={<button onClick={() => onJump("contact")} style={secondaryBtn}>Edit details <ChevronRight size={14} /></button>}
    >
      <FieldGrid>
        <InfoRow icon={<Mail size={14} />}   label="Work Email"   value={profile.contact.workEmail} />
        <InfoRow icon={<Mail size={14} />}   label="Personal Email" value={profile.contact.personalEmail} />
        <InfoRow icon={<Phone size={14} />}  label="Phone"        value={profile.contact.personalPhone || profile.contact.workPhone} />
        <InfoRow icon={<MapPin size={14} />} label="City"         value={profile.contact.city} />
      </FieldGrid>
    </Section>

    {completion < 100 && (
      <Section
        icon={<CheckCircle2 size={20} />} iconColor={C.amber}
        title="Complete your profile"
        subtitle="You're getting closer — fill in the missing pieces."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 8, background: C.surfaceAlt, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${completion}%`, height: "100%", background: ACCENT, transition: "width .3s ease" }} />
          </div>
          <span style={{ ...FONT_NUM, fontSize: 16, fontWeight: 700, color: C.ink, minWidth: 48, textAlign: "right" }}>{completion}%</span>
        </div>
      </Section>
    )}
  </>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
  <div>
    <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: C.muted }}>{icon}</span> {label}
    </label>
    <p style={valueStyle}>{value || dash}</p>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Documents section
 * ─────────────────────────────────────────────────────────────────────── */

const DocumentsSection: React.FC<{
  docsByCat: Record<DocumentCategory, DocumentEntry[]>;
  totalCount: number;
  totalSizeText: string;
  uploadCategory: DocumentCategory;
  onCategoryChange: (c: DocumentCategory) => void;
  onUploadClick: () => void;
  onDelete: (d: DocumentEntry) => void;
}> = ({ docsByCat, totalCount, totalSizeText, uploadCategory, onCategoryChange, onUploadClick, onDelete }) => (
  <Section
    icon={<FileText size={20} />} iconColor={C.pink}
    title={`Documents (${totalCount})`}
    subtitle={`${totalSizeText} stored across all your files.`}
    right={
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select
          value={uploadCategory}
          onChange={e => onCategoryChange(e.target.value as DocumentCategory)}
          style={{ ...inputStyle, width: "auto", paddingRight: 28 }}
        >
          {DOCUMENT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={onUploadClick} style={primaryBtn}><Upload size={14} /> Upload</button>
      </div>
    }
  >
    {totalCount === 0 ? (
      <EmptyHint
        icon={<Upload size={32} />}
        title="No documents yet"
        body="Pick a category above, then upload your ID, contract, qualifications, payslips, or anything else worth keeping safe."
      />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {DOCUMENT_CATEGORIES.map(cat => {
          const list = docsByCat[cat.key];
          if (!list || !list.length) return null;
          return (
            <div key={cat.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 4, background: cat.color, display: "inline-block",
                }} />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.ink }}>{cat.label}</h3>
                <span style={{ ...subtle, fontSize: 12 }}>{list.length} file{list.length === 1 ? "" : "s"}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 10,
              }}>
                {list.map(doc => (
                  <div key={doc.id} style={{
                    border: `1px solid ${C.line}`, borderRadius: R.md,
                    padding: 12, background: "#fff",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 24 }}>{documentIconFor(doc.type)}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ ...valueStyle, margin: 0, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.name}
                      </p>
                      <p style={{ ...subtle, margin: "2px 0 0", fontSize: 11.5 }}>
                        {formatFileSize(doc.size)} · {formatDateShort(doc.uploadedAt)}
                      </p>
                    </div>
                    <button onClick={() => downloadDocument(doc)} style={ghostBtn} title="Download"><Download size={14} /></button>
                    <button onClick={() => onDelete(doc)} style={{ ...ghostBtn, color: C.bad }} title="Delete"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Section>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Skills section
 * ─────────────────────────────────────────────────────────────────────── */

const SkillsSection: React.FC<{
  skills: SkillEntry[];
  draft: { name: string; level: SkillEntry["level"] };
  onDraftChange: (d: { name: string; level: SkillEntry["level"] }) => void;
  onAdd: () => void;
  onRemove: (s: SkillEntry) => void;
}> = ({ skills, draft, onDraftChange, onAdd, onRemove }) => (
  <Section
    icon={<Award size={20} />} iconColor={C.green}
    title={`Skills (${skills.length})`}
    subtitle="Tell your team what you're good at."
  >
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr auto",
      gap: 10, alignItems: "end", marginBottom: 18,
    }}>
      <div>
        <label style={labelStyle}>Skill name</label>
        <input
          style={inputStyle}
          value={draft.name}
          placeholder="e.g. TypeScript"
          onChange={e => onDraftChange({ ...draft, name: e.target.value })}
          onKeyDown={e => { if (e.key === "Enter") onAdd(); }}
        />
      </div>
      <div>
        <label style={labelStyle}>Level</label>
        <select
          value={draft.level}
          onChange={e => onDraftChange({ ...draft, level: e.target.value as SkillEntry["level"] })}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <button onClick={onAdd} style={primaryBtn}><Plus size={14} /> Add</button>
    </div>

    {skills.length === 0 ? (
      <EmptyHint
        icon={<Award size={32} />}
        title="No skills yet"
        body="Add a few core skills above — they'll appear on your team-mates' radar."
      />
    ) : (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {skills.map(s => {
          const color = SKILL_LEVEL_COLOR[s.level];
          return (
            <div key={s.id} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 12px 8px 14px", borderRadius: 999,
              background: `${color}1f`, color, border: `1px solid ${color}40`,
              fontSize: 13, fontWeight: 600,
            }}>
              {s.name}
              <span style={{ fontSize: 11, opacity: 0.75 }}>· {s.level}</span>
              <button onClick={() => onRemove(s)} style={{ ...ghostBtn, color }}><Trash2 size={12} /></button>
            </div>
          );
        })}
      </div>
    )}
  </Section>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Activity section
 * ─────────────────────────────────────────────────────────────────────── */

const ActivitySection: React.FC<{ items: EmployeeProfileData["activity"] }> = ({ items }) => (
  <Section
    icon={<Activity size={20} />} iconColor={C.blue}
    title="Recent Activity"
    subtitle="The last 50 changes you've made to this profile."
  >
    {items.length === 0 ? (
      <EmptyHint
        icon={<Activity size={32} />}
        title="No activity yet"
        body="Once you start editing your profile, your changes will show up here."
      />
    ) : (
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((a, i) => (
          <li key={a.id} style={{
            display: "flex", gap: 14, padding: "12px 0",
            borderBottom: i === items.length - 1 ? "none" : `1px solid ${C.line}`,
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: C.blueBg, color: C.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={14} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...valueStyle, margin: 0 }}>{a.label}</p>
              {a.description && <p style={{ ...subtle, margin: "2px 0 0", fontSize: 12.5 }}>{a.description}</p>}
            </div>
            <span style={{ ...subtle, fontSize: 12, flexShrink: 0 }}>{formatDateTimeShort(a.at)}</span>
          </li>
        ))}
      </ol>
    )}
  </Section>
);
