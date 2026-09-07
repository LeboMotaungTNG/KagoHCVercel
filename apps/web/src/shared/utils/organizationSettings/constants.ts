/**
 * Option lists, defaults and presets used across the Organization Settings
 * page. Keep these here so the page itself stays focused on rendering.
 */

import type {
  CompanyData, CustomLeaveType, LeaveTypeConfig, PayrollSettings, WorkSchedule,
} from "./types";

/* ── Company defaults ─────────────────────────────────────────────── */

export const DEFAULT_COMPANY_DATA: CompanyData = {
  name: "", tradingName: "", logo: "",
  sector: "", businessType: "",
  locationTrackingEnabled: false,
  numberOfEmployees: 0, email: "", phone: "",
  alternativePhone: "", website: "", description: "",
  registrationNumber: "", vatNumber: "",
  incomeTaxNumber: "", payeReference: "",
  uifReference: "", sdlReference: "",
  coida: "", provisionalTaxpayer: true, taxComplianceStatus: "Compliant", beeLevel: "",
  bank: { bankName: "", accountName: "", accountNumber: "", branchCode: "", accountType: "", swiftCode: "" },
  contacts: {
    primaryContact: { name: "", designation: "", email: "", phone: "" },
    finance:        { name: "", designation: "", email: "", phone: "" },
    payroll:        { name: "", designation: "", email: "", phone: "" },
    hr:             { name: "", designation: "", email: "", phone: "" },
  },
  address: {
    physicalAddress: "", postalAddress: "", street: "", suburb: "",
    city: "", province: "", country: "South Africa", postalCode: "",
  },
  language: "English",
  timezone: "Africa/Johannesburg",
  dateFormat: "DD/MM/YYYY",
  currency: "ZAR",
  fiscalYearStart: "",
  fiscalYearEnd: "",
  companyStatus: "Active",
};

/* ── Option lists ─────────────────────────────────────────────────── */

export const SECTORS = [
  "Human Capital & Recruitment", "Technology & Software", "Finance & Banking",
  "Healthcare & Medical", "Manufacturing", "Retail & E-commerce",
  "Education & Training", "Construction & Engineering",
  "Transportation & Logistics", "Agriculture", "Mining & Resources",
  "Legal Services", "Consulting", "Media & Communications",
  "Non-Profit / NGO", "Government / Public Sector", "Other",
];

export const BUSINESS_TYPES = [
  "Private Company (Pty Ltd)", "Public Company (Ltd)",
  "Non-Profit Organisation (NPC)", "Trust", "Close Corporation (CC)",
  "Partnership", "Sole Proprietorship", "State-Owned Entity",
  "Co-operative", "Association",
];

export const COMPANY_STATUSES = [
  "Active", "Inactive", "Suspended", "Under Administration", "In Liquidation",
];

export const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

export const COUNTRIES = [
  "South Africa", "Botswana", "Namibia", "Zimbabwe", "Zambia",
  "Mozambique", "Lesotho", "Eswatini", "Other",
];

export const TAX_COMPLIANCE_STATUSES = [
  "Compliant", "Pending", "Non-Compliant", "Under Review",
];

export const BEE_LEVELS = [
  "Level 1", "Level 2", "Level 3", "Level 4", "Level 5",
  "Level 6", "Level 7", "Level 8", "Non-Compliant",
  "Exempt Micro Enterprise (EME)", "Qualifying Small Enterprise (QSE)",
];

export const BANKS = [
  "ABSA Bank", "First National Bank (FNB)", "Standard Bank", "Nedbank",
  "Capitec Business", "Discovery Bank", "Investec", "African Bank",
  "TymeBank for Business", "Other",
];

export const ACCOUNT_TYPES = [
  "Business Cheque", "Business Current", "Business Savings", "Business Money Market",
];

export const LANGUAGES = [
  "English", "Afrikaans", "isiZulu", "isiXhosa", "Sepedi",
  "Setswana", "Sesotho", "Xitsonga", "Other",
];

