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

const pickStr = (...vals: unknown[]): string => {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
};

const sizeFromHeadcount = (n: number): string => {
  if (n <= 10) return "1-10";
  if (n <= 50) return "11-50";
  if (n <= 200) return "51-200";
  if (n <= 500) return "201-500";
  return "500+";
};

const mapContact = (c: any): ContactPerson => {
  if (!c || typeof c !== "object") return { ...EMPTY_CONTACT };
  return {
    name: pickStr(c.name, c.fullName, [c.firstName, c.lastName].filter(Boolean).join(" ")),
    email: pickStr(c.email),
    phone: pickStr(c.phone, c.mobile, c.telephone),
  };
};

const unwrapCompanyRecord = (raw: any): any => {
  if (!raw || typeof raw !== "object") return {};
  if (raw.company && typeof raw.company === "object" && !raw.name && !raw.registrationNumber) {
    return raw.company;
  }
  if (raw.settings && typeof raw.settings === "object" && !raw.name) return raw.settings;
  return raw;
};

const mergeContact = (a: ContactPerson, b: ContactPerson): ContactPerson => ({
  name: pickStr(b.name, a.name),
  email: pickStr(b.email, a.email),
  phone: pickStr(b.phone, a.phone),
});

/** Map GET /owner/company/settings (and org-settings aliases) onto the onboarding form shape. */
export const normalizeCompanyFromApi = (raw: any): CompanyData => {
  const src = unwrapCompanyRecord(raw);
  if (!src || typeof src !== "object") return { ...EMPTY_COMPANY };
  const bank = src.bank && typeof src.bank === "object" ? src.bank : (src.banking || {});
  const contacts = src.contacts && typeof src.contacts === "object" ? src.contacts : {};
  const address = src.address && typeof src.address === "object" ? src.address : {};
  const ceo = mapContact(contacts.ceo || contacts.primaryContact || contacts.primary);
  const headcount = Number(src.numberOfEmployees);
  return {
    ...EMPTY_COMPANY,
    name: pickStr(src.name, src.companyName, src.registeredName),
    size: pickStr(src.size, Number.isFinite(headcount) && headcount > 0 ? sizeFromHeadcount(headcount) : ""),
    sector: pickStr(src.sector, src.industry),
    email: pickStr(src.email, src.companyEmail),
    phone: pickStr(src.phone, src.telephone, src.mainPhone),
    alternativePhone: pickStr(src.alternativePhone, src.altPhone),
    website: pickStr(src.website),
    fax: pickStr(src.fax),
    language: pickStr(src.language) || EMPTY_COMPANY.language,
    timezone: pickStr(src.timezone) || EMPTY_COMPANY.timezone,
    dateFormat: pickStr(src.dateFormat) || EMPTY_COMPANY.dateFormat,
    status: pickStr(src.status, src.companyStatus) || EMPTY_COMPANY.status,
    logoUrl: pickStr(src.logoUrl, src.logo),
    logoDataUrl: pickStr(src.logoDataUrl),
    registrationNumber: pickStr(src.registrationNumber, src.cipcNumber),
    companyType: pickStr(src.companyType, src.businessType),
    companyStatus: pickStr(src.companyStatus, src.status) || EMPTY_COMPANY.companyStatus,
    registrationDate: pickStr(src.registrationDate),
    taxId: pickStr(src.taxId, src.incomeTaxNumber, src.taxNumber),
    vatNumber: pickStr(src.vatNumber),
    incomeTaxNumber: pickStr(src.incomeTaxNumber, src.taxId, src.taxNumber),
    payeReference: pickStr(src.payeReference, src.paye),
    uifReference: pickStr(src.uifReference, src.uif),
    sdlReference: pickStr(src.sdlReference, src.sdl),
    workInjuryFundRef: pickStr(src.workInjuryFundRef, src.coida, src.wca),
    sarsBranch: pickStr(src.sarsBranch),
    provisionalTaxpayer: Boolean(src.provisionalTaxpayer),
    taxComplianceStatus: pickStr(src.taxComplianceStatus) || EMPTY_COMPANY.taxComplianceStatus,
    bank: {
      bankName: pickStr(bank.bankName, bank.name),
      accountName: pickStr(bank.accountName, bank.accountHolder),
      accountNumber: pickStr(bank.accountNumber, bank.account),
      branchCode: pickStr(bank.branchCode, bank.branch),
      accountType: pickStr(bank.accountType) || EMPTY_COMPANY.bank.accountType,
      swiftCode: pickStr(bank.swiftCode, bank.bic),
    },
    contacts: {
      ceo,
      finance: mapContact(contacts.finance),
      payroll: mapContact(contacts.payroll),
    },
    address: {
      street: pickStr(address.street, address.streetAddress, address.line1),
      city: pickStr(address.city, address.town),
      state: pickStr(address.state, address.province),
      country: pickStr(address.country, src.country) || EMPTY_COMPANY.address.country,
      postalCode: pickStr(address.postalCode, address.code),
      physicalAddress: pickStr(address.physicalAddress),
      postalAddress: pickStr(address.postalAddress),
    },
    fiscalYearStart: pickStr(src.fiscalYearStart, src.financialYearStart),
    fiscalYearEnd: pickStr(src.fiscalYearEnd, src.financialYearEnd),
    lastAuditDate: pickStr(src.lastAuditDate),
    yearsInOperation: Number(src.yearsInOperation) || 0,
    businessType: pickStr(src.businessType, src.companyType),
    country: pickStr(src.country, address.country) || EMPTY_COMPANY.country,
  };
};

