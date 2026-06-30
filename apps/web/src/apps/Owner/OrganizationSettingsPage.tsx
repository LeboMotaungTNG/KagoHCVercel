import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, CardBody, Button, Input, Label,
  FormGroup, Table, Spinner, Badge, Alert, Modal, ModalHeader,
  ModalBody, ModalFooter
} from "reactstrap";
import PhoneInput from "../../shared/components/PhoneInput";
import {
  FaSave, FaEdit, FaPlus, FaTrash, FaChevronDown, FaChevronRight,
  FaBuilding, FaMoneyBillWave, FaCalendarAlt, FaCloudUploadAlt,
  FaCalculator, FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
  FaUmbrellaBeach, FaStar, FaTimes, FaPencilAlt,
  FaGlobe, FaMapMarkerAlt, FaUniversity,
  FaFileAlt, FaShieldAlt, FaUserTie, FaIdCard,
  FaExclamationCircle
} from "react-icons/fa";
import { ClipboardList } from "lucide-react";

// All cross-cutting types, defaults, API calls and icon mappings now live in
// shared/utils/organizationSettings. This page just composes them.
import {
  // types
  type CompanyData, type CoFieldDef, type CustomLeaveType,
  type LeaveBalance, type LeaveTypeConfig, type PayrollCalculation,
  type PayrollRun, type PayrollSettings, type WorkSchedule,
  // constants
  DEFAULT_COMPANY_DATA, DEFAULT_LEAVE_TYPES, DEFAULT_PAYROLL_SETTINGS,
  CUSTOM_LEAVE_PRESETS, LEAVE_COLOR_OPTIONS, WORK_SCHEDULE_DAYS, ALL_WEEK_DAYS,
  MONTHS, SECTORS, BUSINESS_TYPES, COMPANY_STATUSES, PROVINCES, COUNTRIES,
  TAX_COMPLIANCE_STATUSES, BEE_LEVELS, BANKS, ACCOUNT_TYPES,
  LANGUAGES, TIMEZONES, DATE_FORMATS, CURRENCIES,
  // helpers / icons / mappers
  setDeep, formatRand, currentMonthRange, makeSarsReceipt,
  LeaveIcon, LEAVE_ICON_KEYS,
  BCEA_META, mapStatutoryFromApi, mapCustomLeaveFromApi,
  generateBalancesFromEmployees,
  computeOnboardingProgress,
  CONTACT_ROLES,
  orgApi,
} from "../../shared/utils/organizationSettings";

// ─────────────────────────────────────────────
// SHARED DESIGN TOKENS (matches Leave tab style)
// ─────────────────────────────────────────────
const co_card: React.CSSProperties = {
  backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "22px", marginBottom: "18px",
};
const co_secTitle = (color = "#0369A1"): React.CSSProperties => ({
  fontSize: "13px", fontWeight: 700, color, marginBottom: "16px",
  display: "flex", alignItems: "center", gap: "8px",
  textTransform: "uppercase", letterSpacing: "0.05em",
});
const co_label: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#718096", display: "block", marginBottom: "5px" };
const co_input: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", fontSize: "13px", color: "#2D3748", backgroundColor: "white", outline: "none" };
const co_value: React.CSSProperties = { fontSize: "14px", color: "#1A202C", fontWeight: 500, padding: "6px 0", margin: 0 };
const co_infoBox = (color: string): React.CSSProperties => ({
  display: "flex", gap: "10px", padding: "11px 14px",
  backgroundColor: `${color}0D`, border: `1px solid ${color}30`,
  borderRadius: "8px", fontSize: "12px", color: "#374151", lineHeight: 1.6,
});

