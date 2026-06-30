/**
 * Shared logic for the Owner ▸ Manage Employees page.
 *
 * Everything that is not strictly React UI lives here so the page file
 * can stay focused on rendering:
 *   • Brand tokens (login-page sky-blue palette)
 *   • Reference data (provinces, departments, banks, allowance / deduction types)
 *   • Domain types (Employee, Allowance, Deduction, QueueItem, …)
 *   • Pure helpers (SA ID validation, ETI calc, age, full-name, UIF / benefits matrix)
 *   • Default form values
 *   • Validation
 *   • Backend API calls (employee creation + document extraction)
 *   • Local draft persistence
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Brand tokens — matched to the Owner Human Capital pages
 * (ManagersPage / EmployeesPage). System blue #33A6CD on bordered Cards.
 * ────────────────────────────────────────────────────────────────────── */

export const BRAND = {
  primary:      "#33A6CD",   // system blue — sibling Human Capital pages
  primaryDark:  "#1a7fa3",   // hover / modal hero gradient end
  primaryDeep:  "#0f6b8e",   // text on tinted chips
  tint50:       "#f4fafd",   // page background tint
  tint100:      "#e7f4fa",   // soft chip background
  tint200:      "#cfe7f2",   // chip border
  tint300:      "#a9d3e6",   // active outline
  ink:          "#1d2939",
  text:         "#344054",
  textMuted:    "#667085",
  textFaint:    "#98a2b3",
  border:       "#e4e7ec",
  borderSoft:   "#f2f4f7",
  cardBorder:   "#D9D9D9",   // sibling Card border (2 px, radius 10)
  surface:      "#ffffff",
  surfaceAlt:   "#f9fafb",
  danger:       "#ef4444",
  warning:      "#f59e0b",
  success:      "#10b981",
  successBg:    "#ecfdf3",
  successLine:  "#bbf7d0",
  primaryGlow:  "0 4px 10px rgba(51,166,205,0.28)",
  cardShadow:   "0px 4px 8px rgba(0,0,0,0.10)", // matches sibling Card boxShadow
} as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Reference data
 * ────────────────────────────────────────────────────────────────────── */

export const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State",
  "Limpopo", "Mpumalanga", "Northern Cape", "North West",
] as const;

export const DEPARTMENTS = [
  "Sales", "IT", "HR", "Finance", "Operations", "Marketing",
  "Legal", "Procurement", "Customer Service", "Research & Development",
] as const;

export const COUNTRIES = [
  "South Africa", "Zimbabwe", "Nigeria", "Kenya", "United Kingdom",
  "United States", "Germany", "India", "China", "Other",
] as const;

export const ALLOWANCE_TYPES = [
  "Housing Allowance", "Transport Allowance", "Cell Phone Allowance", "Data Allowance",
  "Meal Allowance", "Travel Allowance", "Entertainment Allowance", "Uniform Allowance",
  "Tool Allowance", "Risk Allowance", "Shift Allowance", "Standby Allowance",
  "Call-out Allowance", "CPD Allowance",
] as const;

export const DEDUCTION_TYPES = [
  "PAYE (Income Tax)", "UIF", "SDL", "Pension/Provident Fund", "Medical Aid",
  "Group Life Insurance", "Disability Insurance", "Funeral Cover", "Union Fees",
  "Garnishee Order", "Loan Repayment", "Study Loan", "Staff Purchase",
] as const;

