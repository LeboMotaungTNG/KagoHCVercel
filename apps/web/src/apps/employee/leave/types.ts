import type { LeaveStatus } from "../../../shared/utils/LeaveUtils";

export interface LeaveRequest {
  _id: string;
  leave_id?: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  submitted_at: string;
  reviewer_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  managerApprovedAt?: string;
  managerRejectionReason?: string;
  hrApprovedAt?: string;
  hrRejectionReason?: string;
  attachment_path?: string;
}

export interface LeavePolicy {
  type: string;
  name?: string;
  label?: string;
  entitlementDays?: number;
  total?: number;
  color?: string;
  /** Half-day requests allowed for this leave type. */
  allowHalfDays?: boolean;
}

export interface LeaveBalanceEntry {
  used: number;
  total: number;
  remaining: number;
  // Detail from the server's leave rules (all optional):
  /** "monthly" = earned month by month (credited daily); "upfront" = whole cycle; "event" = per occasion. */
  accrual?: "monthly" | "upfront" | "event";
  /** Earned so far this cycle. */
  earned?: number;
  /** Days earned per month for monthly accrual, e.g. 1.25 (added a little each day). */
  perMonth?: number;
  /** Unused days brought over from last cycle, still usable. */
  carriedOver?: number;
  carryOverExpires?: string | null;
  /** Carried-over days lost because they weren't used in time. */
  forfeited?: number;
  cycleEnd?: string;
  /** e.g. "Available after 4 months' service (from 2027-01-01)." */
  note?: string;
}

export type LeaveBalanceMap = Record<string, LeaveBalanceEntry>;

export interface LeaveFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  /** One-day request: full day, or the morning / afternoon only. */
  dayPart: "full" | "morning" | "afternoon";
  /** Longer request: "afternoon" = the first day is a half day. */
  startDayPart: "full" | "afternoon";
  /** Longer request: "morning" = the last day is a half day. */
  endDayPart: "full" | "morning";
}

export type StatusFilter = "all" | "pending" | "pending_hr" | "approved" | "rejected" | "cancelled";
