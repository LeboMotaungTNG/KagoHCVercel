

import { API_URL, C, safeJson, unwrapArray, getInitials, avatarBg } from "./employee";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;       // YYYY-MM-DD
  gender?: string;
  nationality?: string;
  idNumber?: string;
  maritalStatus?: string;
  languages?: string[];
}

export interface EmploymentInfo {
  employeeCode?: string;
  position?: string;
  department?: string;
  manager?: string;
  hireDate?: string;          // YYYY-MM-DD
  employmentType?: "Permanent" | "Contract" | "Probation" | "Internship" | string;
  employmentStatus?: "Active" | "On leave" | "Suspended" | "Terminated" | string;
  workLocation?: string;
  workSchedule?: string;
  contractEnd?: string;
}

export interface ContactInfo {
  personalEmail?: string;
  workEmail?: string;
  personalPhone?: string;
  workPhone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

export interface BankingInfo {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: "Cheque" | "Savings" | "Credit" | string;
  taxNumber?: string;
  uifNumber?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export type DocumentCategory =
  | "ID"
  | "Contract"
  | "Qualifications"
  | "Tax"
  | "Medical"
  | "Other";

export interface DocumentEntry {
  id: string;
  name: string;
  category: DocumentCategory;
  size: number;            // bytes
  type: string;            // mime
  uploadedAt: string;      // ISO
  dataUrl: string;         // base64 data url so it works fully offline
}

export interface ActivityEntry {
  id: string;
  at: string;              // ISO
  label: string;
  description?: string;
}

export interface EmployeeProfileData {
  personal: PersonalInfo;
  employment: EmploymentInfo;
  contact: ContactInfo;
  emergency: EmergencyContact;
  banking: BankingInfo;
  skills: SkillEntry[];
  documents: DocumentEntry[];
  activity: ActivityEntry[];
  avatarDataUrl?: string;
  bio?: string;
  updatedAt?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Constants
 * ────────────────────────────────────────────────────────────────────────── */

export const DOCUMENT_CATEGORIES: { key: DocumentCategory; label: string; color: string }[] = [
  { key: "ID",             label: "Identification",     color: C.coral },
  { key: "Contract",       label: "Employment Contract", color: C.blue  },
  { key: "Qualifications", label: "Qualifications",      color: C.green },
  { key: "Tax",            label: "Tax & SARS",          color: C.amber },
  { key: "Medical",        label: "Medical",             color: C.pink  },
  { key: "Other",          label: "Other",               color: C.purple },
];

export const SKILL_LEVELS: SkillEntry["level"][] = [
  "Beginner", "Intermediate", "Advanced", "Expert",
];

export const SKILL_LEVEL_COLOR: Record<SkillEntry["level"], string> = {
  Beginner:     C.faint,
  Intermediate: C.blue,
  Advanced:     C.green,
  Expert:       C.coral,
};

export const PROFILE_SECTIONS = [
  { id: "overview",   label: "Overview"   },
  { id: "personal",   label: "Personal"   },
  { id: "employment", label: "Employment" },
  { id: "contact",    label: "Contact"    },
  { id: "banking",    label: "Banking"    },
  { id: "documents",  label: "Documents"  },
  { id: "skills",     label: "Skills"     },
  { id: "activity",   label: "Activity"   },
] as const;
export type ProfileSectionId = typeof PROFILE_SECTIONS[number]["id"];

/* ─────────────────────────────────────────────────────────────────────────────
 * Empty / defaults
 * ────────────────────────────────────────────────────────────────────────── */

export const EMPTY_PROFILE: EmployeeProfileData = {
  personal:   { firstName: "", lastName: "" },
  employment: {},
  contact:    {},
  emergency:  {},
  banking:    {},
  skills:     [],
  documents:  [],
  activity:   [],
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Format helpers
 * ────────────────────────────────────────────────────────────────────────── */

export const formatFileSize = (bytes: number): string => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const formatDateLong = (raw?: string): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
};

export const formatDateShort = (raw?: string): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
};

export const formatDateTimeShort = (raw?: string): string => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const ageFromDob = (dob?: string): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
};

export const yearsOfService = (hireDate?: string): string => {
  if (!hireDate) return "—";
  const d = new Date(hireDate);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 1) return "Less than a month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years}y ${rem}m`;
};

export const fullName = (p: PersonalInfo): string => {
  const parts = [p.firstName, p.middleName, p.lastName].filter(Boolean);
  return parts.join(" ").trim() || "Unnamed Employee";
};

export const initialsFor = (profile: EmployeeProfileData): string =>
  getInitials(fullName(profile.personal));

export const avatarColorFor = (profile: EmployeeProfileData): string =>
  avatarBg(profile.personal.firstName + profile.personal.lastName || "U");

/* ─────────────────────────────────────────────────────────────────────────────
 * Profile completion
 * ────────────────────────────────────────────────────────────────────────── */

