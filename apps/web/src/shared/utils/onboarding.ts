/**
 * onboarding – frontend utilities for the Owner onboarding wizard.
 *
 * Holds types, constants, the brand palette and all the API calls the page
 * needs so the UI file stays focused on layout/render.
 */

import { API_URL, safeJson, unwrapArray, unwrapSuccessData } from "./employee";

/* ─────────────────────────────────────────────────────────────────────────
 * Owner brand tokens (mirrors OwnerOverview.tsx so the wizard fits in)
 * ────────────────────────────────────────────────────────────────────── */

export const OC = {
  accent:    "#4f3da3", accentDk: "#2a2f7a", accentBg: "#eeeaff",
  coral:     "#E6614F", coralBg:  "#fdf0ee",
  ink:       "#1d2939", text:     "#344054",
  muted:     "#667085", faint:    "#98a2b3",
  line:      "#e4e7ec", surface:  "#ffffff", surfaceAlt: "#f9f7f5",
  ok:        "#10b981", okBg:     "#ecfdf3",
  warn:      "#f59e0b", warnBg:   "#fffaeb",
  bad:       "#ef4444", badBg:    "#fef2f2",
  blue:      "#3182CE", blueBg:   "#ebf8ff",
  green:     "#48BB78", greenBg:  "#f0fff4",
  purple:    "#805AD5", purpleBg: "#f3f0ff",
  amber:     "#D97706", amberBg:  "#fffbeb",
  teal:      "#0d9488", tealBg:   "#f0fdfa",
} as const;

export const OSHADOW   = "0 1px 4px rgba(16,24,40,0.06), 0 2px 8px rgba(16,24,40,0.04)";
export const OSHADOW_L = "0 8px 24px rgba(16,24,40,0.12)";
export const OR        = { sm: 8, md: 12, lg: 16, xl: 20, hero: 24 } as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Domain types
 * ────────────────────────────────────────────────────────────────────── */

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  swiftCode: string;
}

export interface ContactPerson {
  name: string;
  email: string;
  phone: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  physicalAddress?: string;
  postalAddress?: string;
}

export interface CompanyContacts {
  ceo: ContactPerson;
  finance: ContactPerson;
  payroll: ContactPerson;
}

export interface CompanyData {
  // Basic
  name: string;
  size: string;
  sector: string;
  email: string;
  phone: string;
  alternativePhone: string;
  website: string;
  fax: string;
  language: string;
  timezone: string;
  dateFormat: string;
  status: string;
  logoUrl?: string;
  logoDataUrl?: string;

  // Registration & SARS
  registrationNumber: string;
  companyType: string;
  companyStatus: string;
  registrationDate: string;
  taxId: string;
  vatNumber: string;
  incomeTaxNumber: string;
  payeReference: string;
  uifReference: string;
  sdlReference: string;
  workInjuryFundRef: string;
  sarsBranch: string;
  provisionalTaxpayer: boolean;
  taxComplianceStatus: string;

  // Nested
  bank: BankDetails;
  contacts: CompanyContacts;
  address: CompanyAddress;

  // Fiscal
  fiscalYearStart: string;
  fiscalYearEnd: string;
  lastAuditDate: string;
  yearsInOperation: number;
  businessType: string;

  // Onboarding
  country: string;
}

const EMPTY_CONTACT: ContactPerson = { name: "", email: "", phone: "" };

export const EMPTY_COMPANY: CompanyData = {
  name: "", size: "", sector: "", email: "", phone: "", alternativePhone: "",
  website: "", fax: "", language: "English", timezone: "Africa/Johannesburg",
  dateFormat: "DD/MM/YYYY", status: "Active",
  registrationNumber: "", companyType: "", companyStatus: "Active",
  registrationDate: "", taxId: "", vatNumber: "", incomeTaxNumber: "",
  payeReference: "", uifReference: "", sdlReference: "", workInjuryFundRef: "",
  sarsBranch: "", provisionalTaxpayer: false, taxComplianceStatus: "Pending",
  bank: { bankName: "", accountName: "", accountNumber: "", branchCode: "", accountType: "Business Cheque", swiftCode: "" },
  contacts: { ceo: { ...EMPTY_CONTACT }, finance: { ...EMPTY_CONTACT }, payroll: { ...EMPTY_CONTACT } },
  address: { street: "", city: "", state: "", country: "South Africa", postalCode: "", physicalAddress: "", postalAddress: "" },
  fiscalYearStart: "", fiscalYearEnd: "", lastAuditDate: "",
  yearsInOperation: 0, businessType: "",
  country: "South Africa",
};

