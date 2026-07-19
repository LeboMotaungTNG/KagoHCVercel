/**
 * Documents Library — shared, frontend-only utilities.
 *
 * The Owner uploads company documents (employment conditions, policies,
 * benefits, etc.) that every employee can see under /employee/documents.
 * Payslips are represented as a first-class document category so the
 * "Latest payslip" feature can share the same storage shape.
 *
 * Persistence is intentionally client-side (localStorage) so the frontend
 * can be built and demoed while the backend team wires the real API.
 * When the backend is ready, only the functions in this file need to be
 * swapped to fetch/mutate over HTTP — the UI code stays untouched.
 */

import { API_URL } from "./employee";
import type React from "react";
import {
  FileText, ShieldCheck, HeartHandshake, GraduationCap,
  Landmark, Receipt, FileArchive,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
 * API Integration (NEW)
 * ─────────────────────────────────────────────────────────────────────────
 */

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "API request failed" }));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
};

export const loadOrgDocumentsAsync = async (): Promise<OrgDocument[]> => {
  try {
    const result = await apiRequest("/documents/employee");
    return (result.data || []).map((doc: any) => ({
      id: doc._id || doc.id,
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      category: doc.category || "Other",
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      size: doc.fileSize || doc.size || 0,
      dataUrl: doc.dataUrl || "",
      uploadedAt: doc.uploadedAt || doc.createdAt,
      uploadedBy: doc.uploadedBy?.firstName
        ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
        : "HR",
      audience: "all",
    }));
  } catch (error) {
    console.error("[documentsLibrary] Error loading employee documents:", error);
    return [];
  }
};

export const getEmployeeDocument = async (id: string): Promise<OrgDocument | null> => {
  try {
    const result = await apiRequest(`/documents/employee/${encodeURIComponent(id)}`);
    const doc = result.data;
    if (!doc) return null;

    return {
      id: doc._id || doc.id,
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      category: doc.category || "Other",
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      size: doc.fileSize || doc.size || 0,
      dataUrl: doc.dataUrl || "",
      uploadedAt: doc.uploadedAt || doc.createdAt,
      uploadedBy: doc.uploadedBy?.firstName
        ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
        : "HR",
      audience: "all",
    };
  } catch (error) {
    console.error("[documentsLibrary] Error getting document:", error);
    return null;
  }
};

export const loadOrgDocumentsOwner = async (): Promise<OrgDocument[]> => {
  try {
    const result = await apiRequest("/documents");
    return (result.data || []).map((doc: any) => ({
      id: doc._id || doc.id,
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      category: doc.category || "Other",
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      size: doc.fileSize || doc.size || 0,
      dataUrl: doc.dataUrl || "",
      uploadedAt: doc.uploadedAt || doc.createdAt,
      uploadedBy: doc.uploadedBy?.firstName
        ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
        : "System",
      audience: "all",
    }));
  } catch (error) {
    console.error("[documentsLibrary] Error loading documents:", error);
    return [];
  }
};

export const uploadDocument = async (
  file: File,
  title: string,
  description: string,
  category: DocCategory,
): Promise<OrgDocument> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("description", description || "");
  formData.append("category", category);

  const token = getToken();
  const response = await fetch(`${API_URL}/documents/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Upload failed");
  }

  const result = await response.json();
  const doc = result.data;

  return {
    id: doc._id || doc.id,
    _id: doc._id,
    title: doc.title,
    description: doc.description,
    category: doc.category || "Other",
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    size: doc.fileSize || doc.size || 0,
    dataUrl: doc.dataUrl || "",
    uploadedAt: doc.uploadedAt || doc.createdAt,
    uploadedBy: "You",
    audience: "all",
  };
};

export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    const result = await apiRequest(`/documents/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return result.success !== false;
  } catch (error) {
    console.error("[documentsLibrary] Error deleting document:", error);
    return false;
  }
};

/* ─────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────── */

export type DocCategory =
  | "Employment"
  | "Policy"
  | "Benefits"
  | "Compliance"
  | "Training"
  | "Payslip"
  | "Other";

export interface OrgDocument {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  category: DocCategory;
  fileName: string;
  mimeType: string;
  size: number;         // bytes
  dataUrl: string;      // base64 data URL (temp frontend storage)
  uploadedAt: string;   // ISO
  uploadedBy?: string;
  /** Reserved for future per-employee scoping. Defaults to "all". */
  audience?: "all";
}

import type { PayslipData } from "./payslipPdf";