export const profileCompletion = (p: EmployeeProfileData): number => {
  // Weighted set of "fields the employee should fill in to consider their
  // profile complete". Each present field contributes equally.
  const fields = [
    p.personal.firstName, p.personal.lastName, p.personal.dateOfBirth,
    p.personal.gender, p.personal.idNumber, p.personal.nationality,
    p.employment.employeeCode, p.employment.position, p.employment.department, p.employment.hireDate,
    p.contact.personalEmail || p.contact.workEmail,
    p.contact.personalPhone || p.contact.workPhone,
    p.contact.address, p.contact.city,
    p.emergency.name, p.emergency.phone,
    p.banking.bankName, p.banking.accountNumber, p.banking.branchCode,
    p.banking.taxNumber,
    p.skills.length > 0 ? "y" : "",
    p.documents.length > 0 ? "y" : "",
    p.avatarDataUrl,
    p.bio,
  ];
  const filled = fields.filter(v => !!v && String(v).trim() !== "").length;
  return Math.round((filled / fields.length) * 100);
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Document helpers (pure client side)
 * ────────────────────────────────────────────────────────────────────────── */

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export const createDocumentFromFile = async (
  file: File,
  category: DocumentCategory,
): Promise<DocumentEntry> => {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    category,
    size: file.size,
    type: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
    dataUrl,
  };
};