export interface Department {
  id?: string;
  name: string;
  description?: string;
}

/** New owner being added through the wizard. */
export interface AdministratorDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface Administrator {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "admin" | "owner";
}

/** Read-only system role baked into the backend User schema. */
export interface SystemRole {
  key: "admin" | "owner" | "hr" | "manager" | "employee" | "user";
  label: string;
  description: string;
  color: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Static reference data
 * ────────────────────────────────────────────────────────────────────── */

export const SADC_COUNTRIES = [
  "Angola", "Botswana", "Comoros", "Democratic Republic of Congo",
  "Eswatini", "Lesotho", "Madagascar", "Malawi", "Mauritius",
  "Mozambique", "Namibia", "Seychelles", "South Africa",
  "Tanzania", "Zambia", "Zimbabwe",
] as const;

export const SYSTEM_ROLES: SystemRole[] = [
  { key: "owner",    label: "Owner",       description: "Full administrative access across the entire organisation.", color: OC.accent },
  { key: "admin",    label: "Administrator", description: "Owner-level access for day-to-day administration.",       color: OC.purple },
  { key: "hr",       label: "HR",           description: "Manage employees, leave, payroll and compliance.",         color: OC.blue   },
  { key: "manager",  label: "Manager",     description: "Review team leave, attendance and performance.",            color: OC.teal   },
  { key: "employee", label: "Employee",    description: "Standard employee – self-service profile, leave, etc.",     color: OC.green  },
  { key: "user",     label: "User",        description: "Basic authenticated user – minimal permissions.",            color: OC.muted  },
];

export const SECTORS = [
  "Technology", "Finance", "Healthcare", "Manufacturing", "Retail", "Education",
  "Construction", "Transportation", "Hospitality", "Agriculture", "Mining",
  "Energy", "Telecommunications", "Consulting", "Human Capital",
] as const;

export const COMPANY_TYPES = [
  "Pty Ltd", "Ltd", "Incorporated", "Partnership",
  "Sole Proprietorship", "Non-Profit Organisation",
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const SA_BANKS = [
  "First National Bank", "Standard Bank", "Absa", "Nedbank", "Capitec",
  "Discovery Bank", "Investec", "TymeBank", "African Bank",
] as const;

export const BANK_ACCOUNT_TYPES = [
  "Business Cheque", "Cheque", "Savings", "Transmission", "Money Market",
] as const;

export const SA_PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Limpopo",
  "Mpumalanga", "North West", "Free State", "Northern Cape",
] as const;

export interface CompanyFieldSpec {
  label: string;
  /** Dot-path inside CompanyData – e.g. "name", "bank.bankName" or "contacts.ceo.email". */
  path: string;
  type?: "text" | "email" | "tel" | "number" | "date";
  placeholder?: string;
  options?: readonly string[];
}

export const COMPANY_BASIC_FIELDS: CompanyFieldSpec[] = [
  { label: "Company Name",  path: "name",           placeholder: "Kago Human Capital" },
  { label: "Sector",        path: "sector",         options: SECTORS },
  { label: "Company Type",  path: "companyType",    options: COMPANY_TYPES },
  { label: "Company Size",  path: "size",           options: COMPANY_SIZES },
  { label: "Email Address", path: "email",          type: "email", placeholder: "info@company.com" },
  { label: "Phone Number",  path: "phone",          type: "tel",   placeholder: "+27 11 123 4567" },
  { label: "Website",       path: "website",        placeholder: "www.company.com" },
];

export const COMPANY_LEGAL_FIELDS: CompanyFieldSpec[] = [
  { label: "Registration Number (CIPC)", path: "registrationNumber" },
  { label: "Income Tax Number",          path: "taxId" },
  { label: "VAT Number",                 path: "vatNumber" },
  { label: "PAYE Reference",             path: "payeReference" },
  { label: "UIF Reference",              path: "uifReference" },
  { label: "SDL Reference",              path: "sdlReference" },
  { label: "Workmen's Comp. (OID) Ref.", path: "workInjuryFundRef" },
  { label: "SARS Branch",                path: "sarsBranch" },
];

export const COMPANY_BANKING_FIELDS: CompanyFieldSpec[] = [
  { label: "Bank Name",      path: "bank.bankName",     options: SA_BANKS },
  { label: "Account Name",   path: "bank.accountName" },
  { label: "Account Number", path: "bank.accountNumber" },
  { label: "Branch Code",    path: "bank.branchCode" },
  { label: "Account Type",   path: "bank.accountType",  options: BANK_ACCOUNT_TYPES },
  { label: "SWIFT / BIC",    path: "bank.swiftCode" },
];

export const COMPANY_ADDRESS_FIELDS: CompanyFieldSpec[] = [
  { label: "Street Address", path: "address.street" },
  { label: "City",           path: "address.city" },
  { label: "Province",       path: "address.state",   options: SA_PROVINCES },
  { label: "Postal Code",    path: "address.postalCode" },
  { label: "Country",        path: "address.country" },
];

export const COMPANY_FISCAL_FIELDS: CompanyFieldSpec[] = [
  { label: "Fiscal Year Start", path: "fiscalYearStart", type: "date" },
  { label: "Fiscal Year End",   path: "fiscalYearEnd",   type: "date" },
];

export const CONTACT_FIELDS = (prefix: "contacts.ceo" | "contacts.finance" | "contacts.payroll"): CompanyFieldSpec[] => [
  { label: "Full Name", path: `${prefix}.name` },
  { label: "Email",     path: `${prefix}.email`, type: "email" },
  { label: "Phone",     path: `${prefix}.phone`, type: "tel" },
];

/* ─────────────────────────────────────────────────────────────────────────
 * Path helpers (read / write nested CompanyData values by dot-path)
 * ────────────────────────────────────────────────────────────────────── */

export const getByPath = (obj: any, path: string): any =>
  path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

export const setByPath = <T extends object>(obj: T, path: string, value: any): T => {
  const keys = path.split(".");
  const next: any = Array.isArray(obj) ? [...(obj as any)] : { ...obj };
  let cursor = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cursor[k] = cursor[k] == null ? {} : { ...cursor[k] };
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;
  return next as T;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Network helpers
 * ────────────────────────────────────────────────────────────────────── */

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token") || "";
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

const handleJson = async (res: Response): Promise<any> => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data?.success !== true) {
    throw new Error(data?.message || data?.error?.message || `Request failed (${res.status})`);
  }
  return data;
};

