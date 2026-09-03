import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote, Briefcase, Building2, Camera, Check, CheckCircle2, ChevronRight, Globe2,
  Landmark, MapPin, Plus, Receipt, Save, Shield, Sparkles, Trash2,
  UserCog, UserPlus, Users, UserSquare2, X,
} from "lucide-react";
import { useCountry } from "../../shared/contexts/CountryContext";
import PhoneInput from "../../shared/components/PhoneInput";
import { getCountryProfile } from "../../shared/utils/country";
import {
  type Administrator,
  type AdministratorDraft,
  type CompanyData,
  type Department,
  type OrgPosition,
  COMPANY_ADDRESS_FIELDS,
  COMPANY_BANKING_FIELDS,
  COMPANY_BASIC_FIELDS,
  COMPANY_FISCAL_FIELDS,
  COMPANY_LEGAL_FIELDS,
  CONTACT_FIELDS,
  BUSINESS_UNIT_TEMPLATES,
  EMPTY_COMPANY,
  OC,
  OR,
  OSHADOW,
  SADC_COUNTRIES,
  SYSTEM_ROLES,
  completeOnboarding,
  computeCompanyCompletion,
  createAdministrator,
  createDepartment,
  deleteDepartment,
  fetchAdministrators,
  fetchCompanySettings,
  fetchDepartments,
  getByPath,
  initialsFromName,
  loadCache,
  loadCachedPositions,
  readFileAsDataUrl,
  saveCache,
  saveCachedPositions,
  saveCompanySettings,
  setByPath,
  validateAdministrator,
  validateCompanyForSave,
} from "../../shared/utils/onboarding";
import { C } from "../../shared/utils/employee";

/* ──────────────────────────────────────────────────────────────────────────
 * Shared inline styles
 * ─────────────────────────────────────────────────────────────────────── */