export const downloadDocument = (doc: DocumentEntry): void => {
  const a = document.createElement("a");
  a.href = doc.dataUrl;
  a.download = doc.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const groupDocuments = (
  docs: DocumentEntry[],
): Record<DocumentCategory, DocumentEntry[]> => {
  const out: Record<DocumentCategory, DocumentEntry[]> = {
    ID: [], Contract: [], Qualifications: [], Tax: [], Medical: [], Other: [],
  };
  docs.forEach(d => { (out[d.category] || out.Other).push(d); });
  return out;
};

export const documentIconFor = (mime: string): string => {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/"))            return "🖼️";
  if (m === "application/pdf")           return "📕";
  if (m.includes("word"))                return "📘";
  if (m.includes("excel") || m.includes("spreadsheet")) return "📗";
  if (m.includes("zip")  || m.includes("rar"))         return "🗜️";
  if (m.startsWith("video/"))            return "🎬";
  if (m.startsWith("audio/"))            return "🎵";
  return "📄";
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Local cache (per logged-in user email)
 * ────────────────────────────────────────────────────────────────────────── */

const cacheKey = (email?: string) => `kago.employeeProfile:${email || "anonymous"}`;

export const loadProfileLocal = (email?: string): EmployeeProfileData | null => {
  try {
    const raw = localStorage.getItem(cacheKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as EmployeeProfileData;
  } catch {
    return null;
  }
};

export const saveProfileLocal = (profile: EmployeeProfileData, email?: string): void => {
  try {
    const next: EmployeeProfileData = { ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(cacheKey(email), JSON.stringify(next));
  } catch (err) {
    console.warn("Failed to cache profile:", err);
  }
};

export const clearProfileLocal = (email?: string): void => {
  try { localStorage.removeItem(cacheKey(email)); } catch { /* noop */ }
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Activity log helpers
 * ────────────────────────────────────────────────────────────────────────── */

export const pushActivity = (
  profile: EmployeeProfileData,
  label: string,
  description?: string,
): EmployeeProfileData => ({
  ...profile,
  activity: [
    {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      label,
      description,
    },
    ...profile.activity,
  ].slice(0, 50),
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Mapping from backend `/employees` row → EmployeeProfileData
 * ────────────────────────────────────────────────────────────────────────── */

const dep = (d: any): string | undefined => {
  if (!d) return undefined;
  if (typeof d === "string") return d;
  if (typeof d === "object") return d.name || d.title || d.department;
  return undefined;
};

export const mapApiEmployee = (api: any, user?: any): EmployeeProfileData => {
  if (!api && !user) return EMPTY_PROFILE;
  const a = api || {};
  const personal: PersonalInfo = {
    firstName:    a.firstName    || a.first_name   || a.personal_info?.first_name  || user?.firstName || "",
    lastName:     a.lastName     || a.last_name    || a.personal_info?.last_name   || user?.lastName  || "",
    middleName:   a.middleName   || a.middle_name  || a.personal_info?.middle_name,
    dateOfBirth:  a.dateOfBirth  || a.date_of_birth|| a.personal_info?.date_of_birth,
    gender:       a.gender       || a.personal_info?.gender,
    nationality:  a.nationality  || a.personal_info?.nationality,
    idNumber:     a.idNumber     || a.id_number    || a.personal_info?.id_number,
    maritalStatus:a.maritalStatus|| a.marital_status,
    languages:    a.languages    || [],
  };
  const employment: EmploymentInfo = {
    employeeCode:    a.employeeId || a.employee_code || a.employment_details?.employee_code,
    position:        a.position   || a.employment_details?.position,
    department:      dep(a.department) || dep(a.employment_details?.department),
    manager:         a.manager    || a.manager_name,
    hireDate:        a.hireDate   || a.hire_date   || a.employment_details?.hire_date,
    employmentType:  a.employmentType   || a.employment_details?.employment_type,
    employmentStatus:a.status            || a.employment_details?.employment_status,
    workLocation:    a.workLocation      || a.employment_details?.work_location,
    workSchedule:    a.workSchedule      || a.employment_details?.work_schedule,
    contractEnd:     a.contractEnd       || a.employment_details?.contract_end,
  };
  const contact: ContactInfo = {
    personalEmail: a.personalEmail || a.contact_info?.personal_email,
    workEmail:     a.email         || a.contact_info?.work_email || user?.email,
    personalPhone: a.personalPhone || a.contact_info?.personal_phone || a.phone,
    workPhone:     a.workPhone     || a.contact_info?.work_phone,
    address:       a.address       || a.contact_info?.address,
    city:          a.city          || a.contact_info?.city,
    province:      a.province      || a.contact_info?.state,
    postalCode:    a.postalCode    || a.contact_info?.postal_code,
    country:       a.country       || a.contact_info?.country || "South Africa",
  };
  const emergency: EmergencyContact = {
    name:         a.emergencyContactName  || a.contact_info?.emergency_contact_name,
    relationship: a.emergencyContactRelation || a.contact_info?.emergency_contact_relation,
    phone:        a.emergencyContactPhone || a.contact_info?.emergency_contact_phone,
    email:        a.emergencyContactEmail || a.contact_info?.emergency_contact_email,
  };
  const banking: BankingInfo = {
    bankName:      a.bankName      || a.banking_details?.bank_name,
    accountHolder: a.accountHolder || a.banking_details?.account_holder_name,
    accountNumber: a.accountNumber || a.banking_details?.account_number,
    branchCode:    a.branchCode    || a.banking_details?.bank_branch,
    accountType:   a.accountType   || a.banking_details?.account_type,
    taxNumber:     a.taxNumber     || a.banking_details?.tax_id,
    uifNumber:     a.uifNumber     || a.banking_details?.uif_number,
  };
  return {
    personal,
    employment,
    contact,
    emergency,
    banking,
    skills:    [],
    documents: [],
    activity:  [],
    bio:       a.bio,
    avatarDataUrl: a.profile_image || a.avatar,
  };
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Loader: merges (cache → API → user) so the page always shows something
 * ────────────────────────────────────────────────────────────────────────── */

export const loadEmployeeProfile = async (
  token?: string | null,
  user?: any,
): Promise<EmployeeProfileData> => {
  const cached = loadProfileLocal(user?.email);

  let apiRow: any = null;
  if (token) {
    const auth = { headers: { Authorization: `Bearer ${token}` } } as RequestInit;
    // Try by userId
    if (user?._id) {
      const byId = await safeJson(`${API_URL}/employees?userId=${user._id}`, auth);
      const arr  = unwrapArray(byId);
      if (arr.length) apiRow = arr[0];
    }
    // Fallback: pull list and filter by email
    if (!apiRow && user?.email) {
      const all = await safeJson(`${API_URL}/employees`, auth);
      const arr = unwrapArray(all);
      apiRow = arr.find((e: any) =>
        (e.email || e.contact_info?.work_email || "").toLowerCase() === String(user.email).toLowerCase(),
      ) || null;
    }
  }

  const fromApi = mapApiEmployee(apiRow, user);

  if (!cached) return fromApi;
  return mergeProfiles(fromApi, cached);
};

const mergeShallow = <T extends Record<string, any>>(base: T, over: Partial<T>): T => {
  const out: Record<string, any> = { ...base };
  Object.keys(over || {}).forEach(k => {
    const v = (over as any)[k];
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out as T;
};

export const mergeProfiles = (
  base: EmployeeProfileData,
  over: Partial<EmployeeProfileData>,
): EmployeeProfileData => ({
  personal:   mergeShallow(base.personal,   over.personal   || {}),
  employment: mergeShallow(base.employment, over.employment || {}),
  contact:    mergeShallow(base.contact,    over.contact    || {}),
  emergency:  mergeShallow(base.emergency,  over.emergency  || {}),
  banking:    mergeShallow(base.banking,    over.banking    || {}),
  skills:     over.skills && over.skills.length    ? over.skills    : base.skills,
  documents:  over.documents && over.documents.length ? over.documents : base.documents,
  activity:   over.activity && over.activity.length   ? over.activity  : base.activity,
  bio:        over.bio        ?? base.bio,
  avatarDataUrl: over.avatarDataUrl ?? base.avatarDataUrl,
  updatedAt:  over.updatedAt  ?? base.updatedAt,
});
