import { loadEmployeeSettings, type NotificationSettings } from "./employeeSettings";
import { loadLatestPayslip } from "./documentsLibrary";

export type NotificationCategory = keyof Omit<NotificationSettings, "emailDigest">;

export type NotificationRole = "employee" | "manager" | "owner";

export interface AppNotification {
  id: string;
  category: NotificationCategory | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export const NOTIFICATIONS_UPDATED_EVENT = "kago:notifications-updated";

const STORAGE_PREFIX = "kago.notifications";

const storageKey = (role: NotificationRole, email?: string) => {
  const id = email?.toLowerCase().trim() || "default";
  return `${STORAGE_PREFIX}.${role}.${id}`;
};

export const dispatchNotificationsUpdated = (): void => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
};

export const loadNotifications = (
  role: NotificationRole,
  email?: string,
): AppNotification[] => {
  try {
    const raw = localStorage.getItem(storageKey(role, email));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveNotifications = (
  notifications: AppNotification[],
  role: NotificationRole,
  email?: string,
): void => {
  try {
    localStorage.setItem(storageKey(role, email), JSON.stringify(notifications));
    dispatchNotificationsUpdated();
  } catch {
    /* ignore quota errors */
  }
};

const categoryEnabled = (
  category: AppNotification["category"],
  prefs: NotificationSettings,
): boolean => {
  if (category === "system") return true;
  return prefs[category];
};

export const filterNotificationsByPreferences = (
  notifications: AppNotification[],
  role: NotificationRole,
  email?: string,
): AppNotification[] => {
  if (role !== "employee") return notifications;
  const prefs = loadEmployeeSettings(email).notifications;
  return notifications.filter(n => categoryEnabled(n.category, prefs));
};

export const getUnreadCount = (
  notifications: AppNotification[],
  role: NotificationRole,
  email?: string,
): number =>
  filterNotificationsByPreferences(notifications, role, email).filter(n => !n.read).length;

export const markNotificationRead = (
  id: string,
  role: NotificationRole,
  email?: string,
): void => {
  const items = loadNotifications(role, email).map(n =>
    n.id === id ? { ...n, read: true } : n,
  );
  saveNotifications(items, role, email);
};

export const markAllNotificationsRead = (
  role: NotificationRole,
  email?: string,
): void => {
  const items = loadNotifications(role, email).map(n => ({ ...n, read: true }));
  saveNotifications(items, role, email);
};

const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const hoursAgo = (hours: number): string => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

const mergeSeeds = (
  existing: AppNotification[],
  seeds: AppNotification[],
): AppNotification[] => {
  const byId = new Map(existing.map(n => [n.id, n]));
  for (const seed of seeds) {
    if (!byId.has(seed.id)) byId.set(seed.id, seed);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const employeeSeeds = (): AppNotification[] => {
  const seeds: AppNotification[] = [
    {
      id: "leave-approved-demo",
      category: "leaveUpdates",
      title: "Leave request approved",
      body: "Your annual leave for 12–16 July has been approved.",
      createdAt: hoursAgo(2),
      read: false,
      href: "/employee/leave",
    },
    {
      id: "company-notice-parental-leave",
      category: "companyNotices",
      title: "New parental leave policy",
      body: "12 weeks fully paid for all parents, effective July 1.",
      createdAt: daysAgo(1),
      read: false,
      href: "/employee",
    },
    {
      id: "attendance-reminder-demo",
      category: "attendanceReminders",
      title: "Clock-in reminder",
      body: "You have not clocked in yet today. Tap to record attendance.",
      createdAt: hoursAgo(1),
      read: false,
      href: "/employee/attendance",
    },
  ];

  const payslip = loadLatestPayslip();
  if (payslip) {
    seeds.unshift({
      id: `payslip-${payslip.id}`,
      category: "payslipReady",
      title: "Payslip ready",
      body: `Your ${payslip.period} payslip is available for download.`,
      createdAt: payslip.issueDate || daysAgo(0),
      read: false,
      href: "/employee/documents",
    });
  } else {
    seeds.unshift({
      id: "payslip-demo",
      category: "payslipReady",
      title: "Payslip ready",
      body: "Your latest payslip is available in Documents.",
      createdAt: daysAgo(3),
      read: true,
      href: "/employee/documents",
    });
  }

  return seeds;
};

const managerSeeds = (): AppNotification[] => [
  {
    id: "manager-leave-pending",
    category: "system",
    title: "Leave requests pending",
    body: "3 team leave requests are waiting for your review.",
    createdAt: hoursAgo(4),
    read: false,
    href: "/manager/leave-requests",
  },
  {
    id: "manager-payroll-reminder",
    category: "system",
    title: "Payroll cycle reminder",
    body: "Monthly payroll closes in 2 days. Review submissions now.",
    createdAt: daysAgo(1),
    read: false,
    href: "/manager/payroll",
  },
];

const ownerSeeds = (): AppNotification[] => [
  {
    id: "owner-compliance",
    category: "system",
    title: "Compliance contacts due",
    body: "Update organization notification contacts in Organization Settings.",
    createdAt: daysAgo(2),
    read: false,
    href: "/owner/organization-settings",
  },
  {
    id: "owner-reviews",
    category: "system",
    title: "Employee reviews open",
    body: "Q2 performance reviews are open for your organization.",
    createdAt: daysAgo(1),
    read: false,
    href: "/owner/employee-review",
  },
];

export const ensureNotificationSeeds = (
  role: NotificationRole,
  email?: string,
): AppNotification[] => {
  const existing = loadNotifications(role, email);
  const seeds =
    role === "employee"
      ? employeeSeeds()
      : role === "manager"
        ? managerSeeds()
        : ownerSeeds();
  const merged = mergeSeeds(existing, seeds);
  if (merged.length !== existing.length) {
    saveNotifications(merged, role, email);
    return merged;
  }
  return existing;
};

export const formatNotificationTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const pushNotification = (
  role: NotificationRole,
  notification: Omit<AppNotification, "id" | "createdAt" | "read"> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
  email?: string,
): void => {
  const items = loadNotifications(role, email);
  const next: AppNotification = {
    id: notification.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: notification.createdAt ?? new Date().toISOString(),
    read: notification.read ?? false,
    category: notification.category,
    title: notification.title,
    body: notification.body,
    href: notification.href,
  };
  saveNotifications([next, ...items.filter((n) => n.id !== next.id)], role, email);
};

export const notifySelfReviewSubmitted = (payload: {
  employeeName: string;
  employeeId: string;
  evaluationId: string;
  period: string;
  moderationId: string;
}): void => {
  pushNotification("manager", {
    category: "system",
    title: "Self-review submitted",
    body: `${payload.employeeName} submitted their ${payload.period} self-review for moderation.`,
    href: `/manager/moderate/${payload.moderationId}`,
  });
};

export const notifyReviewPendingOwner = (payload: {
  employeeName: string;
  employeeId: string;
  evaluationId: string;
  period: string;
}): void => {
  pushNotification("owner", {
    category: "system",
    title: "Review ready for sign-off",
    body: `${payload.employeeName}'s ${payload.period} review is pending your sign-off.`,
    href: "/owner/reviews",
  });
};

export const notifyReviewAccepted = (payload: {
  employeeName: string;
  evaluationId: string;
  period: string;
}): void => {
  pushNotification("manager", {
    category: "system",
    title: "Review accepted",
    body: `Owner accepted ${payload.employeeName}'s ${payload.period} review.`,
    href: "/manager/performance",
  });
};

export const notifyReviewRejected = (payload: {
  employeeName: string;
  evaluationId: string;
  period: string;
  comment: string;
}): void => {
  pushNotification("manager", {
    category: "system",
    title: "Review rejected",
    body: `${payload.employeeName}'s ${payload.period} review was rejected: ${payload.comment}`,
    href: "/manager/performance",
  });
};

export const notifyReviewChangesRequested = (payload: {
  employeeName: string;
  evaluationId: string;
  period: string;
  comment: string;
}): void => {
  pushNotification("manager", {
    category: "system",
    title: "Changes requested on review",
    body: `Owner requested changes on ${payload.employeeName}'s ${payload.period} review: ${payload.comment}`,
    href: `/manager/moderate/${payload.evaluationId}`,
  });
};

export const notifyGoalAssigned = (payload: {
  employeeName: string;
  employeeId: string;
  goalTitle: string;
  objectiveTitle: string;
  period: string;
}): void => {
  pushNotification("employee", {
    category: "system",
    title: "New goal assigned",
    body: `“${payload.goalTitle}” was assigned under ${payload.objectiveTitle} (${payload.period}).`,
    href: "/employee/performance/goals",
  });
};

export const notifyInterventionAssigned = (payload: {
  employeeId: string;
  employeeName: string;
  title: string;
}): void => {
  pushNotification("employee", {
    category: "system",
    title: "Development plan updated",
    body: `Your manager accepted an intervention: ${payload.title}.`,
    href: "/employee/performance/insights",
  });
};