// Company

export const fetchCompanySettings = async (): Promise<Partial<CompanyData>> => {
  const data = await safeJson(`${API_URL}/owner/company/settings`, { headers: authHeaders() });
  const c = unwrapSuccessData(data);
  return c && typeof c === "object" ? c : {};
};

export const saveCompanySettings = async (company: CompanyData): Promise<void> => {
  const res = await fetch(`${API_URL}/owner/company/settings`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(company),
  });
  await handleJson(res);
};

// Departments  (backend: /api/v1/department, POST /create, DELETE /:id)

export const fetchDepartments = async (): Promise<Department[]> => {
  const data = await safeJson(`${API_URL}/department`, { headers: authHeaders() });
  return unwrapArray(data).map((d: any) => ({
    id: d._id || d.id,
    name: d.name || "",
    description: d.description,
  }));
};

export const createDepartment = async (name: string, description?: string): Promise<Department> => {
  const res = await fetch(`${API_URL}/department/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, description }),
  });
  const data = await handleJson(res);
  const d = unwrapSuccessData(data) || {};
  return { id: d._id || d.id, name: d.name || name, description: d.description };
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/department/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleJson(res);
};

// Administrators / Owners
//   POST   /api/v1/owner/create
//   GET    /api/v1/owner
//   POST   /api/v1/owner/onboarding/complete

export const fetchAdministrators = async (): Promise<Administrator[]> => {
  const data = await safeJson(`${API_URL}/owner`, { headers: authHeaders() });
  return unwrapArray(data).map((u: any) => ({
    id: u._id || u.id,
    firstName: u.firstName || "",
    lastName:  u.lastName  || "",
    email:     u.email     || "",
    phone:     u.phone     || "",
    role:      (u.role === "owner" ? "owner" : "admin"),
  }));
};

export const createAdministrator = async (a: AdministratorDraft): Promise<Administrator> => {
  const res = await fetch(`${API_URL}/owner/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      firstName: a.firstName,
      lastName:  a.lastName,
      email:     a.email,
      phone:     a.phone,
      password:  a.password,
      role:      "admin",
    }),
  });
  const data = await handleJson(res);
  const u = unwrapSuccessData(data) || {};
  return {
    id: u._id || u.id,
    firstName: u.firstName || a.firstName,
    lastName:  u.lastName  || a.lastName,
    email:     u.email     || a.email,
    phone:     u.phone     || a.phone,
    role:      (u.role === "owner" ? "owner" : "admin"),
  };
};

