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

export interface PayslipMeta {
  id: string;
  period: string;      // e.g. "October 2025"
  issueDate: string;   // ISO
  gross: number;
  net: number;
  currency: string;    // e.g. "R"
  fileName: string;
  dataUrl?: string;    // if omitted, we generate a demo HTML payslip
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
 * Demo payslip — generated as an HTML data URL so the "View / Download
 * payslip" flow works end-to-end during frontend development without any
 * backend. Replace with a real API call when the backend is ready.
 * ────────────────────────────────────────────────────────────────────── */

export const demoPayslip = (employeeName = "Employee"): PayslipMeta => {
  const now = new Date();
  const monthName = now.toLocaleString(undefined, { month: "long" });
  const year = now.getFullYear();
  const gross = 28450;
  const net = 22186.57;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payslip – ${monthName} ${year}</title>
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;color:#1d2939;padding:40px;max-width:720px;margin:auto}
  h1{margin:0 0 4px;font-size:22px;color:#111}
  .muted{color:#667085;font-size:13px}
  .card{border:1px solid #eef0f3;border-radius:12px;padding:20px;margin-top:20px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td,th{padding:8px 0;border-bottom:1px solid #eef0f3;text-align:left}
  th{color:#667085;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
  .right{text-align:right}
  .total{font-weight:700;color:#0369A1;font-size:16px}
  .brand{color:#E6614F;font-weight:800;letter-spacing:.5px}
</style></head><body>
  <div class="brand">KAGO HUMAN CAPITAL</div>
  <h1>Payslip — ${monthName} ${year}</h1>
  <div class="muted">Issued ${now.toLocaleDateString()} · Reference PS-${now.getTime().toString(36).toUpperCase()}</div>
  <div class="card">
    <table>
      <tr><th>Employee</th><td>${employeeName}</td></tr>
      <tr><th>Pay period</th><td>${monthName} ${year}</td></tr>
      <tr><th>Payment date</th><td>${now.toLocaleDateString()}</td></tr>
    </table>
  </div>
  <div class="card">
    <table>
      <tr><th>Earnings</th><th class="right">Amount</th></tr>
      <tr><td>Basic salary</td><td class="right">R ${gross.toLocaleString()}.00</td></tr>
      <tr><td>Travel allowance</td><td class="right">R 0.00</td></tr>
      <tr><td class="total">Gross pay</td><td class="right total">R ${gross.toLocaleString()}.00</td></tr>
    </table>
  </div>
  <div class="card">
    <table>
      <tr><th>Deductions</th><th class="right">Amount</th></tr>
      <tr><td>PAYE</td><td class="right">R 5,432.10</td></tr>
      <tr><td>UIF (1%)</td><td class="right">R 177.72</td></tr>
      <tr><td>Medical aid</td><td class="right">R 653.61</td></tr>
      <tr><td class="total">Net pay</td><td class="right total">R ${net.toLocaleString()}</td></tr>
    </table>
  </div>
  <p class="muted" style="margin-top:24px">This is a demo payslip generated for preview purposes. Actual figures will be provided by the payroll system.</p>
</body></html>`;

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

  return {
    id: `ps_${now.getTime()}`,
    period: `${monthName} ${year}`,
    issueDate: now.toISOString(),
    gross,
    net,
    currency: "R",
    fileName: `Payslip-${monthName}-${year}.html`,
    dataUrl,
  };
};