/** Keep filled values when the API omits a nested object or returns blanks. */
export const mergeCompanyData = (base: CompanyData, incoming: Partial<CompanyData> | CompanyData): CompanyData => {
  const b = { ...EMPTY_COMPANY, ...base };
  const n = normalizeCompanyFromApi({ ...b, ...incoming, bank: incoming.bank, contacts: incoming.contacts, address: incoming.address });
  return {
    ...b,
    ...Object.fromEntries(
      Object.entries(n).filter(([key, val]) => {
        if (key === "bank" || key === "contacts" || key === "address") return false;
        if (typeof val === "string") return val.trim().length > 0;
        if (typeof val === "boolean") return true;
        if (typeof val === "number") return val !== 0 || typeof (b as any)[key] !== "number";
        return val != null;
      }),
    ),
    bank: {
      bankName: pickStr(n.bank.bankName, b.bank.bankName),
      accountName: pickStr(n.bank.accountName, b.bank.accountName),
      accountNumber: pickStr(n.bank.accountNumber, b.bank.accountNumber),
      branchCode: pickStr(n.bank.branchCode, b.bank.branchCode),
      accountType: pickStr(n.bank.accountType, b.bank.accountType) || b.bank.accountType,
      swiftCode: pickStr(n.bank.swiftCode, b.bank.swiftCode),
    },
    contacts: {
      ceo: mergeContact(b.contacts.ceo, n.contacts.ceo),
      finance: mergeContact(b.contacts.finance, n.contacts.finance),
      payroll: mergeContact(b.contacts.payroll, n.contacts.payroll),
    },
    address: {
      street: pickStr(n.address.street, b.address.street),
      city: pickStr(n.address.city, b.address.city),
      state: pickStr(n.address.state, b.address.state),
      country: pickStr(n.address.country, b.address.country, n.country, b.country),
      postalCode: pickStr(n.address.postalCode, b.address.postalCode),
      physicalAddress: pickStr(n.address.physicalAddress, b.address.physicalAddress),
      postalAddress: pickStr(n.address.postalAddress, b.address.postalAddress),
    },
  } as CompanyData;
};

/** Write every alias the org-settings schema and the onboarding form use. */
export const companyPayloadForSave = (company: CompanyData): Record<string, unknown> => {
  const n = normalizeCompanyFromApi(company);
  const physical = pickStr(
    n.address.physicalAddress,
    [n.address.street, n.address.city, n.address.state, n.address.postalCode].filter(Boolean).join(", "),
  );
  return {
    ...company,
    ...n,
    businessType: n.businessType || n.companyType,
    companyType: n.companyType || n.businessType,
    incomeTaxNumber: n.incomeTaxNumber || n.taxId,
    taxId: n.taxId || n.incomeTaxNumber,
    coida: n.workInjuryFundRef,
    workInjuryFundRef: n.workInjuryFundRef,
    companyStatus: n.companyStatus || n.status,
    status: n.status || n.companyStatus,
    contacts: {
      ceo: n.contacts.ceo,
      primaryContact: {
        name: n.contacts.ceo.name,
        email: n.contacts.ceo.email,
        phone: n.contacts.ceo.phone,
        designation: "CEO / Managing Director",
      },
      finance: n.contacts.finance,
      payroll: n.contacts.payroll,
    },
    address: {
      ...n.address,
      province: n.address.state,
      state: n.address.state,
      physicalAddress: physical,
    },
    bank: n.bank,
    country: n.country || n.address.country,
  };
};

