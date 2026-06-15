import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Activity, Award, Briefcase, Building2, Calendar, Camera, CheckCircle2,
  Download, Edit3, FileText, Mail, MapPin, Phone, Plus, Save, Shield,
  Trash2, Upload, User, X,
} from "lucide-react";
import SharedLayout from "./SharedLayout";
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
  avatarColorFor,
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
  saveProfileLocal,
  yearsOfService,
} from "../../shared/utils/employeeProfile";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared styles
 * ─────────────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.line}`,
  borderRadius: R.lg,
  boxShadow: SHADOW,
  padding: 24,
};
const subtle: React.CSSProperties = { color: C.muted, fontSize: 13 };
const sectionHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
};
const sectionTitle: React.CSSProperties = {
  margin: 0, fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: -0.1,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: "#fff",
  fontSize: 14,
  color: C.ink,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s ease, box-shadow .15s ease",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: C.faint,
  marginBottom: 6,
};
const valueStyle: React.CSSProperties = {
  fontSize: 14, color: C.ink, fontWeight: 500, margin: 0,
};
const primaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, border: "none",
  background: C.coral, color: "#fff",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
  boxShadow: "0 4px 12px rgba(230,167,158,0.3)",
};
const secondaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10,
  border: `1px solid ${C.line}`, background: "#fff",
  color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const dangerBtn: React.CSSProperties = {
  ...secondaryBtn, color: C.bad, borderColor: "#fecaca",
};
const dash = <span style={{ color: C.faint }}>—</span>;

const pillBtn = (active: boolean): React.CSSProperties => ({
  padding: "9px 16px", borderRadius: 999, border: "none", cursor: "pointer",
  fontWeight: 600, fontSize: 13, whiteSpace: "nowrap",
  display: "inline-flex", alignItems: "center", gap: 6,
  background: active ? C.coral : "transparent",
  color: active ? "#fff" : C.text,
  boxShadow: active ? "0 4px 12px rgba(230,167,158,0.35)" : "none",
  transition: "all .15s ease",
});

/* ──────────────────────────────────────────────────────────────────────────
 * Local component helpers
 * ─────────────────────────────────────────────────────────────────────── */

const Grid: React.FC<{ children: React.ReactNode; cols?: number }> = ({ children, cols = 2 }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 18,
  }}>{children}</div>
);

interface FieldProps {
  label: string;
  value?: string;
  editing: boolean;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
}
const Field: React.FC<FieldProps> = ({ label, value, editing, onChange, type = "text", placeholder, full }) => (
  <div style={full ? { gridColumn: "1 / -1" } : undefined}>
    <label style={labelStyle}>{label}</label>
    {editing ? (
      <input
        style={inputStyle}
        type={type}
        value={value || ""}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        onChange={e => onChange?.(e.target.value)}
      />
    ) : (
      <p style={valueStyle}>{value || dash}</p>
    )}
  </div>
);

const Section: React.FC<{
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, iconColor, title, right, children }) => (
  <div style={card}>
    <div style={{
      ...sectionHeader,
      justifyContent: right ? "space-between" : undefined,
      flexWrap: "wrap", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${iconColor}1a`, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
        <h2 style={sectionTitle}>{title}</h2>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div style={{
    padding: "44px 20px", textAlign: "center",
    background: C.surfaceAlt, borderRadius: R.md, border: `1px dashed ${C.line}`,
  }}>
    <div style={{ color: C.faint, marginBottom: 12 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</p>
    <p style={{ ...subtle, margin: "6px auto 0", maxWidth: 420 }}>{body}</p>
  </div>
);

const SectionIcon: React.FC<{ id: ProfileSectionId }> = ({ id }) => {
  const map: Record<ProfileSectionId, React.ReactNode> = {
    overview:   <User       size={14} />,
    personal:   <User       size={14} />,
    employment: <Briefcase  size={14} />,
    contact:    <Phone      size={14} />,
    banking:    <Building2  size={14} />,
    documents:  <FileText   size={14} />,
    skills:     <Award      size={14} />,
    activity:   <Activity   size={14} />,
  };
  return <>{map[id]}</>;
};

/* ──────────────────────────────────────────────────────────────────────────
 * Page
 * ─────────────────────────────────────────────────────────────────────── */

const EmployeeProfilePage: React.FC = () => {
  const [profile, setProfile]               = useState<EmployeeProfileData>(EMPTY_PROFILE);
  const [draft, setDraft]                   = useState<EmployeeProfileData>(EMPTY_PROFILE);
  const [loading, setLoading]               = useState(true);
  const [editing, setEditing]               = useState(false);
  const [activeSection, setActiveSection]   = useState<ProfileSectionId>("overview");
  const [toast, setToast]                   = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("ID");
  const [skillDraft, setSkillDraft]         = useState<{ name: string; level: SkillEntry["level"] }>({
    name: "", level: "Intermediate",
  });

  const fileInputRef   = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // ── Load profile from API + local cache ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token   = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const user    = userStr ? JSON.parse(userStr) : null;
        const p       = await loadEmployeeProfile(token, user);
        setProfile(p);
        setDraft(p);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const userEmail = (): string | undefined => {
    try { return JSON.parse(localStorage.getItem("user") || "{}")?.email; }
    catch { return undefined; }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const persist = (next: EmployeeProfileData, message?: string) => {
    saveProfileLocal(next, userEmail());
    setProfile(next);
    setDraft(next);
    if (message) showToast(message, "success");
  };

  // ── Editing controls ────────────────────────────────────────────────────
  const startEdit  = () => { setDraft(profile); setEditing(true); };
  const cancelEdit = () => { setDraft(profile); setEditing(false); };
  const saveEdit   = () => {
    const next = pushActivity(draft, "Profile updated", "Personal, employment or contact details were changed.");
    persist(next, "Profile saved");
    setEditing(false);
  };
  const update = <K extends keyof EmployeeProfileData>(key: K, patch: Partial<EmployeeProfileData[K]>) =>
    setDraft(d => ({ ...d, [key]: { ...(d[key] as any), ...patch } as any }));
  const updateBio = (bio: string) => setDraft(d => ({ ...d, bio }));

  // ── Avatar / document handlers ──────────────────────────────────────────
  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc  = await createDocumentFromFile(file, "Other");
      const next = pushActivity({ ...profile, avatarDataUrl: doc.dataUrl }, "Profile photo updated");
      persist(next, "Profile photo updated");
    } catch {
      showToast("Could not read image file", "error");
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const onDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const docs = await Promise.all(files.map(f => createDocumentFromFile(f, uploadCategory)));
      const next = pushActivity(
        { ...profile, documents: [...docs, ...profile.documents] },
        `Uploaded ${docs.length} document${docs.length === 1 ? "" : "s"}`,
        docs.map(d => d.name).join(", "),
      );
      persist(next, `${docs.length} document${docs.length === 1 ? "" : "s"} uploaded`);
    } catch {
      showToast("Failed to upload one or more files", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteDocument = (doc: DocumentEntry) => {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    const next = pushActivity(
      { ...profile, documents: profile.documents.filter(d => d.id !== doc.id) },
      "Document deleted", doc.name,
    );
    persist(next, "Document deleted");
  };

  // ── Skill handlers ──────────────────────────────────────────────────────
  const addSkill = () => {
    const name = skillDraft.name.trim();
    if (!name) return;
    const skill: SkillEntry = {
      id: `sk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name, level: skillDraft.level,
    };
    const next = pushActivity(
      { ...profile, skills: [...profile.skills, skill] },
      "Skill added", `${name} (${skill.level})`,
    );
    persist(next, "Skill added");
    setSkillDraft({ name: "", level: "Intermediate" });
  };

  const removeSkill = (id: string) => {
    const sk = profile.skills.find(s => s.id === id);
    const next = pushActivity(
      { ...profile, skills: profile.skills.filter(s => s.id !== id) },
      "Skill removed", sk?.name,
    );
    persist(next, "Skill removed");
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const completion = useMemo(() => profileCompletion(profile), [profile]);
  const name       = useMemo(() => fullName(profile.personal), [profile]);
  const initials   = useMemo(() => initialsFor(profile),       [profile]);
  const avatarBgC  = useMemo(() => avatarColorFor(profile),    [profile]);
  const docsByCat  = useMemo(() => groupDocuments(profile.documents), [profile.documents]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <SharedLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div style={{ fontSize: 14, color: C.muted }}>Loading your profile…</div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout>
      <Helmet>
        <title>My Profile | Kago HC</title>
        <meta name="description" content="Employee profile and personal information" />
      </Helmet>

      {/* Bottom padding keeps the last card clear of the fixed admin footer. */}
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 96 }}>
        {toast && <Toast message={toast.message} type={toast.type} />}

        <ProfileHero
          name={name}
          initials={initials}
          avatarBg={avatarBgC}
          avatarDataUrl={profile.avatarDataUrl}
          profile={profile}
          completion={completion}
          editing={editing}
          onStartEdit={startEdit}
          onCancel={cancelEdit}
          onSave={saveEdit}
          onAvatarClick={() => avatarInputRef.current?.click()}
        />

        {/* Section tabs */}
        <div style={{
          marginTop: 24, marginBottom: 24,
          display: "flex", gap: 6,
          padding: 8, background: "#fff", borderRadius: R.lg,
          border: `1px solid ${C.line}`, boxShadow: SHADOW,
          overflowX: "auto",
        }}>
          {PROFILE_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={pillBtn(activeSection === s.id)}>
              <SectionIcon id={s.id} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {activeSection === "overview"   && <OverviewSection   profile={profile} completion={completion} />}
        {activeSection === "personal"   && <PersonalSection   editing={editing} draft={draft} profile={profile} update={update} updateBio={updateBio} />}
        {activeSection === "employment" && <EmploymentSection editing={editing} draft={draft} profile={profile} update={update} />}
        {activeSection === "contact"    && <ContactSection    editing={editing} draft={draft} profile={profile} update={update} />}
        {activeSection === "banking"    && <BankingSection    editing={editing} draft={draft} profile={profile} update={update} />}
        {activeSection === "documents"  && (
          <DocumentsSection
            docs={profile.documents}
            byCategory={docsByCat}
            uploadCategory={uploadCategory}
            setUploadCategory={setUploadCategory}
            onUploadClick={() => fileInputRef.current?.click()}
            onDelete={deleteDocument}
          />
        )}
        {activeSection === "skills" && (
          <SkillsSection
            skills={profile.skills}
            draft={skillDraft}
            setDraft={setSkillDraft}
            onAdd={addSkill}
            onRemove={removeSkill}
          />
        )}
        {activeSection === "activity" && <ActivitySection activity={profile.activity} />}

        {/* Hidden inputs */}
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange}      style={{ display: "none" }} />
        <input ref={fileInputRef}   type="file" multiple          onChange={onDocumentUpload}   style={{ display: "none" }} />
      </div>
    </SharedLayout>
  );
};

export default EmployeeProfilePage;

/* ──────────────────────────────────────────────────────────────────────────
 * Toast
 * ─────────────────────────────────────────────────────────────────────── */

const Toast: React.FC<{ message: string; type: "success" | "error" }> = ({ message, type }) => (
  <div style={{
    position: "fixed", top: 84, right: 24, zIndex: 9999,
    padding: "12px 18px", borderRadius: 12,
    background: type === "success" ? "#ecfdf3" : "#fee2e2",
    color:      type === "success" ? "#027a48" : "#b42318",
    border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
    display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500,
    boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
  }}>
    {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
    {message}
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Hero
 * ─────────────────────────────────────────────────────────────────────── */

interface HeroProps {
  name: string;
  initials: string;
  avatarBg: string;
  avatarDataUrl?: string;
  profile: EmployeeProfileData;
  completion: number;
  editing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarClick: () => void;
}

const ProfileHero: React.FC<HeroProps> = ({
  name, initials, avatarBg, avatarDataUrl, profile, completion,
  editing, onStartEdit, onSave, onCancel, onAvatarClick,
}) => {
  const accent = `linear-gradient(135deg, ${C.coral} 0%, ${C.pink} 100%)`;
  const status = profile.employment.employmentStatus || "Active";

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: R.hero,
      boxShadow: SHADOW,
    }}>
      <div style={{
        height: 132, background: accent, position: "relative",
        overflow: "hidden",
        borderTopLeftRadius: R.hero,
        borderTopRightRadius: R.hero,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 85% 0%, rgba(255,255,255,0.28) 0%, transparent 60%)",
        }} />
      </div>

      <div style={{ padding: "0 32px 28px" }}>
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20, marginTop: -56,
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <button
              onClick={onAvatarClick}
              title="Change profile photo"
              style={{
                width: 116, height: 116, borderRadius: "50%",
                border: "4px solid #fff", boxShadow: "0 10px 24px rgba(216,138,127,0.28)",
                background: avatarDataUrl ? `center/cover no-repeat url(${avatarDataUrl})` : avatarBg,
                color: "#fff", fontSize: 38, fontWeight: 700, letterSpacing: 0.5,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative", padding: 0,
              }}
            >
              {!avatarDataUrl && initials}
              <span style={{
                position: "absolute", bottom: 4, right: 4,
                width: 32, height: 32, borderRadius: "50%",
                background: "#fff", color: C.coral,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)", border: `1px solid ${C.line}`,
              }}>
                <Camera size={14} />
              </span>
            </button>

            <div style={{ paddingBottom: 4, minWidth: 0, flex: 1, display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: -0.3 }}>{name}</h1>
                <StatusPill label={status} />
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                margin: "8px 0 0",
              }}>
                <Briefcase size={14} color={C.coral} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: C.ink, fontWeight: 600 }}>
                  {profile.employment.position || "Team Member"}
                </span>
                {profile.employment.department && (
                  <>
                    <span style={{ color: C.faint }}>·</span>
                    <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>
                      {profile.employment.department}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Hero contact badges – moved out so the role line is never clipped */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", width: "100%", marginTop: 4,
          }}>
            {profile.employment.employeeCode && (
              <HeroBadge icon={<Shield size={13} />} label={profile.employment.employeeCode} />
            )}
            {(profile.contact.workEmail || profile.contact.personalEmail) && (
              <HeroBadge icon={<Mail size={13} />} label={profile.contact.workEmail || profile.contact.personalEmail!} />
            )}
            {(profile.contact.personalPhone || profile.contact.workPhone) && (
              <HeroBadge icon={<Phone size={13} />} label={profile.contact.personalPhone || profile.contact.workPhone!} />
            )}
            {profile.contact.city && (
              <HeroBadge icon={<MapPin size={13} />} label={profile.contact.city} />
            )}
          </div>

          <div style={{ display: "flex", gap: 10, paddingBottom: 8 }}>
            {!editing ? (
              <button onClick={onStartEdit} style={primaryBtn}>
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <button onClick={onCancel} style={secondaryBtn}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={onSave} style={primaryBtn}>
                  <Save size={14} /> Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{
          marginTop: 24, display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14,
        }}>
          <StatTile label="Profile complete" value={`${completion}%`}                              accent={C.coral}  progress={completion} />
          <StatTile label="Years of service" value={yearsOfService(profile.employment.hireDate)}    accent={C.blue}   />
          <StatTile label="Documents"        value={String(profile.documents.length)}               accent={C.green}  />
          <StatTile label="Skills"           value={String(profile.skills.length)}                  accent={C.purple} />
        </div>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ label: string }> = ({ label }) => {
  const isActive = /active/i.test(label);
  const color = isActive ? C.ok : C.amber;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      background: `${color}1a`, color,
      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
};

const HeroBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 999,
    background: C.coralBg, color: C.coralDk,
    fontSize: 12, fontWeight: 600, maxWidth: 320,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  }} title={label}>{icon}{label}</span>
);

const StatTile: React.FC<{ label: string; value: string; accent: string; progress?: number }> = ({
  label, value, accent, progress,
}) => (
  <div style={{
    background: C.surfaceAlt, border: `1px solid ${C.line}`,
    borderRadius: R.md, padding: 16,
  }}>
    <p style={{ ...subtle, margin: 0, fontSize: 12, fontWeight: 600 }}>{label}</p>
    <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, color: accent, ...FONT_NUM }}>{value}</p>
    {typeof progress === "number" && (
      <div style={{
        marginTop: 12, height: 6, background: "#eef0f3",
        borderRadius: 999, overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          height: "100%", background: accent, transition: "width .3s ease",
        }} />
      </div>
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Overview
 * ─────────────────────────────────────────────────────────────────────── */

const OverviewSection: React.FC<{ profile: EmployeeProfileData; completion: number }> = ({ profile, completion }) => (
  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 20 }}>
    <Section icon={<User size={18} />} iconColor={C.coral} title="About">
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: C.text }}>
        {profile.bio || (
          <span style={{ color: C.faint }}>
            You haven't added a bio yet. Click "Edit Profile" and tell your team a little about yourself.
          </span>
        )}
      </p>
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <InfoRow icon={<Briefcase size={14} />} label="Position"   value={profile.employment.position} />
        <InfoRow icon={<Building2 size={14} />} label="Department" value={profile.employment.department} />
        <InfoRow icon={<Calendar  size={14} />} label="Hired"      value={formatDateLong(profile.employment.hireDate)} />
        <InfoRow icon={<Shield    size={14} />} label="Status"     value={profile.employment.employmentStatus || "Active"} />
        <InfoRow icon={<Mail      size={14} />} label="Email"      value={profile.contact.workEmail || profile.contact.personalEmail} />
        <InfoRow icon={<Phone     size={14} />} label="Phone"      value={profile.contact.personalPhone || profile.contact.workPhone} />
      </div>
    </Section>

    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Section icon={<CheckCircle2 size={18} />} iconColor={C.green} title="Profile Completion">
        <div style={{ fontSize: 38, fontWeight: 700, color: C.coral, ...FONT_NUM, lineHeight: 1 }}>{completion}%</div>
        <div style={{ marginTop: 14, height: 8, background: "#eef0f3", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${completion}%`, height: "100%", background: `linear-gradient(90deg, ${C.coral}, ${C.pink})` }} />
        </div>
        <p style={{ ...subtle, margin: "14px 0 0" }}>
          {completion < 100 ? "Fill in the remaining sections to reach 100%." : "Nice work — your profile is fully filled in."}
        </p>
      </Section>

      <Section icon={<Award size={18} />} iconColor={C.purple} title="Top Skills">
        {profile.skills.length === 0 ? (
          <p style={{ ...subtle, margin: 0 }}>No skills added yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.skills.slice(0, 8).map(s => (
              <span key={s.id} style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: `${SKILL_LEVEL_COLOR[s.level]}22`, color: SKILL_LEVEL_COLOR[s.level],
              }}>{s.name}</span>
            ))}
          </div>
        )}
      </Section>
    </div>
  </div>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
  <div style={{ display: "flex", gap: 12 }}>
    <span style={{
      width: 36, height: 36, borderRadius: 10, background: C.coralBg, color: C.coralDk,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{icon}</span>
    <div style={{ minWidth: 0 }}>
      <p style={{ ...subtle, margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>{label}</p>
      <p style={{ ...valueStyle, marginTop: 2, lineHeight: 1.5, wordBreak: "break-word" }}>
        {value || dash}
      </p>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Personal / Employment / Contact / Banking
 * ─────────────────────────────────────────────────────────────────────── */

interface SectionProps {
  editing: boolean;
  draft: EmployeeProfileData;
  profile: EmployeeProfileData;
  update: <K extends keyof EmployeeProfileData>(key: K, patch: Partial<EmployeeProfileData[K]>) => void;
}

const PersonalSection: React.FC<SectionProps & { updateBio: (b: string) => void }> = ({
  editing, draft, profile, update, updateBio,
}) => {
  const v   = editing ? draft.personal : profile.personal;
  const age = ageFromDob(v.dateOfBirth);
  return (
    <Section icon={<User size={18} />} iconColor={C.coral} title="Personal Information">
      <Grid cols={3}>
        <Field label="First Name"       editing={editing} value={v.firstName}     onChange={x => update("personal", { firstName: x })} />
        <Field label="Middle Name"      editing={editing} value={v.middleName}    onChange={x => update("personal", { middleName: x })} />
        <Field label="Last Name"        editing={editing} value={v.lastName}      onChange={x => update("personal", { lastName: x })} />
        <Field label="Preferred Name"   editing={editing} value={v.preferredName} onChange={x => update("personal", { preferredName: x })} />
        <Field label="Date of Birth"    editing={editing} type="date" value={v.dateOfBirth} onChange={x => update("personal", { dateOfBirth: x })} />
        <div>
          <label style={labelStyle}>Age</label>
          <p style={valueStyle}>{age != null ? `${age} years` : dash}</p>
        </div>
        <Field label="Gender"           editing={editing} value={v.gender}        onChange={x => update("personal", { gender: x })} />
        <Field label="Nationality"      editing={editing} value={v.nationality}   onChange={x => update("personal", { nationality: x })} />
        <Field label="ID / Passport"    editing={editing} value={v.idNumber}      onChange={x => update("personal", { idNumber: x })} />
        <Field label="Marital Status"   editing={editing} value={v.maritalStatus} onChange={x => update("personal", { maritalStatus: x })} />
        <Field label="Languages (comma-separated)" full
               editing={editing}
               value={(v.languages || []).join(", ")}
               onChange={x => update("personal", { languages: x.split(",").map(s => s.trim()).filter(Boolean) })} />
      </Grid>

      <div style={{ marginTop: 26 }}>
        <label style={labelStyle}>Bio</label>
        {editing ? (
          <textarea
            value={draft.bio || ""}
            onChange={e => updateBio(e.target.value)}
            rows={4}
            placeholder="A short introduction visible to colleagues and managers."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        ) : (
          <p style={{ ...valueStyle, lineHeight: 1.6 }}>{profile.bio || dash}</p>
        )}
      </div>
    </Section>
  );
};

const EmploymentSection: React.FC<SectionProps> = ({ editing, draft, profile, update }) => {
  const v = editing ? draft.employment : profile.employment;
  return (
    <Section icon={<Briefcase size={18} />} iconColor={C.blue} title="Employment Details">
      <Grid cols={3}>
        <Field label="Employee Code"   editing={editing} value={v.employeeCode}      onChange={x => update("employment", { employeeCode: x })} />
        <Field label="Position"        editing={editing} value={v.position}          onChange={x => update("employment", { position: x })} />
        <Field label="Department"      editing={editing} value={v.department}        onChange={x => update("employment", { department: x })} />
        <Field label="Manager"         editing={editing} value={v.manager}           onChange={x => update("employment", { manager: x })} />
        <Field label="Hire Date"       editing={editing} type="date" value={v.hireDate}     onChange={x => update("employment", { hireDate: x })} />
        <Field label="Employment Type" editing={editing} value={v.employmentType}    onChange={x => update("employment", { employmentType: x as any })} />
        <Field label="Status"          editing={editing} value={v.employmentStatus}  onChange={x => update("employment", { employmentStatus: x as any })} />
        <Field label="Work Location"   editing={editing} value={v.workLocation}      onChange={x => update("employment", { workLocation: x })} />
        <Field label="Work Schedule"   editing={editing} value={v.workSchedule}      onChange={x => update("employment", { workSchedule: x })} />
        <Field label="Contract End"    editing={editing} type="date" value={v.contractEnd}  onChange={x => update("employment", { contractEnd: x })} />
        <div>
          <label style={labelStyle}>Tenure</label>
          <p style={valueStyle}>{yearsOfService(v.hireDate)}</p>
        </div>
      </Grid>
    </Section>
  );
};

const ContactSection: React.FC<SectionProps> = ({ editing, draft, profile, update }) => {
  const v = editing ? draft.contact   : profile.contact;
  const e = editing ? draft.emergency : profile.emergency;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      <Section icon={<Phone size={18} />} iconColor={C.green} title="Contact Information">
        <Grid cols={2}>
          <Field label="Personal Email" type="email" editing={editing} value={v.personalEmail} onChange={x => update("contact", { personalEmail: x })} />
          <Field label="Work Email"     type="email" editing={editing} value={v.workEmail}     onChange={x => update("contact", { workEmail: x })} />
          <Field label="Personal Phone" type="tel"   editing={editing} value={v.personalPhone} onChange={x => update("contact", { personalPhone: x })} />
          <Field label="Work Phone"     type="tel"   editing={editing} value={v.workPhone}     onChange={x => update("contact", { workPhone: x })} />
          <Field label="Address" full editing={editing} value={v.address}    onChange={x => update("contact", { address: x })} />
          <Field label="City"        editing={editing} value={v.city}        onChange={x => update("contact", { city: x })} />
          <Field label="Province"    editing={editing} value={v.province}    onChange={x => update("contact", { province: x })} />
          <Field label="Postal Code" editing={editing} value={v.postalCode}  onChange={x => update("contact", { postalCode: x })} />
          <Field label="Country"     editing={editing} value={v.country}     onChange={x => update("contact", { country: x })} />
        </Grid>
      </Section>

      <Section icon={<Shield size={18} />} iconColor={C.bad} title="Emergency Contact">
        <Grid cols={2}>
          <Field label="Full Name"    editing={editing} value={e.name}         onChange={x => update("emergency", { name: x })} />
          <Field label="Relationship" editing={editing} value={e.relationship} onChange={x => update("emergency", { relationship: x })} />
          <Field label="Phone" type="tel"   editing={editing} value={e.phone}  onChange={x => update("emergency", { phone: x })} />
          <Field label="Email" type="email" editing={editing} value={e.email}  onChange={x => update("emergency", { email: x })} />
        </Grid>
      </Section>
    </div>
  );
};

const BankingSection: React.FC<SectionProps> = ({ editing, draft, profile, update }) => {
  const v = editing ? draft.banking : profile.banking;
  return (
    <Section icon={<Building2 size={18} />} iconColor={C.amber} title="Banking & Tax">
      <div style={{
        marginBottom: 20, padding: 14, borderRadius: R.md,
        background: C.amberBg, color: "#92400e",
        display: "flex", alignItems: "center", gap: 10, fontSize: 13,
      }}>
        <Shield size={16} />
        Banking details are confidential and only used for payroll processing.
      </div>
      <Grid cols={2}>
        <Field label="Bank Name"      editing={editing} value={v.bankName}      onChange={x => update("banking", { bankName: x })} />
        <Field label="Account Holder" editing={editing} value={v.accountHolder} onChange={x => update("banking", { accountHolder: x })} />
        <Field label="Account Number" editing={editing} value={v.accountNumber} onChange={x => update("banking", { accountNumber: x })} />
        <Field label="Branch Code"    editing={editing} value={v.branchCode}    onChange={x => update("banking", { branchCode: x })} />
        <Field label="Account Type"   editing={editing} value={v.accountType}   onChange={x => update("banking", { accountType: x as any })} />
        <Field label="Tax Number"     editing={editing} value={v.taxNumber}     onChange={x => update("banking", { taxNumber: x })} />
        <Field label="UIF Number"     editing={editing} value={v.uifNumber}     onChange={x => update("banking", { uifNumber: x })} />
      </Grid>
    </Section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Documents
 * ─────────────────────────────────────────────────────────────────────── */

interface DocsProps {
  docs: DocumentEntry[];
  byCategory: Record<DocumentCategory, DocumentEntry[]>;
  uploadCategory: DocumentCategory;
  setUploadCategory: (c: DocumentCategory) => void;
  onUploadClick: () => void;
  onDelete: (d: DocumentEntry) => void;
}

const DocumentsSection: React.FC<DocsProps> = ({
  docs, byCategory, uploadCategory, setUploadCategory, onUploadClick, onDelete,
}) => (
  <Section
    icon={<FileText size={18} />}
    iconColor={C.coral}
    title={`My Documents (${docs.length})`}
    right={
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={uploadCategory}
          onChange={e => setUploadCategory(e.target.value as DocumentCategory)}
          style={{ ...inputStyle, width: "auto", padding: "9px 12px" }}
        >
          {DOCUMENT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={onUploadClick} style={primaryBtn}>
          <Upload size={14} /> Upload Files
        </button>
      </div>
    }
  >
    {docs.length === 0 ? (
      <EmptyState
        icon={<FileText size={36} />}
        title="No documents uploaded yet"
        body="Pick a category above and click Upload Files to add your ID, contract, qualifications and other documents."
      />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {DOCUMENT_CATEGORIES.map(cat => {
          const list = byCategory[cat.key] || [];
          if (!list.length) return null;
          return (
            <div key={cat.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>{cat.label}</h3>
                <span style={{ ...subtle, fontSize: 12 }}>· {list.length}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}>
                {list.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} color={cat.color} onDelete={() => onDelete(doc)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Section>
);

const DocumentCard: React.FC<{ doc: DocumentEntry; color: string; onDelete: () => void }> = ({ doc, color, onDelete }) => (
  <div style={{
    border: `1px solid ${C.line}`, borderRadius: R.md, padding: 14,
    background: "#fff", display: "flex", gap: 12,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: `${color}1a`, color, fontSize: 22,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>{documentIconFor(doc.type)}</div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p title={doc.name} style={{
        margin: 0, fontSize: 13, fontWeight: 600, color: C.ink,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{doc.name}</p>
      <p style={{ ...subtle, margin: "2px 0 0", fontSize: 12 }}>
        {formatFileSize(doc.size)} · {formatDateShort(doc.uploadedAt)}
      </p>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button onClick={() => downloadDocument(doc)} style={{ ...secondaryBtn, padding: "5px 10px", fontSize: 12 }}>
          <Download size={12} /> Download
        </button>
        <button onClick={onDelete} style={{ ...dangerBtn, padding: "5px 10px", fontSize: 12 }}>
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Skills
 * ─────────────────────────────────────────────────────────────────────── */

interface SkillsProps {
  skills: SkillEntry[];
  draft: { name: string; level: SkillEntry["level"] };
  setDraft: (d: { name: string; level: SkillEntry["level"] }) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

const SkillsSection: React.FC<SkillsProps> = ({ skills, draft, setDraft, onAdd, onRemove }) => (
  <Section icon={<Award size={18} />} iconColor={C.purple} title="Skills & Competencies">
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 1fr auto",
      gap: 12, marginBottom: 20, alignItems: "end",
    }}>
      <div>
        <label style={labelStyle}>Skill Name</label>
        <input
          style={inputStyle}
          value={draft.name}
          placeholder="e.g. Project Management"
          onChange={e => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={e => { if (e.key === "Enter") onAdd(); }}
        />
      </div>
      <div>
        <label style={labelStyle}>Level</label>
        <select
          style={inputStyle}
          value={draft.level}
          onChange={e => setDraft({ ...draft, level: e.target.value as SkillEntry["level"] })}
        >
          {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <button onClick={onAdd} style={primaryBtn}><Plus size={14} /> Add</button>
    </div>

    {skills.length === 0 ? (
      <EmptyState
        icon={<Award size={36} />}
        title="No skills added yet"
        body="Use the form above to add the skills you bring to the team."
      />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {skills.map(s => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", border: `1px solid ${C.line}`,
            borderRadius: R.md, background: "#fff",
          }}>
            <div>
              <p style={{ ...valueStyle, margin: 0 }}>{s.name}</p>
              <p style={{ ...subtle, margin: "2px 0 0", fontSize: 12 }}>{s.level}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: `${SKILL_LEVEL_COLOR[s.level]}22`, color: SKILL_LEVEL_COLOR[s.level],
              }}>{s.level}</span>
              <button onClick={() => onRemove(s.id)} title="Remove"
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </Section>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Activity
 * ─────────────────────────────────────────────────────────────────────── */

const ActivitySection: React.FC<{ activity: EmployeeProfileData["activity"] }> = ({ activity }) => (
  <Section icon={<Activity size={18} />} iconColor={C.blue} title="Recent Activity">
    {activity.length === 0 ? (
      <EmptyState
        icon={<Activity size={36} />}
        title="No recent activity"
        body="Profile updates, document uploads and skill changes will appear here."
      />
    ) : (
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {activity.map(a => (
          <li key={a.id} style={{
            display: "flex", gap: 12, padding: 14,
            border: `1px solid ${C.line}`, borderRadius: R.md, background: "#fff",
          }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.blueBg, color: C.blue, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={16} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ ...valueStyle, margin: 0 }}>{a.label}</p>
              {a.description && (
                <p style={{ ...subtle, margin: "2px 0 0", fontSize: 12,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.description}
                </p>
              )}
            </div>
            <span style={{ ...subtle, fontSize: 12, flexShrink: 0 }}>
              {formatDateTimeShort(a.at)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Section>
);
