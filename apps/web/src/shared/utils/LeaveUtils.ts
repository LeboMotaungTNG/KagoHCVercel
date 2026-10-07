import React from "react";
import { C } from "./employee";

export const PAGE_SIZE = 10;
export const API_BASE = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

export type LeaveStatus =
  | "pending"
  | "pending_manager"
  | "pending_hr"
  | "approved"
  | "rejected"
  | "cancelled";

export type LeaveType = string;

export interface LeaveRequest {
  _id: string;
  leave_id: number;
  full_name: string;
  employee_code: string;
  department: string;
  position: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  submitted_at: string;
  reviewer_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  attachment_path?: string;
  managerApprovedBy?: string;
  managerApprovedAt?: string;
  managerRejectionReason?: string;
  hrApprovedBy?: string;
  hrApprovedAt?: string;
  hrRejectionReason?: string;
}

export interface Filters {
  status: LeaveStatus | "";
  leave_type: LeaveType | "";
  start_date: string;
  end_date: string;
  search: string;
}

export interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  family: "Family Responsibility",
  other: "Other",
  study: "Study Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  parental: "Parental Leave",
  unpaid: "Unpaid Leave",
};

export const LEAVE_TYPE_STYLES: Record<string, React.CSSProperties> = {
  annual: { background: "#dbeafe", color: "#1d4ed8" },
  sick: { background: "#dcfce7", color: "#166534" },
  family: { background: "#fef9c3", color: "#854d0e" },
  other: { background: "#f3e8ff", color: "#6b21a5" },
  study: { background: "#e0e7ff", color: "#3730a3" },
  maternity: { background: "#fce7f3", color: "#9d174d" },
  paternity: { background: "#dbeafe", color: "#1e40af" },
  parental: { background: "#d1fae5", color: "#047857" },
  unpaid: { background: "#fef3c7", color: "#b45309" },
};

export const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Awaiting manager",
  pending_manager: "Awaiting manager",
  pending_hr: "Awaiting HR",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_STYLES: Record<LeaveStatus, React.CSSProperties> = {
  pending: { background: "#fef9c3", color: "#854d0e" },
  pending_manager: { background: "#fef9c3", color: "#854d0e" },
  pending_hr: { background: "#dbeafe", color: "#1d4ed8" },
  approved: { background: "#dcfce7", color: "#166534" },
  rejected: { background: "#fee2e2", color: "#991b1b" },
  cancelled: { background: "#f3f4f6", color: "#374151" },
};

export const AVATAR_COLORS = [
  C.primary, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export type LeaveReviewStage = "manager" | "hr";

export function normalizeLeaveStatus(value: unknown): LeaveStatus {
  const status = String(value || "pending_manager");
  if (
    status === "pending" ||
    status === "pending_manager" ||
    status === "pending_hr" ||
    status === "approved" ||
    status === "rejected" ||
    status === "cancelled"
  ) return status;
  return "pending_manager";
}

export function isManagerReviewStatus(status: string): boolean {
  return status === "pending" || status === "pending_manager";
}

export function isHrReviewStatus(status: string): boolean {
  return status === "pending_hr";
}

export function isInProgressLeave(status: string): boolean {
  return isManagerReviewStatus(status) || isHrReviewStatus(status);
}

export function leaveReviewStageForRole(role?: string): LeaveReviewStage {
  const value = String(role || "").trim().toLowerCase().replace(/[ -]+/g, "_");
  if (["owner", "admin", "hr", "hr_manager"].includes(value)) return "hr";
  return "manager";
}

export function canReviewLeave(status: string, stage: LeaveReviewStage): boolean {
  return stage === "hr" ? isHrReviewStatus(status) : isManagerReviewStatus(status);
}

export function formatDate(d: string): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: string): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function filterLeaves(leaves: LeaveRequest[], filters: Filters): LeaveRequest[] {
  return leaves.filter(l => {
    if (filters.status && l.status !== filters.status) return false;
    if (filters.leave_type && l.leave_type !== filters.leave_type) return false;
    if (filters.start_date && l.start_date < filters.start_date) return false;
    if (filters.end_date && l.end_date > filters.end_date) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!(l.full_name || "").toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });
}

export function paginateLeaves(leaves: LeaveRequest[], page: number, pageSize: number): { data: LeaveRequest[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(leaves.length / pageSize));
  const start = (page - 1) * pageSize;
  return { data: leaves.slice(start, start + pageSize), totalPages };
}

export function computeStats(leaves: LeaveRequest[]): Stats {
  return {
    pending: leaves.filter(l => isInProgressLeave(l.status)).length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    total: leaves.length,
  };
}

export function hasActiveFilters(filters: Filters): boolean {
  return Object.values(filters).some(v => v !== "");
}

export function leaveApiMessage(data: any, fallback: string): string {
  return data?.message || data?.error?.message || data?.error || fallback;
}

export function unwrapLeaveRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function mapLeaveRequest(row: any): LeaveRequest {
  return {
    _id: row._id || row.id || "",
    leave_id: row.leave_id,
    full_name: row.full_name || row.fullName || row.employee_name || "",
    employee_code: row.employee_code || row.employeeCode || "",
    department: row.department || "",
    position: row.position || "",
    leave_type: row.leave_type || row.leaveType || row.type || "annual",
    start_date: row.start_date || row.startDate || "",
    end_date: row.end_date || row.endDate || "",
    total_days: row.total_days || row.totalDays || row.daysRequested || 1,
    reason: row.reason || "",
    status: normalizeLeaveStatus(row.status),
    submitted_at: row.submitted_at || row.createdAt || new Date().toISOString(),
    reviewer_name: row.reviewer_name,
    reviewed_at: row.reviewed_at,
    rejection_reason: row.rejection_reason || row.managerRejectionReason || row.hrRejectionReason,
    attachment_path: row.attachment_path || row.attachmentPath,
    managerApprovedBy: row.managerApprovedBy,
    managerApprovedAt: row.managerApprovedAt,
    managerRejectionReason: row.managerRejectionReason,
    hrApprovedBy: row.hrApprovedBy,
    hrApprovedAt: row.hrApprovedAt,
    hrRejectionReason: row.hrRejectionReason,
  };
}
