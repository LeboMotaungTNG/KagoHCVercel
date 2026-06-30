/**
 * BCEA (Basic Conditions of Employment Act) reference data and helpers
 * for mapping the backend's leave-policy records to/from the UI's models.
 */

import React from "react";
import type { CustomLeaveType, LeaveBalance, LeaveTypeConfig } from "./types";
import { LeaveIcon } from "./leaveIcons";

/** Metadata for the five statutory leave types we expose in the UI. */
export const BCEA_META: Record<string, {
  label:    string;
  icon:     React.ReactNode;   // ready-to-render Lucide icon
  color:    string;
  bceaRule: string;
}> = {
  annual: {
    label: "Annual Leave",
    icon: <LeaveIcon name="umbrella" />,
    color: "#0EA5E9",
    bceaRule: "BCEA s20: 15 working days per 12-month cycle (5-day week), or 1.25 days per 17 days worked.",
  },
  sick: {
    label: "Sick Leave",
    icon: <LeaveIcon name="stethoscope" />,
    color: "#F59E0B",
    bceaRule: "BCEA s22: 30 working days per 36-month cycle. First 6 months: 1 day per 26 days worked. Med cert required after 2 consecutive days.",
  },
  family: {
    label: "Family Responsibility Leave",
    icon: <LeaveIcon name="heart" />,
    color: "#EC4899",
    bceaRule: "BCEA s27: 3 days per year. Applies after 4 months employment, min 4 days/week. Covers child birth/illness and death of close family.",
  },
  maternity: {
    label: "Maternity Leave",
    icon: <LeaveIcon name="baby" />,
    color: "#8B5CF6",
    bceaRule: "BCEA s25: 4 consecutive months (unpaid). Employee may not work for 6 weeks after birth unless cleared by a doctor.",
  },
  parental: {
    label: "Parental Leave",
    icon: <LeaveIcon name="users" />,
    color: "#10B981",
    bceaRule: "BCEA s25A: 10 consecutive days upon birth or adoption of a child (unpaid).",
  },
};

const STATUTORY_IDS = ["annual", "sick", "family", "maternity", "parental"];

/** Merge backend statutory leave policies into the current local config list. */
export function mapStatutoryFromApi(
  current: LeaveTypeConfig[],
  policies: any[],
): LeaveTypeConfig[] {
  return current.map((lt) => {
    const policy = policies.find((p) => p.type === lt.id);
    if (!policy) return lt;
    return {
      ...lt,
      enabled:           policy.enabled !== false,
      entitlementDays:   policy.entitlementDays ?? policy.daysPerYear ?? policy.daysTotal ?? lt.entitlementDays,
      cycleLengthMonths: (policy.cycleYears || 1) * 12,
      carryOverAllowed:  policy.carryOver || false,
      maxCarryOverDays:  policy.maxAccrual || 0,
      requiresMedCert:   policy.requiresDoctorNote || false,
    };
  });
}

/** Pull custom (non-statutory) leave types out of a leave-policy payload. */
export function mapCustomLeaveFromApi(policies: any[]): CustomLeaveType[] {
  return policies
    .filter((p) => !STATUTORY_IDS.includes(p.type) && p.enabled !== false)
    .map((p) => ({
      id:                   p._id,
      name:                 p.name,
      description:          p.description || "",
      icon:                 p.icon || "clipboard",
      color:                p.color || "#6366F1",
      entitlementDays:      p.entitlementDays ?? p.daysPerYear ?? p.daysTotal ?? 5,
      cycleLengthMonths:    (p.cycleYears || 1) * 12,
      isPaid:               p.paidPercentage === 100,
      requiresProof:        p.requiresDoctorNote || false,
      proofDescription:     "",
      carryOverAllowed:     p.carryOver || false,
      maxCarryOverDays:     p.maxAccrual || 0,
      requiresApproval:     p.requiresApproval !== false,
      minimumServiceMonths: p.minimumServiceMonths || 0,
      notes:                p.notes || "",
    }));
}

/**
 * Generate a plausible per-employee leave balance from the employee list.
 * BCEA accrual rule of thumb: 1.25 days annual, ~0.83 days sick per month.
 */
export function generateBalancesFromEmployees(employees: any[]): LeaveBalance[] {
  const now = Date.now();
  return employees.map((emp) => {
    const start = emp.startDate ? new Date(emp.startDate) : new Date();
    const monthsEmployed = Math.max(
      1,
      Math.floor((now - start.getTime()) / (1000 * 3600 * 24 * 30)),
    );

    const annualAccrued = Math.min(15, Math.floor(monthsEmployed * 1.25));
    const annualTaken   = Math.floor(Math.random() * annualAccrued);
    const sickAccrued   = Math.min(30, Math.floor(monthsEmployed * 0.83));
    const sickTaken     = Math.floor(Math.random() * 5);

    return {
      employeeId:   emp._id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      position:     emp.position || "Staff",
      department:   emp.department || "General",
      annual:    { opening: Math.max(0, annualAccrued - annualTaken), accrued: annualAccrued, taken: annualTaken, planned: 0 },
      sick:      { opening: Math.max(0, sickAccrued   - sickTaken),   accrued: sickAccrued,   taken: sickTaken,   planned: 0 },
      family:    { opening: 3, accrued: 0, taken: 0, planned: 0 },
      maternity: { opening: 0, accrued: 0, taken: 0, planned: 0 },
      parental:  { opening: 0, accrued: 0, taken: 0, planned: 0 },
    };
  });
}