export const TIMEZONES   = ["Africa/Johannesburg", "UTC"];
export const DATE_FORMATS = ["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"];
export const CURRENCIES  = [
  "ZAR – South African Rand", "USD – US Dollar",
  "EUR – Euro", "GBP – British Pound",
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Payroll defaults ─────────────────────────────────────────────── */

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  frequency: "Monthly",
  payDay: "25",
  currency: "ZAR",
  taxYear: "2026",
  overtimeRate: "1.5",
  weekendRate: "2.0",
  holidayRate: "2.5",
  uifEnabled: true,
  uifRate: "1.0",
  sdlEnabled: true,
  sdlRate: "1.0",
  payeEnabled: true,
  autoGeneratePayslips: true,
  allowSelfServicePayslips: true,
};

/* ── Leave defaults ──────────────────────────────────────────────── */

export const WORK_SCHEDULE_DAYS: Record<WorkSchedule, string[]> = {
  "5-day week (Mon–Fri)": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "6-day week (Mon–Sat)": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "Custom":               [],
};

export const ALL_WEEK_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday",
];

export const DEFAULT_LEAVE_TYPES: LeaveTypeConfig[] = [
  { id: "annual",    enabled: true, entitlementDays: 15, cycleLengthMonths: 12, requiresMedCert: false, medCertAfterDays: 0, carryOverAllowed: true,  maxCarryOverDays: 5, notes: "" },
  { id: "sick",      enabled: true, entitlementDays: 30, cycleLengthMonths: 36, requiresMedCert: true,  medCertAfterDays: 2, carryOverAllowed: false, maxCarryOverDays: 0, notes: "" },
  { id: "family",    enabled: true, entitlementDays: 3,  cycleLengthMonths: 12, requiresMedCert: false, medCertAfterDays: 0, carryOverAllowed: false, maxCarryOverDays: 0, notes: "" },
  { id: "maternity", enabled: true, entitlementDays: 88, cycleLengthMonths: 0,  requiresMedCert: false, medCertAfterDays: 0, carryOverAllowed: false, maxCarryOverDays: 0, notes: "" },
  { id: "parental",  enabled: true, entitlementDays: 10, cycleLengthMonths: 0,  requiresMedCert: false, medCertAfterDays: 0, carryOverAllowed: false, maxCarryOverDays: 0, notes: "" },
];

/** Quick-start presets shown when adding a new custom leave type.
 *  `icon` here is a LeaveIconKey, not an emoji. */
export const CUSTOM_LEAVE_PRESETS: Array<Pick<
  CustomLeaveType, "name" | "description" | "icon" | "color" | "entitlementDays" | "isPaid"
>> = [
  { name: "Study / Exam Leave",        icon: "book-open",      color: "#6366F1", description: "Leave for employees to attend exams or study-related activities.", entitlementDays: 5, isPaid: true  },
  { name: "Bereavement Leave",         icon: "bird",           color: "#64748B", description: "Leave for mourning the loss of a family member or close friend.",   entitlementDays: 3, isPaid: true  },
  { name: "Unpaid Leave",              icon: "pause",          color: "#94A3B8", description: "Leave without pay when paid leave entitlement is exhausted.",       entitlementDays: 30, isPaid: false },
  { name: "Birthday Leave",            icon: "cake",           color: "#F97316", description: "One day off on or around the employee's birthday.",                entitlementDays: 1, isPaid: true  },
  { name: "Religious / Cultural Leave", icon: "star",          color: "#A78BFA", description: "Leave for observance of religious or cultural events.",            entitlementDays: 2, isPaid: true  },
  { name: "Wellness Leave",            icon: "smile",          color: "#34D399", description: "Leave for employees to attend to their mental or physical wellbeing.", entitlementDays: 2, isPaid: true  },
];

export const LEAVE_COLOR_OPTIONS = [
  "#0EA5E9", "#6366F1", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6",
  "#F97316", "#64748B", "#94A3B8", "#EF4444", "#A78BFA", "#34D399",
];

/* ── Frequencies used by the payroll run modal ─────────────────────── */

export const PAYROLL_FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly"] as const;