// ─────────────────────────────────────────────
// FIELD RENDERER HELPER — driven by shared CoFieldDef definitions
// ─────────────────────────────────────────────
const FieldRenderer = ({
  fields, data, editing, onChange,
}: {
  fields: CoFieldDef[];
  data: any;
  editing: boolean;
  onChange: (key: string, value: any) => void;
}) => {
  const get = (key: string) => key.split(".").reduce((o: any, k: string) => o?.[k], data) ?? "";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {fields.map((f) => {
        const val = get(f.key);
        return (
          <div key={f.key} style={{ gridColumn: f.span === 2 ? "1 / -1" : undefined }}>
            <label style={co_label}>
              {f.label}{f.required && <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>}
            </label>
            {editing ? (
              f.type === "textarea" ? (
                <textarea rows={3} value={val} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} style={{ ...co_input, resize: "vertical", minHeight: "76px" }} />
              ) : f.type === "toggle" ? (
                <select value={val ? "yes" : "no"} onChange={(e) => onChange(f.key, e.target.value === "yes")} style={co_input}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              ) : f.type === "select" ? (
                <select value={val} onChange={(e) => onChange(f.key, e.target.value)} style={co_input}>
                  {!f.required && <option value="">— Select —</option>}
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "tel" ? (
                <PhoneInput value={val} onChange={(v) => onChange(f.key, v)} />
              ) : (
                <input type={f.type ?? "text"} value={val} placeholder={f.placeholder} onChange={(e) => onChange(f.key, f.type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)} style={co_input} />
              )
            ) : (
              <p style={co_value}>
                {f.type === "toggle"
                  ? (val ? <span style={{ color: "#059669", fontWeight: 600 }}>Yes</span> : <span style={{ color: "#9CA3AF" }}>No</span>)
                  : (val || <span style={{ color: "#CBD5E0" }}>—</span>)}
              </p>
            )}
            {f.hint && <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "3px", marginBottom: 0 }}>{f.hint}</p>}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// ONBOARDING PROGRESS INDICATOR
// ─────────────────────────────────────────────
const OnboardingProgress = ({ data }: { data: CompanyData }) => {
  // Delegate the rules to shared/utils so the same logic can be reused
  // (e.g. on a dashboard tile) without duplicating the checklist here.
  const { items, pct, color } = computeOnboardingProgress(data);
  return (
    <div style={{ padding: "18px 22px", borderRadius: "12px", border: `1px solid ${color}25`, backgroundColor: `${color}06`, marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A202C", display: "flex", alignItems: "center", gap: "6px" }}>
          {pct === 100 && <FaCheckCircle style={{ color: "#059669" }} size={13} />}
          {pct === 100 ? "Onboarding Complete" : "Onboarding Checklist"}
        </div>
        <span style={{ fontWeight: 700, fontSize: "15px", color }}>{pct}%</span>
      </div>
      <div style={{ height: "8px", borderRadius: "4px", backgroundColor: "#E5E7EB", overflow: "hidden", marginBottom: "14px" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "4px", transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "6px" }}>
        {items.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: c.done ? "#374151" : "#9CA3AF" }}>
            {c.done
              ? <FaCheckCircle style={{ color: "#059669", flexShrink: 0 }} size={11} />
              : <FaExclamationCircle style={{ color: "#F59E0B", flexShrink: 0 }} size={11} />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPANY DETAILS TAB — REDESIGNED (with backend integration)
// ─────────────────────────────────────────────
const CompanyDetailsTab = () => {
  const [activeSection, setActiveSection] = useState<"profile" | "legal" | "banking" | "contacts" | "settings">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [data, setData]   = useState<CompanyData>(DEFAULT_COMPANY_DATA);
  const [draft, setDraft] = useState<CompanyData>(DEFAULT_COMPANY_DATA);

  // Pull persisted settings on mount; fall back to defaults on any failure.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const json = await orgApi.loadCompanySettings();
        if (!cancelled && json.success && json.data) {
          const incoming = json.data;
          const merged: CompanyData = {
            ...DEFAULT_COMPANY_DATA,
            ...incoming,
            bank:     { ...DEFAULT_COMPANY_DATA.bank,     ...(incoming.bank     || {}) },
            contacts: { ...DEFAULT_COMPANY_DATA.contacts, ...(incoming.contacts || {}) },
            address:  { ...DEFAULT_COMPANY_DATA.address,  ...(incoming.address  || {}) },
          };
          setData(merged); setDraft(merged);
        }
      } catch { /* fall back to defaults silently */ }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key: string, value: any) =>
    setDraft((d) => setDeep(d, key, value));

  const handleSave = async () => {
    try {
      const json = await orgApi.saveCompanySettings(draft);
      if (json.success !== false) {
        setData(draft);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch { /* silent — UI stays in edit mode so the user can retry */ }
  };

  const TABS = [
    { id: "profile" as const,  label: "Company Profile", icon: <FaBuilding size={12} /> },
    { id: "legal" as const,    label: "Legal & SARS",    icon: <FaShieldAlt size={12} /> },
    { id: "banking" as const,  label: "Banking",         icon: <FaUniversity size={12} /> },
    { id: "contacts" as const, label: "Contacts",        icon: <FaUserTie size={12} /> },
    { id: "settings" as const, label: "Settings",        icon: <FaCalendarAlt size={12} /> },
  ];

  return (
    <div style={{ padding: "28px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#1A202C", margin: 0 }}>Company Details</h3>
        <p style={{ fontSize: "14px", color: "#718096", marginTop: "4px", marginBottom: 0 }}>Manage your company profile, legal registration, banking and system preferences</p>
      </div>

      {isLoading && <div style={{ textAlign: "center", padding: "60px" }}><Spinner color="primary" /><p style={{ color: "#718096", marginTop: "12px" }}>Loading…</p></div>}

      {!isLoading && (
        <>
          <OnboardingProgress data={data} />

          {/* Identity bar */}
          <div style={{ ...co_card, display: "flex", alignItems: "center", gap: "18px", padding: "16px 22px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "#0369A1", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px", fontWeight: 700, flexShrink: 0 }}>
              {(data.name || "K").charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>{data.name || "—"}</div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "1px" }}>{data.sector} · {data.businessType}{data.numberOfEmployees ? ` · ${data.numberOfEmployees} employees` : ""}</div>
            </div>
            <span style={{ padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, backgroundColor: data.companyStatus === "Active" ? "#D1FAE5" : "#FEE2E2", color: data.companyStatus === "Active" ? "#065F46" : "#991B1B" }}>{data.companyStatus}</span>
            {!isEditing
              ? <button onClick={() => setIsEditing(true)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid #CBD5E0", backgroundColor: "white", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><FaEdit size={11} /> Edit</button>
              : <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setDraft(data); setIsEditing(false); }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #CBD5E0", backgroundColor: "white", color: "#6B7280", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleSave} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", backgroundColor: "#0369A1", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><FaSave size={11} /> Save</button>
                </div>
            }
          </div>

          {saveSuccess && <div style={{ ...co_infoBox("#059669"), marginBottom: "16px" }}><FaCheckCircle style={{ color: "#059669", flexShrink: 0 }} /> Company details saved successfully.</div>}

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #EDF2F7", marginBottom: "22px" }}>
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ padding: "10px 18px", fontSize: "13px", fontWeight: 600, color: activeSection === tab.id ? "#0369A1" : "#718096", background: "none", border: "none", borderBottom: activeSection === tab.id ? "2px solid #0369A1" : "2px solid transparent", cursor: "pointer", marginBottom: "-2px", display: "flex", alignItems: "center", gap: "6px" }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* PROFILE */}
          {activeSection === "profile" && (
            <>
              <div style={co_card}>
                <div style={co_secTitle()}><FaBuilding /> Basic Information</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "Registered Company Name", key: "name", required: true, placeholder: "As per CIPC registration" },
                  { label: "Trading Name (if different)", key: "tradingName", placeholder: "Leave blank if same as registered name" },
                  { label: "Sector / Industry", key: "sector", type: "select", required: true, options: SECTORS },
                  { label: "Business Type", key: "businessType", type: "select", required: true, options: BUSINESS_TYPES },
                  { label: "Number of Employees", key: "numberOfEmployees", type: "number", placeholder: "Full-time equivalent headcount", hint: "Include permanent and fixed-term staff" },
                  { label: "Company Status", key: "companyStatus", type: "select", options: COMPANY_STATUSES },
                  { label: "Primary Email Address", key: "email", type: "email", required: true, placeholder: "info@company.co.za" },
                  { label: "Main Phone Number", key: "phone", type: "tel", required: true, placeholder: "+27 11 000 0000" },
                  { label: "Alternative Phone", key: "alternativePhone", type: "tel", placeholder: "+27 11 000 0001" },
                  { label: "Website", key: "website", type: "url", placeholder: "www.company.co.za" },
                  { label: "Company Description", key: "description", type: "textarea", span: 2, placeholder: "Brief overview of your company's services and operations…" },
                ]} />
              </div>
              <div style={co_card}>
                <div style={co_secTitle()}><FaMapMarkerAlt style={{ color: "#0369A1" }} /> Address</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "Physical Address", key: "address.physicalAddress", type: "textarea", span: 2, required: true, placeholder: "Street, Suburb, City, Province, Postal Code" },
                  { label: "Postal Address", key: "address.postalAddress", type: "textarea", span: 2, placeholder: "PO Box or same as physical address" },
                  { label: "Street / Building Name", key: "address.street", placeholder: "123 Business Park" },
                  { label: "Suburb", key: "address.suburb", placeholder: "Sandton" },
                  { label: "City / Town", key: "address.city", required: true, placeholder: "Johannesburg" },
                  { label: "Province", key: "address.province", type: "select", required: true, options: PROVINCES },
                  { label: "Postal Code", key: "address.postalCode", required: true, placeholder: "2196" },
                  { label: "Country", key: "address.country", type: "select", options: COUNTRIES },
                ]} />
              </div>
            </>
          )}

          {/* LEGAL */}
          {activeSection === "legal" && (
            <>
              <div style={{ ...co_infoBox("#0369A1"), marginBottom: "18px" }}>
                <FaInfoCircle style={{ color: "#0369A1", flexShrink: 0, marginTop: "2px" }} />
                <span>All registration numbers must match your CIPC and SARS records exactly. These are used for statutory reporting (EMP201, IRP5, UIF declarations) and compliance verification.</span>
              </div>
              <div style={co_card}>
                <div style={co_secTitle()}><FaIdCard /> CIPC Registration</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "CIPC Registration Number", key: "registrationNumber", required: true, placeholder: "YYYY/NNNNNN/NN", hint: "As issued by the Companies and Intellectual Property Commission" },
                  { label: "VAT Registration Number", key: "vatNumber", placeholder: "e.g., 4123456789", hint: "Mandatory if annual turnover exceeds R1 million. Format: 4XXXXXXXXX" },
                ]} />
              </div>
              <div style={co_card}>
                <div style={co_secTitle()}><FaFileAlt /> SARS References</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "Income Tax Number", key: "incomeTaxNumber", required: true, placeholder: "e.g., 9123456789", hint: "SARS income tax reference for the company entity" },
                  { label: "PAYE Employer Reference", key: "payeReference", required: true, placeholder: "e.g., 7123456789", hint: "Used on EMP201 monthly submissions. Format: 7XXXXXXXXX" },
                  { label: "UIF Reference Number", key: "uifReference", required: true, placeholder: "e.g., UIF123456", hint: "Issued by Dept. of Employment & Labour on employer registration" },
                  { label: "SDL Reference Number", key: "sdlReference", placeholder: "e.g., L123456789", hint: "Skills Development Levy — required if annual payroll exceeds R500,000" },
                  { label: "COIDA / WCA Reference", key: "coida", placeholder: "e.g., W123456", hint: "Compensation Fund or approved insurer (e.g., FEM) reference number" },
                  { label: "Provisional Taxpayer", key: "provisionalTaxpayer", type: "toggle", hint: "Companies earning income not subject to PAYE must register as provisional taxpayers" },
                  { label: "Tax Compliance Status", key: "taxComplianceStatus", type: "select", options: TAX_COMPLIANCE_STATUSES, hint: "Verify via SARS eFiling Tax Compliance Status (TCS) system" },
                ]} />
              </div>
              <div style={co_card}>
                <div style={co_secTitle()}><FaShieldAlt /> B-BBEE &amp; Employment Equity</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "B-BBEE Contributor Level", key: "beeLevel", type: "select", options: BEE_LEVELS, hint: "Broad-Based Black Economic Empowerment scorecard level — renewed annually" },
                ]} />
                <div style={{ ...co_infoBox("#7C3AED"), marginTop: "14px" }}>
                  <FaInfoCircle style={{ color: "#7C3AED", flexShrink: 0, marginTop: "2px" }} />
                  <span>Employers with <strong>50+ employees</strong> must submit an Employment Equity Report (EEA2 &amp; EEA4) annually by 15 January. Employers with <strong>150+ staff</strong> must also comply with an EE plan. B-BBEE certificates must be renewed every 12 months.</span>
                </div>
              </div>
            </>
          )}

          {/* BANKING */}
          {activeSection === "banking" && (
            <>
              <div style={{ ...co_infoBox("#059669"), marginBottom: "18px" }}>
                <FaInfoCircle style={{ color: "#059669", flexShrink: 0, marginTop: "2px" }} />
                <span>Banking details are used for payroll salary disbursements and third-party payment references. Ensure the account is in the company's registered legal name.</span>
              </div>
              <div style={co_card}>
                <div style={co_secTitle()}><FaUniversity /> Company Bank Account</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "Bank Name", key: "bank.bankName", type: "select", required: true, options: BANKS },
                  { label: "Account Name", key: "bank.accountName", required: true, placeholder: "Must match registered company name exactly" },
                  { label: "Account Number", key: "bank.accountNumber", required: true, placeholder: "e.g., 62812345678" },
                  { label: "Branch Code", key: "bank.branchCode", required: true, placeholder: "e.g., 250655", hint: "Universal branch code applies to most major SA banks" },
                  { label: "Account Type", key: "bank.accountType", type: "select", required: true, options: ACCOUNT_TYPES },
                  { label: "SWIFT / BIC Code", key: "bank.swiftCode", placeholder: "e.g., FIRNZAJJ", hint: "Required for international transfers only" },
                ]} />
                <div style={{ ...co_infoBox("#D97706"), marginTop: "16px" }}>
                  <FaExclamationTriangle style={{ color: "#D97706", flexShrink: 0, marginTop: "2px" }} />
                  <span>Banking information is stored securely and used only for authorised payroll disbursements within this system. Never share account credentials externally.</span>
                </div>
              </div>
            </>
          )}

          {/* CONTACTS */}
          {activeSection === "contacts" && (
            <>
              <div style={{ ...co_infoBox("#0369A1"), marginBottom: "18px" }}>
                <FaInfoCircle style={{ color: "#0369A1", flexShrink: 0, marginTop: "2px" }} />
                <span>These contacts are used for system notifications, SARS correspondence, audit queries, and escalations. Ensure all details are current.</span>
              </div>
              {/* Each contact role renders the same card with a Lucide icon
                  and per-role accent colour pulled from shared/utils. */}
              {CONTACT_ROLES.map((c) => (
                <div key={c.key} style={{ ...co_card, borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ color: c.color, display: "inline-flex", alignItems: "center" }}>{c.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#1A202C" }}>{c.title}</span>
                  </div>
                  <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                    { label: "Full Name",               key: `${c.key}.name`,        required: c.key === "contacts.primaryContact", placeholder: "First and last name" },
                    { label: "Designation / Job Title", key: `${c.key}.designation`, placeholder: "e.g., Chief Financial Officer" },
                    { label: "Email Address",           key: `${c.key}.email`,       type: "email", placeholder: "contact@company.co.za" },
                    { label: "Direct Phone Number",     key: `${c.key}.phone`,       type: "tel",   placeholder: "+27 8X XXX XXXX" },
                  ]} />
                </div>
              ))}
            </>
          )}

          {/* SETTINGS */}
          {activeSection === "settings" && (
            <>
              <div style={co_card}>
                <div style={co_secTitle()}><FaGlobe style={{ color: "#0369A1" }} /> Regional &amp; Display Preferences</div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "System Language", key: "language", type: "select", options: LANGUAGES },
                  { label: "Timezone", key: "timezone", type: "select", options: TIMEZONES },
                  { label: "Date Format", key: "dateFormat", type: "select", options: DATE_FORMATS },
                  { label: "Currency", key: "currency", type: "select", options: CURRENCIES },
                ]} />
              </div>
              <div style={co_card}>
                <div style={co_secTitle()}><FaCalendarAlt style={{ color: "#0369A1" }} /> Fiscal Year</div>
                <div style={{ ...co_infoBox("#0369A1"), marginBottom: "16px" }}>
                  <FaInfoCircle style={{ color: "#0369A1", flexShrink: 0, marginTop: "2px" }} />
                  <span>The SARS tax year runs <strong>1 March – 28/29 February</strong>. Your company fiscal year may differ. This setting affects payroll period groupings and year-end IRP5 reconciliation (EMP501).</span>
                </div>
                <FieldRenderer editing={isEditing} data={draft} onChange={handleChange} fields={[
                  { label: "Fiscal Year Start", key: "fiscalYearStart", type: "date", required: true },
                  { label: "Fiscal Year End",   key: "fiscalYearEnd",   type: "date", required: true },
                ]} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// Types (Employee/PayrollRun/PayrollCalculation) are imported from