export interface PayslipMeta {
  id: string;
  period: string;      // e.g. "October 2025"
  issueDate: string;   // ISO
  gross: number;
  net: number;
  currency: string;    // e.g. "R"
  fileName: string;
  /**
   * Full structured payslip payload used to render the PDF on demand.
   * Kept optional for backward compatibility with anything that only
   * needs the summary fields above.
   */
  data?: PayslipData;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Category metadata (icon + tint) — sourced from the Kago accent palette
 * used elsewhere in the app so the UI stays cohesive.
 * ────────────────────────────────────────────────────────────────────── */

export const CATEGORY_META: Record<
  DocCategory,
  { label: string; icon: React.ComponentType<any>; color: string; bg: string; blurb: string }
> = {
  Employment: {
    label: "Employment",
    icon: FileText,
    color: "#0369A1",
    bg: "rgba(3,105,161,0.10)",
    blurb: "Contracts, offer letters, employment conditions",
  },
  Policy: {
    label: "Company Policy",
    icon: ShieldCheck,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.10)",
    blurb: "Code of conduct, IT & remote-work policies",
  },
  Benefits: {
    label: "Benefits",
    icon: HeartHandshake,
    color: "#059669",
    bg: "rgba(5,150,105,0.10)",
    blurb: "Medical aid, pension, wellness programmes",
  },
  Compliance: {
    label: "Compliance",
    icon: Landmark,
    color: "#B45309",
    bg: "rgba(180,83,9,0.10)",
    blurb: "BCEA, POPIA, health & safety notices",
  },
  Training: {
    label: "Training",
    icon: GraduationCap,
    color: "#DB2777",
    bg: "rgba(219,39,119,0.10)",
    blurb: "Handbooks, onboarding & course materials",
  },
  Payslip: {
    label: "Payslip",
    icon: Receipt,
    color: "#E6614F",
    bg: "rgba(230,97,79,0.12)",
    blurb: "Monthly earning statements",
  },
  Other: {
    label: "Other",
    icon: FileArchive,
    color: "#475569",
    bg: "rgba(71,85,105,0.10)",
    blurb: "Miscellaneous documents",
  },
};

export const CATEGORY_ORDER: DocCategory[] = [
  "Employment", "Policy", "Benefits", "Compliance", "Training", "Payslip", "Other",
];

/* ─────────────────────────────────────────────────────────────────────────
 * Constraints
 * ────────────────────────────────────────────────────────────────────── */

/** Per-file cap. Base64 in localStorage is expensive; keep it sane. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

export const ACCEPTED_MIME =
  ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,application/pdf," +
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "text/plain,image/png,image/jpeg";

/* ─────────────────────────────────────────────────────────────────────────
 * Formatting helpers
 * ────────────────────────────────────────────────────────────────────── */

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
};

export const formatMoney = (n: number, currency = "R"): string =>
  `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─────────────────────────────────────────────────────────────────────────
 * File → base64 data URL
 * ────────────────────────────────────────────────────────────────────── */

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Trigger a browser download for a data URL / URL. */
export const downloadDataUrl = (dataUrl: string, fileName: string): void => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/* ─────────────────────────────────────────────────────────────────────────
 * Storage (localStorage today, HTTP tomorrow)
 * ────────────────────────────────────────────────────────────────────── */

const DOCS_KEY = "kago:orgDocuments";
const PAYSLIP_KEY = "kago:latestPayslip";

export const loadOrgDocuments = (): OrgDocument[] => {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

export const saveOrgDocuments = (docs: OrgDocument[]): void => {
  try { localStorage.setItem(DOCS_KEY, JSON.stringify(docs)); }
  catch (err) {
    console.warn("[documentsLibrary] Failed to persist documents:", err);
  }
};

export const loadLatestPayslip = (): PayslipMeta | null => {
  try {
    const raw = localStorage.getItem(PAYSLIP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PayslipMeta;
  } catch { return null; }
};

export const saveLatestPayslip = (slip: PayslipMeta | null): void => {
  try {
    if (slip == null) localStorage.removeItem(PAYSLIP_KEY);
    else localStorage.setItem(PAYSLIP_KEY, JSON.stringify(slip));
  } catch (err) {
    console.warn("[documentsLibrary] Failed to persist payslip:", err);
  }
};

export const loadLatestPayslipAsync = async (): Promise<PayslipMeta | null> => {
  try {
    const result = await apiRequest("/payroll/employee/payslips/latest");
    const doc = result.data;
    if (!doc) return null;

    return {
      id: doc._id || doc.id,
      period: doc.period || "",
      issueDate: doc.payDate || doc.createdAt || new Date().toISOString(),
      gross: doc.grossEarnings || doc.gross || 0,
      net: doc.netPay || doc.net || 0,
      currency: doc.currency || "R",
      fileName: `Payslip_${doc.period || 'current'}.pdf`,
      data: {
        reference: doc._id,
        period: doc.period,
        periodStart: doc.periodStart,
        periodEnd: doc.periodEnd,
        payDate: doc.payDate,
        currency: doc.currency || "R",
        employer: doc.employerSnapshot || {
          name: "Kago Human Capital",
          registrationNo: "",
          payeReference: "",
          address: ""
        },
        employee: doc.employeeSnapshot || {
          name: "Employee",
          employeeNumber: "",
          idNumber: "",
          department: "",
          position: "",
          bank: "",
          accountLast4: "",
          paymentMethod: "EFT"
        },
        earnings: [
          { label: "Basic Salary", amount: doc.basicSalary || 0 },
          { label: "Housing Allowance", amount: doc.allowances?.housing || 0 },
          { label: "Transport Allowance", amount: doc.allowances?.transport || 0 },
          { label: "Medical Allowance", amount: doc.allowances?.medical || 0 }
        ],
        deductions: [
          { label: "PAYE", amount: doc.deductions?.paye || 0 },
          { label: "UIF", amount: doc.deductions?.uif || 0 },
          { label: "Pension", amount: doc.deductions?.pension || 0 }
        ],
        ytd: doc.ytd || { gross: 0, tax: 0, net: 0 },
        leaveBalances: [],
        notes: "This is a computer-generated payslip."
      }
    } as PayslipMeta;
  } catch (error) {
    console.error("[documentsLibrary] Error loading latest payslip:", error);
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────────────────
 * ID generation
 * ────────────────────────────────────────────────────────────────────── */

export const newId = (): string =>
  `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/* ─────────────────────────────────────────────────────────────────────────
 * Demo payslip — returns a rich, structured `PayslipData` payload so the
 * PDF renderer can produce a professional statement end-to-end during
 * frontend development. When the backend ships, swap `loadLatestPayslip()`
 * for a real API call and this function can be removed.
 * ────────────────────────────────────────────────────────────────────── */

