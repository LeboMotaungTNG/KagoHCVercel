/**
 * Type definitions for the Owner → Organization Settings page.
 *
 * Three concerns live here: the company profile (legal/banking/contacts),
 * payroll configuration & runs, and leave policy (BCEA statutory + custom).
 */

/* ── Company profile ──────────────────────────────────────────────── */

export interface CompanyAddress {
  physicalAddress: string;
  postalAddress:   string;
  street:          string;
  suburb:          string;
  city:            string;
  province:        string;
  country:         string;
  postalCode:      string;
}

export interface CompanyBank {
  bankName:      string;
  accountName:   string;
  accountNumber: string;
  branchCode:    string;
  accountType:   string;
  swiftCode:     string;
}

export interface CompanyContactPerson {
  name:        string;
  designation: string;
  email:       string;
  phone:       string;
}

export interface CompanyContacts {
  primaryContact: CompanyContactPerson;
  finance:        CompanyContactPerson;
  payroll:        CompanyContactPerson;
  hr:             CompanyContactPerson;
}

export interface CompanyData {
  name:                 string;
  tradingName:          string;
  logo:                 string;
  sector:               string;
  businessType:         string;
  locationTrackingEnabled: boolean;
  numberOfEmployees:    number;
  email:                string;
  phone:                string;
  alternativePhone:     string;
  website:              string;
  description:          string;
  registrationNumber:   string;
  vatNumber:            string;
  incomeTaxNumber:      string;
  payeReference:        string;
  uifReference:         string;
  sdlReference:         string;
  coida:                string;
  provisionalTaxpayer:  boolean;
  taxComplianceStatus:  string;
  beeLevel:             string;
  bank:                 CompanyBank;
  contacts:             CompanyContacts;
  address:              CompanyAddress;
  language:             string;
  timezone:             string;
  dateFormat:           string;
  currency:             string;
  fiscalYearStart:      string;
  fiscalYearEnd:        string;
  companyStatus:        string;
}

/* ── Form field renderer ──────────────────────────────────────────── */

export type CoFieldType =
  | "text" | "email" | "tel" | "number"
  | "date" | "select" | "textarea" | "toggle" | "url";

export interface CoFieldDef {
  label:        string;
  key:          string;
  type?:        CoFieldType;
  options?:     string[];
  placeholder?: string;
  hint?:        string;
  required?:    boolean;
  span?:        1 | 2;
}

/* ── Payroll ──────────────────────────────────────────────────────── */

export interface PayrollSettings {
  frequency:                string;
  payDay:                   string;
  currency:                 string;
  taxYear:                  string;
  overtimeRate:             string;
  weekendRate:              string;
  holidayRate:              string;
  uifEnabled:               boolean;
  uifRate:                  string;
  sdlEnabled:               boolean;
  sdlRate:                  string;
  payeEnabled:              boolean;
  autoGeneratePayslips:     boolean;
  allowSelfServicePayslips: boolean;
}

export interface PayrollRun {
  id:                string;
  _id?:              string;
  period:            string;
  periodStart:       string;
  periodEnd:         string;
  frequency:         "Weekly" | "Bi-Weekly" | "Monthly" | string;
  status:            "draft" | "attendance_imported" | "calculated" | "approved" | "reports_generated" | "submitted";
  employeeCount:     number;
  totalGross:        number;
  totalDeductions:   number;
  totalNetPay:       number;
  approvedBy?:       string;
  approvedAt?:       string;
  submittedAt?:      string;
  submissionReceipt?: string;
  createdAt:         string;
  updatedAt:         string;
}

export interface PayrollCalculation {
  id:            string;
  payrollRunId:  string;
  employeeId:    string;
  name?:         string;
  position?:     string;
  basicSalary:   number;
  allowances:    { housing: number; transport: number; medical: number; other: number; total: number; };
  overtime:      { hours: number; rate: number; amount: number; };
  commissions:   number;
  grossEarnings: number;
  deductions:    { paye: number; uif: number; sdl: number; pension: number; medicalAid: number; other: number; total: number; };
  netPay:        number;
  employerCosts: { uif: number; sdl: number; skillsLevy: number; total: number; };
}

export interface PayrollEmployee {
  id:            string;
  employeeCode:  string;
  name:          string;
  department:    string;
  position:      string;
  basicSalary:   number;
  allowances:    { housing: number; transport: number; medical: number; other: number; };
  bankAccount:   string;
  taxReference:  string;
  uifReference:  string;
  joinDate:      string;
  status:        "active" | "on_leave" | "terminated";
}

/* ── Leave ────────────────────────────────────────────────────────── */

export type WorkSchedule =
  | "5-day week (Mon–Fri)"
  | "6-day week (Mon–Sat)"
  | "Custom";

export type LeaveBasis = "Working Days" | "Calendar Days";

/** A BCEA statutory leave type, configured by the company. */
export interface LeaveTypeConfig {
  id:                 string;
  enabled:            boolean;
  entitlementDays:    number;
  cycleLengthMonths:  number;
  requiresMedCert:    boolean;
  medCertAfterDays:   number;
  carryOverAllowed:   boolean;
  maxCarryOverDays:   number;
  notes:              string;
}

/** A company-defined custom leave type (study, birthday, wellness, etc.). */
export interface CustomLeaveType {
  id:                   string;
  name:                 string;
  description:          string;
  icon:                 string;   // Either a LeaveIconKey or a legacy emoji from older data.
  color:                string;
  entitlementDays:      number;
  cycleLengthMonths:    number;   // 0 = once-off / per event
  isPaid:               boolean;
  requiresProof:        boolean;
  proofDescription:     string;
  carryOverAllowed:     boolean;
  maxCarryOverDays:     number;
  requiresApproval:     boolean;
  minimumServiceMonths: number;
  notes:                string;
}

export interface LeaveBucket {
  opening: number;
  accrued: number;
  taken:   number;
  planned: number;
}

export interface LeaveBalance {
  employeeId:   string;
  employeeName: string;
  position:     string;
  department:   string;
  annual:       LeaveBucket;
  sick:         LeaveBucket;
  family:       LeaveBucket;
  maternity:    LeaveBucket;
  parental:     LeaveBucket;
}

/* ── API envelopes ────────────────────────────────────────────────── */

export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  data?:    T;
  message?: string;
  [k: string]: unknown;
}
