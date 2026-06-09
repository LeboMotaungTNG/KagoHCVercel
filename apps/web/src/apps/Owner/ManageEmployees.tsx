/**
 * ManageEmployees – full-featured employee management for managers.
 * Implements all 6 tabs, conditional fields, ETI/UIF/SDL/OID, benefits matrix,
 * table mode (20+ cols), upload mode, and full queue management.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generateRandomEmployeeCode(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `EMP${year}${seq}`;
}
function validateEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validateSAIdNumber(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = parseInt(id[i], 10);
    if (i % 2 !== 0) d *= 2;
    sum += d > 9 ? d - 9 : d;
  }
  return sum % 10 === 0;
}
function extractDobFromId(id: string): string {
  if (id.length < 6) return "";
  const yy = id.substring(0, 2);
  const mm = id.substring(2, 4);
  const dd = id.substring(4, 6);
  const year = parseInt(yy) > parseInt(new Date().getFullYear().toString().substring(2)) ? `19${yy}` : `20${yy}`;
  return `${year}-${mm}-${dd}`;
}
function calcAge(dob: string): number {
  if (!dob) return 0;
  const d = new Date(dob), now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}
function calcETI(monthlyWage: number, monthsEmployed: number): number {
  if (monthlyWage > 8000 || monthsEmployed > 24) return 0;
  const factor = monthsEmployed <= 12 ? 1500 : 1000;
  if (monthlyWage <= 6000) return factor;
  return Math.max(0, factor - (monthlyWage - 6000));
}
function zaf_banks() {
  return ["ABSA","Capitec Bank","First National Bank","Investec","Nedbank","Standard Bank","African Bank","Bidvest Bank","Discovery Bank","Grindrod Bank","HBZ Bank","Mercantile Bank","Old Mutual","TymeBank","Ubank","VBS Mutual Bank"];
}

// ─── Types ───────────────────────────────────────────────────────────────────
type EmploymentType = "Full Time"|"Part Time"|"Contract"|"Intern"|"Temporary"|"Casual"|"Probation";
type IdentificationType = "RSA ID Number"|"Passport Number"|"Asylum Seeker Permit"|"Refugee Permit";
type PaymentMethod = "Bank Transfer"|"Cash"|"Cheque";
type Mode = "form"|"table"|"upload";
type FormTab = 1|2|3|4|5|6;

interface Allowance { type: string; taxable: boolean; calcMethod: "fixed"|"percent"; amount: number; }
interface Deduction { type: string; mandatory: boolean; amount: number; }

interface Employee {
  // Tab 1 – Personal
  employeeType: "Person"|"Personal Service Provider";
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
  // Tab 2 – Contact
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
  // Tab 3 – Employment
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
  // Tab 4 – Payment
  payment_method: PaymentMethod;
  payment_frequency: string; payment_day: string; payment_currency: string;
  bank_name: string; bank_branch: string; bank_branch_code: string;
  bank_account_holder: string; bank_account_number: string; bank_account_confirm: string;
  bank_account_type: string; bank_swift: string;
  annual_salary: string; monthly_salary: string;
  allowances: Allowance[];
  deductions: Deduction[];
  // Tab 5 – ETI
  eti_employed_after_2013: boolean; eti_valid_id: boolean; eti_not_connected: boolean;
  eti_not_domestic: boolean; eti_not_broker: boolean; eti_not_contractor: boolean;
  eti_hours_worked: string; eti_days_worked: string; eti_remuneration: string;
  eti_declaration_date: string; eti_signed_by: string;
  // Tab 6 – Hours
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

interface QueueItem extends Employee { tempId: string; }
type ValidationResult = { valid: boolean; errors: string[] };

// ─── Default form ─────────────────────────────────────────────────────────────
const defaultForm = (): Employee => ({
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

function getFullName(f: Employee) {
  return [f.first_name, f.surname].filter(Boolean).join(" ") || "New Employee";
}

// ─── UIF eligibility helper ──────────────────────────────────────────────────
function uifRequired(et: EmploymentType): boolean {
  return ["Full Time","Part Time","Contract","Probation","Temporary"].includes(et);
}
function benefitsForType(et: EmploymentType) {
  const map: Record<EmploymentType, { medical: boolean; retirement: boolean; leave: boolean; uif: boolean; bonus: boolean }> = {
    "Full Time":   { medical: true, retirement: true, leave: true, uif: true,  bonus: true },
    "Part Time":   { medical: true, retirement: true, leave: true, uif: true,  bonus: true },
    "Contract":    { medical: false, retirement: false, leave: false, uif: true,  bonus: false },
    "Intern":      { medical: false, retirement: false, leave: false, uif: false, bonus: false },
    "Temporary":   { medical: false, retirement: false, leave: true, uif: true,  bonus: false },
    "Casual":      { medical: false, retirement: false, leave: false, uif: false, bonus: false },
    "Probation":   { medical: true, retirement: true, leave: true, uif: true,  bonus: false },
  };
  return map[et];
}

// ─── Validation ──────────────────────────────────────────────────────────────
function validateEmployee(data: Partial<Employee>): ValidationResult {
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

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 11a2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  IdCard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Briefcase: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Dollar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Grid: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Inbox: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  RefreshCw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Sliders: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  AlertCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Lightbulb: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 3 2 5 2 5h8s2-2 2-5a6 6 0 0 0-6-6z"/></svg>,
  Flag: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Layers: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Book: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Hash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  CreditCard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Map: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Mail2: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8z"/><polyline points="15 9 18 9 18 11"/><path d="M6.5 5C4 5 2 7 2 9.5v.5"/><line x1="2" y1="14" x2="22" y2="14"/></svg>,
};

// ─── Field components ──────────────────────────────────────────────────────────
const S = {
  inputWrap: { position: "relative" as const },
  iconLeft: { position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "#98a2b3", display: "flex" as const, alignItems: "center" as const, pointerEvents: "none" as const },
  input: (hasIcon = true): React.CSSProperties => ({
    width: "100%", padding: hasIcon ? "9px 12px 9px 34px" : "9px 12px",
    border: "1px solid #d0d5dd", borderRadius: 8, fontSize: 13, outline: "none",
    background: "#fff", boxSizing: "border-box",
  }),
  select: (hasIcon = true): React.CSSProperties => ({
    width: "100%", padding: hasIcon ? "9px 12px 9px 34px" : "9px 12px",
    border: "1px solid #d0d5dd", borderRadius: 8, fontSize: 13, outline: "none",
    background: "#fff", boxSizing: "border-box", appearance: "none" as const,
  }),
  label: { display: "block" as const, marginBottom: 5, color: "#344054", fontWeight: 500 as const, fontSize: 13 },
  fieldGroup: { marginBottom: 16 },
  row2: { display: "grid" as const, gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  row3: { display: "grid" as const, gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700 as const, color: "#1d2939", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f2f4f7", display: "flex" as const, alignItems: "center" as const, gap: 8 },
  badge: (color = "#E6A79E"): React.CSSProperties => ({
    background: color + "22", color, padding: "2px 8px", borderRadius: 6,
    fontSize: 11, fontWeight: 600,
  }),
  notice: (type: "info"|"warn"|"success" = "info"): React.CSSProperties => ({
    background: type === "info" ? "#eff8ff" : type === "warn" ? "#fffaeb" : "#ecfdf3",
    border: `1px solid ${type === "info" ? "#b2d4f5" : type === "warn" ? "#fedf89" : "#abefc6"}`,
    color: type === "info" ? "#0c4a6e" : type === "warn" ? "#92400e" : "#166534",
    padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 16, display: "flex" as const, gap: 8, alignItems: "flex-start" as const,
  }),
  btn: (variant: "primary"|"secondary"|"danger"|"success" = "primary"): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
    background: variant === "primary" ? "#E6A79E" : variant === "secondary" ? "#fff" : variant === "danger" ? "#f04438" : "#12b76a",
    color: variant === "secondary" ? "#344054" : "#fff",
    ...(variant === "secondary" ? { border: "1px solid #d0d5dd" } : {}),
  }),
};

function FI({ icon, label, required, children }: { icon?: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label} {required && <span style={{ color: "#f04438" }}>*</span>}</label>
      {icon ? (
        <div style={S.inputWrap}>
          <span style={S.iconLeft}>{icon}</span>
          {children}
        </div>
      ) : children}
    </div>
  );
}

function TextInput({ icon, value, onChange, placeholder, type = "text", maxLength, readOnly }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; maxLength?: number; readOnly?: boolean;
}) {
  return (
    <div style={S.inputWrap}>
      {icon && <span style={S.iconLeft}>{icon}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} readOnly={readOnly}
        style={S.input(!!icon)} />
    </div>
  );
}

function SelectInput({ icon, value, onChange, children }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div style={S.inputWrap}>
      {icon && <span style={S.iconLeft}>{icon}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select(!!icon)}>
        {children}
      </select>
    </div>
  );
}

function Checkbox({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 8 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#E6A79E" : "#d0d5dd"}`,
        background: checked ? "#E6A79E" : "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s",
      }}>
        {checked && <Ic.Check />}
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#344054", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{sub}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: "none" }} />
    </label>
  );
}

function RadioGroup({ value, onChange, options, horizontal }: {
  value: string; onChange: (v: string) => void; options: string[]; horizontal?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", gap: 8, flexWrap: "wrap" }}>
      {options.map(o => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            border: `2px solid ${value === o ? "#E6A79E" : "#d0d5dd"}`,
            background: value === o ? "#E6A79E" : "#fff", transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {value === o && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
          </div>
          <span style={{ fontSize: 13, color: "#344054" }}>{o}</span>
          <input type="radio" checked={value === o} onChange={() => onChange(o)} style={{ display: "none" }} />
        </label>
      ))}
    </div>
  );
}

const provinces = ["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Free State","Limpopo","Mpumalanga","Northern Cape","North West"];
const departments = ["Sales","IT","HR","Finance","Operations","Marketing","Legal","Procurement","Customer Service","Research & Development"];
const countries = ["South Africa","Zimbabwe","Nigeria","Kenya","United Kingdom","United States","Germany","India","China","Other"];
const allowanceTypes = ["Housing Allowance","Transport Allowance","Cell Phone Allowance","Data Allowance","Meal Allowance","Travel Allowance","Entertainment Allowance","Uniform Allowance","Tool Allowance","Risk Allowance","Shift Allowance","Standby Allowance","Call-out Allowance","CPD Allowance"];
const deductionTypes = ["PAYE (Income Tax)","UIF","SDL","Pension/Provident Fund","Medical Aid","Group Life Insurance","Disability Insurance","Funeral Cover","Union Fees","Garnishee Order","Loan Repayment","Study Loan","Staff Purchase"];

// ─── TAB COMPONENTS ──────────────────────────────────────────────────────────

function Tab1Personal({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const age = calcAge(f.date_of_birth);
  return (
    <div>
      <div style={S.sectionTitle}><Ic.User /> Employee Type & Code</div>
      <div style={S.row2}>
        <FI label="Employee Type" required>
          <RadioGroup value={f.employeeType} onChange={v => upd("employeeType", v)}
            options={["Person","Personal Service Provider"]} horizontal />
        </FI>
        <FI label="Employee Code" required icon={<Ic.Hash />}>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={f.employee_code} onChange={e => upd("employee_code", e.target.value)}
              style={{ ...S.input(false), flex: 1 }} />
            <button type="button" onClick={() => upd("employee_code", generateRandomEmployeeCode())}
              style={{ ...S.btn("secondary"), padding: "8px 10px" }}><Ic.RefreshCw /></button>
          </div>
        </FI>
      </div>

      <div style={S.sectionTitle}><Ic.User /> Name Details</div>
      <div style={S.row3}>
        <FI label="Title"><SelectInput value={f.title} onChange={v => upd("title", v)}><option value="">—</option>{["Mr","Ms","Mrs","Dr","Prof"].map(t => <option key={t}>{t}</option>)}</SelectInput></FI>
        <FI label="Initials" icon={<Ic.Hash />}><TextInput value={f.initials} onChange={v => upd("initials", v)} placeholder="J.D." /></FI>
        <FI label="Known As" icon={<Ic.User />}><TextInput value={f.known_as} onChange={v => upd("known_as", v)} placeholder="Nickname" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="First Name" required icon={<Ic.User />}><TextInput value={f.first_name} onChange={v => upd("first_name", v)} placeholder="John" /></FI>
        <FI label="Second Name" icon={<Ic.User />}><TextInput value={f.second_name} onChange={v => upd("second_name", v)} placeholder="David" /></FI>
      </div>
      <FI label="Surname" required icon={<Ic.User />}><TextInput value={f.surname} onChange={v => upd("surname", v)} placeholder="Smith" /></FI>

      <div style={S.sectionTitle}><Ic.IdCard /> Identification</div>
      <FI label="Identification Type" required>
        <RadioGroup value={f.identification_type}
          onChange={v => upd("identification_type", v as IdentificationType)}
          options={["RSA ID Number","Passport Number","Asylum Seeker Permit","Refugee Permit"]}
          horizontal />
      </FI>

      {f.identification_type === "RSA ID Number" && (
        <FI label="RSA ID Number" required icon={<Ic.IdCard />}>
          <TextInput value={f.id_number} onChange={v => {
            upd("id_number", v);
            if (v.length >= 6) upd("date_of_birth", extractDobFromId(v));
          }} placeholder="8501015009087" maxLength={13} />
          {f.id_number && !validateSAIdNumber(f.id_number) && f.id_number.length === 13 &&
            <div style={{ color: "#f04438", fontSize: 11, marginTop: 4 }}>⚠ Invalid Luhn checksum</div>}
          {f.id_number.length === 13 && validateSAIdNumber(f.id_number) &&
            <div style={{ color: "#12b76a", fontSize: 11, marginTop: 4 }}>✓ Valid SA ID</div>}
        </FI>
      )}
      {f.identification_type === "Passport Number" && (
        <div style={S.row2}>
          <FI label="Passport Number" required icon={<Ic.Book />}><TextInput value={f.passport_number} onChange={v => upd("passport_number", v)} placeholder="M12345678" /></FI>
          <FI label="Passport Country" required icon={<Ic.Flag />}><SelectInput value={f.passport_country} onChange={v => upd("passport_country", v)}><option value="">Select</option>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
        </div>
      )}
      {f.identification_type === "Asylum Seeker Permit" && (
        <div style={S.row3}>
          <FI label="Permit Number" required icon={<Ic.IdCard />}><TextInput value={f.asylum_permit_number} onChange={v => upd("asylum_permit_number", v)} /></FI>
          <FI label="Country of Origin" required icon={<Ic.Flag />}><SelectInput value={f.asylum_country} onChange={v => upd("asylum_country", v)}><option value="">Select</option>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
          <FI label="Permit Expiry" required><TextInput type="date" value={f.asylum_expiry} onChange={v => upd("asylum_expiry", v)} /></FI>
        </div>
      )}
      {f.identification_type === "Refugee Permit" && (
        <div style={S.row3}>
          <FI label="Permit Number" required icon={<Ic.IdCard />}><TextInput value={f.refugee_permit_number} onChange={v => upd("refugee_permit_number", v)} /></FI>
          <FI label="Country of Origin" required icon={<Ic.Flag />}><SelectInput value={f.refugee_country} onChange={v => upd("refugee_country", v)}><option value="">Select</option>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
          <FI label="Permit Expiry" required><TextInput type="date" value={f.refugee_expiry} onChange={v => upd("refugee_expiry", v)} /></FI>
        </div>
      )}

      <div style={S.sectionTitle}><Ic.User /> Demographics</div>
      <div style={S.row2}>
        <FI label={`Date of Birth${age > 0 ? ` (Age: ${age})` : ""}`} required>
          <TextInput type="date" value={f.date_of_birth} onChange={v => upd("date_of_birth", v)} />
        </FI>
        <FI label="Gender"><SelectInput value={f.gender} onChange={v => upd("gender", v)}><option value="">Select</option>{["Male","Female","Other","Prefer not to say"].map(g => <option key={g}>{g}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Nationality"><SelectInput value={f.nationality} onChange={v => upd("nationality", v)}><option value="">Select</option>{["South African","Zimbabwean","Nigerian","Kenyan","British","American","Other"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
        <FI label="Marital Status"><SelectInput value={f.marital_status} onChange={v => upd("marital_status", v)}><option value="">Select</option>{["Single","Married","Divorced","Widowed","Domestic Partnership"].map(m => <option key={m}>{m}</option>)}</SelectInput></FI>
      </div>
    </div>
  );
}

function Tab2Contact({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  return (
    <div>
      <div style={S.sectionTitle}><Ic.Home /> Physical / Residential Address</div>
      <div style={S.row3}>
        <FI label="Unit Number"><TextInput value={f.phys_unit} onChange={v => upd("phys_unit", v)} placeholder="A101" /></FI>
        <FI label="Complex Name"><TextInput value={f.phys_complex} onChange={v => upd("phys_complex", v)} placeholder="Riviera Gardens" /></FI>
        <FI label="Street Number"><TextInput value={f.phys_street_no} onChange={v => upd("phys_street_no", v)} placeholder="123" /></FI>
      </div>
      <FI label="Street / Farm Name" required icon={<Ic.MapPin />}><TextInput value={f.phys_street} onChange={v => upd("phys_street", v)} placeholder="Main Street" /></FI>
      <div style={S.row2}>
        <FI label="Suburb / District"><TextInput value={f.phys_suburb} onChange={v => upd("phys_suburb", v)} placeholder="Sandton" /></FI>
        <FI label="City / Town" required icon={<Ic.Map />}><TextInput value={f.phys_city} onChange={v => upd("phys_city", v)} placeholder="Johannesburg" /></FI>
      </div>
      <div style={S.row3}>
        <FI label="Province" required icon={<Ic.Flag />}><SelectInput value={f.phys_province} onChange={v => upd("phys_province", v)}><option value="">Select</option>{provinces.map(p => <option key={p}>{p}</option>)}</SelectInput></FI>
        <FI label="Postal Code" required icon={<Ic.Hash />}><TextInput value={f.phys_postal} onChange={v => upd("phys_postal", v)} placeholder="2000" maxLength={4} /></FI>
        <FI label="Country" required icon={<Ic.Flag />}><SelectInput value={f.phys_country} onChange={v => upd("phys_country", v)}>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Residential Status"><SelectInput value={f.phys_status} onChange={v => upd("phys_status", v)}><option value="">Select</option>{["Owner","Tenant","Living with family","Other"].map(s => <option key={s}>{s}</option>)}</SelectInput></FI>
        <FI label="Years at Address"><TextInput type="number" value={f.phys_years} onChange={v => upd("phys_years", v)} placeholder="5" /></FI>
      </div>

      <div style={S.sectionTitle}><Ic.Mail /> Postal Address</div>
      <Checkbox checked={f.postal_same_as_phys} onChange={v => upd("postal_same_as_phys", v)} label="Same as physical/residential address" />
      {!f.postal_same_as_phys && (
        <>
          <div style={S.row2}>
            <FI label="Address Type"><RadioGroup value={f.postal_type} onChange={v => upd("postal_type", v)} options={["Post Box","Street Address"]} horizontal /></FI>
            {f.postal_type === "Post Box" && <FI label="Box Type"><RadioGroup value={f.postal_box_type} onChange={v => upd("postal_box_type", v)} options={["PO Box","Private Bag"]} horizontal /></FI>}
          </div>
          <div style={S.row2}>
            <FI label="Box Number"><TextInput value={f.postal_box_no} onChange={v => upd("postal_box_no", v)} /></FI>
            <FI label="Post Office Branch"><TextInput value={f.postal_branch} onChange={v => upd("postal_branch", v)} /></FI>
          </div>
          <div style={S.row3}>
            <FI label="City / Town"><TextInput value={f.postal_city} onChange={v => upd("postal_city", v)} /></FI>
            <FI label="Postal Code"><TextInput value={f.postal_postal} onChange={v => upd("postal_postal", v)} maxLength={4} /></FI>
            <FI label="Country"><SelectInput value={f.postal_country} onChange={v => upd("postal_country", v)}>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
          </div>
          <div style={S.row2}>
            <FI label="Care of (c/o)"><TextInput value={f.postal_care_of} onChange={v => upd("postal_care_of", v)} placeholder="c/o Someone" /></FI>
            <FI label="Delivery Instructions"><TextInput value={f.postal_delivery} onChange={v => upd("postal_delivery", v)} /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Valid From"><TextInput type="date" value={f.postal_valid_from} onChange={v => upd("postal_valid_from", v)} /></FI>
            <FI label="Valid To"><TextInput type="date" value={f.postal_valid_to} onChange={v => upd("postal_valid_to", v)} /></FI>
          </div>
        </>
      )}

      <div style={S.sectionTitle}><Ic.Briefcase /> Work Address</div>
      <div style={{ marginBottom: 12 }}>
        <Checkbox checked={f.work_same_as_phys} onChange={v => upd("work_same_as_phys", v)} label="Same as physical address" />
        <Checkbox checked={f.work_same_as_company} onChange={v => upd("work_same_as_company", v)} label="Same as company address" />
      </div>
      {!f.work_same_as_phys && !f.work_same_as_company && (
        <>
          <div style={S.row3}>
            <FI label="Unit"><TextInput value={f.work_unit} onChange={v => upd("work_unit", v)} /></FI>
            <FI label="Complex"><TextInput value={f.work_complex} onChange={v => upd("work_complex", v)} /></FI>
            <FI label="Building"><TextInput value={f.work_building} onChange={v => upd("work_building", v)} /></FI>
          </div>
          <FI label="Street / Farm Name" icon={<Ic.MapPin />}><TextInput value={f.work_street} onChange={v => upd("work_street", v)} /></FI>
          <div style={S.row3}>
            <FI label="City"><TextInput value={f.work_city} onChange={v => upd("work_city", v)} /></FI>
            <FI label="Province"><SelectInput value={f.work_province} onChange={v => upd("work_province", v)}><option value="">Select</option>{provinces.map(p => <option key={p}>{p}</option>)}</SelectInput></FI>
            <FI label="Postal Code"><TextInput value={f.work_postal} onChange={v => upd("work_postal", v)} maxLength={4} /></FI>
          </div>
          <FI label="Office Location Name"><TextInput value={f.work_office_name} onChange={v => upd("work_office_name", v)} placeholder="Johannesburg Head Office" /></FI>
        </>
      )}

      <div style={S.sectionTitle}><Ic.Phone /> Communication Details</div>
      <div style={S.row2}>
        <FI label="Home Number" icon={<Ic.Phone />}><TextInput value={f.home_number} onChange={v => upd("home_number", v)} placeholder="0111234567" /></FI>
        <FI label="Work Number" icon={<Ic.Phone />}><TextInput value={f.work_number} onChange={v => upd("work_number", v)} placeholder="0111234567" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Cell Number" required icon={<Ic.Phone />}><TextInput value={f.cell_number} onChange={v => upd("cell_number", v)} placeholder="0821234567" /></FI>
        <FI label="Alternative Cell" icon={<Ic.Phone />}><TextInput value={f.alt_cell} onChange={v => upd("alt_cell", v)} placeholder="0831234567" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Email Address" required icon={<Ic.Mail />}><TextInput type="email" value={f.email} onChange={v => upd("email", v)} placeholder="john@company.com" /></FI>
        <FI label="Alternative Email" icon={<Ic.Mail />}><TextInput type="email" value={f.alt_email} onChange={v => upd("alt_email", v)} placeholder="personal@gmail.com" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Fax Number" icon={<Ic.Phone />}><TextInput value={f.fax_number} onChange={v => upd("fax_number", v)} placeholder="0111234567" /></FI>
        <FI label="Preferred Contact Method"><SelectInput value={f.preferred_contact} onChange={v => upd("preferred_contact", v)}>{["Email","Phone","SMS","WhatsApp"].map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
      </div>

      <div style={S.sectionTitle}><Ic.Shield /> Emergency Contact</div>
      <div style={S.row2}>
        <FI label="Contact Person" required icon={<Ic.User />}><TextInput value={f.emergency_name} onChange={v => upd("emergency_name", v)} /></FI>
        <FI label="Relationship" required><SelectInput value={f.emergency_rel} onChange={v => upd("emergency_rel", v)}><option value="">Select</option>{["Spouse","Parent","Sibling","Friend","Other"].map(r => <option key={r}>{r}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Primary Phone" required icon={<Ic.Phone />}><TextInput value={f.emergency_phone1} onChange={v => upd("emergency_phone1", v)} /></FI>
        <FI label="Secondary Phone" icon={<Ic.Phone />}><TextInput value={f.emergency_phone2} onChange={v => upd("emergency_phone2", v)} /></FI>
      </div>
      <FI label="Emergency Email" icon={<Ic.Mail />}><TextInput type="email" value={f.emergency_email} onChange={v => upd("emergency_email", v)} /></FI>
      <FI label="Medical Conditions / Alerts" icon={<Ic.Activity />}>
        <textarea value={f.emergency_medical} onChange={e => upd("emergency_medical", e.target.value)}
          placeholder="Any medical information first responders should know..."
          style={{ ...S.input(true), height: 72, resize: "vertical" as const }} />
      </FI>
    </div>
  );
}

function Tab3Employment({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const benefits = benefitsForType(f.employment_type);
  const toggleBenefit = (b: string) => {
    const cur = f.benefits_package;
    upd("benefits_package", cur.includes(b) ? cur.filter(x => x !== b) : [...cur, b]);
  };

  return (
    <div>
      <div style={S.sectionTitle}><Ic.Briefcase /> Position & Department</div>
      <div style={S.row2}>
        <FI label="Position" required icon={<Ic.Briefcase />}>
          <TextInput value={f.position} onChange={v => upd("position", v)} placeholder="Sales Representative" />
        </FI>
        <FI label="Department" required icon={<Ic.Layers />}>
          <SelectInput value={f.department} onChange={v => upd("department", v)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </SelectInput>
        </FI>
      </div>
      <FI label="Start Date" required><TextInput type="date" value={f.start_date} onChange={v => upd("start_date", v)} /></FI>

      <div style={S.sectionTitle}><Ic.Clock /> Employment Type</div>
      <FI label="Employment Type" required>
        <RadioGroup value={f.employment_type} onChange={v => upd("employment_type", v as EmploymentType)}
          options={["Full Time","Part Time","Contract","Intern","Temporary","Casual","Probation"]} horizontal />
      </FI>

      {/* Benefits notice */}
      {f.employment_type === "Intern" && (
        <div style={S.notice("warn")}><Ic.AlertCircle />
          <div><strong>Intern Policy:</strong> Interns receive stipend only — no medical aid, retirement fund, or leave benefits. UIF is not required.</div>
        </div>
      )}
      {f.employment_type === "Casual" && (
        <div style={S.notice("warn")}><Ic.AlertCircle />
          <div><strong>Casual Policy:</strong> No standard benefits, leave, or UIF unless working regular hours above threshold.</div>
        </div>
      )}

      {/* Full Time fields */}
      {f.employment_type === "Full Time" && (
        <>
          <div style={S.sectionTitle}><Ic.CheckCircle /> Full-Time Benefits</div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Benefits Package</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Medical Aid","Retirement Fund","Disability Cover","Life Insurance","Funeral Cover"].map(b => (
                <label key={b} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  border: `1px solid ${f.benefits_package.includes(b) ? "#E6A79E" : "#d0d5dd"}`,
                  borderRadius: 20, cursor: "pointer", fontSize: 12,
                  background: f.benefits_package.includes(b) ? "#E6A79E22" : "#fff",
                  color: f.benefits_package.includes(b) ? "#c47b72" : "#344054",
                }}>
                  <input type="checkbox" checked={f.benefits_package.includes(b)}
                    onChange={() => toggleBenefit(b)} style={{ display: "none" }} />
                  {f.benefits_package.includes(b) && <Ic.Check />} {b}
                </label>
              ))}
            </div>
          </div>
          <div style={S.row2}>
            <FI label="Leave Entitlement"><SelectInput value={f.leave_entitlement} onChange={v => upd("leave_entitlement", v)}>{["15 days","20 days","25 days","30 days"].map(l => <option key={l}>{l}</option>)}</SelectInput></FI>
            <FI label="Notice Period"><SelectInput value={f.notice_period} onChange={v => upd("notice_period", v)}>{["1 month","2 months","3 months"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
          </div>
          <div style={S.row2}>
            <FI label="Sick Leave"><SelectInput value={f.sick_leave} onChange={v => upd("sick_leave", v)}>{["Standard (30 days per 36 months)","Enhanced"].map(s => <option key={s}>{s}</option>)}</SelectInput></FI>
            <FI label="Probation Period"><SelectInput value={f.probation_period} onChange={v => upd("probation_period", v)}>{["3 months","6 months","None"].map(p => <option key={p}>{p}</option>)}</SelectInput></FI>
          </div>
        </>
      )}

      {/* Part Time fields */}
      {f.employment_type === "Part Time" && (
        <>
          <div style={S.sectionTitle}><Ic.Clock /> Part-Time Details</div>
          <div style={S.row2}>
            <FI label="Min Hours/Week"><TextInput type="number" value={f.pt_min_hours} onChange={v => upd("pt_min_hours", v)} placeholder="20" /></FI>
            <FI label="Max Hours/Week"><TextInput type="number" value={f.pt_max_hours} onChange={v => upd("pt_max_hours", v)} placeholder="30" /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Benefits Eligibility"><SelectInput value={f.pt_benefits} onChange={v => upd("pt_benefits", v)}><option value="">Select</option>{["Pro-rated benefits","No benefits","Full benefits after hours threshold"].map(b => <option key={b}>{b}</option>)}</SelectInput></FI>
            <FI label="Shift Pattern"><SelectInput value={f.pt_shift} onChange={v => upd("pt_shift", v)}><option value="">Select</option>{["Fixed","Rotating","Flexible"].map(s => <option key={s}>{s}</option>)}</SelectInput></FI>
          </div>
        </>
      )}

      {/* Contract fields */}
      {f.employment_type === "Contract" && (
        <>
          <div style={S.sectionTitle}><Ic.IdCard /> Contract Details</div>
          <div style={S.row2}>
            <FI label="Contract Start Date" required><TextInput type="date" value={f.contract_start} onChange={v => upd("contract_start", v)} /></FI>
            <FI label="Contract End Date" required><TextInput type="date" value={f.contract_end} onChange={v => upd("contract_end", v)} /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Contract Renewal"><SelectInput value={f.contract_renewal} onChange={v => upd("contract_renewal", v)}>{["Automatically renew","Fixed term no renewal","Renewable by agreement"].map(r => <option key={r}>{r}</option>)}</SelectInput></FI>
            <FI label="Notice Period"><SelectInput value={f.contract_notice} onChange={v => upd("contract_notice", v)}>{["1 week","2 weeks","1 month","As per contract"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
          </div>
          <Checkbox checked={f.contract_bonus} onChange={v => upd("contract_bonus", v)} label="Completion Bonus" />
          {f.contract_bonus && <FI label="Bonus Amount (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.contract_bonus_amount} onChange={v => upd("contract_bonus_amount", v)} placeholder="10000" /></FI>}
        </>
      )}

      {/* Intern fields */}
      {f.employment_type === "Intern" && (
        <>
          <div style={S.sectionTitle}><Ic.Book /> Internship Details</div>
          <div style={S.row2}>
            <FI label="Internship Type"><SelectInput value={f.intern_type} onChange={v => upd("intern_type", v)}>{["Graduate","Student","Vocational","Learnership"].map(t => <option key={t}>{t}</option>)}</SelectInput></FI>
            <FI label="Duration"><SelectInput value={f.intern_duration} onChange={v => upd("intern_duration", v)}>{["6 months","12 months","18 months","24 months"].map(d => <option key={d}>{d}</option>)}</SelectInput></FI>
          </div>
          <div style={S.row2}>
            <FI label="Monthly Stipend (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.intern_stipend} onChange={v => upd("intern_stipend", v)} placeholder="6000" /></FI>
            <FI label="Study Release Hours/Week"><TextInput type="number" value={f.intern_study_hours} onChange={v => upd("intern_study_hours", v)} placeholder="4" /></FI>
          </div>
          <FI label="Assigned Mentor" icon={<Ic.User />}><TextInput value={f.intern_mentor} onChange={v => upd("intern_mentor", v)} placeholder="John Smith" /></FI>
          <FI label="Qualification Required"><TextInput value={f.intern_qualification} onChange={v => upd("intern_qualification", v)} placeholder="BCom Degree" /></FI>
          <Checkbox checked={f.intern_learning_signed} onChange={v => upd("intern_learning_signed", v)} label="Learning Agreement Signed" />
        </>
      )}

      {/* Temporary fields */}
      {f.employment_type === "Temporary" && (
        <>
          <div style={S.sectionTitle}><Ic.Clock /> Temporary Assignment</div>
          <div style={S.row2}>
            <FI label="Assignment Duration"><TextInput value={f.temp_duration} onChange={v => upd("temp_duration", v)} placeholder="3 months" /></FI>
            <FI label="Expected End Date"><TextInput type="date" value={f.temp_end} onChange={v => upd("temp_end", v)} /></FI>
          </div>
          <Checkbox checked={f.temp_agency} onChange={v => upd("temp_agency", v)} label="Placed through agency" />
          {f.temp_agency && <FI label="Agency Name" icon={<Ic.Briefcase />}><TextInput value={f.temp_agency_name} onChange={v => upd("temp_agency_name", v)} /></FI>}
        </>
      )}

      {/* Casual fields */}
      {f.employment_type === "Casual" && (
        <>
          <div style={S.sectionTitle}><Ic.Activity /> Casual Details</div>
          <div style={S.row2}>
            <FI label="Hourly Rate (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.casual_hourly} onChange={v => upd("casual_hourly", v)} placeholder="75" /></FI>
            <FI label="Max Hours/Week"><TextInput type="number" value={f.casual_max_hours} onChange={v => upd("casual_max_hours", v)} placeholder="20" /></FI>
          </div>
          <Checkbox checked={f.casual_oncall} onChange={v => upd("casual_oncall", v)} label="On-call requirement" />
        </>
      )}

      {/* Probation fields */}
      {f.employment_type === "Probation" && (
        <>
          <div style={S.sectionTitle}><Ic.Activity /> Probation Details</div>
          <div style={S.row3}>
            <FI label="Duration"><SelectInput value={f.probation_duration} onChange={v => upd("probation_duration", v)}>{["1 month","3 months","6 months"].map(d => <option key={d}>{d}</option>)}</SelectInput></FI>
            <FI label="Convert To"><SelectInput value={f.probation_convert} onChange={v => upd("probation_convert", v)}>{["Full Time","Part Time","Contract"].map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
            <FI label="Notice Period"><SelectInput value={f.notice_period} onChange={v => upd("notice_period", v)}>{["1 month","2 months","3 months"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
          </div>
          <FI label="Performance KPIs / Targets">
            <textarea value={f.probation_kpis} onChange={e => upd("probation_kpis", e.target.value)}
              placeholder="List key performance indicators..."
              style={{ ...S.input(false), height: 80, resize: "vertical" as const }} />
          </FI>
        </>
      )}

      {/* UIF */}
      <div style={S.sectionTitle}><Ic.Shield /> UIF (Unemployment Insurance Fund)</div>
      {!uifRequired(f.employment_type) ? (
        <div style={S.notice("info")}><Ic.Info /><div>UIF is not applicable for <strong>{f.employment_type}</strong> employees.</div></div>
      ) : (
        <>
          <Checkbox checked={f.uif_exemption} onChange={v => upd("uif_exemption", v)} label="UIF Exemption applies" />
          {!f.uif_exemption ? (
            <div style={S.row3}>
              <FI label="UIF Number" required icon={<Ic.Hash />}><TextInput value={f.uif_number} onChange={v => upd("uif_number", v)} /></FI>
              <FI label="Contribution"><SelectInput value={f.uif_contribution} onChange={v => upd("uif_contribution", v)}><option>1%</option></SelectInput></FI>
              <FI label="Declaration Date"><TextInput type="date" value={f.uif_declaration_date} onChange={v => upd("uif_declaration_date", v)} /></FI>
            </div>
          ) : (
            <FI label="Exemption Reason"><SelectInput value={f.uif_exemption_reason} onChange={v => upd("uif_exemption_reason", v)}><option value="">Select</option>{["Over 65","Expatriate","Other"].map(r => <option key={r}>{r}</option>)}</SelectInput></FI>
          )}
        </>
      )}

      {/* SDL */}
      <div style={S.sectionTitle}><Ic.Layers /> SDL (Skills Development Levy)</div>
      <div style={S.row2}>
        <FI label="SDL Number"><TextInput value={f.sdl_number} onChange={v => upd("sdl_number", v)} /></FI>
        <FI label="SDL Contribution"><SelectInput value={f.sdl_contribution} onChange={v => upd("sdl_contribution", v)}><option>1%</option><option>Exempt</option></SelectInput></FI>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Checkbox checked={f.sdl_learnership} onChange={v => upd("sdl_learnership", v)} label="Learnership Agreement" />
        <Checkbox checked={f.sdl_apprenticeship} onChange={v => upd("sdl_apprenticeship", v)} label="Apprenticeship" />
      </div>

      {/* OID */}
      <div style={S.sectionTitle}><Ic.Activity /> OID (Occupational Injuries & Diseases)</div>
      <div style={S.row2}>
        <FI label="OID Classification" icon={<Ic.Hash />}><TextInput value={f.oid_classification} onChange={v => upd("oid_classification", v)} placeholder="Occupation code" /></FI>
        <FI label="Disability %" icon={<Ic.Activity />}><TextInput type="number" value={f.oid_disability_pct} onChange={v => upd("oid_disability_pct", v)} placeholder="0" /></FI>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Checkbox checked={f.oid_exclude} onChange={v => upd("oid_exclude", v)} label="Exclude from OID report" />
        <Checkbox checked={f.oid_modified_duty} onChange={v => upd("oid_modified_duty", v)} label="Modified duty required" />
      </div>
      {f.oid_return_date && <FI label="Return to Work Date"><TextInput type="date" value={f.oid_return_date} onChange={v => upd("oid_return_date", v)} /></FI>}
    </div>
  );
}

function Tab4Payment({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const monthly = f.annual_salary ? (parseFloat(f.annual_salary) / 12).toFixed(2) : "";

  const addAllowance = () => upd("allowances", [...f.allowances, { type: allowanceTypes[0], taxable: true, calcMethod: "fixed", amount: 0 }]);
  const removeAllowance = (i: number) => upd("allowances", f.allowances.filter((_, idx) => idx !== i));
  const updateAllowance = (i: number, key: keyof Allowance, val: any) => upd("allowances", f.allowances.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  const addDeduction = () => upd("deductions", [...f.deductions, { type: deductionTypes[0], mandatory: false, amount: 0 }]);
  const removeDeduction = (i: number) => upd("deductions", f.deductions.filter((_, idx) => idx !== i));
  const updateDeduction = (i: number, key: keyof Deduction, val: any) => upd("deductions", f.deductions.map((d, idx) => idx === i ? { ...d, [key]: val } : d));

  return (
    <div>
      <div style={S.sectionTitle}><Ic.Dollar /> Payment Method</div>
      <div style={S.row2}>
        <FI label="Payment Method" required>
          <RadioGroup value={f.payment_method} onChange={v => upd("payment_method", v as PaymentMethod)}
            options={["Bank Transfer","Cash","Cheque"]} horizontal />
        </FI>
        <FI label="Payment Frequency"><SelectInput value={f.payment_frequency} onChange={v => upd("payment_frequency", v)}>{["Weekly","Bi-weekly","Semi-monthly","Monthly"].map(x => <option key={x}>{x}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Payment Day"><SelectInput value={f.payment_day} onChange={v => upd("payment_day", v)}>{["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => <option key={d}>{d}</option>)}</SelectInput></FI>
        <FI label="Currency"><SelectInput value={f.payment_currency} onChange={v => upd("payment_currency", v)}>{["ZAR","USD","GBP","EUR"].map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
      </div>

      {f.payment_method === "Bank Transfer" && (
        <>
          <div style={S.sectionTitle}><Ic.CreditCard /> Bank Details</div>
          <div style={S.row2}>
            <FI label="Bank Name" required icon={<Ic.CreditCard />}><SelectInput value={f.bank_name} onChange={v => upd("bank_name", v)}><option value="">Select Bank</option>{zaf_banks().map(b => <option key={b}>{b}</option>)}</SelectInput></FI>
            <FI label="Branch Name" icon={<Ic.MapPin />}><TextInput value={f.bank_branch} onChange={v => upd("bank_branch", v)} /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Branch Code (6 digits)" required icon={<Ic.Hash />}><TextInput value={f.bank_branch_code} onChange={v => upd("bank_branch_code", v)} maxLength={6} /></FI>
            <FI label="Account Type" required><SelectInput value={f.bank_account_type} onChange={v => upd("bank_account_type", v)}>{["Cheque","Savings","Transmission","Investment"].map(t => <option key={t}>{t}</option>)}</SelectInput></FI>
          </div>
          <FI label="Account Holder Name" required icon={<Ic.User />}><TextInput value={f.bank_account_holder} onChange={v => upd("bank_account_holder", v)} /></FI>
          <div style={S.row2}>
            <FI label="Account Number" required icon={<Ic.Hash />}><TextInput value={f.bank_account_number} onChange={v => upd("bank_account_number", v)} /></FI>
            <FI label="Confirm Account Number" required icon={<Ic.Hash />}>
              <TextInput value={f.bank_account_confirm} onChange={v => upd("bank_account_confirm", v)} />
              {f.bank_account_confirm && f.bank_account_number !== f.bank_account_confirm &&
                <div style={{ color: "#f04438", fontSize: 11, marginTop: 4 }}>⚠ Account numbers do not match</div>}
            </FI>
          </div>
          <FI label="SWIFT / BIC Code (for international transfers)" icon={<Ic.Hash />}><TextInput value={f.bank_swift} onChange={v => upd("bank_swift", v)} /></FI>
        </>
      )}

      <div style={S.sectionTitle}><Ic.Dollar /> Compensation Structure</div>
      <div style={S.row2}>
        <FI label="Annual Salary (R)" required icon={<Ic.Dollar />}>
          <TextInput type="number" value={f.annual_salary} onChange={v => {
            upd("annual_salary", v);
            upd("monthly_salary", v ? (parseFloat(v) / 12).toFixed(2) : "");
          }} placeholder="360000" />
        </FI>
        <FI label="Monthly Salary (R) — auto" icon={<Ic.Dollar />}>
          <TextInput type="number" value={f.monthly_salary} onChange={v => {
            upd("monthly_salary", v);
            upd("annual_salary", v ? (parseFloat(v) * 12).toFixed(2) : "");
          }} placeholder="30000" />
        </FI>
      </div>
      {f.annual_salary && (
        <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#667085", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[["Weekly", (parseFloat(f.annual_salary) / 52).toFixed(2)], ["Daily", (parseFloat(f.annual_salary) / 260).toFixed(2)], ["Hourly", (parseFloat(f.annual_salary) / 2080).toFixed(2)], ["Overtime (1.5x)", (parseFloat(f.annual_salary) / 2080 * 1.5).toFixed(2)]].map(([label, val]) => (
            <div key={label as string}><div style={{ fontWeight: 600, color: "#344054" }}>R {parseFloat(val as string).toLocaleString()}</div><div>{label}</div></div>
          ))}
        </div>
      )}

      <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Ic.Plus /> Allowances</span>
        <button type="button" onClick={addAllowance} style={S.btn("secondary")}><Ic.Plus /> Add</button>
      </div>
      {f.allowances.map((a, i) => (
        <div key={i} style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <FI label="Allowance Type">
              <SelectInput value={a.type} onChange={v => updateAllowance(i, "type", v)}>
                {allowanceTypes.map(t => <option key={t}>{t}</option>)}
              </SelectInput>
            </FI>
            <FI label="Amount (R)"><TextInput type="number" value={String(a.amount)} onChange={v => updateAllowance(i, "amount", parseFloat(v) || 0)} /></FI>
            <FI label="Taxable?">
              <RadioGroup value={a.taxable ? "Yes" : "No"} onChange={v => updateAllowance(i, "taxable", v === "Yes")} options={["Yes","No"]} horizontal />
            </FI>
            <button type="button" onClick={() => removeAllowance(i)} style={{ ...S.btn("danger"), padding: "8px 10px", alignSelf: "flex-end", marginBottom: 16 }}><Ic.Trash /></button>
          </div>
        </div>
      ))}
      {f.allowances.length === 0 && <div style={{ color: "#98a2b3", fontSize: 12, marginBottom: 16 }}>No allowances added yet.</div>}

      <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Ic.Trash /> Deductions</span>
        <button type="button" onClick={addDeduction} style={S.btn("secondary")}><Ic.Plus /> Add</button>
      </div>
      {f.deductions.map((d, i) => (
        <div key={i} style={{ background: "#fff8f8", border: "1px solid #fee4e2", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, alignItems: "end" }}>
            <FI label="Deduction Type">
              <SelectInput value={d.type} onChange={v => updateDeduction(i, "type", v)}>
                {deductionTypes.map(t => <option key={t}>{t}</option>)}
              </SelectInput>
            </FI>
            <FI label="Amount (R)"><TextInput type="number" value={String(d.amount)} onChange={v => updateDeduction(i, "amount", parseFloat(v) || 0)} /></FI>
            <button type="button" onClick={() => removeDeduction(i)} style={{ ...S.btn("danger"), padding: "8px 10px", alignSelf: "flex-end", marginBottom: 16 }}><Ic.Trash /></button>
          </div>
        </div>
      ))}
      {f.deductions.length === 0 && <div style={{ color: "#98a2b3", fontSize: 12, marginBottom: 16 }}>No deductions added yet.</div>}

      <div style={S.sectionTitle}><Ic.Lock /> Account Setup</div>
      <div style={S.row2}>
        <FI label="Password" icon={<Ic.Lock />}><TextInput type="password" value={f.password} onChange={v => upd("password", v)} placeholder="Min. 6 characters" /></FI>
        <FI label="Confirm Password" icon={<Ic.Lock />}><TextInput type="password" value={f.confirm_password} onChange={v => upd("confirm_password", v)} placeholder="Re-enter password" /></FI>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Checkbox checked={f.create_account} onChange={v => upd("create_account", v)} label="Create system account" sub="Employee can log in with their email and password" />
        <Checkbox checked={f.send_email} onChange={v => upd("send_email", v)} label="Send welcome email" sub="Email credentials to employee" />
      </div>
    </div>
  );
}

function Tab5ETI({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const age = calcAge(f.date_of_birth);
  const wage = parseFloat(f.eti_remuneration || f.monthly_salary || "0");
  const months = f.start_date ? Math.max(0, Math.floor((Date.now() - new Date(f.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
  const etiAmt = calcETI(wage, months);
  const ageEligible = age > 0 && age < 30;

  return (
    <div>
      <div style={S.notice("info")}><Ic.Info />
        <div><strong>ETI (Employment Tax Incentive):</strong> A government incentive to encourage youth employment. Employers can reduce PAYE by the ETI amount for qualifying employees under 30, earning under R8,000/month.</div>
      </div>

      <div style={S.sectionTitle}><Ic.CheckCircle /> Eligibility Criteria</div>
      {age > 0 && (
        <div style={S.notice(ageEligible ? "success" : "warn")}>
          {ageEligible ? <Ic.CheckCircle /> : <Ic.AlertCircle />}
          <div>Employee is <strong>{age} years old</strong>. {ageEligible ? "Age-eligible for ETI." : age < 30 ? "Partially eligible." : "Not eligible — over 29."}</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        <Checkbox checked={f.eti_employed_after_2013} onChange={v => upd("eti_employed_after_2013", v)} label="Employed after 1 October 2013" />
        <Checkbox checked={f.eti_valid_id} onChange={v => upd("eti_valid_id", v)} label="Has valid South African ID or passport" />
        <Checkbox checked={f.eti_not_connected} onChange={v => upd("eti_not_connected", v)} label="Not a connected person to employer" />
        <Checkbox checked={f.eti_not_domestic} onChange={v => upd("eti_not_domestic", v)} label="Not a domestic worker" />
        <Checkbox checked={f.eti_not_broker} onChange={v => upd("eti_not_broker", v)} label="Not a labour broker" />
        <Checkbox checked={f.eti_not_contractor} onChange={v => upd("eti_not_contractor", v)} label="Not an independent contractor" />
      </div>

      <div style={S.sectionTitle}><Ic.Activity /> Monthly ETI Declaration</div>
      <div style={S.row3}>
        <FI label="Hours Worked in Month"><TextInput type="number" value={f.eti_hours_worked} onChange={v => upd("eti_hours_worked", v)} placeholder="230 (max for full claim)" /></FI>
        <FI label="Days Worked"><TextInput type="number" value={f.eti_days_worked} onChange={v => upd("eti_days_worked", v)} placeholder="22" /></FI>
        <FI label="Remuneration Paid (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.eti_remuneration} onChange={v => upd("eti_remuneration", v)} placeholder="Monthly amount" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Declaration Date"><TextInput type="date" value={f.eti_declaration_date} onChange={v => upd("eti_declaration_date", v)} /></FI>
        <FI label="Declaration Signed By" icon={<Ic.User />}><TextInput value={f.eti_signed_by} onChange={v => upd("eti_signed_by", v)} /></FI>
      </div>

      <div style={S.sectionTitle}><Ic.Zap /> ETI Calculation Summary</div>
      <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            ["Monthly Wage", `R ${wage.toLocaleString()}`],
            ["Months Employed", months.toString()],
            ["ETI Claim Amount", `R ${etiAmt.toLocaleString()}`],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center", padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e4e7ec" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: etiAmt > 0 ? "#12b76a" : "#344054" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        {etiAmt === 0 && wage > 0 && <div style={{ marginTop: 12, color: "#667085", fontSize: 12, textAlign: "center" }}>No ETI applicable — wage exceeds R8,000 or employee has been with company 24+ months.</div>}
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 16 }}>ETI Scale Reference</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr style={{ background: "#f9fafb" }}>
          {["Period","Monthly Wage < R6,000","Monthly Wage R6,001–R8,000","Monthly Wage > R8,000"].map(h => (
            <th key={h} style={{ padding: "8px 12px", border: "1px solid #e4e7ec", textAlign: "left", color: "#344054", fontWeight: 600 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {[["First 12 months","R1,500","Sliding scale","R0"],["Next 12 months","R1,000","Sliding scale","R0"],["After 24 months","R0","R0","R0"]].map(([period, ...vals], i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
              <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec", fontWeight: 500 }}>{period}</td>
              {vals.map((v, j) => <td key={j} style={{ padding: "8px 12px", border: "1px solid #e4e7ec", color: v.startsWith("R0") ? "#98a2b3" : "#12b76a", fontWeight: v.startsWith("R0") ? 400 : 600 }}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tab6Hours({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const hpd = parseFloat(f.hours_per_day || "8");
  const dpw = parseFloat(f.days_per_week || "5");
  const hpw = hpd * dpw;
  const hpm = (hpw * 52 / 12).toFixed(1);

  const benefits = benefitsForType(f.employment_type);

  return (
    <div>
      <div style={S.sectionTitle}><Ic.Clock /> Standard Hours</div>
      <div style={S.row2}>
        <FI label="Working Hours Per Day"><TextInput type="number" value={f.hours_per_day} onChange={v => upd("hours_per_day", v)} placeholder="8" /></FI>
        <FI label="Working Days Per Week"><TextInput type="number" value={f.days_per_week} onChange={v => upd("days_per_week", v)} placeholder="5" /></FI>
      </div>
      <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
        {[["Hours/Week", hpw.toFixed(0)], ["Hours/Month", hpm], ["Annual Hours", (hpw * 52).toFixed(0)]].map(([label, val]) => (
          <div key={label}><div style={{ fontWeight: 700, fontSize: 16, color: "#1d2939" }}>{val}</div><div style={{ color: "#667085" }}>{label}</div></div>
        ))}
      </div>
      <div style={S.row2}>
        <FI label="Lunch Break (hours)"><TextInput type="number" value={f.lunch_break} onChange={v => upd("lunch_break", v)} placeholder="1" /></FI>
        <FI label="Paid Break (hours)"><TextInput type="number" value={f.paid_break} onChange={v => upd("paid_break", v)} placeholder="0" /></FI>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <Checkbox checked={f.flexi_time} onChange={v => upd("flexi_time", v)} label="Flexi-time allowed" sub="Employee can vary start/end times" />
        <Checkbox checked={f.compressed_week} onChange={v => upd("compressed_week", v)} label="Compressed work week" sub="E.g. 4 days × 10 hours" />
      </div>

      <div style={S.sectionTitle}><Ic.Activity /> Overtime Rules</div>
      <div style={S.row3}>
        <FI label="Weekday OT Rate"><SelectInput value={f.ot_weekday_rate} onChange={v => upd("ot_weekday_rate", v)}><option>1.5x</option><option>2x</option></SelectInput></FI>
        <FI label="Saturday OT Rate"><SelectInput value={f.ot_saturday_rate} onChange={v => upd("ot_saturday_rate", v)}><option>1.5x</option><option>2x</option></SelectInput></FI>
        <FI label="Max OT/Week (hrs)"><SelectInput value={f.ot_max_per_week} onChange={v => upd("ot_max_per_week", v)}><option>10</option><option>15</option><option>Unlimited</option></SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="OT Meal Allowance (R)"><TextInput type="number" value={f.ot_meal_allowance} onChange={v => upd("ot_meal_allowance", v)} placeholder="Per shift" /></FI>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <Checkbox checked={f.ot_approval} onChange={v => upd("ot_approval", v)} label="Overtime requires manager approval" />
        <Checkbox checked={f.ot_transport} onChange={v => upd("ot_transport", v)} label="Transport provided after late shift" />
      </div>

      <div style={S.sectionTitle}><Ic.CheckCircle /> Leave Entitlements Summary</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f9fafb" }}>
            {["Leave Type","Entitlement","Applicable"].map(h => (
              <th key={h} style={{ padding: "8px 12px", border: "1px solid #e4e7ec", textAlign: "left", color: "#344054", fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              ["Annual Leave", f.leave_entitlement || "15–30 days", benefits.leave],
              ["Sick Leave", "30 days per 36 months", benefits.leave],
              ["Family Responsibility", f.family_leave || "3 days/year", benefits.leave],
              ["Maternity Leave", "4 months", true],
              ["Paternity Leave", "10 days", true],
              ["Study Leave", "By arrangement", benefits.leave],
              ["Unpaid Leave", "Available on request", true],
            ].map(([type, entitlement, applicable]) => (
              <tr key={type as string}>
                <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec", fontWeight: 500 }}>{type as string}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec", color: "#667085" }}>{applicable ? entitlement as string : "Not applicable"}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec" }}>
                  <span style={{ ...S.badge(applicable ? "#12b76a" : "#98a2b3") }}>{applicable ? "✓ Yes" : "✗ No"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 20 }}><Ic.Layers /> Benefits Matrix for {f.employment_type}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          ["Medical Aid", benefits.medical],
          ["Retirement Fund", benefits.retirement],
          ["Annual Leave", benefits.leave],
          ["UIF", benefits.uif],
          ["Bonus Eligible", benefits.bonus],
          ["Training Budget", benefits.leave],
        ].map(([label, has]) => (
          <div key={label as string} style={{
            padding: "10px 14px", borderRadius: 8,
            background: has ? "#ecfdf3" : "#f9fafb",
            border: `1px solid ${has ? "#abefc6" : "#e4e7ec"}`,
            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          }}>
            <span style={{ color: has ? "#12b76a" : "#98a2b3" }}>{has ? <Ic.CheckCircle /> : <Ic.X />}</span>
            <span style={{ fontWeight: 500, color: has ? "#166534" : "#667085" }}>{label as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Queue Item Component ─────────────────────────────────────────────────────
function QueueCard({ item, index, onRemove }: { item: QueueItem; index: number; onRemove: () => void }) {
  const age = calcAge(item.date_of_birth);
  const benefits = benefitsForType(item.employment_type);
  return (
    <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #f2f4f7" }}>
        <div>
          <div style={{ fontWeight: 600, color: "#1d2939", fontSize: 13 }}>{getFullName(item)}</div>
          <div style={{ fontSize: 11, color: "#667085" }}>{item.email || "No email"}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={S.badge("#E6A79E")}>#{index + 1}</span>
          <button onClick={onRemove} style={{ ...S.btn("danger"), padding: "5px 8px" }}><Ic.Trash /></button>
        </div>
      </div>
      <div style={{ padding: "10px 14px", fontSize: 11, color: "#667085", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <div><strong>Dept:</strong> {item.department || "—"}</div>
        <div><strong>Position:</strong> {item.position || "—"}</div>
        <div><strong>Type:</strong> <span style={S.badge(item.employment_type === "Intern" ? "#f79009" : "#12b76a")}>{item.employment_type}</span></div>
        <div><strong>Start:</strong> {item.start_date || "—"}</div>
        {age > 0 && <div><strong>Age:</strong> {age} {age < 30 ? "⚡ ETI eligible" : ""}</div>}
        <div><strong>UIF:</strong> {uifRequired(item.employment_type) ? "Required" : "N/A"}</div>
        <div><strong>Medical:</strong> {benefits.medical ? "✓" : "✗"}</div>
        <div><strong>Payment:</strong> {item.payment_method}</div>
      </div>
    </div>
  );
}

// ─── Table Mode ───────────────────────────────────────────────────────────────
interface TableRowData { full_name: string; email: string; id_number: string; phone: string; passport_number: string; address_street: string; address_city: string; address_province: string; address_postal_code: string; department: string; position: string; start_date: string; employment_type: string; annual_salary: string; payment_method: string; nationality: string; gender: string; date_of_birth: string; work_location: string; identification_type: string; }

function TableModeRow({ data, index, onChange, onRemove }: { data: Partial<TableRowData>; index: number; onChange: (k: keyof TableRowData, v: string) => void; onRemove: () => void }) {
  const inp: React.CSSProperties = { padding: "12px 14px", border: "1px solid #d0d5dd", borderRadius: 8, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", minWidth: 100 };
  const sel: React.CSSProperties = { ...inp, appearance: "none" as const };
  return (
    <tr style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb", height: "auto" }}>
      <td style={{ padding: "12px 14px", textAlign: "center", color: "#667085", fontSize: 15, fontWeight: 500 }}>{index}</td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 150 }} placeholder="First name" value={data.full_name || ""} onChange={e => onChange("full_name", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 80 }} placeholder="Surname" value={data.phone || ""} onChange={e => onChange("phone", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 160 }} type="email" placeholder="email@company.com" value={data.email || ""} onChange={e => onChange("email", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}>
        <select style={{ ...sel, minWidth: 100 }} value={data.identification_type || "RSA ID Number"} onChange={e => onChange("identification_type", e.target.value)}>
          {["RSA ID Number","Passport Number","Asylum Seeker Permit","Refugee Permit"].map(t => <option key={t} value={t}>{t === "RSA ID Number" ? "RSA ID" : t === "Passport Number" ? "Passport" : t}</option>)}
        </select>
      </td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 120 }} placeholder="ID/Passport" value={data.id_number || ""} onChange={e => onChange("id_number", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 110 }} placeholder="0821234567" value={data.phone || ""} onChange={e => onChange("phone", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 120 }} placeholder="Gender" value={data.gender || ""} onChange={e => onChange("gender", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 120 }} type="date" value={data.date_of_birth || ""} onChange={e => onChange("date_of_birth", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 160 }} placeholder="Street address" value={data.address_street || ""} onChange={e => onChange("address_street", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 100 }} placeholder="City" value={data.address_city || ""} onChange={e => onChange("address_city", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}>
        <select style={{ ...sel, minWidth: 110 }} value={data.address_province || ""} onChange={e => onChange("address_province", e.target.value)}>
          <option value="">Province</option>{provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 70 }} placeholder="2000" maxLength={4} value={data.address_postal_code || ""} onChange={e => onChange("address_postal_code", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}>
        <select style={{ ...sel, minWidth: 120 }} value={data.department || ""} onChange={e => onChange("department", e.target.value)}>
          <option value="">Dept</option>{departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 130 }} placeholder="Position" value={data.position || ""} onChange={e => onChange("position", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}>
        <select style={{ ...sel, minWidth: 110 }} value={data.employment_type || ""} onChange={e => onChange("employment_type", e.target.value)}>
          <option value="">Type</option>{(["Full Time","Part Time","Contract","Intern","Temporary","Casual","Probation"] as EmploymentType[]).map(t => <option key={t}>{t}</option>)}
        </select>
      </td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 120 }} type="date" value={data.start_date || ""} onChange={e => onChange("start_date", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}><input style={{ ...inp, minWidth: 100 }} type="number" placeholder="Annual salary" value={data.annual_salary || ""} onChange={e => onChange("annual_salary", e.target.value)} /></td>
      <td style={{ padding: "12px 14px" }}>
        <select style={{ ...sel, minWidth: 100 }} value={data.payment_method || "Bank Transfer"} onChange={e => onChange("payment_method", e.target.value)}>
          {["Bank Transfer","Cash","Cheque"].map(m => <option key={m}>{m}</option>)}
        </select>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center" }}>
        <button type="button" onClick={onRemove} style={{ ...S.btn("danger"), padding: "6px 10px" }}><Ic.Trash /></button>
      </td>
    </tr>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ManageEmployeesContent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("form");
  const [activeTab, setActiveTab] = useState<FormTab>(1);
  const [form, setForm] = useState<Employee>(defaultForm());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [tableRows, setTableRows] = useState<Partial<TableRowData>[]>([]);
  const [bulkDept, setBulkDept] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  const upd = useCallback((k: keyof Employee, v: any) => setForm(prev => ({ ...prev, [k]: v })), []);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const clearForm = () => { setForm(defaultForm()); setActiveTab(1); };

  const addToQueue = (continueAdding = false) => {
    const result = validateEmployee(form);
    if (!result.valid) { alert(result.errors.join("\n")); return; }
    const item: QueueItem = {
      ...form,
      full_name: getFullName(form),
      phone: form.cell_number,
      tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setQueue(prev => [...prev, item]);
    showToast(`${getFullName(form)} added to queue!`);
    if (continueAdding) clearForm();
  };

  const processQueue = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("Session expired. Please login again."); return; }
    if (queue.length === 0) { alert("No employees in queue"); return; }
    if (!window.confirm(`Process ${queue.length} employee(s)? This will add them to the database.`)) return;

    setProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const emp of queue) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        
        // STEP 1: Create employee with onboarding
        const employeeData = {
          firstName: emp.first_name,
          lastName: emp.surname,
          email: emp.email,
          department: emp.department,
          position: emp.position,
          start_date: emp.start_date,
          annual_salary: emp.annual_salary,
          phone: emp.cell_number,
          employment_type: emp.employment_type,
          create_account: true,  // IMPORTANT: Tell backend to create user account
          password: emp.password || "Welcome123!",
          send_email: false
        };

        const empResponse = await fetch(`${API_URL}/employees/create-with-onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(employeeData),
        });

        const empData = await empResponse.json();
        
        if (empResponse.ok && empData.success) {
          successCount++;
          console.log(`✅ Created: ${emp.first_name} ${emp.surname} (${emp.email})`);
        } else {
          failCount++;
          console.error(`❌ Failed: ${emp.email} - ${empData.message}`);
        }
        
      } catch (err) {
        failCount++;
        console.error(`❌ Error creating ${emp.email}:`, err);
      }
    }

    showToast(`✓ ${successCount} employee(s) added! ${failCount > 0 ? `${failCount} failed.` : ''}`, 
      failCount > 0 ? "error" : "success");
    setQueue([]);
    clearForm();
    setProcessing(false);
  };

  const saveDraft = () => {
    if (queue.length === 0) { alert("No employees in queue"); return; }
    localStorage.setItem("employeeDraft", JSON.stringify({ queue, timestamp: new Date().toISOString() }));
    showToast("Draft saved locally!");
  };

  const tabs: { label: string; icon: React.ReactNode }[] = [
    { label: "Personal", icon: <Ic.User /> },
    { label: "Contact", icon: <Ic.Phone /> },
    { label: "Employment", icon: <Ic.Briefcase /> },
    { label: "Payment", icon: <Ic.Dollar /> },
    { label: "ETI", icon: <Ic.Zap /> },
    { label: "Hours", icon: <Ic.Clock /> },
  ];

  return (
    <div style={{ padding: 24, background: "#f9f7f5", minHeight: "100vh" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, right: 20, zIndex: 99999,
          padding: "14px 20px", background: toast.type === "success" ? "#10b981" : "#f04438",
          color: "#fff", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500,
        }}>
          {toast.type === "success" ? <Ic.CheckCircle /> : <Ic.AlertCircle />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 28px", borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.08)", border: "1px solid #e4e7ec" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1d2939", marginBottom: 3 }}>Employee Management</h1>
          <p style={{ color: "#667085", fontSize: 13 }}>Comprehensive employee management with UIF, ETI, SDL & OID compliance</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={saveDraft} style={S.btn("secondary")}><Ic.Save /> Save Draft</button>
          <button onClick={() => window.history.back()} style={S.btn("secondary")}><Ic.X /></button>
        </div>
      </div>

      {/* Mode Selector */}
      <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 16, marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.08)", border: "1px solid #e4e7ec" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {([["form","Form Mode",<Ic.Edit />],["table","Table Mode",<Ic.Grid />],["upload","Upload Document",<Ic.Upload />]] as [Mode, string, React.ReactNode][]).map(([m, label, icon]) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 14,
              border: `1.5px solid ${mode === m ? "#E6A79E" : "#e4e7ec"}`,
              borderRadius: 10, cursor: "pointer", background: mode === m ? "#E6A79E11" : "#fff",
              color: mode === m ? "#c47b72" : "#667085", fontWeight: mode === m ? 600 : 400,
              fontSize: 13, transition: "all 0.15s",
            }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Left Panel */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.08)", border: "1px solid #e4e7ec", overflow: "hidden" }}>

          {/* FORM MODE */}
          {mode === "form" && (
            <>
              {/* Tab Navigation */}
              <div style={{ display: "flex", borderBottom: "1px solid #f2f4f7", overflowX: "auto" }}>
                {tabs.map((tab, i) => {
                  const tabNum = (i + 1) as FormTab;
                  const active = activeTab === tabNum;
                  return (
                    <button key={i} type="button" onClick={() => setActiveTab(tabNum)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      padding: "14px 16px", border: "none", cursor: "pointer",
                      background: active ? "#fff" : "transparent",
                      color: active ? "#E6A79E" : "#667085",
                      borderBottom: active ? "2px solid #E6A79E" : "2px solid transparent",
                      fontWeight: active ? 600 : 400, fontSize: 11, whiteSpace: "nowrap",
                      transition: "all 0.15s", minWidth: 80,
                    }}>
                      {tab.icon}
                      <span>Tab {tabNum}: {tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "calc(100vh - 380px)" }}>
                {activeTab === 1 && <Tab1Personal f={form} upd={upd} />}
                {activeTab === 2 && <Tab2Contact f={form} upd={upd} />}
                {activeTab === 3 && <Tab3Employment f={form} upd={upd} />}
                {activeTab === 4 && <Tab4Payment f={form} upd={upd} />}
                {activeTab === 5 && <Tab5ETI f={form} upd={upd} />}
                {activeTab === 6 && <Tab6Hours f={form} upd={upd} />}
              </div>

              {/* Tab Footer */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid #f2f4f7", display: "flex", gap: 10, justifyContent: "space-between", background: "#fafafa" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {activeTab > 1 && <button type="button" onClick={() => setActiveTab(prev => (prev - 1) as FormTab)} style={S.btn("secondary")}><Ic.ChevronLeft /> Back</button>}
                  {activeTab < 6 && <button type="button" onClick={() => setActiveTab(prev => (prev + 1) as FormTab)} style={S.btn("primary")}>Next <Ic.ChevronRight /></button>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={clearForm} style={S.btn("secondary")}><Ic.X /> Clear</button>
                  <button type="button" onClick={() => addToQueue(true)} style={S.btn("primary")}><Ic.Plus /> Add & Continue</button>
                  <button type="button" onClick={() => addToQueue(false)} style={{ ...S.btn("success") }}><Ic.CheckCircle /> Add to Queue</button>
                </div>
              </div>
            </>
          )}

          {/* TABLE MODE */}
          {mode === "table" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f2f4f7" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1d2939" }}>Table Mode</h3>
                  <p style={{ fontSize: 12, color: "#667085" }}>Enter multiple employees at once — scroll right to see all {20} columns</p>
                </div>
                <button type="button" onClick={() => setTableRows(prev => [...prev, {}])} style={S.btn("primary")}><Ic.Plus /> Add Row</button>
              </div>

              <div style={{ padding: "12px 20px" }}>
                <div style={S.notice("info")}><Ic.Info />
                  <div><strong>Wide Table:</strong> 20 columns including employment type, salary, payment method. <strong>Scroll right</strong> to fill all fields.</div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div style={{ padding: "0 20px 12px" }}>
                <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#344054", marginBottom: 8 }}><Ic.Sliders /> Bulk Actions — Apply to empty cells:</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select value={bulkDept} onChange={e => setBulkDept(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                      <option value="">Department</option>{departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select value={bulkType} onChange={e => setBulkType(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                      <option value="">Employment Type</option>{(["Full Time","Part Time","Contract","Intern","Temporary","Casual","Probation"] as EmploymentType[]).map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12 }} />
                    <button type="button" onClick={() => {
                      setTableRows(prev => prev.map(row => ({
                        ...row,
                        department: row.department || bulkDept || row.department,
                        employment_type: row.employment_type || bulkType || row.employment_type,
                        start_date: row.start_date || bulkDate || row.start_date,
                      })));
                      showToast("Bulk values applied!");
                    }} style={S.btn("primary")}><Ic.Check /> Apply</button>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto", overflowY: "auto", padding: "0 20px 20px", minHeight: "650px", maxHeight: "800px", border: "1px solid #e4e7ec", borderRadius: 8, background: "#fafafa" }}>
                <table style={{ minWidth: 2800, borderCollapse: "collapse", fontSize: 15 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
                      {["#","First Name","Surname","Email","ID Type","ID/Passport","Phone","Gender","DOB","Street Address","City","Province","Postal","Department","Position","Emp. Type","Start Date","Annual Salary","Payment Method","Actions"].map(h => (
                        <th key={h} style={{ padding: "14px 12px", border: "1px solid #e4e7ec", textAlign: "left", fontSize: 14, fontWeight: 700, color: "#344054", whiteSpace: "nowrap", background: "#f9fafb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <TableModeRow key={i} data={row} index={i + 1}
                        onChange={(k, v) => setTableRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r))}
                        onRemove={() => setTableRows(prev => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                    {tableRows.length === 0 && (
                      <tr><td colSpan={20} style={{ padding: 60, textAlign: "center", color: "#98a2b3", fontSize: 15 }}>
                        <div style={{ marginBottom: 12, fontSize: 40 }}><Ic.Inbox /></div>
                        No rows yet. Click "Add Row" to start entering employees.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: "16px 20px", borderTop: "1px solid #f2f4f7", display: "flex", gap: 10 }}>
                <button type="button" onClick={() => {
                  if (tableRows.length === 0) { alert("No rows to add"); return; }
                  const items: QueueItem[] = tableRows.map(row => ({
                    ...defaultForm(),
                    full_name: row.full_name || "",
                    first_name: (row.full_name || "").split(" ")[0] || "",
                    surname: (row.full_name || "").split(" ").slice(1).join(" ") || "",
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
                    tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  }));
                  setQueue(prev => [...prev, ...items]);
                  setTableRows([]);
                  showToast(`${items.length} employee(s) added to queue!`);
                }} style={S.btn("primary")}><Ic.ArrowRight /> Add All to Queue ({tableRows.length})</button>
              </div>
            </>
          )}

          {/* UPLOAD MODE */}
          {mode === "upload" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f2f4f7" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1d2939" }}>Upload Document</h3>
                <span style={S.badge("#12b76a")}>Auto-extract data</span>
              </div>
              <div style={{ padding: 28 }}>
                <div style={S.notice("info")}><Ic.Info />
                  <div>Upload a PDF, Excel, CSV or Word document containing employee data. The system will extract employee information and add them to the queue for review.</div>
                </div>
                <div style={{
                  border: "2px dashed #d0d5dd", borderRadius: 12, padding: "60px 20px",
                  textAlign: "center", cursor: "pointer", background: "#f9fafb",
                  transition: "all 0.2s",
                }}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) document.getElementById("fileInput")?.click();
                  }}
                >
                  <div style={{ color: "#98a2b3", marginBottom: 16 }}><Ic.Upload /></div>
                  <h4 style={{ color: "#1d2939", marginBottom: 8, fontWeight: 600 }}>
                    {uploading ? "Processing Document..." : "Upload Employee Document"}
                  </h4>
                  <p style={{ color: "#667085", fontSize: 13, marginBottom: 4 }}>Drag & drop or click to upload</p>
                  <p style={{ color: "#98a2b3", fontSize: 12, marginBottom: 20 }}>Supports: PDF, Excel (.xlsx, .xls), CSV, Word (.docx)</p>
                  <input id="fileInput" type="file" accept=".pdf,.xlsx,.xls,.csv,.docx" onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setUploading(true);
                    try {
                      const token = localStorage.getItem("token");
                      const formPayload = new FormData(); formPayload.append("document", file);
                      const res = await fetch("http://localhost:3000/api/v1/onboarding/extract-document", { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formPayload });
                      const data = await res.json();
                      if (data.success && data.employees?.length) {
                        const extracted: QueueItem[] = data.employees.map((emp: any) => ({ ...defaultForm(), ...emp, employee_code: generateRandomEmployeeCode(), tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9) }));
                        setQueue(prev => [...prev, ...extracted]);
                        showToast(`${extracted.length} employee(s) extracted and added to queue!`);
                        setMode("form");
                      } else alert(data.message || "No employee data could be extracted.");
                    } catch { showToast("Extraction API not available — use Form or Table mode instead.", "error"); }
                    setUploading(false);
                  }} style={{ display: "none" }} />
                  <button type="button" onClick={e => { e.stopPropagation(); document.getElementById("fileInput")?.click(); }} style={S.btn("primary")}><Ic.Upload /> Choose File</button>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontWeight: 600, color: "#344054", fontSize: 13, marginBottom: 10 }}>Download Template</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {[["Excel Template","xlsx","#12b76a"],["CSV Template","csv","#667085"],["PDF Guide","pdf","#f04438"]].map(([label, ext, color]) => (
                      <button key={ext} type="button" style={{ padding: "10px 14px", border: `1px solid ${color}22`, borderRadius: 8, background: `${color}11`, color, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                        ↓ {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel – Queue */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.08)", border: "1px solid #e4e7ec", display: "flex", flexDirection: "column", position: "sticky", top: 20, maxHeight: "calc(100vh - 44px)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f2f4f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1d2939" }}>Onboarding Queue</h3>
            <span style={{ background: "#E6A79E", color: "#fff", padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{queue.length}</span>
          </div>

          {/* Summary card */}
          <div style={{ background: "linear-gradient(135deg, #E6A79E, #d07b71)", margin: "16px 16px 0", borderRadius: 12, padding: "14px 16px", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Ic.Users />
              <div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>Employees Ready to Process</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{queue.length}</div>
              </div>
            </div>
            {queue.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["Full Time","Part Time","Contract","Intern"] as EmploymentType[]).map(t => {
                  const count = queue.filter(q => q.employment_type === t).length;
                  return count > 0 ? <span key={t} style={{ background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{count} {t}</span> : null;
                })}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#98a2b3" }}>
                <div style={{ marginBottom: 10 }}><Ic.Inbox /></div>
                <div style={{ fontWeight: 600, color: "#344054", fontSize: 13, marginBottom: 6 }}>Queue is empty</div>
                <div style={{ fontSize: 12 }}>Add employees using the form, table, or upload mode</div>
              </div>
            ) : (
              queue.map((item, i) => (
                <QueueCard key={item.tempId} item={item} index={i} onRemove={() => setQueue(prev => prev.filter(q => q.tempId !== item.tempId))} />
              ))
            )}
          </div>

          <div style={{ padding: "14px 16px", borderTop: "1px solid #f2f4f7", display: "flex", flexDirection: "column", gap: 8 }}>
            {queue.length > 0 && (
              <button type="button" onClick={() => { if (window.confirm("Clear all employees from queue?")) setQueue([]); }} style={S.btn("secondary")}><Ic.Trash /> Clear All</button>
            )}
            <button type="button" onClick={processQueue} disabled={queue.length === 0 || processing}
              style={{ ...S.btn(queue.length === 0 ? "secondary" : "success"), opacity: queue.length === 0 ? 0.5 : 1, cursor: queue.length === 0 ? "not-allowed" : "pointer" }}>
              {processing ? "Processing..." : <><Ic.ArrowRight /> Process All ({queue.length})</>}
            </button>
          </div>
        </div>
      </div>

      {/* Footer tip */}
      <div style={{ marginTop: 20, background: "linear-gradient(135deg, #ecf3ff, #dde9ff)", padding: "14px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, color: "#3641f5", fontSize: 13, fontWeight: 500, border: "1px solid #9cb9ff" }}>
        <Ic.Lightbulb />
        <span>Complete all 6 tabs for full compliance data including UIF, ETI (for under-30 employees), SDL, and OID classification</span>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
const ManageEmployees: React.FC = () => (
  <SharedLayout title="Manage Employees">
    <ManageEmployeesContent />
  </SharedLayout>
);

export default ManageEmployees;