export const ZAF_BANKS = [
  "ABSA", "Capitec Bank", "First National Bank", "Investec", "Nedbank",
  "Standard Bank", "African Bank", "Bidvest Bank", "Discovery Bank",
  "Grindrod Bank", "HBZ Bank", "Mercantile Bank", "Old Mutual",
  "TymeBank", "Ubank", "VBS Mutual Bank",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Domain types
 * ────────────────────────────────────────────────────────────────────── */

export type EmploymentType =
  | "Full Time" | "Part Time" | "Contract" | "Intern"
  | "Temporary" | "Casual" | "Probation";

export type IdentificationType =
  | "RSA ID Number" | "Passport Number"
  | "Asylum Seeker Permit" | "Refugee Permit";

export type PaymentMethod = "Bank Transfer" | "Cash" | "Cheque";
export type Mode = "form" | "table" | "upload";
export type FormTab = 1 | 2 | 3 | 4 | 5 | 6;

export interface Allowance {
  type: string;
  taxable: boolean;
  calcMethod: "fixed" | "percent";
  amount: number;
}

export interface Deduction {
  type: string;
  mandatory: boolean;
  amount: number;
}

export interface Employee {
  // Tab 1 — Personal
  employeeType: "Person" | "Personal Service Provider";
  employee_code: string;
  title: string;
  initials: string;
  first_name: string;
  second_name: string;
  surname: string;
  known_as: string;
  identification_type: IdentificationType;
  id_number: string;
  passport_number: string;
  passport_country: string;
  asylum_permit_number: string;
  asylum_country: string;
  asylum_expiry: string;
  refugee_permit_number: string;
  refugee_country: string;
  refugee_expiry: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;

  // Tab 2 — Contact
  phys_unit: string; phys_complex: string; phys_street_no: string; phys_street: string;
  phys_suburb: string; phys_city: string; phys_province: string; phys_postal: string;
  phys_country: string; phys_status: string; phys_years: string;
  postal_same_as_phys: boolean; postal_type: string; postal_box_type: string;
  postal_box_no: string; postal_agency: string; postal_other: string;
  postal_branch: string; postal_suburb: string; postal_city: string;
  postal_postal: string; postal_country: string; postal_care_of: string;
  postal_delivery: string; postal_valid_from: string; postal_valid_to: string;
  work_same_as_phys: boolean; work_same_as_company: boolean;
  work_unit: string; work_complex: string; work_building: string;
  work_street_no: string; work_street: string; work_suburb: string;
  work_city: string; work_province: string; work_postal: string;
  work_country: string; work_office_name: string;
  home_number: string; work_number: string; cell_number: string;
  alt_cell: string; fax_number: string;
  email: string; alt_email: string; preferred_contact: string;
  emergency_name: string; emergency_rel: string; emergency_phone1: string;
  emergency_phone2: string; emergency_email: string; emergency_address: string;
  emergency_medical: string;

  // Tab 3 — Employment
  employment_type: EmploymentType;
  position: string; department: string;
  benefits_package: string[];
  leave_entitlement: string; sick_leave: string; family_leave: string;
  maternity_leave: string; notice_period: string; probation_period: string;
  pt_min_hours: string; pt_max_hours: string; pt_benefits: string; pt_shift: string;
  contract_start: string; contract_end: string; contract_renewal: string;
  contract_notice: string; contract_bonus: boolean; contract_bonus_amount: string;
  intern_type: string; intern_stipend: string; intern_mentor: string;
  intern_duration: string; intern_study_hours: string; intern_qualification: string;
  intern_learning_signed: boolean;
  temp_duration: string; temp_end: string; temp_agency: boolean; temp_agency_name: string;
  casual_hourly: string; casual_max_hours: string; casual_oncall: boolean;
  probation_duration: string; probation_convert: string; probation_kpis: string;
  uif_required: boolean; uif_number: string; uif_contribution: string;
  uif_declaration_date: string; uif_exemption: boolean; uif_exemption_reason: string;
  sdl_number: string; sdl_contribution: string; sdl_exemption: boolean;
  sdl_learnership: boolean; sdl_apprenticeship: boolean;
  oid_classification: string; oid_exclude: boolean; oid_return_date: string;
  oid_modified_duty: boolean; oid_disability_pct: string;
  start_date: string;

  // Tab 4 — Payment
  payment_method: PaymentMethod;
  payment_frequency: string; payment_day: string; payment_currency: string;
  bank_name: string; bank_branch: string; bank_branch_code: string;
  bank_account_holder: string; bank_account_number: string; bank_account_confirm: string;
  bank_account_type: string; bank_swift: string;
  annual_salary: string; monthly_salary: string;
  allowances: Allowance[];
  deductions: Deduction[];

  // Tab 5 — ETI
  eti_employed_after_2013: boolean; eti_valid_id: boolean; eti_not_connected: boolean;
  eti_not_domestic: boolean; eti_not_broker: boolean; eti_not_contractor: boolean;
  eti_hours_worked: string; eti_days_worked: string; eti_remuneration: string;
  eti_declaration_date: string; eti_signed_by: string;

  // Tab 6 — Hours
  hours_per_day: string; days_per_week: string;
  lunch_break: string; paid_break: string;
  flexi_time: boolean; compressed_week: boolean;
  ot_weekday_rate: string; ot_saturday_rate: string;
  ot_max_per_week: string; ot_approval: boolean;
  ot_meal_allowance: string; ot_transport: boolean;

  // Misc
  password: string; confirm_password: string;
  create_account: boolean; send_email: boolean;
  full_name: string; phone: string;
}

export interface QueueItem extends Employee { tempId: string; }

export interface ValidationResult { valid: boolean; errors: string[]; }

export interface TableRowData {
  full_name: string;
  email: string;
  id_number: string;
  phone: string;
  passport_number: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  department: string;
  position: string;
  start_date: string;
  employment_type: string;
  annual_salary: string;
  payment_method: string;
  nationality: string;
  gender: string;
  date_of_birth: string;
  work_location: string;
  identification_type: string;
}

export interface BenefitMatrix {
  medical: boolean;
  retirement: boolean;
  leave: boolean;
  uif: boolean;
  bonus: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Pure helpers
 * ────────────────────────────────────────────────────────────────────── */

export function generateRandomEmployeeCode(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `EMP${year}${seq}`;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** South African ID Luhn-checksum validation. */
export function validateSAIdNumber(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = parseInt(id[i], 10);
    if (i % 2 !== 0) d *= 2;
    sum += d > 9 ? d - 9 : d;
  }
  return sum % 10 === 0;
}

export function extractDobFromId(id: string): string {
  if (id.length < 6) return "";
  const yy = id.substring(0, 2);
  const mm = id.substring(2, 4);
  const dd = id.substring(4, 6);
  const cutoff = new Date().getFullYear().toString().substring(2);
  const year = parseInt(yy, 10) > parseInt(cutoff, 10) ? `19${yy}` : `20${yy}`;
  return `${year}-${mm}-${dd}`;
}

export function calcAge(dob: string): number {
  if (!dob) return 0;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

/** South African ETI (Employment Tax Incentive) monthly amount. */
export function calcETI(monthlyWage: number, monthsEmployed: number): number {
  if (monthlyWage > 8000 || monthsEmployed > 24) return 0;
  const factor = monthsEmployed <= 12 ? 1500 : 1000;
  if (monthlyWage <= 6000) return factor;
  return Math.max(0, factor - (monthlyWage - 6000));
}

export function getFullName(f: Pick<Employee, "first_name" | "surname">): string {
  return [f.first_name, f.surname].filter(Boolean).join(" ") || "New Employee";
}

/** Employment types that must contribute to UIF. */
export function uifRequired(et: EmploymentType): boolean {
  return ["Full Time", "Part Time", "Contract", "Probation", "Temporary"].includes(et);
}

/** Default benefits matrix per employment type. */
export function benefitsForType(et: EmploymentType): BenefitMatrix {
  const map: Record<EmploymentType, BenefitMatrix> = {
    "Full Time": { medical: true,  retirement: true,  leave: true,  uif: true,  bonus: true  },
    "Part Time": { medical: true,  retirement: true,  leave: true,  uif: true,  bonus: true  },
    "Contract":  { medical: false, retirement: false, leave: false, uif: true,  bonus: false },
    "Intern":    { medical: false, retirement: false, leave: false, uif: false, bonus: false },
    "Temporary": { medical: false, retirement: false, leave: true,  uif: true,  bonus: false },
    "Casual":    { medical: false, retirement: false, leave: false, uif: false, bonus: false },
    "Probation": { medical: true,  retirement: true,  leave: true,  uif: true,  bonus: false },
  };
  return map[et];
}

/* ─────────────────────────────────────────────────────────────────────────
 * Default form
 * ────────────────────────────────────────────────────────────────────── */

export const defaultForm = (): Employee => ({
  employeeType: "Person", employee_code: generateRandomEmployeeCode(),
  title: "", initials: "", first_name: "", second_name: "", surname: "", known_as: "",
  identification_type: "RSA ID Number", id_number: "", passport_number: "", passport_country: "",
  asylum_permit_number: "", asylum_country: "", asylum_expiry: "",
  refugee_permit_number: "", refugee_country: "", refugee_expiry: "",
  date_of_birth: "", gender: "", nationality: "", marital_status: "",
  phys_unit: "", phys_complex: "", phys_street_no: "", phys_street: "",
  phys_suburb: "", phys_city: "", phys_province: "", phys_postal: "2000",
  phys_country: "South Africa", phys_status: "", phys_years: "",
  postal_same_as_phys: true, postal_type: "Post Box", postal_box_type: "PO Box",
  postal_box_no: "", postal_agency: "", postal_other: "", postal_branch: "",
  postal_suburb: "", postal_city: "", postal_postal: "", postal_country: "South Africa",
  postal_care_of: "", postal_delivery: "", postal_valid_from: "", postal_valid_to: "",
  work_same_as_phys: false, work_same_as_company: true,
  work_unit: "", work_complex: "", work_building: "", work_street_no: "", work_street: "",
  work_suburb: "", work_city: "", work_province: "", work_postal: "", work_country: "South Africa",
  work_office_name: "",
  home_number: "", work_number: "", cell_number: "", alt_cell: "", fax_number: "",
  email: "", alt_email: "", preferred_contact: "Email",
  emergency_name: "", emergency_rel: "", emergency_phone1: "", emergency_phone2: "",
  emergency_email: "", emergency_address: "", emergency_medical: "",
  employment_type: "Full Time", position: "", department: "",
  benefits_package: [], leave_entitlement: "20 days", sick_leave: "Standard",
  family_leave: "3 days per year", maternity_leave: "Standard", notice_period: "1 month",
  probation_period: "3 months",
  pt_min_hours: "", pt_max_hours: "", pt_benefits: "", pt_shift: "",
  contract_start: "", contract_end: "", contract_renewal: "Fixed term no renewal",
  contract_notice: "1 month", contract_bonus: false, contract_bonus_amount: "",
  intern_type: "Graduate", intern_stipend: "", intern_mentor: "", intern_duration: "12 months",
  intern_study_hours: "", intern_qualification: "", intern_learning_signed: false,
  temp_duration: "", temp_end: "", temp_agency: false, temp_agency_name: "",
  casual_hourly: "", casual_max_hours: "", casual_oncall: false,
  probation_duration: "3 months", probation_convert: "Full Time", probation_kpis: "",
  uif_required: true, uif_number: "", uif_contribution: "1%",
  uif_declaration_date: "", uif_exemption: false, uif_exemption_reason: "",
  sdl_number: "", sdl_contribution: "1%", sdl_exemption: false,
  sdl_learnership: false, sdl_apprenticeship: false,
  oid_classification: "", oid_exclude: false, oid_return_date: "",
  oid_modified_duty: false, oid_disability_pct: "",
  start_date: new Date().toISOString().split("T")[0],
  payment_method: "Bank Transfer", payment_frequency: "Monthly", payment_day: "Friday",
  payment_currency: "ZAR",
  bank_name: "", bank_branch: "", bank_branch_code: "", bank_account_holder: "",
  bank_account_number: "", bank_account_confirm: "", bank_account_type: "Cheque", bank_swift: "",
  annual_salary: "", monthly_salary: "",
  allowances: [], deductions: [],
  eti_employed_after_2013: true, eti_valid_id: true, eti_not_connected: true,
  eti_not_domestic: true, eti_not_broker: true, eti_not_contractor: true,
  eti_hours_worked: "", eti_days_worked: "", eti_remuneration: "",
  eti_declaration_date: "", eti_signed_by: "",
  hours_per_day: "8", days_per_week: "5", lunch_break: "1", paid_break: "0",
  flexi_time: false, compressed_week: false,
  ot_weekday_rate: "1.5x", ot_saturday_rate: "1.5x", ot_max_per_week: "10",
  ot_approval: true, ot_meal_allowance: "", ot_transport: false,
  password: "", confirm_password: "", create_account: true, send_email: true,
  full_name: "", phone: "",
});

/* ─────────────────────────────────────────────────────────────────────────
 * Validation
 * ────────────────────────────────────────────────────────────────────── */

export function validateEmployee(data: Partial<Employee>): ValidationResult {
  const errors: string[] = [];

  if (!data.first_name) errors.push("First name is required");
  if (!data.surname) errors.push("Surname is required");
  if (!data.email) errors.push("Email is required");
  else if (!validateEmail(data.email)) errors.push("Valid email is required");
  if (!data.cell_number) errors.push("Cell number is required");

  if (data.identification_type === "RSA ID Number") {
    if (!data.id_number) errors.push("RSA ID Number is required");
    else if (!validateSAIdNumber(data.id_number)) errors.push("Invalid SA ID number");
  } else if (data.identification_type === "Passport Number") {
    if (!data.passport_number) errors.push("Passport number is required");
  }

  if (!data.phys_street) errors.push("Street address is required");
  if (!data.phys_city) errors.push("City is required");
  if (!data.phys_province) errors.push("Province is required");
  if (!data.phys_postal) errors.push("Postal code is required");
  if (!data.department) errors.push("Department is required");
  if (!data.position) errors.push("Position is required");
  if (!data.start_date) errors.push("Start date is required");

  if (data.payment_method === "Bank Transfer") {
    if (!data.bank_name) errors.push("Bank name is required");
    if (!data.bank_account_number) errors.push("Account number is required");
    if (data.bank_account_number !== data.bank_account_confirm) errors.push("Account numbers do not match");
  }
  if (data.create_account && !data.password) errors.push("Password is required");
  if (data.password && data.password !== data.confirm_password) errors.push("Passwords do not match");
  if (data.password && data.password.length < 6) errors.push("Password must be at least 6 characters");

  return { valid: errors.length === 0, errors };
}

/* ─────────────────────────────────────────────────────────────────────────
 * Backend API
 * ────────────────────────────────────────────────────────────────────── */

const API_URL = (import.meta as any).env?.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const authHeaders = (token: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface CreateEmployeeResult {
  ok: boolean;
  data?: any;
  message?: string;
}

/** POST /employees/create-with-onboarding — payload mirrors backend contract. */
export async function createEmployeeWithOnboarding(
  emp: Employee,
  token: string,
): Promise<CreateEmployeeResult> {
  try {
    const res = await fetch(`${API_URL}/employees/create-with-onboarding`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        firstName: emp.first_name,
        lastName: emp.surname,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        start_date: emp.start_date,
        annual_salary: emp.annual_salary,
        phone: emp.cell_number,
        employment_type: emp.employment_type,
        create_account: true,
        password: emp.password || "Welcome123!",
        send_email: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && data?.success,
      data,
      message: data?.message,
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Couldn't connect. Please check your internet and try again." };
  }
}

/** POST /onboarding/extract-document — parses an uploaded document for employee rows. */
export async function extractEmployeeDocument(
  file: File,
  token: string,
): Promise<{ ok: boolean; employees?: Partial<Employee>[]; message?: string }> {
  try {
    const body = new FormData();
    body.append("document", file);
    const res = await fetch(`${API_URL}/onboarding/extract-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (data?.success && Array.isArray(data.employees)) {
      return { ok: true, employees: data.employees };
    }
    return { ok: false, message: data?.message || "No employee data could be extracted." };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Extraction API not available." };
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Local draft persistence
 * ────────────────────────────────────────────────────────────────────── */

const DRAFT_KEY = "employeeDraft";

export interface QueueDraft {
  queue: QueueItem[];
  timestamp: string;
}

export const saveQueueDraft = (queue: QueueItem[]): void => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ queue, timestamp: new Date().toISOString() }));
  } catch (err) { console.warn("Failed to save queue draft:", err); }
};

export const loadQueueDraft = (): QueueDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as QueueDraft) : null;
  } catch { return null; }
};

/** Build a QueueItem from a (potentially sparse) bulk-table row. */
export const queueItemFromTableRow = (row: Partial<TableRowData>): QueueItem => {
  const base = defaultForm();
  const firstName = (row.full_name || "").split(" ")[0] || "";
  const lastName = (row.full_name || "").split(" ").slice(1).join(" ") || "";
  return {
    ...base,
    full_name: row.full_name || "",
    first_name: firstName,
    surname: lastName,
    email: row.email || "",
    cell_number: row.phone || "",
    phone: row.phone || "",
    id_number: row.id_number || "",
    identification_type: (row.identification_type || "RSA ID Number") as IdentificationType,
    phys_street: row.address_street || "",
    phys_city: row.address_city || "",
    phys_province: row.address_province || "",
    phys_postal: row.address_postal_code || "",
    department: row.department || "",
    position: row.position || "",
    employment_type: (row.employment_type || "Full Time") as EmploymentType,
    start_date: row.start_date || "",
    annual_salary: row.annual_salary || "",
    monthly_salary: row.annual_salary ? (parseFloat(row.annual_salary) / 12).toFixed(2) : "",
    payment_method: (row.payment_method || "Bank Transfer") as PaymentMethod,
    password: `Temp${Math.random().toString(36).substring(2, 10)}!`,
    employee_code: generateRandomEmployeeCode(),
    tempId: Date.now().toString() + Math.random().toString(36).substring(2, 11),
  };
};

/** Tag a freshly-built Employee object with a tempId so it can sit in the queue. */
export const toQueueItem = (emp: Employee): QueueItem => ({
  ...emp,
  full_name: getFullName(emp),
  phone: emp.cell_number,
  tempId: Date.now().toString() + Math.random().toString(36).substring(2, 11),
});
