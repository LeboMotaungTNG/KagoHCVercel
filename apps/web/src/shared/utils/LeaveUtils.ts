import React from "react";
import { C } from "./employee";

// Constants
export const PAGE_SIZE = 10;
export const API_BASE = import.meta.env.VITE_API_URL || 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1';

// Types
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "sick" | "family" | "other" | "study" | "maternity" | "paternity" | "unpaid";

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

// Display Maps
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  family: "Family Responsibility",
  other: "Other",
  study: "Study Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
};

export const LEAVE_TYPE_STYLES: Record<LeaveType, React.CSSProperties> = {
  annual: { background: "#dbeafe", color: "#1d4ed8" },
  sick: { background: "#dcfce7", color: "#166534" },
  family: { background: "#fef9c3", color: "#854d0e" },
  other: { background: "#f3e8ff", color: "#6b21a5" },
  study: { background: "#e0e7ff", color: "#3730a3" },
  maternity: { background: "#fce7f3", color: "#9d174d" },
  paternity: { background: "#dbeafe", color: "#1e40af" },
  unpaid: { background: "#fef3c7", color: "#b45309" },
};

export const STATUS_STYLES: Record<LeaveStatus, React.CSSProperties> = {
  pending: { background: "#fef9c3", color: "#854d0e" },
  approved: { background: "#dcfce7", color: "#166534" },
  rejected: { background: "#fee2e2", color: "#991b1b" },
  cancelled: { background: "#f3f4f6", color: "#374151" },
};

export const AVATAR_COLORS = [
  C.primary, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

// Utility Functions
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
      if (!l.full_name.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });
}

export function paginateLeaves(leaves: LeaveRequest[], page: number, pageSize: number): { data: LeaveRequest[]; totalPages: number } {
  const totalPages = Math.ceil(leaves.length / pageSize);
  const start = (page - 1) * pageSize;
  return { data: leaves.slice(start, start + pageSize), totalPages };
}

export function computeStats(leaves: LeaveRequest[]): Stats {
  return {
    pending: leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    total: leaves.length,
  };
}

export function hasActiveFilters(filters: Filters): boolean {
  return Object.values(filters).some(v => v !== "");
}
