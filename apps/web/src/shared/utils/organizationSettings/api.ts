/**
 * Thin fetch wrappers for the Organization Settings page. Centralising these
 * keeps the page free of repeated `fetch + JSON.stringify + auth header`
 * boilerplate and makes it easy to swap the transport later.
 */

import { authHeader, jsonHeaders } from "./helpers";

// Resolved at module load. Kept identical to the inline literal previously used
// across the codebase so callers don't observe any URL drift.
const API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

import type {
  ApiEnvelope, CompanyData, CustomLeaveType, LeaveTypeConfig,
  PayrollRun, PayrollSettings,
} from "./types";
import {
  companyPayloadForSave,
  normalizeCompanyFromApi,
} from "../onboarding";
import { DEFAULT_COMPANY_DATA } from "./constants";

/* ── Generic helpers ──────────────────────────────────────────────── */

async function getJSON<T>(path: string): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeader() });
  return res.json();
}

async function send<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body === undefined ? authHeader() : jsonHeaders(),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  // DELETE may return an empty body; guard for that.
  try { return await res.json(); }
  catch { return { success: res.ok } as ApiEnvelope<T>; }
}

/* ── Company profile ──────────────────────────────────────────────── */

const toOrgCompany = (incoming: any): CompanyData => {
  const n = normalizeCompanyFromApi(incoming);
  const src = incoming && typeof incoming === "object" ? incoming : {};
  const srcContacts = src.contacts && typeof src.contacts === "object" ? src.contacts : {};
  const srcAddress = src.address && typeof src.address === "object" ? src.address : {};
  return {
    ...DEFAULT_COMPANY_DATA,
    name: n.name,
    tradingName: String(src.tradingName || src.trading_name || ""),
    logo: n.logoUrl || String(src.logo || ""),
    sector: n.sector,
    businessType: n.businessType || n.companyType,
    locationTrackingEnabled: Boolean(src.locationTrackingEnabled),
    numberOfEmployees: Number(src.numberOfEmployees) || DEFAULT_COMPANY_DATA.numberOfEmployees,
    email: n.email,
    phone: n.phone,
    alternativePhone: n.alternativePhone,
    website: n.website,
    description: String(src.description || ""),
    registrationNumber: n.registrationNumber,
    vatNumber: n.vatNumber,
    incomeTaxNumber: n.incomeTaxNumber || n.taxId,
    payeReference: n.payeReference,
    uifReference: n.uifReference,
    sdlReference: n.sdlReference,
    coida: n.workInjuryFundRef || String(src.coida || ""),
    provisionalTaxpayer: n.provisionalTaxpayer,
    taxComplianceStatus: n.taxComplianceStatus,
    beeLevel: String(src.beeLevel || src.bbbeeLevel || src.bee || ""),
    bank: { ...DEFAULT_COMPANY_DATA.bank, ...n.bank },
    contacts: {
      primaryContact: {
        ...DEFAULT_COMPANY_DATA.contacts.primaryContact,
        ...(srcContacts.primaryContact || {}),
        name: n.contacts.ceo.name || srcContacts.primaryContact?.name || "",
        email: n.contacts.ceo.email || srcContacts.primaryContact?.email || "",
        phone: n.contacts.ceo.phone || srcContacts.primaryContact?.phone || "",
      },
      finance: {
        ...DEFAULT_COMPANY_DATA.contacts.finance,
        ...(srcContacts.finance || {}),
        name: n.contacts.finance.name,
        email: n.contacts.finance.email,
        phone: n.contacts.finance.phone,
      },
      payroll: {
        ...DEFAULT_COMPANY_DATA.contacts.payroll,
        ...(srcContacts.payroll || {}),
        name: n.contacts.payroll.name,
        email: n.contacts.payroll.email,
        phone: n.contacts.payroll.phone,
      },
      hr: {
        ...DEFAULT_COMPANY_DATA.contacts.hr,
        ...(srcContacts.hr || {}),
      },
    },
    address: {
      ...DEFAULT_COMPANY_DATA.address,
      ...n.address,
      physicalAddress: n.address.physicalAddress || srcAddress.physicalAddress || "",
      postalAddress: n.address.postalAddress || srcAddress.postalAddress || "",
      suburb: String(srcAddress.suburb || ""),
      province: n.address.state || srcAddress.province || "",
      country: n.address.country,
    },
    language: n.language,
    timezone: n.timezone,
    dateFormat: n.dateFormat,
    currency: String(src.currency || DEFAULT_COMPANY_DATA.currency),
    fiscalYearStart: n.fiscalYearStart,
    fiscalYearEnd: n.fiscalYearEnd,
    companyStatus: n.companyStatus,
  };
};

export const loadCompanySettings = async () => {
  const json = await getJSON<Partial<CompanyData>>("/owner/company/settings");
  const raw = (json as any)?.data ?? json;
  return { ...json, data: toOrgCompany(raw) };
};

export const saveCompanySettings = (data: CompanyData) => {
  const mapped = companyPayloadForSave(data);
  return send<CompanyData>("/owner/company/settings", "PUT", {
    ...mapped,
    ...data,
    incomeTaxNumber: data.incomeTaxNumber || mapped.incomeTaxNumber,
    taxId: data.incomeTaxNumber || mapped.taxId,
    payeReference: data.payeReference || mapped.payeReference,
    uifReference: data.uifReference || mapped.uifReference,
    sdlReference: data.sdlReference || mapped.sdlReference,
    vatNumber: data.vatNumber || mapped.vatNumber,
    coida: data.coida || mapped.coida,
    beeLevel: data.beeLevel,
    taxComplianceStatus: data.taxComplianceStatus,
    provisionalTaxpayer: data.provisionalTaxpayer,
    tradingName: data.tradingName,
    description: data.description,
    currency: data.currency,
    locationTrackingEnabled: data.locationTrackingEnabled,
    contacts: {
      ...((mapped.contacts as object) || {}),
      ...data.contacts,
    },
    address: {
      ...((mapped.address as object) || {}),
      ...data.address,
    },
    bank: {
      ...((mapped.bank as object) || {}),
      ...data.bank,
    },
  });
};