// shared/utils/organizationSettings. We use `PayrollEmployee` here as our
// internal alias for the lightweight mock roster used for the initial
// "before any API has loaded" preview state.
type Employee = import("../../shared/utils/organizationSettings").PayrollEmployee;

// Seed roster used only until the backend returns the real employee list.
// Kept small and locally because it is purely presentational.
const mockEmployees: Employee[] = [
  { id: "EMP001", employeeCode: "KHC001", name: "John Doe", department: "Engineering", position: "Senior Developer", basicSalary: 35000, allowances: { housing: 5000, transport: 2000, medical: 1500, other: 0 }, bankAccount: "1234567890", taxReference: "1234567890", uifReference: "UIF001", joinDate: "2023-01-15", status: "active" },
  { id: "EMP002", employeeCode: "KHC002", name: "Jane Smith", department: "Sales", position: "Sales Manager", basicSalary: 45000, allowances: { housing: 7000, transport: 3000, medical: 2000, other: 1000 }, bankAccount: "0987654321", taxReference: "0987654321", uifReference: "UIF002", joinDate: "2022-06-01", status: "active" },
  { id: "EMP003", employeeCode: "KHC003", name: "Pieter van der Merwe", department: "Operations", position: "Operations Manager", basicSalary: 40000, allowances: { housing: 6000, transport: 2500, medical: 1800, other: 500 }, bankAccount: "1122334455", taxReference: "1122334455", uifReference: "UIF003", joinDate: "2023-03-10", status: "active" },
  { id: "EMP004", employeeCode: "KHC004", name: "Sarah Williams", department: "HR", position: "HR Specialist", basicSalary: 30000, allowances: { housing: 4000, transport: 1500, medical: 1200, other: 0 }, bankAccount: "5566778899", taxReference: "5566778899", uifReference: "UIF004", joinDate: "2023-08-20", status: "active" }
];

