export interface LeaveRequest {
  _id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  submitted_at: string;
  reviewer_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export interface LeavePolicy {
  type: string;
  name?: string;
  label?: string;
  entitlementDays?: number;
  total?: number;
  color?: string;
}

export interface LeaveBalanceEntry {
  used: number;
  total: number;
  remaining: number;
}

export type LeaveBalanceMap = Record<string, LeaveBalanceEntry>;

export interface LeaveFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

export type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";