export const completeOnboarding = async (payload: {
  country: string;
  company: CompanyData;
  departments: string[];
}): Promise<void> => {
  const res = await fetch(`${API_URL}/owner/onboarding/complete`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  await handleJson(res);
};

/* ─────────────────────────────────────────────────────────────────────────
 * Local cache for the wizard (so refreshes don't reset progress)
 * ────────────────────────────────────────────────────────────────────── */

const CACHE_KEY = "kago.ownerOnboarding";

export interface OnboardingCache {
  country: string;
  company: CompanyData;
  administrators: Administrator[];
  completedSteps: number[];
}

export const loadCache = (): OnboardingCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingCache) : null;
  } catch { return null; }
};

export const saveCache = (state: OnboardingCache): void => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(state)); }
  catch (err) { console.warn("Failed to cache onboarding:", err); }
};

/* ─────────────────────────────────────────────────────────────────────────
 * Validation helpers
 * ────────────────────────────────────────────────────────────────────── */

export const isValidEmail = (s: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const validateAdministrator = (a: AdministratorDraft): string | null => {
  if (!a.firstName.trim()) return "First name is required.";
  if (!a.lastName.trim())  return "Last name is required.";
  if (!isValidEmail(a.email)) return "Please enter a valid email address.";
  if (a.password.length < 8)  return "Password must be at least 8 characters.";
  return null;
};

export const validateCompanyForSave = (c: CompanyData): string | null => {
  if (!c.name.trim()) return "Company name is required.";
  if (c.email && !isValidEmail(c.email)) return "Company email is not valid.";
  return null;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Misc helpers
 * ────────────────────────────────────────────────────────────────────── */

export const initialsFromName = (first?: string, last?: string): string =>
  `${(first?.[0] || "").toUpperCase()}${(last?.[0] || "").toUpperCase()}` || "?";

export const computeCompanyCompletion = (c: CompanyData): number => {
  const paths = [
    "name", "sector", "companyType", "size", "email", "phone",
    "registrationNumber", "taxId", "payeReference", "uifReference",
    "bank.bankName", "bank.accountNumber",
    "address.street", "address.city", "address.country",
    "contacts.ceo.name", "contacts.payroll.name",
    "fiscalYearStart", "fiscalYearEnd",
  ];
  const filled = paths.filter(p => {
    const v = getByPath(c, p);
    return v !== undefined && v !== null && String(v).trim().length > 0;
  }).length;
  return Math.round((filled / paths.length) * 100);
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
