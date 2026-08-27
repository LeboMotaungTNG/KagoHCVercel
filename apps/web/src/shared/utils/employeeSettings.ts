export interface NotificationSettings {
  leaveUpdates: boolean;
  payslipReady: boolean;
  companyNotices: boolean;
  attendanceReminders: boolean;
  emailDigest: boolean;
}

export interface EmployeeSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: NotificationSettings;
}

export const LANGUAGE_OPTIONS = [
  "English", "Afrikaans", "isiZulu", "isiXhosa",
  "Sepedi", "Setswana", "Sesotho", "Xitsonga", "Other",
];

export const TIMEZONE_OPTIONS = [
  "Africa/Johannesburg",
  "Africa/Harare",
  "Africa/Windhoek",
  "Africa/Maputo",
  "Africa/Lusaka",
  "UTC",
];

export const DATE_FORMAT_OPTIONS = ["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"];

export const DEFAULT_EMPLOYEE_SETTINGS: EmployeeSettings = {
  language: "English",
  timezone: "Africa/Johannesburg",
  dateFormat: "DD/MM/YYYY",
  notifications: {
    leaveUpdates: true,
    payslipReady: true,
    companyNotices: true,
    attendanceReminders: true,
    emailDigest: false,
  },
};

const STORAGE_PREFIX = "kago.employeeSettings";

const storageKey = (email?: string) => {
  const id = email?.toLowerCase().trim() || "default";
  return `${STORAGE_PREFIX}.${id}`;
};

export const loadEmployeeSettings = (email?: string): EmployeeSettings => {
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) {
      return {
        ...DEFAULT_EMPLOYEE_SETTINGS,
        notifications: { ...DEFAULT_EMPLOYEE_SETTINGS.notifications },
      };
    }
    const parsed = JSON.parse(raw) as Partial<EmployeeSettings>;
    return {
      ...DEFAULT_EMPLOYEE_SETTINGS,
      ...parsed,
      notifications: {
        ...DEFAULT_EMPLOYEE_SETTINGS.notifications,
        ...(parsed.notifications || {}),
      },
    };
  } catch {
    return {
      ...DEFAULT_EMPLOYEE_SETTINGS,
      notifications: { ...DEFAULT_EMPLOYEE_SETTINGS.notifications },
    };
  }
};

export const saveEmployeeSettings = (settings: EmployeeSettings, email?: string): void => {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(settings));
  } catch { /* ignore quota errors */ }
};
