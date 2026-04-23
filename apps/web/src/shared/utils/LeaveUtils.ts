

import React from "react";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const PAGE_SIZE = 10;

export const API_BASE = "http://localhost:4000/api/v1/leave";

// â”€â”€â”€ Domain Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType   = "annual" | "sick" | "maternity" | "paternity" | "study" | "unpaid" | "other";
export type AlertType   = "success" | "error" | "info";

export interface LeaveRequest {
  _id?:              string;   // MongoDB ObjectId
  leave_id:          number;
  full_name:         string;
  employee_code:     string;
  department:        string;
  position:          string;
  leave_type:        LeaveType;
  start_date:        string;   // "YYYY-MM-DD"
  end_date:          string;   // "YYYY-MM-DD"
  total_days:        number;
  reason:            string;
  status:            LeaveStatus;
  submitted_at:      string;   // ISO datetime
  reviewed_by?:      number;
  reviewer_name?:    string;
  reviewed_at?:      string;   // ISO datetime
  rejection_reason?: string;
  attachment_path?:  string;
}

export interface Filters {
  status:     LeaveStatus | "";
  leave_type: LeaveType   | "";
  start_date: string;
  end_date:   string;
  search:     string;
}

export interface Stats {
  pending:  number;
  approved: number;
  rejected: number;
  total:    number;
}

export interface PaginatedResult<T> {
  data:        T[];
  currentPage: number;
  totalPages:  number;
  totalItems:  number;
}

export interface AlertState {
  message: string;
  type:    AlertType;
}

// â”€â”€â”€ Defaults â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEFAULT_FILTERS: Filters = {
  status:     "",
  leave_type: "",
  start_date: "",
  end_date:   "",
  search:     "",
};

// â”€â”€â”€ Display Maps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual:    "Annual Leave",
  sick:      "Sick Leave",
  maternity: "Maternity",
  paternity: "Paternity",
  study:     "Study Leave",
  unpaid:    "Unpaid Leave",
  other:     "Other",
};

export const LEAVE_TYPE_STYLES: Record<LeaveType, React.CSSProperties> = {
  annual:    { background: "#dbeafe", color: "#1d4ed8" },
  sick:      { background: "#dcfce7", color: "#166534" },
  maternity: { background: "#f3e8ff", color: "#7e22ce" },
  paternity: { background: "#fce7f3", color: "#9d174d" },
  study:     { background: "#e0e7ff", color: "#3730a3" },
  unpaid:    { background: "#f3f4f6", color: "#374151" },
  other:     { background: "#fef9c3", color: "#854d0e" },
};

export const STATUS_STYLES: Record<LeaveStatus, React.CSSProperties> = {
  pending:   { background: "#fef9c3", color: "#854d0e" },
  approved:  { background: "#dcfce7", color: "#166534" },
  rejected:  { background: "#fee2e2", color: "#991b1b" },
  cancelled: { background: "#f3f4f6", color: "#374151" },
};

export const AVATAR_COLORS = [
  "#E6A79E", "#12b76a", "#f79009",
  "#ee46bc", "#7a5af8", "#f04438",
];

// â”€â”€â”€ Formatters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function formatDate(d: string): string {
  if (!d) return "â€”";
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatDateTime(d: string): string {
  if (!d) return "â€”";
  return new Date(d).toLocaleString("en-ZA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// â”€â”€â”€ Filter & pagination (pure â€” safe in useMemo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Returns a filtered copy of the leave list based on the current Filters state.
 */
export function filterLeaves(leaves: LeaveRequest[], filters: Filters): LeaveRequest[] {
  return leaves.filter(l => {
    if (filters.status     && l.status     !== filters.status)     return false;
    if (filters.leave_type && l.leave_type !== filters.leave_type) return false;
    if (filters.start_date && l.start_date <  filters.start_date)  return false;
    if (filters.end_date   && l.end_date   >  filters.end_date)    return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !l.full_name.toLowerCase().includes(q) &&
        !l.employee_code.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });
}

/**
 * Slices a list into a single page and returns pagination metadata.
 */
export function paginateLeaves(
  leaves: LeaveRequest[],
  page: number,
  pageSize: number = PAGE_SIZE,
): PaginatedResult<LeaveRequest> {
  const totalPages = Math.max(1, Math.ceil(leaves.length / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const data       = leaves.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { data, currentPage: safePage, totalPages, totalItems: leaves.length };
}

/**
 * Derives the four stat counters from the full leave list.
 */
export function computeStats(leaves: LeaveRequest[]): Stats {
  return {
    pending:  leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    total:    leaves.length,
  };
}

/**
 * True if any filter field is non-empty â€” used to customise empty-state copy.
 */
export function hasActiveFilters(filters: Filters): boolean {
  return Object.values(filters).some(v => v !== "");
}

// â”€â”€â”€ Optimistic state updaters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Pure array transforms â€” pass directly to setLeaves().
//
// Usage:
//   setLeaves(prev => applyApprove(prev, id));
//   setLeaves(prev => applyReject(prev, id, reason));
//   setLeaves(prev => applyCancel(prev, id));

export function applyApprove(
  leaves: LeaveRequest[],
  id: number,
  reviewerName = "Admin",
): LeaveRequest[] {
  return leaves.map(l =>
    l.leave_id === id
      ? {
          ...l,
          status:        "approved",
          reviewer_name: reviewerName,
          reviewed_at:   new Date().toISOString(),
        }
      : l,
  );
}

export function applyReject(
  leaves: LeaveRequest[],
  id: number,
  reason: string,
  reviewerName = "Admin",
): LeaveRequest[] {
  return leaves.map(l =>
    l.leave_id === id
      ? {
          ...l,
          status:           "rejected",
          rejection_reason: reason,
          reviewer_name:    reviewerName,
          reviewed_at:      new Date().toISOString(),
        }
      : l,
  );
}

export function applyCancel(
  leaves: LeaveRequest[],
  id: number,
): LeaveRequest[] {
  return leaves.map(l =>
    l.leave_id === id ? { ...l, status: "cancelled" } : l,
  );
}


export function validateRejectionReason(reason: string): string | null {
  if (!reason.trim())         return "Rejection reason is required.";
  if (reason.trim().length < 10) return "Please provide a more detailed reason (min 10 characters).";
  return null;
}