const card: React.CSSProperties = {
  background: OC.surface,
  border: `1px solid ${OC.line}`,
  borderRadius: OR.xl,
  boxShadow: OSHADOW,
  padding: 24,
};
const subtle: React.CSSProperties = { color: OC.muted, fontSize: 13 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${OC.line}`,
  background: "#fff",
  fontSize: 14,
  color: OC.ink,
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: 0.5,
  color: OC.faint, marginBottom: 6,
};
const valueStyle: React.CSSProperties = {
  fontSize: 14, color: OC.ink, fontWeight: 500, margin: 0,
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, border: "none",
  background: OC.accent, color: "#fff",
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
  boxShadow: "0 4px 12px rgba(79,61,163,0.28)",
};
const secondaryBtn: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10,
  border: `1px solid ${OC.line}`, background: "#fff",
  color: OC.text, fontWeight: 600, fontSize: 13, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
};
const ghostBtn: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 8,
  border: "none", background: "transparent",
  color: OC.muted, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
};
const dash = <span style={{ color: OC.faint }}>—</span>;

/* ──────────────────────────────────────────────────────────────────────────
 * Reusable bits
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
          background: `${iconColor}1a`, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: OC.ink, letterSpacing: -0.2 }}>{title}</h2>
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
    background: type === "success" ? OC.okBg : OC.badBg,
    color:      type === "success" ? "#027a48" : "#b42318",
    border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
    display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500,
    boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
  }}>
    {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
    {message}
  </div>
);

const StatTile: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div style={{
    background: OC.surfaceAlt, border: `1px solid ${OC.line}`,
    borderRadius: OR.md, padding: 16,
  }}>
    <p style={{ ...subtle, margin: 0, fontSize: 12, fontWeight: 600 }}>{label}</p>
    <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700, color: accent }}>{value}</p>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Field renderers
 * ─────────────────────────────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  value?: string;
  editing: boolean;
  type?: string;
  placeholder?: string;
  options?: readonly string[];
  onChange?: (v: string) => void;
}

const Field: React.FC<FieldProps> = ({ label, value, editing, type = "text", placeholder, options, onChange }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {editing ? (
      options && options.length ? (
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={value || ""}
          onChange={e => onChange?.(e.target.value)}
        >
          <option value="">Select…</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : type === "tel" ? (
        // Smart phone field tied to the active country (locked dial code,
        // local placeholder, local-only validation).
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
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 18,
  }}>{children}</div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Step config
 * ─────────────────────────────────────────────────────────────────────── */

const STEPS = [
  { id: 1, title: "Country",       blurb: "Choose your SADC country",            icon: Globe2,    color: OC.blue },
  { id: 2, title: "Company",       blurb: "Tell us about your organisation",     icon: Building2, color: OC.accent },
  { id: 3, title: "Administrators", blurb: "Invite your administrators",          icon: UserCog,   color: OC.purple },
  { id: 4, title: "Structure",     blurb: "Departments, positions, and roles",   icon: Users,     color: OC.teal },
] as const;
type StepId = typeof STEPS[number]["id"];

/* ──────────────────────────────────────────────────────────────────────────
 * Main component
 * ─────────────────────────────────────────────────────────────────────── */

const OnboardingPage: React.FC = () => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Country lives in a global context so it can influence phone inputs,
  // compliance rules, etc. across the whole app. The local component
  // mirror keeps the existing render code unchanged.
  const { country, setCountry: setActiveCountry } = useCountry();
  const setCountry = (next: string) => {
    setActiveCountry(next);
    // Mirror onto the company drafts so the field is included in the
    // very next save (whether triggered by Continue or by Edit Details).
    setCompany(c => ({ ...c, country: next, address: { ...c.address, country: next } }));
    setCompanyDraft(c => ({ ...c, country: next, address: { ...c.address, country: next } }));
  };

  // Company
  const [company, setCompany] = useState<CompanyData>(EMPTY_COMPANY);
  const [companyDraft, setCompanyDraft] = useState<CompanyData>(EMPTY_COMPANY);
  const [editingCompany, setEditingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Administrators
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [deptDraft, setDeptDraft] = useState({ name: "", description: "" });
  // "department" = nested under a Business Unit, "business_unit" = top-level
  // (parentDepartment: null). See createDepartment in onboarding.ts.
  const [deptType, setDeptType] = useState<"department" | "business_unit">("business_unit");
  const [deptParentId, setDeptParentId] = useState<string>("");
  const [savingDept, setSavingDept] = useState(false);

  // Positions (local catalog until a positions API exists)
  const [positions, setPositions] = useState<OrgPosition[]>(() => loadCachedPositions());
  const [posDraft, setPosDraft] = useState({ name: "", description: "", departmentId: "" });
  const [savingPos, setSavingPos] = useState(false);
  const persistReady = useRef(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  // ── Initial load (cache + company from API) ─────────────────────────────
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      if (cached.country) setActiveCountry(cached.country);
      setCompany(cached.company || EMPTY_COMPANY);
      setCompanyDraft(cached.company || EMPTY_COMPANY);
      setAdministrators(cached.administrators || []);
      setCompletedSteps(cached.completedSteps || []);
      setPositions(cached.positions || []);
    }
    persistReady.current = true;
    (async () => {
      try {
        const remote = await fetchCompanySettings();
        if (remote && Object.keys(remote).length) {
          const merged = { ...EMPTY_COMPANY, ...(cached?.company || {}), ...remote } as CompanyData;
          setCompany(merged);
          setCompanyDraft(merged);
          // Backend is the source of truth — if it has a country, sync the
          // global context so phone inputs across the system pick it up.
          const remoteCountry =
            (remote as any)?.country ||
            (remote as any)?.address?.country;
          if (remoteCountry) setActiveCountry(remoteCountry);
        }
      } catch (err) { console.warn("Could not load company settings:", err); }
    })();
  }, []);

  // ── Persist progress to local cache ─────────────────────────────────────
  useEffect(() => {
    if (!persistReady.current) return;
    saveCache({ country, company, administrators, completedSteps, positions });
  }, [country, company, administrators, completedSteps, positions]);

  // ── Step navigation ─────────────────────────────────────────────────────
  const goToStep = (id: StepId) => setCurrentStep(id);
  const advanceFromStep = (id: StepId) => {
    setCompletedSteps(prev => Array.from(new Set([...prev, id])));
    if (id < 4) setCurrentStep((id + 1) as StepId);

    // When leaving the Country step, persist the country to the backend
    // so it becomes the system-wide default immediately. We fire and
    // forget — UI doesn't block on this.
    if (id === 1) {
      const next: CompanyData = {
        ...company,
        country,
        address: { ...company.address, country },
      };
      saveCompanySettings(next)
        .then(() => setCompany(next))
        .catch(() => { /* silent — cached locally regardless */ });
    }
  };

  const handleCompleteOnboarding = async () => {
    setCompletedSteps(prev => Array.from(new Set([...prev, 4])));
    try {
      await completeOnboarding({
        country,
        company,
        departments: departments.map(d => d.name),
      });
      showToast("Onboarding complete! Welcome to KagoHC.", "success");
    } catch (err: any) {
      showToast(err?.message || "Saved locally — could not reach the backend.", "error");
    }
  };

  // ── Company handlers ────────────────────────────────────────────────────
  const startEditCompany = () => { setCompanyDraft(company); setEditingCompany(true); };
  const cancelEditCompany = () => { setCompanyDraft(company); setEditingCompany(false); };
  const updateCompanyPath = (path: string, value: string) =>
    setCompanyDraft(c => setByPath(c, path, value));

  const handleSaveCompany = async () => {
    const err = validateCompanyForSave(companyDraft);
    if (err) { showToast(err, "error"); return; }
    setSavingCompany(true);
    try {
      await saveCompanySettings(companyDraft);
      setCompany(companyDraft);
      setEditingCompany(false);
      showToast("Company details saved.", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to save company details.", "error");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next = { ...companyDraft, logoDataUrl: dataUrl };
      setCompanyDraft(next);
      setCompany(next);
      showToast("Logo updated.", "success");
    } catch {
      showToast("Could not read image file.", "error");
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // ── Department handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== 4) return;
    setLoadingDepartments(true);
    fetchDepartments()
      .then(setDepartments)
      .catch(err => showToast(err?.message || "Failed to load departments.", "error"))
      .finally(() => setLoadingDepartments(false));
  }, [currentStep]);

  // ── Load administrators when on step 3 ──────────────────────────────────
  useEffect(() => {
    if (currentStep !== 3) return;
    fetchAdministrators()
      .then(rows => { if (rows.length) setAdministrators(rows); })
      .catch(err => console.warn("Could not load administrators:", err));
  }, [currentStep]);

  const handleAddDepartment = async () => {
    const name = deptDraft.name.trim();
    if (!name) { showToast("Name is required.", "error"); return; }
    if (deptType === "department" && !deptParentId) {
      showToast("Select a Business Unit for this department.", "error");
      return;
    }

    // Client-side duplicate guard: the backend enforces a name-uniqueness
    // check across ALL department records (business units AND leaf
    // departments share the same collection), so catch it here first.
    // This gives an immediate, consistent message in every environment
    // instead of depending on how the backend's 400 response happens to
    // be worded — which is what made this feel inconsistent between
    // local and the Vercel/Heroku deployment (same validation, same
    // result, just surfaced differently depending on network timing).
    const nameTaken = departments.some(
      d => d.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (nameTaken) {
      showToast(`"${name}" already exists in your organization structure. Choose a different name.`, "error");
      return;
    }

    setSavingDept(true);
    try {
      const parentDepartment = deptType === "business_unit" ? null : deptParentId;
      const created = await createDepartment(name, deptDraft.description.trim() || undefined, parentDepartment);
      setDepartments(prev => [created, ...prev]);
      setDeptDraft({ name: "", description: "" });
      showToast(`${deptType === "business_unit" ? "Business unit" : "Department"} added.`, "success");
    } catch (e: any) {
      // Still handle it gracefully if the client-side check somehow
      // misses a case the backend catches (e.g. a name added by someone
      // else a second ago, in a multi-admin scenario) — map common
      // backend wording to the same friendly message rather than
      // showing a raw "Request failed (400)".
      const raw = e?.message || "";
      const isDuplicate = /already exists|duplicate/i.test(raw);
      showToast(
        isDuplicate
          ? `"${name}" already exists in your organization structure. Choose a different name.`
          : (raw || "Failed to add. Please try again."),
        "error"
      );
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (d: Department) => {
    if (!d.id) return;
    if (!window.confirm(`Delete "${d.name}"?`)) return;
    try {
      await deleteDepartment(d.id);
      const childIds = departments.filter(x => x.parentDepartment === d.id).map(x => x.id);
      setDepartments(prev => prev.filter(x => x.id !== d.id));
      setPositions(prev => {
        const next = prev.filter(p => p.departmentId !== d.id && !childIds.includes(p.departmentId));
        saveCachedPositions(next);
        return next;
      });
      showToast("Deleted.", "success");
    } catch (e: any) {
      showToast(e?.message || "Failed to delete.", "error");
    }
  };

  const handleAddPosition = () => {
    const name = posDraft.name.trim();
    if (!name) { showToast("Position name is required.", "error"); return; }
    if (!posDraft.departmentId) {
      showToast("Select a department for this position.", "error");
      return;
    }
    const dept = departments.find(d => d.id === posDraft.departmentId);
    if (!dept) { showToast("Select a valid department.", "error"); return; }
    const taken = positions.some(
      p => p.departmentId === posDraft.departmentId && p.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (taken) {
      showToast(`"${name}" already exists in ${dept.name}.`, "error");
      return;
    }
    setSavingPos(true);
    const created: OrgPosition = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `pos-${Date.now()}`,
      name,
      description: posDraft.description.trim() || undefined,
      departmentId: posDraft.departmentId,
      departmentName: dept.name,
    };
    setPositions(prev => {
      const next = [created, ...prev];
      saveCachedPositions(next);
      return next;
    });
    setPosDraft({ name: "", description: "", departmentId: posDraft.departmentId });
    setSavingPos(false);
    showToast("Position added.", "success");
  };

  const handleDeletePosition = (p: OrgPosition) => {
    if (!window.confirm(`Delete position "${p.name}"?`)) return;
    setPositions(prev => {
      const next = prev.filter(x => x.id !== p.id);
      saveCachedPositions(next);
      return next;
    });
    showToast("Position deleted.", "success");
  };

  // ── Administrator handlers ──────────────────────────────────────────────
  const handleCreateAdministrator = async (draft: AdministratorDraft) => {
    const err = validateAdministrator(draft);
    if (err) throw new Error(err);
    const created = await createAdministrator(draft);
    setAdministrators(prev => [created, ...prev]);
    showToast(`${created.firstName} ${created.lastName} added as administrator.`, "success");
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const completion = useMemo(() => computeCompanyCompletion(company), [company]);
  const overallProgress = useMemo(
    () => Math.round((completedSteps.filter(s => [1, 2, 3, 4].includes(s)).length / 4) * 100),
    [completedSteps],
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      padding: 28, backgroundColor: OC.surfaceAlt, minHeight: "100vh",
    }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 96 }}>
        <HeroBanner country={country} progress={overallProgress} />

        <div style={{
          marginTop: 24, display: "grid",
          gridTemplateColumns: "minmax(0, 280px) minmax(0, 1fr)", gap: 22,
          alignItems: "flex-start",
        }}>
          <Stepper
            currentStep={currentStep}
            completed={completedSteps}
            onSelect={goToStep}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {currentStep === 1 && (
              <CountryStep
                country={country}
                onChange={setCountry}
                onContinue={() => advanceFromStep(1)}
              />
            )}
            {currentStep === 2 && (
              <CompanyStep
                company={editingCompany ? companyDraft : company}
                editing={editingCompany}
                saving={savingCompany}
                completion={completion}
                logoInputRef={logoInputRef}
                onLogoUpload={handleLogoUpload}
                onStartEdit={startEditCompany}
                onCancelEdit={cancelEditCompany}
                onChangeField={updateCompanyPath}
                onSave={handleSaveCompany}
                onContinue={() => advanceFromStep(2)}
              />
            )}
            {currentStep === 3 && (
              <AdministratorsStep
                administrators={administrators}
                onOpenAddModal={() => setAdminModalOpen(true)}
                onContinue={() => advanceFromStep(3)}
              />
            )}
            {currentStep === 4 && (
              <StructureStep
                departments={departments}
                loading={loadingDepartments}
                deptDraft={deptDraft}
                deptType={deptType}
                deptParentId={deptParentId}
                saving={savingDept}
                onDraftChange={setDeptDraft}
                onTypeChange={setDeptType}
                onParentChange={setDeptParentId}
                onAdd={handleAddDepartment}
                onDelete={handleDeleteDepartment}
                positions={positions}
                posDraft={posDraft}
                savingPos={savingPos}
                onPosDraftChange={setPosDraft}
                onAddPosition={handleAddPosition}
                onDeletePosition={handleDeletePosition}
                onComplete={handleCompleteOnboarding}
              />
            )}
          </div>
        </div>
      </div>

      {adminModalOpen && (
        <AdministratorModal
          onClose={() => setAdminModalOpen(false)}
          onSubmit={handleCreateAdministrator}
        />
      )}
    </div>
  );
};

export default OnboardingPage;

/* ──────────────────────────────────────────────────────────────────────────
 * Hero banner
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Header bar — mirrors the look of the sibling Owner pages
 * (ManagersPage / EmployeesPage on the owner side): bordered Card,
 * pill on the left, pill chips on the right, system blue accent.
 */
const HERO_BRAND = C.primary;
const HERO_BRAND_DK = C.primaryDark;
const HERO_BORDER = "#D9D9D9";
const HERO_TINT = C.primaryTint;
const HERO_TINT_LINE = "rgba(51,166,205,0.28)";

const HeroBanner: React.FC<{ country: string; progress: number }> = ({ country, progress }) => (
  <div style={{
    background: "#fff",
    borderRadius: 10,
    border: `2px solid ${HERO_BORDER}`,
    boxShadow: "0px 4px 8px rgba(0,0,0,0.10)",
    padding: "16px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 18, flexWrap: "wrap",
  }}>
    {/* Title block */}
    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: "1 1 auto" }}>
      <span style={{
        width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${HERO_BRAND} 0%, ${HERO_BRAND_DK} 100%)`,
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 10px rgba(51,166,205,0.28)",
      }}>
        <Sparkles size={22} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "2px 9px", borderRadius: 999,
          background: HERO_TINT, color: HERO_BRAND_DK,
          border: `1px solid ${HERO_TINT_LINE}`,
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
          marginBottom: 6,
        }}>
          <Shield size={11} /> Owner Onboarding
        </div>
        <h1 style={{
          margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.3,
          color: OC.ink, lineHeight: 1.1,
        }}>
          Welcome to KagoHC
        </h1>
        <p style={{ margin: "3px 0 0", color: OC.muted, fontSize: 12.5, maxWidth: 560 }}>
          Complete these four guided steps to bring your organisation online — progress is saved as you go.
        </p>
      </div>
    </div>

    {/* Right meta — country pill + progress pill + progress bar */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, minWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: "#fff", color: OC.text,
          border: `2px solid ${HERO_BORDER}`,
          fontSize: 12, fontWeight: 700,
        }}>
          <Globe2 size={13} /> {country}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: HERO_BRAND, color: "#fff",
          fontSize: 12, fontWeight: 700,
          boxShadow: "0 4px 10px rgba(51,166,205,0.28)",
        }}>
          {progress}% complete
        </span>
      </div>
      <div style={{
        width: 240, height: 6, borderRadius: 999, overflow: "hidden",
        background: HERO_TINT, border: `1px solid ${HERO_TINT_LINE}`,
      }}>
        <div style={{
          width: `${progress}%`, height: "100%",
          background: `linear-gradient(90deg, ${HERO_BRAND} 0%, ${HERO_BRAND_DK} 100%)`,
          borderRadius: 999, transition: "width .3s ease",
        }} />
      </div>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Stepper (left rail)
 * ─────────────────────────────────────────────────────────────────────── */