export interface DepartmentManagerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface Department {
  id?: string;
  name: string;
  description?: string;
  // id of the parent Business Unit. null/undefined = this DEPARTMENT
  // RECORD **IS** a Business Unit (top-level, no parent).
  parentDepartment?: string | null;
  // Populated display name of the parent, when the backend sends it back
  // via .populate('parentDepartment', 'name').
  parentDepartmentName?: string;
  // Populated manager, when the backend sends it back via
  // .populate('manager', 'firstName lastName email role'). null/undefined
  // means no manager has been assigned to this department yet.
  manager?: DepartmentManagerInfo | null;
}

// Canonical starter taxonomy — MUST stay in sync with DEFAULT_DEPARTMENTS in
// api/src/modules/owner/seed/department.seed.ts. Drives the Structure step's
// dropdowns so owners pick from a controlled list instead of typing free
// text — prevents near-duplicate names like "Commercial" / "Commercials"
// ending up as two separate Business Units.
export interface BusinessUnitTemplate {
  name: string;
  departments: string[];
}

export const BUSINESS_UNIT_TEMPLATES: BusinessUnitTemplate[] = [
  { name: "Corporate Services",     departments: ["HR", "Finance", "Legal", "Procurement"] },
  { name: "Commercial",             departments: ["Sales", "Marketing", "Customer Service"] },
  { name: "Technology",             departments: ["IT", "Research & Development"] },
  { name: "Operations & Logistics", departments: ["Operations"] },
];

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
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || data?.error?.message || `Request failed (${res.status})`);
  }
  return data;
};

// Company

export const fetchCompanySettings = async (): Promise<CompanyData> => {
  const data = await safeJson(`${API_URL}/owner/company/settings`, { headers: authHeaders() });
  const c = unwrapSuccessData(data);
  return normalizeCompanyFromApi(c);
};

export const saveCompanySettings = async (company: CompanyData): Promise<CompanyData> => {
  const payload = companyPayloadForSave(company);
  const res = await fetch(`${API_URL}/owner/company/settings`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleJson(res);
  const saved = unwrapSuccessData(data);
  return mergeCompanyData(normalizeCompanyFromApi(payload), normalizeCompanyFromApi(saved));
};

// Departments  (backend: /api/v1/department — POST /, GET /, GET /hierarchy,
// PUT /:id, DELETE /:id — see api/src/modules/owner/routes/department.routes.ts)

const mapDepartment = (d: any): Department => ({
  id: d._id || d.id,
  name: d.name || "",
  description: d.description,
  parentDepartment: d.parentDepartment?._id || d.parentDepartment || null,
  parentDepartmentName: d.parentDepartment?.name,
  manager: d.manager && (d.manager._id || d.manager.id)
    ? {
        id: d.manager._id || d.manager.id,
        firstName: d.manager.firstName || "",
        lastName: d.manager.lastName || "",
        email: d.manager.email || "",
        role: d.manager.role,
      }
    : null,
});

export const fetchDepartments = async (): Promise<Department[]> => {
  const data = await safeJson(`${API_URL}/department`, { headers: authHeaders() });
  return unwrapArray(data).map(mapDepartment);
};

export const createDepartment = async (
  name: string,
  description?: string,
  parentDepartment?: string | null,
): Promise<Department> => {
  // NOTE: this is POST /department (no /create suffix) — matches
  // department.routes.ts's `router.post('/', ...)`. Hitting /department/create
  // 404s because that route doesn't exist on the backend.
  const res = await fetch(`${API_URL}/department`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      name,
      description,
      parentDepartment: parentDepartment || undefined,
    }),
  });
  const data = await handleJson(res);
  const d = unwrapSuccessData(data) || {};
  return mapDepartment({ ...d, name: d.name || name });
};

