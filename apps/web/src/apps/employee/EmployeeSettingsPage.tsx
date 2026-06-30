/**
 * EmployeeSettingsPage – account, security, notifications & preferences
 * for the logged-in employee. Visual language mirrors EmployeeProfilePage.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, CheckCircle2, ChevronRight, Globe2, Lock, LogOut,
  Mail, Save, Settings, Shield, User as UserIcon, X,
} from "lucide-react";
import SharedLayout from "./SharedLayout";
import { useCountry } from "../../shared/contexts/CountryContext";
import { C, R, SHADOW, API_URL, safeJson, unwrapSuccessData, getInitials } from "../../shared/utils/employee";
import { COUNTRY_PROFILES } from "../../shared/utils/country";
import {
  type EmployeeSettings,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  loadEmployeeSettings,
  saveEmployeeSettings,
} from "../../shared/utils/employeeSettings";

/* ──────────────────────────────────────────────────────────────────────────
 * Styles (match EmployeeProfilePage)
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
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: 0.5,
  color: C.faint, marginBottom: 6,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14, color: C.ink, fontWeight: 500, margin: 0, lineHeight: 1.5,
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

const ACCENT    = "#0d9488";
const ACCENT_DK = "#0f766e";

type SettingsSectionId = "account" | "security" | "notifications" | "preferences";

const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string }[] = [
  { id: "account",       label: "Account"       },
  { id: "security",      label: "Security"      },
  { id: "notifications", label: "Notifications" },
  { id: "preferences",   label: "Preferences"   },
];

const SECTION_META: Record<SettingsSectionId, {
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  blurb: string;
}> = {
  account:       { icon: UserIcon,  color: C.purple, blurb: "Login & identity"       },
  security:      { icon: Lock,      color: C.amber,  blurb: "Password & sessions"    },
  notifications: { icon: Bell,      color: C.blue,   blurb: "Email & alerts"         },
  preferences:   { icon: Globe2,    color: ACCENT,   blurb: "Language & display"     },
};

interface StoredUser {
  id?: string;
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  lastLogin?: string;
}

const userFromStorage = (): StoredUser => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

/* ──────────────────────────────────────────────────────────────────────────
 * Primitives
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

const FieldGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
  }}>{children}</div>
);

const ReadOnlyField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <p style={valueStyle}>{value || <span style={{ color: C.faint }}>—</span>}</p>
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <select style={selectStyle} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 16, padding: "14px 0",
    borderBottom: `1px solid ${C.line}`,
  }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{label}</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{description}</div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 999, border: "none", flexShrink: 0,
        background: checked ? ACCENT : C.line,
        cursor: "pointer", position: "relative",
        transition: "background .2s ease",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transition: "left .2s ease",
      }} />
    </button>
  </div>
);

const SectionRail: React.FC<{
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}> = ({ active, onSelect }) => (
  <div style={card}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: -0.2 }}>
      Settings
    </h3>
    <p style={{ ...subtle, margin: "2px 0 18px", fontSize: 12.5 }}>Manage your workspace.</p>
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {SETTINGS_SECTIONS.map(section => {
        const meta = SECTION_META[section.id];
        const Icon = meta.icon;
        const isActive = section.id === active;
        return (
          <li key={section.id}>
            <button
              type="button"
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

    <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
      <Link
        to="/employee/profile"
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 12,
          background: C.surfaceAlt, border: `1px solid ${C.line}`,
          textDecoration: "none", color: C.ink, fontSize: 13, fontWeight: 600,
        }}
      >
        <UserIcon size={16} color={ACCENT} />
        <span style={{ flex: 1 }}>Update HR profile</span>
        <ChevronRight size={14} color={C.faint} />
      </Link>
    </div>
  </div>
);

const HeroBanner: React.FC<{
  name: string;
  initials: string;
  email?: string;
  role?: string;
}> = ({ name, initials, email, role }) => (
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
    <div style={{ position: "relative", display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(255,255,255,0.22)",
        color: "#fff", fontSize: 24, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "3px solid rgba(255,255,255,0.85)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.18)", flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 12px", borderRadius: 999,
          background: "rgba(255,255,255,0.18)", fontSize: 12, fontWeight: 600,
        }}>
          <Settings size={14} /> Settings
        </div>
        <h1 style={{ margin: "10px 0 4px", fontSize: 26, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 }}>
          {name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 14, opacity: 0.95 }}>
          <Mail size={14} />
          <span>{email || "No email on file"}</span>
          {role && (
            <>
              <span style={{ opacity: 0.7 }}>·</span>
              <span style={{
                padding: "3px 10px", borderRadius: 999,
                background: "rgba(255,255,255,0.18)", fontSize: 12, fontWeight: 700,
              }}>
                {role}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Main
 * ─────────────────────────────────────────────────────────────────────── */

const EmployeeSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { country, setCountry } = useCountry();

  const storedUser = useMemo(userFromStorage, []);
  const [user, setUser] = useState<StoredUser>(storedUser);
  const [settings, setSettings] = useState<EmployeeSettings>(() => loadEmployeeSettings(storedUser.email));
  const [draft, setDraft] = useState<EmployeeSettings>(settings);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const name = useMemo(() => {
    const n = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return n || user.email || "Employee";
  }, [user]);

  const initials = useMemo(
    () => getInitials(name),
    [name],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const payload = await safeJson(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const me = unwrapSuccessData(payload) as StoredUser | null;
          if (me) {
            setUser(prev => ({ ...prev, ...me }));
            const loaded = loadEmployeeSettings(me.email || storedUser.email);
            setSettings(loaded);
            setDraft(loaded);
          }
        }
      } catch {
        /* keep localStorage fallback */
      } finally {
        setLoading(false);
      }
    })();
  }, [storedUser.email]);

  const updateNotifications = (key: keyof EmployeeSettings["notifications"], value: boolean) => {
    setDraft(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      saveEmployeeSettings(draft, user.email);
      setSettings(draft);
      showToast("Settings saved.", "success");
    } catch {
      showToast("Could not save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast("Please fill in all password fields.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Password change is not available yet. Contact your HR admin.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      showToast(msg, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const formatLastLogin = (raw?: string) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const hasUnsavedPrefs = useMemo(() => (
    draft.language !== settings.language
    || draft.timezone !== settings.timezone
    || draft.dateFormat !== settings.dateFormat
    || JSON.stringify(draft.notifications) !== JSON.stringify(settings.notifications)
  ), [draft, settings]);

  return (
    <SharedLayout>
      <Helmet>
        <title>Settings · KagoHC</title>
        <meta name="description" content="Manage your KagoHC account settings, notifications, and preferences." />
      </Helmet>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <style>{`
        @media (max-width: 900px) {
          .kg-settings-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ padding: 28, backgroundColor: C.surfaceAlt, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 96 }}>
          <HeroBanner
            name={name}
            initials={initials}
            email={user.email}
            role={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : undefined}
          />

          {loading ? (
            <div style={{ ...card, marginTop: 24, textAlign: "center", color: C.muted }}>
              Loading settings…
            </div>
          ) : (
            <div
              className="kg-settings-layout"
              style={{
                marginTop: 24, display: "grid",
                gridTemplateColumns: "minmax(0, 240px) minmax(0, 1fr)", gap: 22,
                alignItems: "flex-start",
              }}
            >
              <SectionRail active={activeSection} onSelect={setActiveSection} />

              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {activeSection === "account" && (
                  <Section
                    icon={<UserIcon size={20} />}
                    iconColor={C.purple}
                    title="Account"
                    subtitle="Your login identity. HR profile details are managed separately."
                  >
                    <FieldGrid>
                      <ReadOnlyField label="First Name" value={user.firstName} />
                      <ReadOnlyField label="Last Name" value={user.lastName} />
                      <ReadOnlyField label="Email Address" value={user.email} />
                      <ReadOnlyField label="Phone" value={user.phone} />
                      <ReadOnlyField label="Role" value={user.role} />
                      <ReadOnlyField label="Last Login" value={formatLastLogin(user.lastLogin)} />
                    </FieldGrid>
                    <p style={{ ...subtle, margin: "18px 0 0", lineHeight: 1.5 }}>
                      To update personal, contact, or banking details, go to{" "}
                      <Link to="/employee/profile" style={{ color: ACCENT, fontWeight: 600 }}>My Profile</Link>.
                    </p>
                  </Section>
                )}

                {activeSection === "security" && (
                  <>
                    <Section
                      icon={<Lock size={20} />}
                      iconColor={C.amber}
                      title="Change Password"
                      subtitle="Use a strong password you don't use elsewhere."
                    >
                      <form onSubmit={handlePasswordChange}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
                          <div>
                            <label style={labelStyle}>Current Password</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              autoComplete="current-password"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>New Password</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              autoComplete="new-password"
                              placeholder="Min. 6 characters"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <input
                              type="password"
                              style={inputStyle}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              autoComplete="new-password"
                            />
                          </div>
                          <button
                            type="submit"
                            style={{ ...primaryBtn, alignSelf: "flex-start", opacity: changingPassword ? 0.7 : 1 }}
                            disabled={changingPassword}
                          >
                            <Lock size={16} />
                            {changingPassword ? "Updating…" : "Update password"}
                          </button>
                        </div>
                      </form>
                    </Section>

                    <Section
                      icon={<Shield size={20} />}
                      iconColor={C.blue}
                      title="Session"
                      subtitle="Sign out of this device."
                    >
                      <button type="button" style={secondaryBtn} onClick={handleSignOut}>
                        <LogOut size={16} /> Sign out
                      </button>
                    </Section>
                  </>
                )}

                {activeSection === "notifications" && (
                  <Section
                    icon={<Bell size={20} />}
                    iconColor={C.blue}
                    title="Email Notifications"
                    subtitle="Choose what you'd like to be notified about."
                    right={hasUnsavedPrefs && (
                      <button type="button" style={primaryBtn} onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? "Saving…" : "Save"}
                      </button>
                    )}
                  >
                    <ToggleRow
                      label="Leave updates"
                      description="When your leave request is approved, rejected, or needs action."
                      checked={draft.notifications.leaveUpdates}
                      onChange={v => updateNotifications("leaveUpdates", v)}
                    />
                    <ToggleRow
                      label="Payslip ready"
                      description="When a new payslip is available for download."
                      checked={draft.notifications.payslipReady}
                      onChange={v => updateNotifications("payslipReady", v)}
                    />
                    <ToggleRow
                      label="Company notices"
                      description="Important announcements from HR and leadership."
                      checked={draft.notifications.companyNotices}
                      onChange={v => updateNotifications("companyNotices", v)}
                    />
                    <ToggleRow
                      label="Attendance reminders"
                      description="Gentle nudges if you haven't clocked in by your usual time."
                      checked={draft.notifications.attendanceReminders}
                      onChange={v => updateNotifications("attendanceReminders", v)}
                    />
                    <div style={{ borderBottom: "none" }}>
                      <ToggleRow
                        label="Weekly email digest"
                        description="A summary of your week — hours, leave balance, and team updates."
                        checked={draft.notifications.emailDigest}
                        onChange={v => updateNotifications("emailDigest", v)}
                      />
                    </div>
                  </Section>
                )}

                {activeSection === "preferences" && (
                  <Section
                    icon={<Globe2 size={20} />}
                    iconColor={ACCENT}
                    title="Regional & Display"
                    subtitle="Language, timezone, and formatting preferences."
                    right={hasUnsavedPrefs && (
                      <button type="button" style={primaryBtn} onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? "Saving…" : "Save"}
                      </button>
                    )}
                  >
                    <FieldGrid>
                      <SelectField
                        label="System Language"
                        value={draft.language}
                        options={LANGUAGE_OPTIONS}
                        onChange={v => setDraft(prev => ({ ...prev, language: v }))}
                      />
                      <SelectField
                        label="Timezone"
                        value={draft.timezone}
                        options={TIMEZONE_OPTIONS}
                        onChange={v => setDraft(prev => ({ ...prev, timezone: v }))}
                      />
                      <SelectField
                        label="Date Format"
                        value={draft.dateFormat}
                        options={DATE_FORMAT_OPTIONS}
                        onChange={v => setDraft(prev => ({ ...prev, dateFormat: v }))}
                      />
                      <div>
                        <label style={labelStyle}>Country / Region</label>
                        <select
                          style={selectStyle}
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                        >
                          {COUNTRY_PROFILES.map(p => (
                            <option key={p.iso2} value={p.name}>
                              {p.flag} {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </FieldGrid>
                  </Section>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </SharedLayout>
  );
};

export default EmployeeSettingsPage;