const Stepper: React.FC<{
  currentStep: StepId;
  completed: number[];
  onSelect: (id: StepId) => void;
}> = ({ currentStep, completed, onSelect }) => (
  <div style={card}>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: OC.ink, letterSpacing: -0.2 }}>
      Setup steps
    </h3>
    <p style={{ ...subtle, margin: "2px 0 18px", fontSize: 12.5 }}>Click any step to jump.</p>

    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {STEPS.map(step => {
        const active = step.id === currentStep;
        const done = completed.includes(step.id);
        const Icon = step.icon;
        return (
          <li key={step.id}>
            <button
              onClick={() => onSelect(step.id)}
              style={{
                width: "100%", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                background: active ? `${step.color}14` : "transparent",
                border: `1px solid ${active ? `${step.color}40` : "transparent"}`,
                transition: "background .15s ease, border-color .15s ease",
              }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: done ? `${OC.ok}22` : active ? `${step.color}22` : OC.surfaceAlt,
                color:      done ? OC.ok        : active ? step.color       : OC.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: active ? step.color : OC.ink }}>
                  {step.title}
                </span>
                <span style={{ display: "block", fontSize: 12, color: OC.muted, marginTop: 1 }}>
                  {step.blurb}
                </span>
              </span>
              {active && <ChevronRight size={14} color={step.color} />}
            </button>
          </li>
        );
      })}
    </ol>
  </div>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Step 1 – Country
 * ─────────────────────────────────────────────────────────────────────── */