export const demoPayslip = (employeeName = "Employee"): PayslipMeta => {
  const now = new Date();
  const monthName = now.toLocaleString("en-ZA", { month: "long" });
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const monthsPaid = monthIdx + 1;

  const basic = 28450;
  const travel = 1500;
  const bonus = 0;
  const overtime = 0;

  const paye = 5432.10;
  const uif = 177.72;
  const medical = 653.61;
  const pension = basic * 0.075;

  const gross = basic + travel + bonus + overtime;
  const totalDed = paye + uif + medical + pension;
  const net = gross - totalDed;

  const periodStart = new Date(year, monthIdx, 1).toISOString();
  const periodEnd   = new Date(year, monthIdx + 1, 0).toISOString();
  const payDate     = new Date(year, monthIdx, 25).toISOString();
  const reference   = `PS-${now.getTime().toString(36).toUpperCase()}`;

  const data: PayslipData = {
    reference,
    period: `${monthName} ${year}`,
    periodStart,
    periodEnd,
    payDate,
    currency: "R",
    employer: {
      name: "Kago Human Capital",
      registrationNo: "2021/123456/07",
      payeReference: "7010123456",
      address: "1st Floor, Sandton Central, Johannesburg, 2196",
    },
    employee: {
      name: employeeName,
      employeeNumber: "EMP-00042",
      idNumber: "9101015800086",
      department: "Engineering",
      position: "Software Engineer",
      bank: "Standard Bank",
      accountLast4: "4321",
      paymentMethod: "EFT",
    },
    earnings: [
      { label: "Basic salary",     amount: basic },
      { label: "Travel allowance", amount: travel },
      { label: "Overtime",         amount: overtime },
      { label: "Bonus",            amount: bonus },
    ],
    deductions: [
      { label: "PAYE",           amount: paye },
      { label: "UIF (1%)",       amount: uif },
      { label: "Medical aid",    amount: medical },
      { label: "Pension (7.5%)", amount: pension },
    ],
    ytd: {
      gross: gross * monthsPaid,
      tax:   paye * monthsPaid,
      net:   net * monthsPaid,
    },
    leaveBalances: [
      { label: "Annual",       days: 15 },
      { label: "Sick",         days: 12 },
      { label: "Family Resp.", days: 3 },
    ],
    notes: "This is a computer-generated payslip and does not require a signature.",
  };

  return {
    id: `ps_${now.getTime()}`,
    period: `${monthName} ${year}`,
    issueDate: now.toISOString(),
    gross,
    net,
    currency: "R",
    fileName: `Payslip-${monthName}-${year}.pdf`,
    data,
  };
};