// ============================================
// PAYROLL SETTINGS TAB
// ============================================
export const PayrollSettingsTab = () => {
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState<PayrollSettings>(payrollSettings);
  // Initial placeholder run, replaced by /payroll/runs as soon as it returns.
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([{ id: "PR-2026-05", period: "May 2026", periodStart: "2026-05-01", periodEnd: "2026-05-31", frequency: "Monthly", status: "draft", employeeCount: mockEmployees.length, totalGross: 0, totalDeductions: 0, totalNetPay: 0, createdAt: "2026-05-01T08:00:00Z", updatedAt: "2026-05-01T08:00:00Z" }]);
  const [activePayrollRun, setActivePayrollRun] = useState<PayrollRun | null>(null);
  const [payrollCalculations, setPayrollCalculations] = useState<PayrollCalculation[]>([]);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showExceptionsModal, setShowExceptionsModal] = useState(false);
  const [exceptionsList, setExceptionsList] = useState<string[]>([]);
  const [showPayrollRunModal, setShowPayrollRunModal] = useState(false);
  const [newRunPeriod, setNewRunPeriod] = useState("");
  const [newRunFrequency, setNewRunFrequency] = useState<"Weekly" | "Bi-Weekly" | "Monthly">("Monthly");
  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch real employees and payroll runs on component mount
  useEffect(() => {
    fetchRealEmployees();
    fetchRealPayrollRuns();
    loadPayrollSettings();
  }, []);

  const fetchRealEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await orgApi.loadEmployees();
      if (data.success && data.data) setRealEmployees(data.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchRealPayrollRuns = async () => {
    try {
      const data = await orgApi.loadPayrollRuns();
      if (data.success && data.data && data.data.length > 0) {
        // The backend stores Mongo _id; normalize to a single `id` field.
        const runs = data.data.map((run: any) => ({ ...run, id: run.id || run._id }));
        setPayrollRuns(runs);
        setActivePayrollRun(runs[0]);
      }
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
    }
  };

  // Backend stores fractional rates (e.g. 0.01); the UI works with percentages.
  const buildSettingsFromApi = (api: any): PayrollSettings => ({
    ...DEFAULT_PAYROLL_SETTINGS,
    taxYear:      api.taxYear ?? DEFAULT_PAYROLL_SETTINGS.taxYear,
    overtimeRate: api.overtimeRate?.toString() ?? DEFAULT_PAYROLL_SETTINGS.overtimeRate,
    weekendRate:  api.weekendRate?.toString()  ?? DEFAULT_PAYROLL_SETTINGS.weekendRate,
    holidayRate:  api.holidayRate?.toString()  ?? DEFAULT_PAYROLL_SETTINGS.holidayRate,
    uifRate:      (api.uifRate * 100)?.toString() || DEFAULT_PAYROLL_SETTINGS.uifRate,
    sdlRate:      (api.sdlRate * 100)?.toString() || DEFAULT_PAYROLL_SETTINGS.sdlRate,
    payeEnabled:  api.payeEnabled ?? true,
  });

  const loadPayrollSettings = async () => {
    try {
      const data = await orgApi.loadPayrollSettingsApi();
      if (data.success && data.data) {
        const built = buildSettingsFromApi(data.data);
        setPayrollSettings(built);
        setSettingsFormData(built);
      }
    } catch (error) {
      console.error("Error loading payroll settings:", error);
    }
  };

  const savePayrollSettings = async () => {
    setLoading(true);
    try {
      const data = await orgApi.savePayrollSettingsApi(settingsFormData);
      if (data.success) {
        setPayrollSettings(settingsFormData);
        setIsEditingSettings(false);
        alert("Payroll settings saved successfully");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving payroll settings:", error);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const styleTh: React.CSSProperties = { padding: "12px 10px", fontSize: "12px", fontWeight: 600, color: "#4A5568", backgroundColor: "#F7FAFC", borderBottom: "2px solid #E2E8F0" };
  const styleTd: React.CSSProperties = { padding: "12px 10px", fontSize: "13px", color: "#2D3748", borderBottom: "1px solid #EDF2F7", verticalAlign: "middle" };

  const startNewPayrollRun = async () => {
    if (!newRunPeriod.trim()) return;
    setLoading(true);
    try {
      // Default the period to "this calendar month" — the backend can refine later.
      const { start, end } = currentMonthRange();
      const data = await orgApi.createPayrollRun(newRunPeriod, newRunFrequency, start, end);

      if (data.success && data.data) {
        const apiRun: any = data.data;
        const newRun: PayrollRun = {
          id:              apiRun._id,
          _id:             apiRun._id,
          period:          apiRun.period,
          periodStart:     apiRun.periodStart,
          periodEnd:       apiRun.periodEnd,
          frequency:       apiRun.frequency,
          status:          apiRun.status,
          employeeCount:   realEmployees.length,
          totalGross:      0,
          totalDeductions: 0,
          totalNetPay:     0,
          createdAt:       apiRun.createdAt,
          updatedAt:       apiRun.updatedAt,
        };

        setPayrollRuns([newRun, ...payrollRuns]);
        setActivePayrollRun(newRun);
        setPayrollCalculations([]);
        setShowPayrollRunModal(false);
        setNewRunPeriod("");
        alert("Payroll run created successfully");
      } else {
        alert("Failed to create payroll run");
      }
    } catch (error) {
      console.error("Error creating payroll run:", error);
      alert("Error creating payroll run");
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = async () => {
    if (!activePayrollRun) return;
    setLoading(true);
    try {
      const runId = activePayrollRun._id || activePayrollRun.id;
      const data  = await orgApi.calculatePayrollRun(runId, payrollSettings);

      if (data.success && data.data) {
        // Backend returns a thin per-employee summary; reshape it into the
        // PayrollCalculation rows the table here expects.
        const calculations: PayrollCalculation[] = data.data.employees.map((emp: any) => ({
          id:            emp.employeeId,
          payrollRunId:  runId,
          employeeId:    emp.employeeId,
          name:          emp.name,
          position:      emp.position,
          basicSalary:   emp.grossPay,
          allowances:    { housing: 0, transport: 0, medical: 0, other: 0, total: 0 },
          overtime:      { hours: 0, rate: 1.5, amount: 0 },
          commissions:   0,
          grossEarnings: emp.grossPay,
          deductions:    { paye: emp.deductions.paye, uif: emp.deductions.uif, sdl: 0, pension: 0, medicalAid: 0, other: 0, total: emp.totalDeductions },
          netPay:        emp.netPay,
          employerCosts: { uif: 0, sdl: 0, skillsLevy: 0, total: 0 },
        }));

        setPayrollCalculations(calculations);
        setActivePayrollRun({
          ...activePayrollRun,
          status:          "calculated",
          totalGross:      data.data.totalGross,
          totalDeductions: data.data.totalDeductions,
          totalNetPay:     data.data.totalNetPay,
          employeeCount:   data.data.employeeCount,
        });
        alert("Payroll calculated successfully");
      } else {
        alert("Failed to calculate payroll: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error calculating payroll:", error);
      alert("Failed to calculate payroll");
    } finally {
      setLoading(false);
    }
  };

  const detectExceptions = (calc: PayrollCalculation, emp: Employee): string[] => {
    const ex: string[] = [];
    if (calc.overtime.amount > calc.basicSalary * 0.3) ex.push("High overtime volume (exceeds 30% of base salary)");
    if (calc.netPay < 0) ex.push("Critical: Negative net pay calculated");
    return ex;
  };

  const approvePayrollRun = async () => {
    if (!activePayrollRun) return;
    setLoading(true);
    try {
      const runId = activePayrollRun._id || activePayrollRun.id;
      const data  = await orgApi.approvePayrollRunApi(runId);
      if (data.success) {
        setActivePayrollRun({
          ...activePayrollRun,
          status:     "approved",
          approvedBy: "System Administrator",
          approvedAt: new Date().toISOString(),
        });
        alert("Payroll approved successfully");
      } else {
        alert("Failed to approve payroll");
      }
    } catch (error) {
      console.error("Error approving payroll:", error);
      alert("Failed to approve payroll");
    } finally {
      setLoading(false);
    }
  };

  const generateStatReports = async () => {
    if (!activePayrollRun) return;
    setReportGenerating(true);
    try {
      const runId = activePayrollRun._id || activePayrollRun.id;
      // Helper triggers the browser download and throws on any non-PDF response.
      await orgApi.downloadEmp201(runId, activePayrollRun.period);
      setActivePayrollRun({ ...activePayrollRun, status: "reports_generated" });
      alert("EMP201 Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading EMP201:", error);
      alert(`Failed to download EMP201: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setReportGenerating(false);
    }
  };

  const submitToSARS = () => {
    if (!activePayrollRun) return;
    setSubmitting(true);
    // Simulated SARS hand-off for the demo flow; the real call happens server-side.
    setTimeout(() => {
      const u: PayrollRun = {
        ...activePayrollRun,
        status:            "submitted",
        submittedAt:       new Date().toISOString(),
        submissionReceipt: makeSarsReceipt(),
        updatedAt:         new Date().toISOString(),
      };
      setActivePayrollRun(u);
      setPayrollRuns(payrollRuns.map((r) => (r.id === activePayrollRun.id ? u : r)));
      setSubmitting(false);
    }, 1500);
  };

  const renderStatusBadge = (status: PayrollRun["status"]) => {
    const config: Record<PayrollRun["status"], { color: string; text: string }> = { draft: { color: "secondary", text: "Draft" }, attendance_imported: { color: "info", text: "Imported" }, calculated: { color: "warning", text: "Calculated" }, approved: { color: "success", text: "Approved" }, reports_generated: { color: "primary", text: "EMP201 Generated" }, submitted: { color: "success", text: "SARS Submitted" } };
    const c = config[status] || config.draft;
    return <Badge color={c.color} pill className="px-3 py-1">{c.text}</Badge>;
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h4 className="fw-bold mb-1 text-dark">Payroll Control Panel</h4><p className="text-muted small mb-0">Configure tax rules and processing timelines</p></div>
        {!isEditingSettings ? <Button color="info" className="text-white px-4" onClick={() => setIsEditingSettings(true)}><FaEdit className="me-2" /> Edit Configuration</Button>
        : <div className="d-flex gap-2"><Button color="secondary" outline onClick={() => { setSettingsFormData(payrollSettings); setIsEditingSettings(false); }}>Cancel</Button><Button color="success" className="px-4" disabled={loading} onClick={savePayrollSettings}>{loading ? <Spinner size="sm" className="me-2" /> : <FaSave className="me-2" />} {loading ? "Saving..." : "Save"}</Button></div>}
      </div>
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <CardBody className="p-4">
          <h5 className="fw-bold text-info mb-3 d-flex align-items-center"><FaBuilding className="me-2" /> Operational Parameters</h5>
          <Row className="g-3">
            <Col md={3}><FormGroup><Label className="small text-muted fw-bold">Pay Cycle Frequency</Label>{isEditingSettings ? <Input type="select" value={settingsFormData.frequency} onChange={(e) => setSettingsFormData({ ...settingsFormData, frequency: e.target.value })}><option>Weekly</option><option>Bi-Weekly</option><option>Monthly</option></Input> : <p className="h6 fw-normal mt-1">{payrollSettings.frequency}</p>}</FormGroup></Col>
            <Col md={3}><FormGroup><Label className="small text-muted fw-bold">Pay Day</Label>{isEditingSettings ? <Input type="select" value={settingsFormData.payDay} onChange={(e) => setSettingsFormData({ ...settingsFormData, payDay: e.target.value })}>{[...Array(31)].map((_, i) => <option key={i+1}>{i+1}</option>)}</Input> : <p className="h6 fw-normal mt-1">Day {payrollSettings.payDay}</p>}</FormGroup></Col>
            <Col md={3}><FormGroup><Label className="small text-muted fw-bold">Currency</Label>{isEditingSettings ? <Input type="select" value={settingsFormData.currency} onChange={(e) => setSettingsFormData({ ...settingsFormData, currency: e.target.value })}><option>ZAR - South African Rand</option><option>USD - US Dollar</option></Input> : <p className="h6 fw-normal mt-1">{payrollSettings.currency}</p>}</FormGroup></Col>
            <Col md={3}><FormGroup><Label className="small text-muted fw-bold">Tax Year</Label>{isEditingSettings ? <Input type="select" value={settingsFormData.taxYear} onChange={(e) => setSettingsFormData({ ...settingsFormData, taxYear: e.target.value })}><option>2025</option><option>2026</option></Input> : <p className="h6 fw-normal mt-1">{payrollSettings.taxYear}</p>}</FormGroup></Col>
          </Row>
          <hr className="my-4" />
          <h5 className="fw-bold text-info mb-3">Statutory Contributions</h5>
          <Row className="g-3">
            <Col md={4}><FormGroup><Label className="small text-muted fw-bold">UIF Rate</Label>{isEditingSettings ? <div className="pt-1"><FormGroup check inline><Input type="checkbox" checked={settingsFormData.uifEnabled} onChange={(e) => setSettingsFormData({ ...settingsFormData, uifEnabled: e.target.checked })} /><Label check className="small ms-1">Active</Label></FormGroup><Input type="number" step="0.1" className="mt-2" value={settingsFormData.uifRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, uifRate: e.target.value })} disabled={!settingsFormData.uifEnabled} /></div> : <p className="h6 fw-normal mt-1">{payrollSettings.uifEnabled ? `Enabled (${payrollSettings.uifRate}%)` : "Disabled"}</p>}</FormGroup></Col>
            <Col md={4}><FormGroup><Label className="small text-muted fw-bold">SDL Rate</Label>{isEditingSettings ? <div className="pt-1"><FormGroup check inline><Input type="checkbox" checked={settingsFormData.sdlEnabled} onChange={(e) => setSettingsFormData({ ...settingsFormData, sdlEnabled: e.target.checked })} /><Label check className="small ms-1">Active</Label></FormGroup><Input type="number" step="0.1" className="mt-2" value={settingsFormData.sdlRate} onChange={(e) => setSettingsFormData({ ...settingsFormData, sdlRate: e.target.value })} disabled={!settingsFormData.sdlEnabled} /></div> : <p className="h6 fw-normal mt-1">{payrollSettings.sdlEnabled ? `Enabled (${payrollSettings.sdlRate}%)` : "Disabled"}</p>}</FormGroup></Col>
            <Col md={4}><FormGroup><Label className="small text-muted fw-bold">PAYE</Label>{isEditingSettings ? <div className="pt-2"><FormGroup check><Input type="checkbox" checked={settingsFormData.payeEnabled} onChange={(e) => setSettingsFormData({ ...settingsFormData, payeEnabled: e.target.checked })} /><Label check className="small ms-1">Enforce PAYE Calculations</Label></FormGroup></div> : <p className="h6 fw-normal mt-1">{payrollSettings.payeEnabled ? "Enabled" : "Disabled"}</p>}</FormGroup></Col>
          </Row>
        </CardBody>
      </Card>

      <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
        <div><h4 className="fw-bold mb-1 text-dark">Payroll Runs</h4><p className="text-muted small mb-0">Manage and process payroll periods</p></div>
        <Button color="info" className="text-white px-4" onClick={() => setShowPayrollRunModal(true)}><FaPlus className="me-2" /> New Period</Button>
      </div>
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <CardBody className="p-4">
          <Table responsive hover className="align-middle mb-0">
            <thead><tr><th style={styleTh}>Period</th><th style={styleTh}>Frequency</th><th style={styleTh}>Start</th><th style={styleTh}>End</th><th style={styleTh}>Status</th><th style={styleTh} className="text-center">Employees</th><th style={styleTh} className="text-end">Gross</th><th style={styleTh} className="text-center">Action</th></tr></thead>
            <tbody>{payrollRuns.map((run) => (<tr key={run.id} className={activePayrollRun?.id === run.id ? "table-light fw-medium" : ""}><td style={styleTd}><strong>{run.period}</strong></td><td style={styleTd}>{run.frequency}</td><td style={styleTd}>{run.periodStart}</td><td style={styleTd}>{run.periodEnd}</td><td style={styleTd}>{renderStatusBadge(run.status)}</td><td style={styleTd} className="text-center">{run.employeeCount}</td><td style={styleTd} className="text-end">{run.totalGross > 0 ? `R ${run.totalGross.toLocaleString()}` : "—"}</td><td style={styleTd} className="text-center"><Button size="sm" color={activePayrollRun?.id === run.id ? "info" : "outline-info"} className={activePayrollRun?.id === run.id ? "text-white px-3" : "px-3"} onClick={() => setActivePayrollRun(run)}>{activePayrollRun?.id === run.id ? "Active" : "Select"}</Button></td></tr>))}</tbody>
          </Table>
        </CardBody>
      </Card>

      {activePayrollRun && (
        <Card className="border-2 border-info shadow-sm rounded-4 mb-5">
          <CardBody className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2">
              <div><span className="text-info small d-block fw-bold mb-1 text-uppercase">Active Pipeline</span><h4 className="fw-bold text-dark mb-0">{activePayrollRun.period}</h4></div>
              <div>{renderStatusBadge(activePayrollRun.status)}</div>
            </div>
            <Row className="g-2 text-center mb-4">
              <Col><Button color="primary" block disabled={activePayrollRun.status !== "draft"} onClick={() => setActivePayrollRun({ ...activePayrollRun, status: "attendance_imported", updatedAt: new Date().toISOString() })} className="py-2 d-flex align-items-center justify-content-center gap-2"><FaCloudUploadAlt /> 1. Import</Button></Col>
              <Col><Button color="primary" block disabled={activePayrollRun.status !== "attendance_imported"} onClick={calculatePayroll} className="py-2 d-flex align-items-center justify-content-center gap-2"><FaCalculator /> 2. Calculate</Button></Col>
              <Col><Button color="primary" block disabled={activePayrollRun.status !== "calculated"} onClick={approvePayrollRun} className="py-2 d-flex align-items-center justify-content-center gap-2"><FaCheckCircle /> 3. Approve</Button></Col>
              <Col><Button color="primary" block disabled={activePayrollRun.status !== "approved"} onClick={generateStatReports} className="py-2 d-flex align-items-center justify-content-center gap-2">{reportGenerating ? "Compiling..." : "4. EMP201"}</Button></Col>
              <Col><Button color="success" block disabled={activePayrollRun.status !== "reports_generated"} onClick={submitToSARS} className="py-2 d-flex align-items-center justify-content-center gap-2">{submitting ? "Sending..." : "5. Submit to SARS"}</Button></Col>
            </Row>
            {activePayrollRun.status !== "draft" && (
              <Alert color="light" className="border rounded-3 p-3 mb-4">
                <Row className="text-center">
                  <Col md={3} className="border-end"><span className="small text-muted d-block mb-1">Gross Pay</span><strong className="h5 fw-bold">R {activePayrollRun.totalGross.toLocaleString()}</strong></Col>
                  <Col md={3} className="border-end"><span className="small text-muted d-block mb-1">Deductions</span><strong className="h5 fw-bold text-danger">R {activePayrollRun.totalDeductions.toLocaleString()}</strong></Col>
                  <Col md={3} className="border-end"><span className="small text-muted d-block mb-1">Net Pay</span><strong className="h5 fw-bold text-success">R {activePayrollRun.totalNetPay.toLocaleString()}</strong></Col>
                  <Col md={3}><span className="small text-muted d-block mb-1">Employees</span><strong className="h5 fw-bold">{activePayrollRun.employeeCount}</strong></Col>
                </Row>
              </Alert>
            )}
            {payrollCalculations.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold mb-3">Payroll Line Items</h6>
                <div className="table-responsive rounded-3 border" style={{ maxHeight: "350px", overflowY: "auto" }}>
                  <Table hover striped size="sm" className="align-middle mb-0 bg-white">
                    <thead className="bg-light sticky-top"><tr><th style={styleTh}>Employee</th><th style={styleTh} className="text-end">Basic</th><th style={styleTh} className="text-end">Allowances</th><th style={styleTh} className="text-end">Overtime</th><th style={styleTh} className="text-end">Gross</th><th style={styleTh} className="text-end">PAYE</th><th style={styleTh} className="text-end">UIF</th><th style={styleTh} className="text-end text-success">Net Pay</th></tr></thead>
                    <tbody>{payrollCalculations.map((calc) => { const emp = realEmployees.find(e => e._id === calc.employeeId); const ex = emp ? detectExceptions(calc, emp) : []; return (<tr key={calc.id} className={ex.length > 0 ? "table-warning" : ""}><td style={styleTd}><div><span className="d-block fw-bold">{calc.name || calc.employeeId}</span><span className="text-muted small">{calc.position}</span></div></td><td style={styleTd} className="text-end">R {calc.basicSalary.toLocaleString()}</td><td style={styleTd} className="text-end">R {calc.allowances.total.toLocaleString()}</td><td style={styleTd} className="text-end">R {calc.overtime.amount.toLocaleString()}</td><td style={styleTd} className="text-end fw-bold">R {calc.grossEarnings.toLocaleString()}</td><td style={styleTd} className="text-end">R {calc.deductions.paye.toLocaleString()}</td><td style={styleTd} className="text-end">R {calc.deductions.uif.toLocaleString()}</td><td style={styleTd} className="text-end fw-bold text-success">R {calc.netPay.toLocaleString()}</td></tr>); })}</tbody>
                  </Table>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Modal isOpen={showPayrollRunModal} toggle={() => setShowPayrollRunModal(false)} centered>
        <ModalHeader toggle={() => setShowPayrollRunModal(false)} className="fw-bold">New Payroll Period</ModalHeader>
        <ModalBody>
          <FormGroup><Label className="small fw-bold text-muted">Period Label</Label><Input type="text" placeholder="e.g., June 2026" value={newRunPeriod} onChange={(e) => setNewRunPeriod(e.target.value)} /></FormGroup>
          <FormGroup className="mt-3"><Label className="small fw-bold text-muted">Frequency</Label><Input type="select" value={newRunFrequency} onChange={(e) => setNewRunFrequency(e.target.value as any)}><option value="Monthly">Monthly</option><option value="Bi-Weekly">Bi-Weekly</option><option value="Weekly">Weekly</option></Input></FormGroup>
        </ModalBody>
        <ModalFooter><Button color="secondary" outline onClick={() => setShowPayrollRunModal(false)}>Cancel</Button><Button color="info" className="text-white" disabled={!newRunPeriod.trim()} onClick={startNewPayrollRun}>Create</Button></ModalFooter>
      </Modal>

      <Modal isOpen={showExceptionsModal} toggle={() => setShowExceptionsModal(false)} centered>
        <ModalHeader className="bg-warning text-dark fw-bold"><FaExclamationTriangle className="me-2" /> Validation Warnings</ModalHeader>
        <ModalBody><p className="small text-muted mb-3">Please review these before approving:</p><ul className="text-danger small fw-medium ps-3">{exceptionsList.map((e, i) => <li key={i} className="mb-1">{e}</li>)}</ul></ModalBody>
        <ModalFooter><Button color="secondary" size="sm" onClick={() => setShowExceptionsModal(false)}>Acknowledge</Button></ModalFooter>
      </Modal>
    </div>
  );
};

// ============================================
// LEAVE SETTINGS TAB — SA BCEA + CUSTOM LEAVE
// ============================================
// Types, defaults, BCEA metadata, presets, icon keys, work-schedule tables
// and colour palette all come from shared/utils/organizationSettings so they
// can be reused from other Owner screens without copy-paste.

// ---- Statutory Leave Card ----
const StatutoryLeaveCard = ({ config, onChange }: { config: LeaveTypeConfig; onChange: (u: LeaveTypeConfig) => void; }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = BCEA_META[config.id];
  if (!meta) return null;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E0", fontSize: "13px", color: "#2D3748", backgroundColor: config.enabled ? "white" : "#F9FAFB" };
  const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#718096", marginBottom: "4px", display: "block" };

  return (
    <div style={{ border: `1px solid ${config.enabled ? meta.color + "40" : "#E2E8F0"}`, borderRadius: "12px", marginBottom: "10px", overflow: "hidden", backgroundColor: config.enabled ? "#FFFFFF" : "#F9FAFB", boxShadow: config.enabled ? `0 2px 8px ${meta.color}14` : "none", transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", cursor: "pointer", backgroundColor: expanded ? `${meta.color}08` : "transparent", borderBottom: expanded ? `1px solid ${meta.color}20` : "none" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: "34px", height: "34px", borderRadius: "8px", backgroundColor: config.enabled ? meta.color : "#CBD5E0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", flexShrink: 0 }}>{meta.icon}</div>
        <span style={{ fontWeight: 600, fontSize: "14px", color: config.enabled ? "#1A202C" : "#A0AEC0", flex: 1 }}>{meta.label}</span>
        {config.entitlementDays > 0 && <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: config.enabled ? `${meta.color}18` : "#EDF2F7", color: config.enabled ? meta.color : "#A0AEC0", border: `1px solid ${config.enabled ? meta.color + "40" : "#E2E8F0"}` }}>{config.entitlementDays} days{config.cycleLengthMonths > 0 ? ` / ${config.cycleLengthMonths}mo` : ""}</span>}
        <div onClick={(e) => { e.stopPropagation(); onChange({ ...config, enabled: !config.enabled }); }} style={{ width: "40px", height: "22px", borderRadius: "11px", backgroundColor: config.enabled ? meta.color : "#CBD5E0", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }} title="Toggle">
          <div style={{ position: "absolute", top: "2px", left: config.enabled ? "19px" : "2px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
        <div style={{ color: "#A0AEC0" }}>{expanded ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}</div>
      </div>
      {expanded && (
        <div style={{ padding: "18px", backgroundColor: "#FAFAFA" }}>
          <div style={{ display: "flex", gap: "10px", padding: "10px 14px", backgroundColor: `${meta.color}0D`, border: `1px solid ${meta.color}20`, borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#4A5568", lineHeight: 1.5 }}>
            <FaInfoCircle style={{ color: meta.color, flexShrink: 0, marginTop: "2px" }} />
            <span><strong>BCEA: </strong>{meta.bceaRule}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div><label style={labelStyle}>Entitlement (days)</label><input type="number" style={inputStyle} value={config.entitlementDays} min={0} onChange={(e) => onChange({ ...config, entitlementDays: parseFloat(e.target.value) || 0 })} disabled={!config.enabled} /></div>
            {config.cycleLengthMonths > 0 && <div><label style={labelStyle}>Cycle (months)</label><input type="number" style={inputStyle} value={config.cycleLengthMonths} min={1} onChange={(e) => onChange({ ...config, cycleLengthMonths: parseInt(e.target.value) || 12 })} disabled={!config.enabled} /></div>}
            {config.id === "sick" && <><div><label style={labelStyle}>Require Medical Certificate</label><select style={inputStyle} value={config.requiresMedCert ? "yes" : "no"} onChange={(e) => onChange({ ...config, requiresMedCert: e.target.value === "yes" })} disabled={!config.enabled}><option value="yes">Yes</option><option value="no">No</option></select></div>{config.requiresMedCert && <div><label style={labelStyle}>Cert required after (days)</label><input type="number" style={inputStyle} value={config.medCertAfterDays} min={1} onChange={(e) => onChange({ ...config, medCertAfterDays: parseInt(e.target.value) || 2 })} disabled={!config.enabled} /></div>}</>}
            {config.id === "annual" && <><div><label style={labelStyle}>Allow Carry-over</label><select style={inputStyle} value={config.carryOverAllowed ? "yes" : "no"} onChange={(e) => onChange({ ...config, carryOverAllowed: e.target.value === "yes" })} disabled={!config.enabled}><option value="yes">Yes</option><option value="no">No</option></select></div>{config.carryOverAllowed && <div><label style={labelStyle}>Max carry-over (days)</label><input type="number" style={inputStyle} value={config.maxCarryOverDays} min={0} onChange={(e) => onChange({ ...config, maxCarryOverDays: parseInt(e.target.value) || 0 })} disabled={!config.enabled} /></div>}</>}
          </div>
          <div style={{ marginTop: "14px" }}><label style={labelStyle}>Internal Notes</label><textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Company-specific notes..." value={config.notes} onChange={(e) => onChange({ ...config, notes: e.target.value })} disabled={!config.enabled} /></div>
        </div>
      )}
    </div>
  );
};

// ---- Custom Leave Form Modal ----
const CustomLeaveModal = ({
  isOpen, onClose, onSave, editingLeave
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leave: CustomLeaveType) => void;
  editingLeave: CustomLeaveType | null;
}) => {
  const blank: CustomLeaveType = { id: "", name: "", description: "", icon: "star", color: "#6366F1", entitlementDays: 5, cycleLengthMonths: 12, isPaid: true, requiresProof: false, proofDescription: "", carryOverAllowed: false, maxCarryOverDays: 0, requiresApproval: true, minimumServiceMonths: 0, notes: "" };
  const [form, setForm] = useState<CustomLeaveType>(editingLeave || blank);

  useEffect(() => { setForm(editingLeave || blank); }, [editingLeave, isOpen]);

  const applyPreset = (preset: typeof CUSTOM_LEAVE_PRESETS[0]) => {
    setForm(prev => ({ ...prev, name: preset.name, description: preset.description, icon: preset.icon, color: preset.color, entitlementDays: preset.entitlementDays, isPaid: preset.isPaid }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      alert("Please enter a leave type name");
      return;
    }
    onSave({ ...form, id: form.id || `custom_${Date.now()}` });
    onClose();
  };

  const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", fontSize: "13px", color: "#2D3748", outline: "none", backgroundColor: "white" };
  const lbl: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#718096", display: "block", marginBottom: "5px" };
  const sel: React.CSSProperties = { ...inp };

  return (
    <Modal isOpen={isOpen} toggle={onClose} centered size="lg">
      <ModalHeader toggle={onClose} style={{ fontWeight: 700, borderBottom: "1px solid #EDF2F7" }}>
        {editingLeave ? "Edit Custom Leave Type" : "Add Custom Leave Type"}
      </ModalHeader>
      <ModalBody style={{ padding: "20px 24px" }}>
        {/* Quick Presets */}
        {!editingLeave && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ ...lbl, marginBottom: "8px" }}>Quick Start from Preset</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CUSTOM_LEAVE_PRESETS.map((p) => (
                <button key={p.name} onClick={() => applyPreset(p)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${p.color}60`, backgroundColor: `${p.color}12`, color: p.color, fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <LeaveIcon name={p.icon} size={14} color={p.color} /> {p.name}
                </button>
              ))}
            </div>
            <div style={{ height: "1px", backgroundColor: "#EDF2F7", margin: "18px 0" }} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Name */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>Leave Type Name *</label>
            <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Study Leave" />
          </div>

          {/* Description */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>Description</label>
            <textarea rows={2} style={{ ...inp, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of when this leave applies..." />
          </div>

          {/* Icon picker — each option renders the actual Lucide glyph the
              user will see on the leave card, not an emoji preview. */}
          <div>
            <label style={lbl}>Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
              {LEAVE_ICON_KEYS.map(ic => (
                <span
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  title={ic}
                  style={{
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    border: form.icon === ic ? "2px solid #0EA5E9" : "2px solid transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "30px",
                    color: form.icon === ic ? "#0EA5E9" : "#4A5568",
                  }}
                >
                  <LeaveIcon name={ic} size={18} />
                </span>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={lbl}>Colour</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {LEAVE_COLOR_OPTIONS.map(c => (
                <div key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c, cursor: "pointer", border: form.color === c ? "3px solid #1A202C" : "2px solid transparent", boxSizing: "border-box" }} />
              ))}
            </div>
          </div>

          {/* Entitlement */}
          <div>
            <label style={lbl}>Entitlement (days)</label>
            <input type="number" style={inp} min={0} value={form.entitlementDays} onChange={(e) => setForm({ ...form, entitlementDays: parseFloat(e.target.value) || 0 })} />
          </div>

          {/* Cycle */}
          <div>
            <label style={lbl}>Cycle (months, 0 = once-off)</label>
            <input type="number" style={inp} min={0} value={form.cycleLengthMonths} onChange={(e) => setForm({ ...form, cycleLengthMonths: parseInt(e.target.value) || 0 })} />
          </div>

          {/* Paid */}
          <div>
            <label style={lbl}>Paid Leave</label>
            <select style={sel} value={form.isPaid ? "yes" : "no"} onChange={(e) => setForm({ ...form, isPaid: e.target.value === "yes" })}>
              <option value="yes">Yes – full pay</option>
              <option value="no">No – unpaid</option>
            </select>
          </div>

          {/* Approval */}
          <div>
            <label style={lbl}>Requires Manager Approval</label>
            <select style={sel} value={form.requiresApproval ? "yes" : "no"} onChange={(e) => setForm({ ...form, requiresApproval: e.target.value === "yes" })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Requires Proof */}
          <div>
            <label style={lbl}>Requires Supporting Document</label>
            <select style={sel} value={form.requiresProof ? "yes" : "no"} onChange={(e) => setForm({ ...form, requiresProof: e.target.value === "yes" })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {form.requiresProof && (
            <div>
              <label style={lbl}>Document Description</label>
              <input style={inp} value={form.proofDescription} onChange={(e) => setForm({ ...form, proofDescription: e.target.value })} placeholder="e.g., Exam timetable or results" />
            </div>
          )}

          {/* Carry-over */}
          <div>
            <label style={lbl}>Allow Carry-over</label>
            <select style={sel} value={form.carryOverAllowed ? "yes" : "no"} onChange={(e) => setForm({ ...form, carryOverAllowed: e.target.value === "yes" })}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {form.carryOverAllowed && (
            <div>
              <label style={lbl}>Max Carry-over (days)</label>
              <input type="number" style={inp} min={0} value={form.maxCarryOverDays} onChange={(e) => setForm({ ...form, maxCarryOverDays: parseInt(e.target.value) || 0 })} />
            </div>
          )}

          {/* Min Service */}
          <div>
            <label style={lbl}>Minimum Service (months)</label>
            <input type="number" style={inp} min={0} value={form.minimumServiceMonths} onChange={(e) => setForm({ ...form, minimumServiceMonths: parseInt(e.target.value) || 0 })} placeholder="0 = no requirement" />
          </div>

          {/* Notes */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>Internal Notes</label>
            <textarea rows={2} style={{ ...inp, resize: "vertical" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional company-specific conditions..." />
          </div>
        </div>

        {/* Preview */}
        {form.name && (
          <div style={{ marginTop: "18px", padding: "14px 18px", borderRadius: "10px", border: `1px solid ${form.color}40`, backgroundColor: `${form.color}0A`, display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: form.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>
              <LeaveIcon name={form.icon} size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A202C" }}>{form.name}</div>
              <div style={{ fontSize: "12px", color: "#718096" }}>
                {form.entitlementDays} days {form.cycleLengthMonths > 0 ? `/ ${form.cycleLengthMonths} months` : "(once-off)"} · {form.isPaid ? "Paid" : "Unpaid"} · {form.requiresApproval ? "Approval required" : "Self-service"}
              </div>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter style={{ borderTop: "1px solid #EDF2F7" }}>
        <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #CBD5E0", backgroundColor: "white", color: "#4A5568", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        <button onClick={handleSave} disabled={!form.name.trim()} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", backgroundColor: form.name.trim() ? form.color : "#CBD5E0", color: "white", fontSize: "13px", fontWeight: 600, cursor: form.name.trim() ? "pointer" : "not-allowed" }}>
          {editingLeave ? "Save Changes" : "Add Leave Type"}
        </button>
      </ModalFooter>
    </Modal>
  );
};

// ---- Custom Leave Type Row ----
const CustomLeaveRow = ({ leave, onEdit, onDelete }: { leave: CustomLeaveType; onEdit: () => void; onDelete: () => void; }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", border: `1px solid ${leave.color}30`, borderRadius: "10px", marginBottom: "8px", backgroundColor: "white", transition: "box-shadow 0.15s" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: leave.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>
        <LeaveIcon name={leave.icon} size={18} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#1A202C", display: "flex", alignItems: "center", gap: "8px" }}>
          {leave.name}
          <span style={{ padding: "1px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: leave.isPaid ? "#D1FAE5" : "#FEE2E2", color: leave.isPaid ? "#065F46" : "#991B1B" }}>{leave.isPaid ? "Paid" : "Unpaid"}</span>
          {leave.requiresApproval && <span style={{ padding: "1px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "#EDE9FE", color: "#5B21B6" }}>Approval</span>}
        </div>
        <div style={{ fontSize: "12px", color: "#718096", marginTop: "2px" }}>
          {leave.entitlementDays} days {leave.cycleLengthMonths > 0 ? `every ${leave.cycleLengthMonths} months` : "(once-off)"}
          {leave.minimumServiceMonths > 0 && ` · ${leave.minimumServiceMonths}mo min service`}
          {leave.requiresProof && ` · Proof required`}
          {leave.description && ` · ${leave.description}`}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button onClick={onEdit} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "white", color: "#718096", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
          <FaPencilAlt size={10} /> Edit
        </button>
        {showConfirm ? (
          <>
            <button onClick={onDelete} style={{ padding: "6px 10px", borderRadius: "6px", border: "none", backgroundColor: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Confirm</button>
            <button onClick={() => setShowConfirm(false)} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "white", color: "#718096", cursor: "pointer", fontSize: "12px" }}><FaTimes size={10} /></button>
          </>
        ) : (
          <button onClick={() => setShowConfirm(true)} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #FECACA", backgroundColor: "white", color: "#EF4444", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center" }}>
            <FaTrash size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

// ---- Employee Balances Table ----
const EmployeeBalancesTable = ({ balances, leaveTypes, customLeaveTypes }: { balances: LeaveBalance[]; leaveTypes: LeaveTypeConfig[]; customLeaveTypes: CustomLeaveType[]; }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const enabledTypes = leaveTypes.filter(lt => lt.enabled);
  const ths: React.CSSProperties = { padding: "10px 12px", fontSize: "11px", fontWeight: 700, color: "#718096", backgroundColor: "#F7FAFC", borderBottom: "2px solid #EDF2F7", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" };
  const tds: React.CSSProperties = { padding: "12px", fontSize: "13px", color: "#2D3748", borderBottom: "1px solid #EDF2F7", verticalAlign: "middle" };

  const getBalance = (bal: LeaveBalance, typeId: string) => {
    const raw = (bal as any)[typeId] as { opening: number; accrued: number; taken: number; planned: number } | undefined;
    if (!raw) return null;
    return { ...raw, closing: raw.opening + raw.accrued - raw.taken };
  };

  return (
    <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
        <thead>
          <tr>
            <th style={ths}>Employee</th>
            {enabledTypes.map(lt => (
              <th key={lt.id} style={{ ...ths, textAlign: "center" }}>
                <span style={{ color: BCEA_META[lt.id]?.color }}>{BCEA_META[lt.id]?.label}</span>
                <div style={{ fontWeight: 400, fontSize: "10px", color: "#A0AEC0", textTransform: "none" }}>Balance</div>
              </th>
            ))}
            {customLeaveTypes.map(clt => (
              <th key={clt.id} style={{ ...ths, textAlign: "center" }}>
                <span style={{ color: clt.color, display: "inline-flex", alignItems: "center", gap: "5px", justifyContent: "center" }}>
                  <LeaveIcon name={clt.icon} size={12} color={clt.color} /> {clt.name}
                </span>
                <div style={{ fontWeight: 400, fontSize: "10px", color: "#A0AEC0", textTransform: "none" }}>Balance</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {balances.map((bal) => (
            <React.Fragment key={bal.employeeId}>
              <tr style={{ cursor: "pointer", backgroundColor: expandedRow === bal.employeeId ? "#F0F9FF" : "white" }} onClick={() => setExpandedRow(expandedRow === bal.employeeId ? null : bal.employeeId)}>
                <td style={tds}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#33A6CD22", display: "flex", alignItems: "center", justifyContent: "center", color: "#33A6CD", fontWeight: 700, fontSize: "13px" }}>{bal.employeeName.charAt(0)}</div>
                    <div><div style={{ fontWeight: 600, fontSize: "13px" }}>{bal.employeeName}</div><div style={{ fontSize: "11px", color: "#A0AEC0" }}>{bal.position} · {bal.department}</div></div>
                  </div>
                </td>
                {enabledTypes.map(lt => {
                  const b = getBalance(bal, lt.id);
                  return <td key={lt.id} style={{ ...tds, textAlign: "center" }}>{b ? <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontWeight: 600, fontSize: "12px", backgroundColor: b.closing > 0 ? "#D1FAE5" : "#FEE2E2", color: b.closing > 0 ? "#065F46" : "#991B1B" }}>{b.closing.toFixed(1)}</span> : <span style={{ color: "#CBD5E0" }}>—</span>}</td>;
                })}
                {customLeaveTypes.map(clt => (
                  <td key={clt.id} style={{ ...tds, textAlign: "center" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontWeight: 600, fontSize: "12px", backgroundColor: `${clt.color}18`, color: clt.color }}>{clt.entitlementDays.toFixed(1)}</span>
                  </td>
                ))}
              </tr>
              {expandedRow === bal.employeeId && (
                <tr>
                  <td colSpan={enabledTypes.length + customLeaveTypes.length + 1} style={{ padding: 0, backgroundColor: "#F8FAFC" }}>
                    <div style={{ padding: "16px 20px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#718096", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Leave Breakdown — {bal.employeeName}</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "10px" }}>
                        {enabledTypes.map(lt => {
                          const b = getBalance(bal, lt.id); if (!b) return null;
                          const color = BCEA_META[lt.id]?.color || "#33A6CD";
                          return (
                            <div key={lt.id} style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${color}22`, backgroundColor: "white" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color, marginBottom: "8px" }}>{BCEA_META[lt.id]?.label}</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "12px" }}>
                                <span style={{ color: "#A0AEC0" }}>Opening</span><span style={{ fontWeight: 600 }}>{b.opening.toFixed(1)}</span>
                                <span style={{ color: "#A0AEC0" }}>Accrued</span><span style={{ fontWeight: 600, color: "#10B981" }}>+{b.accrued.toFixed(1)}</span>
                                <span style={{ color: "#A0AEC0" }}>Taken</span><span style={{ fontWeight: 600, color: "#F59E0B" }}>-{b.taken.toFixed(1)}</span>
                                <span style={{ color: "#A0AEC0" }}>Balance</span><span style={{ fontWeight: 700, color: b.closing > 0 ? "#0EA5E9" : "#EF4444" }}>{b.closing.toFixed(1)}</span>
                              </div>
                            </div>
                          );
                        })}
                        {customLeaveTypes.map(clt => (
                          <div key={clt.id} style={{ padding: "12px", borderRadius: "8px", border: `1px solid ${clt.color}22`, backgroundColor: "white" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: clt.color, marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                              <LeaveIcon name={clt.icon} size={12} color={clt.color} /> {clt.name}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "12px" }}>
                              <span style={{ color: "#A0AEC0" }}>Entitlement</span><span style={{ fontWeight: 600 }}>{clt.entitlementDays.toFixed(1)}</span>
                              <span style={{ color: "#A0AEC0" }}>Taken</span><span style={{ fontWeight: 600, color: "#F59E0B" }}>0.0</span>
                              <span style={{ color: "#A0AEC0" }}>Balance</span><span style={{ fontWeight: 700, color: clt.color }}>{clt.entitlementDays.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---- Main Leave Settings Tab ----
const LeaveSettingsTab = () => {
  const [activeSection, setActiveSection] = useState<"policy" | "custom" | "balances">("policy");
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>("5-day week (Mon–Fri)");
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [leaveBasis, setLeaveBasis] = useState<"Working Days" | "Calendar Days">("Working Days");
  const [leaveYearStart, setLeaveYearStart] = useState("January");
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>(DEFAULT_LEAVE_TYPES);
  const [customLeaveTypes, setCustomLeaveTypes] = useState<CustomLeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState<CustomLeaveType | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch real employees on component mount
  useEffect(() => {
    fetchRealEmployeesForLeave();
    fetchLeavePolicy();
  }, []);

  // Pull the live employee roster and synthesize accrual-based balances so
  // the Balances tab can render before any explicit policy is saved.
  const fetchRealEmployeesForLeave = async () => {
    setLoadingEmployees(true);
    try {
      const data = await orgApi.loadEmployees();
      if (data.success && data.data) {
        setRealEmployees(data.data);
        setBalances(generateBalancesFromEmployees(data.data));
      }
    } catch (error) {
      console.error("Error fetching employees for leave:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Load the full leave-policy list and map it onto our UI models (statutory
  // entries update existing rows, the rest become custom leave entries).
  const fetchLeavePolicy = async () => {
    try {
      const data = await orgApi.loadLeavePolicies();
      if (data.success && data.data) {
        const policies = data.data;
        setLeaveTypes((current) => mapStatutoryFromApi(current, policies));
        setCustomLeaveTypes(mapCustomLeaveFromApi(policies));
      }
    } catch (error) {
      console.error("Error fetching leave policy:", error);
    }
  };

  // Persist all statutory + custom leave policies in one click. Existing rows
  // are PUT-updated; previously-unknown custom rows get a fresh POST.
  const saveLeavePolicy = async () => {
    setSaving(true);
    try {
      const existing = await orgApi.loadLeavePolicies();
      const existingPolicies: any[] = existing.data || [];

      for (const lt of leaveTypes) {
        const match = existingPolicies.find((p) => p.type === lt.id);
        if (match) {
          await orgApi.updateLeavePolicy(match._id, {
            ...orgApi.statutoryToApi(lt),
            enabled: lt.enabled,
          });
        }
      }

      for (const custom of customLeaveTypes) {
        const match = existingPolicies.find((p) => p.type === custom.id || p.name === custom.name);
        const payload = orgApi.customLeaveToApi(custom);
        if (match) await orgApi.updateLeavePolicy(match._id, payload);
        else       await orgApi.createLeavePolicy(payload);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchLeavePolicy();
    } catch (error) {
      console.error("Error saving leave policy:", error);
      alert("Failed to save leave policy");
    } finally {
      setSaving(false);
    }
  };

  const effectiveDays = workSchedule === "Custom" ? customDays : WORK_SCHEDULE_DAYS[workSchedule];

  const handleSaveCustomLeave = async (leave: CustomLeaveType) => {
    setSaving(true);
    try {
      const data = await orgApi.createLeavePolicy(orgApi.customLeaveToApi(leave));
      if (data.success) {
        await fetchLeavePolicy();
        setShowCustomModal(false);
        setEditingLeave(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        alert("Custom leave type added successfully");
      } else {
        alert("Failed to add: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving custom leave:", error);
      alert("Error saving custom leave type");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomLeave = async (leave: CustomLeaveType) => {
    if (!window.confirm(`Delete "${leave.name}"? This will remove it from employee leave balances.`)) return;
    // Optimistic UI: drop it locally so it disappears immediately.
    setCustomLeaveTypes((prev) => prev.filter((l) => l.id !== leave.id));
    try {
      const data = await orgApi.deleteLeavePolicy(leave.id);
      if (data.success === false) {
        alert("Failed to delete leave type on the server. Reloading list.");
      }
    } catch (err) {
      console.error("Error deleting custom leave:", err);
      alert("Couldn't reach the server while deleting the leave type. Reloading the list.");
    } finally {
      // Re-sync with server so the UI always reflects the DB state.
      await fetchLeavePolicy();
    }
  };

  const handleSave = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); };

  const cardStyle: React.CSSProperties = { backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: "20px", marginBottom: "20px" };
  const secTitle: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#2D3748", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" };
  const lbl: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#718096", display: "block", marginBottom: "6px" };
  const sel: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E0", fontSize: "13px", color: "#2D3748", backgroundColor: "white" };

  return (
    <div style={{ padding: "28px", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#1A202C", margin: 0 }}>Leave Management</h3>
        <p style={{ fontSize: "14px", color: "#718096", marginTop: "4px", margin: 0 }}>Configure statutory BCEA leave and company-specific leave policies</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #EDF2F7", marginBottom: "24px" }}>
        {(["policy", "custom", "balances"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)} style={{ padding: "10px 22px", fontSize: "14px", fontWeight: 600, color: activeSection === tab ? "#0EA5E9" : "#718096", background: "none", border: "none", borderBottom: activeSection === tab ? "2px solid #0EA5E9" : "2px solid transparent", cursor: "pointer", marginBottom: "-2px", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "7px" }}>
            {tab === "policy" && <><FaCalendarAlt size={13} /> Statutory Leave</>}
            {tab === "custom" && <><FaStar size={13} /> Custom Leave {customLeaveTypes.length > 0 && <span style={{ backgroundColor: "#0EA5E9", color: "white", borderRadius: "10px", padding: "0px 6px", fontSize: "11px" }}>{customLeaveTypes.length}</span>}</>}
            {tab === "balances" && <><FaCheckCircle size={13} /> Employee Balances</>}
          </button>
        ))}
      </div>

      {/* ---- STATUTORY LEAVE TAB ---- */}
      {activeSection === "policy" && (
        <>
          {/* Work Schedule */}
          <div style={cardStyle}>
            <div style={secTitle}><FaCalendarAlt style={{ color: "#0EA5E9" }} /> Work Schedule &amp; Leave Basis</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", alignItems: "start" }}>
              <div>
                <label style={lbl}>Work Week</label>
                <select style={sel} value={workSchedule} onChange={(e) => setWorkSchedule(e.target.value as WorkSchedule)}>
                  <option>5-day week (Mon–Fri)</option>
                  <option>6-day week (Mon–Sat)</option>
                  <option>Custom</option>
                </select>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                  {workSchedule === "Custom" ? ALL_WEEK_DAYS.map(day => (
                    <span key={day} onClick={() => setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${customDays.includes(day) ? "#0EA5E9" : "#CBD5E0"}`, backgroundColor: customDays.includes(day) ? "#E0F2FE" : "#F7FAFC", color: customDays.includes(day) ? "#0EA5E9" : "#718096", userSelect: "none" }}>{day.slice(0, 3)}</span>
                  )) : effectiveDays.map(day => (
                    <span key={day} style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "1px solid #0EA5E9", backgroundColor: "#E0F2FE", color: "#0EA5E9" }}>{day.slice(0, 3)}</span>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Leave Calculated In</label>
                <select style={sel} value={leaveBasis} onChange={(e) => setLeaveBasis(e.target.value as any)}>
                  <option>Working Days</option>
                  <option>Calendar Days</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Leave Year Starts</label>
                <select style={sel} value={leaveYearStart} onChange={(e) => setLeaveYearStart(e.target.value)}>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Statutory Leave Types */}
          <div style={cardStyle}>
            <div style={secTitle}><FaUmbrellaBeach style={{ color: "#0EA5E9" }} /> BCEA Statutory Leave Types</div>
            <p style={{ fontSize: "13px", color: "#718096", marginBottom: "16px" }}>All entitlements reflect BCEA minimums. You may increase but not reduce below statutory requirements.</p>
            {leaveTypes.map(lt => <StatutoryLeaveCard key={lt.id} config={lt} onChange={(u) => setLeaveTypes(prev => prev.map(x => x.id === u.id ? u : x))} />)}
          </div>

          {/* Save Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", paddingTop: "16px", borderTop: "1px solid #EDF2F7" }}>
            {saveSuccess && <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#10B981", padding: "6px 14px", borderRadius: "8px", backgroundColor: "#D1FAE5" }}><FaCheckCircle /> Saved successfully</span>}
            <button onClick={saveLeavePolicy} disabled={saving} style={{ padding: "9px 24px", borderRadius: "8px", backgroundColor: saving ? "#CBD5E0" : "#0EA5E9", color: "white", border: "none", fontWeight: 600, fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: saving ? 0.6 : 1 }}><FaSave size={13} /> {saving ? "Saving..." : "Save Policy"}</button>
          </div>
        </>
      )}

      {/* ---- CUSTOM LEAVE TAB ---- */}
      {activeSection === "custom" && (
        <>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <div style={secTitle}><FaStar style={{ color: "#F59E0B" }} /> Company-Defined Leave Types</div>
                <p style={{ fontSize: "13px", color: "#718096", margin: 0 }}>Add leave types specific to your company — such as study leave, bereavement leave, or unpaid leave. These are in addition to the BCEA statutory minimums.</p>
              </div>
              <button onClick={() => { setEditingLeave(null); setShowCustomModal(true); }} style={{ padding: "9px 18px", borderRadius: "8px", backgroundColor: "#0EA5E9", color: "white", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", flexShrink: 0, marginLeft: "16px" }}>
                <FaPlus size={11} /> Add Leave Type
              </button>
            </div>

            {customLeaveTypes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", border: "2px dashed #E2E8F0", borderRadius: "10px", color: "#A0AEC0" }}>
                <div style={{ marginBottom: "12px", color: "#A0AEC0", display: "flex", justifyContent: "center" }}>
                  <ClipboardList size={36} aria-hidden="true" />
                </div>
                <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "6px", color: "#718096" }}>No custom leave types yet</div>
                <p style={{ fontSize: "13px", margin: "0 0 16px" }}>Add study leave, bereavement, unpaid leave, or any other type your company offers.</p>
                <button onClick={() => { setEditingLeave(null); setShowCustomModal(true); }} style={{ padding: "8px 20px", borderRadius: "8px", backgroundColor: "#0EA5E9", color: "white", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <FaPlus size={11} /> Add First Leave Type
                </button>
              </div>
            ) : (
              <>
                {customLeaveTypes.map(leave => (
                  <CustomLeaveRow key={leave.id} leave={leave} onEdit={() => { setEditingLeave(leave); setShowCustomModal(true); }} onDelete={() => handleDeleteCustomLeave(leave)} />
                ))}

                {/* Summary Cards */}
                <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                  {customLeaveTypes.map(leave => (
                    <div key={leave.id} style={{ padding: "14px", borderRadius: "10px", border: `1px solid ${leave.color}30`, backgroundColor: `${leave.color}08`, textAlign: "center" }}>
                      <div style={{ marginBottom: "6px", color: leave.color, display: "flex", justifyContent: "center" }}>
                        <LeaveIcon name={leave.icon} size={22} color={leave.color} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A202C", marginBottom: "2px" }}>{leave.name}</div>
                      <div style={{ fontWeight: 700, fontSize: "20px", color: leave.color }}>{leave.entitlementDays}</div>
                      <div style={{ fontSize: "11px", color: "#A0AEC0" }}>days / {leave.cycleLengthMonths > 0 ? `${leave.cycleLengthMonths}mo` : "once-off"}</div>
                      <div style={{ marginTop: "6px", display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap" }}>
                        <span style={{ padding: "1px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: 600, backgroundColor: leave.isPaid ? "#D1FAE5" : "#FEE2E2", color: leave.isPaid ? "#065F46" : "#991B1B" }}>{leave.isPaid ? "Paid" : "Unpaid"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tip box */}
          <div style={{ padding: "14px 18px", borderRadius: "10px", backgroundColor: "#F0F9FF", border: "1px solid #BAE6FD", display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <FaInfoCircle style={{ color: "#0EA5E9", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "13px", color: "#0C4A6E" }}>
              <strong>Note:</strong> Custom leave types are company-specific and are separate from BCEA minimum entitlements. Unpaid leave should always be available when paid leave is exhausted, in line with good HR practice. All custom leave must still comply with any applicable collective bargaining agreements.
            </div>
          </div>

          {/* Save Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", paddingTop: "16px", borderTop: "1px solid #EDF2F7", marginTop: "16px" }}>
            {saveSuccess && <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#10B981", padding: "6px 14px", borderRadius: "8px", backgroundColor: "#D1FAE5" }}><FaCheckCircle /> Saved</span>}
            <button onClick={handleSave} style={{ padding: "9px 24px", borderRadius: "8px", backgroundColor: "#0EA5E9", color: "white", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><FaSave size={13} /> Save</button>
          </div>
        </>
      )}

      {/* ---- BALANCES TAB ---- */}
      {activeSection === "balances" && (
        <div style={cardStyle}>
          <div style={secTitle}><FaCalendarAlt style={{ color: "#0EA5E9" }} /> Employee Leave Balances</div>
          <p style={{ fontSize: "13px", color: "#718096", marginBottom: "16px" }}>Click any employee row to expand their full leave breakdown. Balance = Opening + Accrued − Taken.</p>
          {loadingEmployees ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", fontSize: "14px", color: "#718096" }}>
              <Spinner size="sm" style={{ marginRight: "10px" }} />
              Loading employee data...
            </div>
          ) : (
            <EmployeeBalancesTable balances={balances} leaveTypes={leaveTypes} customLeaveTypes={customLeaveTypes} />
          )}
        </div>
      )}

      {/* Custom Leave Modal */}
      <CustomLeaveModal isOpen={showCustomModal} onClose={() => { setShowCustomModal(false); setEditingLeave(null); }} onSave={handleSaveCustomLeave} editingLeave={editingLeave} />
    </div>
  );
};

// ============================================
// MAIN ORGANIZATION SETTINGS PAGE
// ============================================
export const OrganizationSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<"company" | "payroll" | "leave">("company");

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 24px", backgroundColor: isActive ? "#33A6CD" : "transparent",
    color: isActive ? "white" : "#4A5568", border: "none", borderRadius: "8px 8px 0 0",
    cursor: "pointer", fontWeight: 500, transition: "all 0.2s ease",
    display: "flex", alignItems: "center", gap: "8px"
  });

  return (
    <div className="w-100" style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        <button onClick={() => setActiveTab("company")} style={tabStyle(activeTab === "company")}><FaBuilding size={16} /> Company Details</button>
        <button onClick={() => setActiveTab("payroll")} style={tabStyle(activeTab === "payroll")}><FaMoneyBillWave size={16} /> Payroll</button>
        <button onClick={() => setActiveTab("leave")} style={tabStyle(activeTab === "leave")}><FaCalendarAlt size={16} /> Leave</button>
      </div>
      {activeTab === "company" && <CompanyDetailsTab />}
      {activeTab === "payroll" && <PayrollSettingsTab />}
      {activeTab === "leave" && <LeaveSettingsTab />}
    </div>
  );
};

export default OrganizationSettingsPage;