export const updateDepartment = async (
  id: string,
  updates: { name?: string; description?: string; manager?: string | null; parentDepartment?: string | null },
): Promise<Department> => {
  const res = await fetch(`${API_URL}/department/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await handleJson(res);
  const d = unwrapSuccessData(data) || {};
  return mapDepartment(d);
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/department/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handleJson(res);
};

// Administrators / Owners
//   POST   /api/v1/owner/create           (public signup — creates a NEW
//                                            owner + NEW company; NOT used
//                                            for adding admins to an
//                                            existing company)
//   GET    /api/v1/owner/administrators    (owner + admins of the CURRENT
//                                            company only)
//   POST   /api/v1/owner/administrators    (add an admin to the CURRENT
//                                            company — owner-only)
//   POST   /api/v1/owner/onboarding/complete

export const fetchAdministrators = async (): Promise<Administrator[]> => {
  const data = await safeJson(`${API_URL}/owner/administrators`, { headers: authHeaders() });
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
  const res = await fetch(`${API_URL}/owner/administrators`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      firstName: a.firstName,
      lastName:  a.lastName,
      email:     a.email,
      phone:     a.phone,
      password:  a.password,
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
    body: JSON.stringify({
      ...payload,
      company: companyPayloadForSave(payload.company),
    }),
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
  /** Job titles defined under Structure. Local until a positions API exists. */
  positions?: OrgPosition[];
}

/** A job title owned by a department. Stored locally until the backend catalog ships. */
export interface OrgPosition {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  departmentName: string;
}

export const loadCache = (): OnboardingCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingCache) : null;
  } catch { return null; }
};

export const saveCache = (state: OnboardingCache): void => {
  try {
    const prev = loadCache();
    const merged: OnboardingCache = {
      country: state.country ?? prev?.country ?? "",
      company: state.company ?? prev?.company ?? EMPTY_COMPANY,
      administrators: state.administrators ?? prev?.administrators ?? [],
      completedSteps: state.completedSteps ?? prev?.completedSteps ?? [],
      positions: state.positions ?? prev?.positions ?? [],
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  } catch (err) { console.warn("Failed to cache onboarding:", err); }
};

export const loadCachedPositions = (): OrgPosition[] =>
  loadCache()?.positions || [];

export const saveCachedPositions = (positions: OrgPosition[]): void => {
  const cached = loadCache() || {
    country: "",
    company: EMPTY_COMPANY,
    administrators: [],
    completedSteps: [],
  };
  saveCache({ ...cached, positions });
};

export const positionsForDepartment = (
  departmentName: string,
  positions?: OrgPosition[],
): OrgPosition[] => {
  const list = positions ?? loadCachedPositions();
  const key = departmentName.trim().toLowerCase();
  if (!key) return [];
  return list.filter(p => p.departmentName.trim().toLowerCase() === key);
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

/** Mark wizard steps done from saved org data, not only local clicks. */
export const inferOnboardingSteps = (opts: {
  country?: string;
  company?: CompanyData;
  administratorCount?: number;
  departmentCount?: number;
  cached?: number[];
}): number[] => {
  const steps = new Set<number>((opts.cached || []).filter((n) => n >= 1 && n <= 4));
  if (opts.country || opts.company?.country || opts.company?.address?.country) steps.add(1);
  const fill = opts.company ? computeCompanyCompletion(opts.company) : 0;
  if (opts.company?.name || fill >= 20) steps.add(2);
  if ((opts.administratorCount || 0) > 0) steps.add(3);
  if ((opts.departmentCount || 0) > 0) steps.add(4);
  return Array.from(steps).sort((a, b) => a - b);
};

export const computeCompanyCompletion = (c: CompanyData): number => {
  const n = normalizeCompanyFromApi(c);
  const paths = [
    "name", "sector", "companyType", "size", "email", "phone",
    "registrationNumber", "taxId", "payeReference", "uifReference",
    "bank.bankName", "bank.accountNumber",
    "address.street", "address.city", "address.country",
    "contacts.ceo.name", "contacts.payroll.name",
    "fiscalYearStart", "fiscalYearEnd",
  ];
  const filled = paths.filter(p => {
    const v = getByPath(n, p);
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