const CountryStep: React.FC<{
  country: string;
  onChange: (c: string) => void;
  onContinue: () => void;
}> = ({ country, onChange, onContinue }) => {
  const profile = getCountryProfile(country);
  return (
    <Section
      icon={<Globe2 size={20} />} iconColor={OC.blue}
      title="Country Selection"
      subtitle="Auto-loads SADC compliance defaults and locks phone inputs to local numbers."
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
        <div>
          <label style={labelStyle}>SADC Country</label>
          <select
            value={country}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {SADC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Live country card — shows the dial code & local format */}
        <div style={{
          display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12,
        }}>
          <div style={{
            padding: 14, borderRadius: OR.md,
            background: "#fff", border: `1px solid ${OC.line}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{profile.flag}</span>
            <div>
              <p style={{ ...subtle, margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Active country
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: OC.ink }}>
                {profile.name}
              </p>
            </div>
          </div>
          <div style={{
            padding: 14, borderRadius: OR.md,
            background: "#fff", border: `1px solid ${OC.line}`,
          }}>
            <p style={{ ...subtle, margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Phone format
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: OC.ink, fontFamily: "monospace" }}>
              +{profile.dialCode} <span style={{ color: OC.muted }}>{profile.placeholderLocal}</span>
            </p>
          </div>
        </div>

        <div style={{
          padding: 14, borderRadius: OR.md,
          background: OC.blueBg, color: "#1e40af",
          display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13,
        }}>
          <Sparkles size={16} style={{ marginTop: 2 }} />
          <span>
            Compliance rules, public holidays, statutory leave defaults and{" "}
            <strong>every phone field across the system</strong> will be tailored to{" "}
            <strong>{profile.name}</strong> once you continue. Only{" "}
            <strong>+{profile.dialCode}</strong> numbers will be accepted.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onContinue} style={primaryBtn}>
            Continue to Company <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </Section>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Step 2 – Company
 * ─────────────────────────────────────────────────────────────────────── */

const CompanyStep: React.FC<{
  company: CompanyData;
  editing: boolean;
  saving: boolean;
  completion: number;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeField: (path: string, value: string) => void;
  onSave: () => void;
  onContinue: () => void;
}> = ({
  company, editing, saving, completion, logoInputRef, onLogoUpload,
  onStartEdit, onCancelEdit, onChangeField, onSave, onContinue,
}) => {
  const headerActions = editing ? (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onCancelEdit} style={secondaryBtn}><X size={14} /> Cancel</button>
      <button onClick={onSave} style={primaryBtn} disabled={saving}>
        <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  ) : (
    <button onClick={onStartEdit} style={primaryBtn}>
      <Save size={14} /> Edit Details
    </button>
  );

  const renderFields = (specs: { label: string; path: string; type?: string; placeholder?: string; options?: readonly string[] }[], cols = 2) => (
    <FieldGrid cols={cols}>
      {specs.map(f => (
        <Field
          key={f.path}
          label={f.label}
          value={getByPath(company, f.path) as string | undefined}
          editing={editing}
          type={f.type}
          placeholder={f.placeholder}
          options={f.options}
          onChange={v => onChangeField(f.path, v)}
        />
      ))}
    </FieldGrid>
  );

  return (
    <>
      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
      }}>
        <StatTile label="Company name" value={company.name || "—"} accent={OC.accent} />
        <StatTile label="Sector"       value={company.sector || "—"} accent={OC.blue} />
        <StatTile label="Profile fill" value={`${completion}%`} accent={OC.green} />
        <StatTile label="Country"      value={company.country || "—"} accent={OC.teal} />
      </div>

      {/* Basic Information + Logo */}
      <Section
        icon={<Building2 size={20} />} iconColor={OC.accent}
        title="Company Information"
        subtitle="These details power your dashboards, invoices and compliance reports."
        right={headerActions}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 84, height: 84, borderRadius: "50%",
              background: company.logoDataUrl
                ? `center/cover no-repeat url(${company.logoDataUrl})`
                : `linear-gradient(135deg, ${OC.accent}, ${OC.accentDk})`,
              color: "#fff", fontSize: 30, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(79,61,163,0.25)",
            }}>
              {!company.logoDataUrl && (company.name?.charAt(0) || "K").toUpperCase()}
            </div>
            {editing && (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#fff", color: OC.accent,
                  border: `1px solid ${OC.line}`, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <Camera size={14} />
              </button>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoUpload} style={{ display: "none" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: OC.ink }}>{company.name || "Your company"}</p>
            <p style={{ ...subtle, margin: "2px 0 0" }}>{company.sector || "Sector not set"}</p>
          </div>
        </div>

        {renderFields(COMPANY_BASIC_FIELDS, 2)}
      </Section>

      {/* Legal & SARS */}
      <Section
        icon={<Receipt size={20} />} iconColor={OC.blue}
        title="Legal & SARS Registration"
        subtitle="CIPC, SARS, PAYE, UIF and SDL references for statutory reporting."
        right={headerActions}
      >
        {renderFields(COMPANY_LEGAL_FIELDS, 2)}
      </Section>

      {/* Banking */}
      <Section
        icon={<Banknote size={20} />} iconColor={OC.green}
        title="Banking Details"
        subtitle="Used for payroll runs, supplier payments and direct deposit reconciliation."
        right={headerActions}
      >
        {renderFields(COMPANY_BANKING_FIELDS, 2)}
      </Section>

      {/* Key Contacts */}
      <Section
        icon={<UserSquare2 size={20} />} iconColor={OC.purple}
        title="Key Contacts"
        subtitle="People we reach for executive and payroll communications."
        right={headerActions}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 22 }}>
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: OC.purple, textTransform: "uppercase", letterSpacing: 0.4 }}>
              CEO / Managing Director
            </h3>
            {renderFields(CONTACT_FIELDS("contacts.ceo"), 3)}
          </div>
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: OC.purple, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Payroll Manager
            </h3>
            {renderFields(CONTACT_FIELDS("contacts.payroll"), 3)}
          </div>
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: OC.purple, textTransform: "uppercase", letterSpacing: 0.4 }}>
              Finance Contact
            </h3>
            {renderFields(CONTACT_FIELDS("contacts.finance"), 3)}
          </div>
        </div>
      </Section>

      {/* Address & Fiscal Year */}
      <Section
        icon={<MapPin size={20} />} iconColor={OC.teal}
        title="Address & Fiscal Year"
        subtitle="Physical location and the financial period your reports follow."
        right={headerActions}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: OC.teal, textTransform: "uppercase", letterSpacing: 0.4 }}>
          Physical Address
        </h3>
        {renderFields(COMPANY_ADDRESS_FIELDS, 2)}

        <h3 style={{ margin: "22px 0 12px", fontSize: 13, fontWeight: 700, color: OC.teal, textTransform: "uppercase", letterSpacing: 0.4 }}>
          Fiscal Year
        </h3>
        {renderFields(COMPANY_FISCAL_FIELDS, 2)}
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onContinue} style={primaryBtn}>
          Continue to Administrators <ChevronRight size={14} />
        </button>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Step 3 – Administrators
 * ─────────────────────────────────────────────────────────────────────── */

const AdministratorsStep: React.FC<{
  administrators: Administrator[];
  onOpenAddModal: () => void;
  onContinue: () => void;
}> = ({ administrators, onOpenAddModal, onContinue }) => (
  <Section
    icon={<UserCog size={20} />} iconColor={OC.purple}
    title="Administrators"
    subtitle="People with owner-level access to manage the whole platform."
    right={
      <button onClick={onOpenAddModal} style={primaryBtn}>
        <UserPlus size={14} /> Add Administrator
      </button>
    }
  >
    {administrators.length === 0 ? (
      <EmptyHint
        icon={<UserCog size={32} />}
        title="No administrators added yet"
        body="Click Add Administrator to create your first one. Administrators can manage employees, leave, payroll and settings."
      />
    ) : (
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {administrators.map((a, i) => (
          <li key={a.id || i} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 14px", borderRadius: OR.md,
            background: OC.surfaceAlt, border: `1px solid ${OC.line}`,
          }}>
            <span style={{
              width: 42, height: 42, borderRadius: "50%",
              background: `linear-gradient(135deg, ${OC.purple}, ${OC.accent})`,
              color: "#fff", fontWeight: 700, fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {initialsFromName(a.firstName, a.lastName)}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ ...valueStyle, margin: 0 }}>{a.firstName} {a.lastName}</p>
              <p style={{ ...subtle, margin: "2px 0 0", fontSize: 12 }}>{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
            </div>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 700,
              background: OC.purpleBg, color: OC.purple,
            }}>{a.role.toUpperCase()}</span>
          </li>
        ))}
      </ul>
    )}

    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
      <button onClick={onContinue} style={primaryBtn}>
        Continue to Structure <ChevronRight size={14} />
      </button>
    </div>
  </Section>
);

/* ──────────────────────────────────────────────────────────────────────────
 * Step 4 – Departments & System Roles
 * ─────────────────────────────────────────────────────────────────────── */

/** Two-option segmented control — used to pick Department vs Business Unit. */
const SegToggle: React.FC<{
  value: "department" | "business_unit";
  onChange: (v: "department" | "business_unit") => void;
}> = ({ value, onChange }) => (
  <div style={{
    display: "inline-flex", padding: 4, borderRadius: 12,
    background: OC.surfaceAlt, border: `1px solid ${OC.line}`, gap: 3,
  }}>
    {(["business_unit", "department"] as const).map(opt => {
      const active = value === opt;
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: "9px 18px", borderRadius: 9, border: "none",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            background: active ? (opt === "business_unit" ? OC.accent : OC.teal) : "transparent",
            color: active ? "#fff" : OC.muted,
            transition: "background .15s ease, color .15s ease",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          {opt === "business_unit" ? <Landmark size={13} /> : <Building2 size={13} />}
          {opt === "department" ? "Department" : "Business Unit"}
        </button>
      );
    })}
  </div>
);

const StructureStep: React.FC<{
  departments: Department[];
  loading: boolean;
  deptDraft: { name: string; description: string };
  deptType: "department" | "business_unit";
  deptParentId: string;
  saving: boolean;
  onDraftChange: (d: { name: string; description: string }) => void;
  onTypeChange: (t: "department" | "business_unit") => void;
  onParentChange: (id: string) => void;
  onAdd: () => void;
  onDelete: (d: Department) => void;
  positions: OrgPosition[];
  posDraft: { name: string; description: string; departmentId: string };
  savingPos: boolean;
  onPosDraftChange: (d: { name: string; description: string; departmentId: string }) => void;
  onAddPosition: () => void;
  onDeletePosition: (p: OrgPosition) => void;
  onComplete: () => void;
}> = ({
  departments, loading, deptDraft, deptType, deptParentId, saving,
  onDraftChange, onTypeChange, onParentChange, onAdd, onDelete,
  positions, posDraft, savingPos, onPosDraftChange, onAddPosition, onDeletePosition,
  onComplete,
}) => {
  // Top-level = no parent set = a Business Unit.
  const businessUnits = useMemo(
    () => departments.filter(d => !d.parentDepartment),
    [departments],
  );

  // Departments grouped by the Business Unit id they belong to.
  const departmentsByUnit = useMemo(() => {
    const map = new Map<string, Department[]>();
    departments.filter(d => d.parentDepartment).forEach(d => {
      const key = d.parentDepartment as string;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return map;
  }, [departments]);

  const leafDepartments = useMemo(
    () => departments.filter(d => !!d.parentDepartment),
    [departments],
  );

  const positionsByDept = useMemo(() => {
    const map = new Map<string, OrgPosition[]>();
    positions.forEach(p => {
      if (!map.has(p.departmentId)) map.set(p.departmentId, []);
      map.get(p.departmentId)!.push(p);
    });
    return map;
  }, [positions]);

  // Whether the name field is showing free-text entry instead of the
  // controlled dropdown. Reset whenever the user switches what they're
  // adding, or (for departments) switches which business unit they're
  // adding under — a leftover custom-name flag from a previous selection
  // shouldn't carry over.
  const [useCustomName, setUseCustomName] = useState(false);
  useEffect(() => {
    setUseCustomName(false);
    onDraftChange({ ...deptDraft, name: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptType, deptParentId]);

  // Standard business unit names not already present (case-insensitive) —
  // these populate the dropdown so an owner picks "Commercial" once,
  // never types "Commercial" and "Commercials" as two different units.
  const availableBusinessUnitNames = useMemo(() => {
    const existing = new Set(businessUnits.map(u => u.name.trim().toLowerCase()));
    return BUSINESS_UNIT_TEMPLATES.map(t => t.name).filter(n => !existing.has(n.toLowerCase()));
  }, [businessUnits]);

  // Standard department names for whichever business unit is currently
  // selected, minus any already added under it. Custom (non-template)
  // business units have no suggestions — those departments must be typed.
  const availableDepartmentNames = useMemo(() => {
    const unit = businessUnits.find(u => u.id === deptParentId);
    if (!unit) return [];
    const template = BUSINESS_UNIT_TEMPLATES.find(t => t.name.toLowerCase() === unit.name.trim().toLowerCase());
    if (!template) return [];
    const existing = new Set((departmentsByUnit.get(unit.id || "") || []).map(d => d.name.trim().toLowerCase()));
    return template.departments.filter(n => !existing.has(n.toLowerCase()));
  }, [businessUnits, departmentsByUnit, deptParentId]);

  const nameFieldOptions = deptType === "business_unit" ? availableBusinessUnitNames : availableDepartmentNames;
  const nameFieldHasBusinessUnitSelected = deptType === "department" ? !!deptParentId : true;

  return (
    <>
      <Section
        icon={<Users size={20} />} iconColor={OC.teal}
        title={`Organisation Structure`}
        subtitle="Business Units group your Departments — this drives leave approvals and your organisation chart."
      >
        {/* Guidance: business unit → department → positions */}
        <div style={{
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
          padding: "14px 18px", borderRadius: OR.md, marginBottom: 20,
          background: OC.surfaceAlt, border: `1px solid ${OC.line}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: businessUnits.length > 0 ? OC.okBg : OC.accentBg,
              color: businessUnits.length > 0 ? OC.ok : OC.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
            }}>
              {businessUnits.length > 0 ? <Check size={14} /> : "1"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: OC.ink }}>
              Add a Business Unit <span style={{ color: OC.muted, fontWeight: 400 }}>(e.g. Commercial, Technology)</span>
            </span>
          </div>
          <ChevronRight size={16} color={OC.faint} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: departments.some(d => d.parentDepartment) ? OC.okBg : OC.tealBg,
              color: departments.some(d => d.parentDepartment) ? OC.ok : OC.teal,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
            }}>
              {departments.some(d => d.parentDepartment) ? <Check size={14} /> : "2"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: OC.ink }}>
              Add Departments under it <span style={{ color: OC.muted, fontWeight: 400 }}>(e.g. Sales, IT)</span>
            </span>
          </div>
          <ChevronRight size={16} color={OC.faint} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: positions.length > 0 ? OC.okBg : OC.blue + "22",
              color: positions.length > 0 ? OC.ok : OC.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
            }}>
              {positions.length > 0 ? <Check size={14} /> : "3"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: OC.ink }}>
              Add Positions <span style={{ color: OC.muted, fontWeight: 400 }}>(e.g. Sales Representative)</span>
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>What are you adding?</label>
          <SegToggle value={deptType} onChange={onTypeChange} />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: deptType === "department" ? "1.4fr 1.2fr 1.4fr auto" : "1.6fr 1.6fr auto",
          gap: 12, alignItems: "end", marginBottom: 24,
          padding: 16, borderRadius: OR.md,
          background: "#fff", border: `1px solid ${OC.line}`,
        }}>
          <div>
            <label style={labelStyle}>{deptType === "business_unit" ? "Business unit name" : "Department name"}</label>
            {!nameFieldHasBusinessUnitSelected ? (
              // Department mode, but no business unit chosen yet — nothing
              // to suggest, and typing a name now would be for the wrong
              // parent. Keep the field disabled until one is picked.
              <input style={{ ...inputStyle, cursor: "not-allowed", color: OC.faint }} disabled value="" placeholder="Select a business unit first" />
            ) : useCustomName || nameFieldOptions.length === 0 ? (
              <div>
                <input
                  style={inputStyle}
                  value={deptDraft.name}
                  placeholder={deptType === "business_unit" ? "e.g. Commercial" : "e.g. Sales"}
                  onChange={e => onDraftChange({ ...deptDraft, name: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") onAdd(); }}
                  autoFocus={useCustomName}
                />
                {nameFieldOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setUseCustomName(false); onDraftChange({ ...deptDraft, name: "" }); }}
                    style={{ ...ghostBtn, padding: "4px 0", fontSize: 12, fontWeight: 700, color: OC.accent }}
                  >
                    ← Choose from list instead
                  </button>
                )}
                {nameFieldOptions.length === 0 && deptType === "business_unit" && (
                  <p style={{ ...subtle, margin: "4px 0 0", fontSize: 11.5 }}>All standard business units have been added — enter a custom name.</p>
                )}
                {nameFieldOptions.length === 0 && deptType === "department" && (
                  <p style={{ ...subtle, margin: "4px 0 0", fontSize: 11.5 }}>No standard departments left to suggest for this unit — enter a custom name.</p>
                )}
              </div>
            ) : (
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={deptDraft.name}
                onChange={e => {
                  if (e.target.value === "__custom__") { setUseCustomName(true); onDraftChange({ ...deptDraft, name: "" }); return; }
                  onDraftChange({ ...deptDraft, name: e.target.value });
                }}
              >
                <option value="">Select…</option>
                {nameFieldOptions.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="__custom__">+ Custom name…</option>
              </select>
            )}
          </div>

          {deptType === "department" && (
            <div>
              <label style={labelStyle}>Business unit</label>
              {businessUnits.length === 0 ? (
                <div>
                  <select style={{ ...inputStyle, cursor: "not-allowed", color: OC.faint }} disabled value="">
                    <option>Add a Business Unit first</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onTypeChange("business_unit")}
                    style={{ ...ghostBtn, padding: "4px 0", fontSize: 12, fontWeight: 700, color: OC.accent }}
                  >
                    + Add one now
                  </button>
                </div>
              ) : (
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={deptParentId}
                  onChange={e => onParentChange(e.target.value)}
                >
                  <option value="">Select…</option>
                  {businessUnits.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label style={labelStyle}>Description (optional)</label>
            <input
              style={inputStyle}
              value={deptDraft.description}
              placeholder="What does this group do?"
              onChange={e => onDraftChange({ ...deptDraft, description: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") onAdd(); }}
            />
          </div>

          <button onClick={onAdd} style={primaryBtn} disabled={saving}>
            <Plus size={14} /> {saving ? "Saving…" : "Add"}
          </button>
        </div>

        {loading ? (
          <p style={{ ...subtle, textAlign: "center", padding: 20 }}>Loading departments…</p>
        ) : departments.length === 0 ? (
          <EmptyHint
            icon={<Building2 size={32} />}
            title="No structure yet"
            body="Start with a Business Unit (e.g. Commercial, Technology), then add Departments under it (e.g. Sales, IT)."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {businessUnits.map(unit => (
              <div key={unit.id || unit.name} style={{
                border: `1px solid ${OC.line}`, borderRadius: OR.md,
                overflow: "hidden", background: "#fff",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  background: OC.accentBg,
                  borderBottom: `1px solid ${OC.line}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: "#fff", color: OC.accent,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Landmark size={15} />
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: OC.accentDk }}>{unit.name}</p>
                      {unit.description && <p style={{ ...subtle, margin: 0, fontSize: 11.5 }}>{unit.description}</p>}
                    </div>
                  </div>
                  {unit.id && (
                    <button onClick={() => onDelete(unit)} style={{ ...ghostBtn, color: OC.accentDk }} title={`Delete ${unit.name}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  {(departmentsByUnit.get(unit.id || "") || []).length === 0 ? (
                    <span style={{ ...subtle, fontSize: 12.5 }}>No departments yet under this unit.</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {departmentsByUnit.get(unit.id || "")!.map(d => (
                        <div key={d.id || d.name} style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          padding: "8px 14px 8px 16px", borderRadius: 999,
                          background: OC.tealBg, color: OC.teal,
                          border: `1px solid ${OC.teal}30`,
                          fontSize: 13, fontWeight: 600,
                        }}>
                          <Building2 size={12} />
                          {d.name}
                          {d.id && (
                            <button onClick={() => onDelete(d)} style={{ ...ghostBtn, padding: 2, color: OC.teal }} title={`Delete ${d.name}`}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        icon={<Briefcase size={20} />} iconColor={OC.blue}
        title="Position management"
        subtitle="Job titles sit under a department. Employees pick from this list when you add them."
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1.4fr 1.4fr auto",
          gap: 12, alignItems: "end", marginBottom: 24,
          padding: 16, borderRadius: OR.md,
          background: "#fff", border: `1px solid ${OC.line}`,
        }}>
          <div>
            <label style={labelStyle}>Department</label>
            {leafDepartments.length === 0 ? (
              <select style={{ ...inputStyle, cursor: "not-allowed", color: OC.faint }} disabled value="">
                <option>Add a Department first</option>
              </select>
            ) : (
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={posDraft.departmentId}
                onChange={e => onPosDraftChange({ ...posDraft, departmentId: e.target.value })}
              >
                <option value="">Select…</option>
                {leafDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label style={labelStyle}>Position name</label>
            <input
              style={inputStyle}
              value={posDraft.name}
              placeholder="e.g. Sales Representative"
              disabled={!posDraft.departmentId}
              onChange={e => onPosDraftChange({ ...posDraft, name: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") onAddPosition(); }}
            />
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <input
              style={inputStyle}
              value={posDraft.description}
              placeholder="What does this role do?"
              disabled={!posDraft.departmentId}
              onChange={e => onPosDraftChange({ ...posDraft, description: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") onAddPosition(); }}
            />
          </div>
          <button onClick={onAddPosition} style={primaryBtn} disabled={savingPos || !posDraft.departmentId}>
            <Plus size={14} /> {savingPos ? "Saving…" : "Add"}
          </button>
        </div>

        {leafDepartments.length === 0 ? (
          <EmptyHint
            icon={<Briefcase size={32} />}
            title="No departments yet"
            body="Add a Business Unit and Departments above, then create positions under each department."
          />
        ) : positions.length === 0 ? (
          <EmptyHint
            icon={<Briefcase size={32} />}
            title="No positions yet"
            body="Select a department and add job titles. These will appear on the employee form."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {leafDepartments.map(dept => {
              const titles = positionsByDept.get(dept.id || "") || [];
              return (
                <div key={dept.id || dept.name} style={{
                  border: `1px solid ${OC.line}`, borderRadius: OR.md,
                  overflow: "hidden", background: "#fff",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    background: OC.blueBg,
                    borderBottom: `1px solid ${OC.line}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: "#fff", color: OC.blue,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Building2 size={15} />
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: OC.blue }}>{dept.name}</p>
                        <p style={{ ...subtle, margin: 0, fontSize: 11.5 }}>
                          {titles.length} position{titles.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    {titles.length === 0 ? (
                      <span style={{ ...subtle, fontSize: 12.5 }}>No positions yet under this department.</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {titles.map(p => (
                          <div key={p.id} style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "8px 14px 8px 16px", borderRadius: 999,
                            background: OC.blueBg, color: OC.blue,
                            border: `1px solid ${OC.blue}30`,
                            fontSize: 13, fontWeight: 600,
                          }}>
                            <Briefcase size={12} />
                            {p.name}
                            <button onClick={() => onDeletePosition(p)} style={{ ...ghostBtn, padding: 2, color: OC.blue }} title={`Delete ${p.name}`}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        icon={<Shield size={20} />} iconColor={OC.amber}
        title="System Roles"
        subtitle="These are the access levels available in KagoHC. They are built into the platform."
      >
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}>
          {SYSTEM_ROLES.map(r => (
            <div key={r.key} style={{
              border: `1px solid ${OC.line}`, borderRadius: OR.md,
              padding: 14, background: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${r.color}1f`, color: r.color,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Shield size={14} />
                </span>
                <p style={{ ...valueStyle, margin: 0 }}>{r.label}</p>
              </div>
              <p style={{ ...subtle, margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{r.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onComplete} style={{ ...primaryBtn, background: OC.green, boxShadow: "0 4px 12px rgba(72,187,120,0.3)" }}>
          <CheckCircle2 size={16} /> Complete Onboarding
        </button>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Administrator modal
 * ─────────────────────────────────────────────────────────────────────── */

const AdministratorModal: React.FC<{
  onClose: () => void;
  onSubmit: (draft: AdministratorDraft) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState<AdministratorDraft>({
    firstName: "", lastName: "", email: "", phone: "", password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const setField = (k: keyof AdministratorDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to add administrator.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: OC.surface, borderRadius: OR.xl,
          border: `1px solid ${OC.line}`,
          boxShadow: "0 24px 60px rgba(15,23,42,0.30)",
          overflow: "hidden",
        }}
      >
        <div style={{
          padding: "18px 22px", borderBottom: `1px solid ${OC.line}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 10,
              background: OC.purpleBg, color: OC.purple,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <UserCog size={18} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: OC.ink }}>Add Administrator</h3>
              <p style={{ ...subtle, margin: 0, fontSize: 12 }}>Creates a user with full admin access.</p>
            </div>
          </div>
          <button onClick={onClose} style={ghostBtn} title="Close"><X size={16} /></button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{
              padding: "10px 12px", borderRadius: 10,
              background: OC.badBg, color: "#b42318",
              border: "1px solid #fecaca", fontSize: 13,
            }}>{error}</div>
          )}

          <FieldGrid cols={2}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} value={form.firstName} onChange={setField("firstName")} placeholder="e.g. John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} value={form.lastName} onChange={setField("lastName")} placeholder="e.g. Doe" />
            </div>
          </FieldGrid>

          <div>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={form.email} onChange={setField("email")} placeholder="john.doe@company.com" />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
          </div>
          <div>
            <label style={labelStyle}>Password *</label>
            <input style={inputStyle} type="password" value={form.password} onChange={setField("password")} placeholder="At least 8 characters" />
          </div>
        </div>

        <div style={{
          padding: "14px 22px", borderTop: `1px solid ${OC.line}`,
          background: OC.surfaceAlt,
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button onClick={handleSubmit} style={primaryBtn} disabled={saving}>
            <UserPlus size={14} /> {saving ? "Adding…" : "Add Administrator"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * Empty hint
 * ─────────────────────────────────────────────────────────────────────── */

const EmptyHint: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({ icon, title, body }) => (
  <div style={{
    padding: "36px 20px", textAlign: "center",
    background: OC.surfaceAlt, borderRadius: OR.md,
    border: `1px dashed ${OC.line}`,
  }}>
    <div style={{ color: OC.faint, marginBottom: 10 }}>{icon}</div>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: OC.ink }}>{title}</p>
    <p style={{ ...subtle, margin: "6px auto 0", maxWidth: 420 }}>{body}</p>
  </div>
);