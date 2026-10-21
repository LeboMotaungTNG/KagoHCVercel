/**
 * One place for owner-facing org numbers so Dashboard, Plan, and
 * Company Profile cannot drift (headcount, plan name, monthly price, status).
 */

import { API_URL, normalizeEmployeeList, unwrapSuccessData } from "./employee";

export type OwnerPlanName = "Starter" | "Business" | "Enterprise";

export type OwnerOrgNumbers = {
  employeeCount: number;
  companyStatus: string;
  planName: OwnerPlanName;
  monthlyRand: number;
};

const PLAN_PRICE: Record<OwnerPlanName, number> = {
  Starter: 0,
  Business: 2499,
  Enterprise: 7999,
};

export function planFromHeadcount(count: number): { planName: OwnerPlanName; monthlyRand: number } {
  const planName: OwnerPlanName = count > 200 ? "Enterprise" : count > 50 ? "Business" : "Starter";
  return { planName, monthlyRand: PLAN_PRICE[planName] };
}

export function formatMonthlyPrice(rand: number): string {
  return `R${Number(rand || 0).toFixed(2)}`;
}

export function isActiveCompanyStatus(status?: string): boolean {
  return String(status || "Active").trim().toLowerCase() === "active";
}

async function authJson(path: string): Promise<unknown> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json().catch(() => null);
}

export async function loadOwnerOrgNumbers(): Promise<OwnerOrgNumbers> {
  const [empPayload, companyPayload] = await Promise.all([
    authJson("/employees"),
    authJson("/owner/company/settings"),
  ]);
  const employeeCount = normalizeEmployeeList(empPayload).length;
  const company = unwrapSuccessData(companyPayload) || {};
  const companyStatus = String(
    (company as any)?.companyStatus || (company as any)?.status || "Active",
  ).trim() || "Active";
  const plan = planFromHeadcount(employeeCount);
  return { employeeCount, companyStatus, ...plan };
}
