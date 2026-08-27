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

export const loadCompanySettings = () =>
  getJSON<Partial<CompanyData>>("/owner/company/settings");

export const saveCompanySettings = (data: CompanyData) =>
  send<CompanyData>("/owner/company/settings", "PUT", data);

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
    standardHoursPerDay:  8,
    standardDaysPerMonth: 20,
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