/* ── Payroll ──────────────────────────────────────────────────────── */

export const loadEmployees = () =>
  getJSON<any[]>("/employees");

export const loadPayrollRuns = () =>
  getJSON<PayrollRun[]>("/payroll/runs");

export const loadPayrollSettingsApi = () =>
  getJSON<any>("/payroll/settings");

export const savePayrollSettingsApi = (settings: PayrollSettings) =>
  send<PayrollSettings>("/payroll/settings", "PUT", {
    overtimeRate:         parseFloat(settings.overtimeRate),
    weekendRate:          parseFloat(settings.weekendRate),
    holidayRate:          parseFloat(settings.holidayRate),
    uifRate:              parseFloat(settings.uifRate) / 100,
    sdlRate:              parseFloat(settings.sdlRate) / 100,
    payeEnabled:          settings.payeEnabled,
    taxYear:              settings.taxYear,
    standardHoursPerDay:  settings.standardHoursPerDay,
    standardDaysPerMonth: settings.standardDaysPerMonth,
  });

export const createPayrollRun = (period: string, frequency: string, start: string, end: string) =>
  send<any>("/payroll/runs", "POST", {
    period,
    periodStart: start,
    periodEnd:   end,
    frequency:   frequency.toLowerCase(),
  });

export const calculatePayrollRun = (runId: string, settings: PayrollSettings) =>
  send<any>(`/payroll/runs/${runId}/calculate`, "POST", {
    overtimeRate: parseFloat(settings.overtimeRate),
    weekendRate:  parseFloat(settings.weekendRate),
    holidayRate:  parseFloat(settings.holidayRate),
    uifRate:      parseFloat(settings.uifRate) / 100,
    sdlRate:      parseFloat(settings.sdlRate) / 100,
    payeEnabled:  settings.payeEnabled,
  });

/* ── Overtime ────────────────────────────────────────────────────── */

export const loadOvertimeSettings = () =>
  getJSON<any>("/attendance/overtime/settings");

export const saveOvertimeSettings = (settings: unknown) =>
  send<any>("/attendance/overtime/settings", "PUT", settings);

export const requestOvertime = (request: Pick<import("./types").OvertimeRequest, "date" | "startTime" | "endTime" | "reason">) =>
  send<any>("/attendance/overtime/request", "POST", request);

export const loadOvertimeRequests = () =>
  getJSON<any[]>("/attendance/overtime/requests");

export const approveOvertime = (id: string, notes = "") =>
  send<any>(`/attendance/overtime/requests/${id}/approve`, "PUT", { notes });

export const rejectOvertime = (id: string, notes = "") =>
  send<any>(`/attendance/overtime/requests/${id}/reject`, "PUT", { notes });

export const approvePayrollRunApi = (runId: string) =>
  send<any>(`/payroll/runs/${runId}/approve`, "POST");

/** Downloads the EMP201 PDF for a payroll run and triggers a browser save. */
export async function downloadEmp201(runId: string, periodLabel: string): Promise<void> {
  const res = await fetch(`${API_URL}/payroll/runs/${runId}/emp201`, {
    headers: authHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const blob = await res.blob();

  // The server returns JSON for errors and PDF for success.
  if (blob.type !== "application/pdf") {
    const text = await blob.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || "Unknown error");
    } catch {
      throw new Error("Unexpected response format");
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `EMP201_${periodLabel.replace(/\s/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/* ── Leave policies ───────────────────────────────────────────────── */

export const loadLeavePolicies = () =>
  getJSON<any[]>("/owner/leave-policies");

export const createLeavePolicy = (payload: Record<string, unknown>) =>
  send<any>("/owner/leave-policies", "POST", payload);

export const updateLeavePolicy = (id: string, payload: Record<string, unknown>) =>
  send<any>(`/owner/leave-policies/${id}`, "PUT", payload);

export const deleteLeavePolicy = (id: string) =>
  send<unknown>(`/owner/leave-policies/${id}`, "DELETE");

/* ── Mapping helpers (UI shape ⇄ API shape) ───────────────────────── */

/** Translate a statutory LeaveTypeConfig into the backend's payload shape. */
export const statutoryToApi = (lt: LeaveTypeConfig) => ({
  enabled:           lt.enabled,
  carryOver:         lt.carryOverAllowed,
  maxAccrual:        lt.maxCarryOverDays,
  entitlementDays:   lt.entitlementDays,
  daysPerYear:       lt.entitlementDays,
  daysTotal:         lt.entitlementDays,
  cycleYears:        Math.floor(lt.cycleLengthMonths / 12),
  requiresDoctorNote: lt.requiresMedCert,
});

/** Translate a CustomLeaveType into the backend's payload shape. */
export const customLeaveToApi = (c: CustomLeaveType) => ({
  name:               c.name,
  type:               c.id,
  daysPerYear:        c.entitlementDays,
  cycleYears:         Math.floor(c.cycleLengthMonths / 12),
  carryOver:          c.carryOverAllowed,
  maxAccrual:         c.maxCarryOverDays,
  requiresDoctorNote: c.requiresProof,
  requiresApproval:   c.requiresApproval,
  paidPercentage:     c.isPaid ? 100 : 0,
  applicableTo:       ["permanent", "contract", "probation"],
  icon:               c.icon,
  color:              c.color,
  description:        c.description,
  notes:              c.notes,
  enabled:            true,
});
