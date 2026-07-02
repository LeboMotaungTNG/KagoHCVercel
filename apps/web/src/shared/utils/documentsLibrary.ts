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

import type React from "react";
import {
  FileText, ShieldCheck, HeartHandshake, GraduationCap,
  Landmark, Receipt, FileArchive,
} from "lucide-react";

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
