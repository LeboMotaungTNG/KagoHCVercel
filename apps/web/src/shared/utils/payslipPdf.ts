/**
 * Payslip PDF renderer
 * --------------------
 * Renders a professional, print-ready A4 payslip from a `PayslipData` value
 * using jsPDF. Kept in a dedicated module so the UI code and storage layer
 * don't take a jsPDF dependency directly.
 *
 * Design intent — an enterprise SA earning statement styled to the Kago brand:
 *   • Deep-blue banner with the Kago logo & the "PAYSLIP" wordmark.
 *   • Centered period ribbon straddling the banner and body.
 *   • Employer + employee info cards with blue eyebrow labels.
 *   • Joined earnings / deductions table with subtle zebra rows & totals band.
 *   • Coral NET PAY hero strip — the visual focal point.
 *   • YTD + payment cards, green leave balances strip, elegant footer.
 *
 * Output is a real, downloadable PDF (application/pdf).
 */

import { jsPDF } from "jspdf";

// Vite resolves this to a URL string at build time. We fetch it once, base64
// it, and cache the result so subsequent PDF renders don't hit the network.
// @ts-ignore — Vite asset import
import logoUrl from "../../assets/images/logo-black-white.png";

/* ─────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────── */

export interface PayslipLineItem {
  label: string;
  amount: number;
}

export interface PayslipYTD {
  gross: number;
  tax: number;
  net: number;
}

export interface PayslipEmployerInfo {
  name: string;
  registrationNo?: string;
  payeReference?: string;
  address?: string;
}

export interface PayslipEmployeeInfo {
  name: string;
  employeeNumber?: string;
  idNumber?: string;
  department?: string;
  position?: string;
  bank?: string;
  accountLast4?: string;
  paymentMethod?: string;
}

export interface PayslipData {
  reference: string;
  period: string;              // "July 2026"
  periodStart: string;         // ISO
  periodEnd: string;           // ISO
  payDate: string;             // ISO
  currency: string;            // "R"
  employer: PayslipEmployerInfo;
  employee: PayslipEmployeeInfo;
  earnings: PayslipLineItem[];
  deductions: PayslipLineItem[];
  ytd: PayslipYTD;
  leaveBalances?: { label: string; days: number }[];
  notes?: string;
}

/* ─────────────────────────────────────────────────────────────────────
 * Palette — Kago tokens with a blue-forward accent scheme
 * ────────────────────────────────────────────────────────────────── */

type RGB = [number, number, number];
const C = {
  // Blue primary (matches OrganizationSettings tab tokens)
  blueDk:   [3, 105, 161]  as RGB,   // #0369A1
  blue:     [51, 166, 205] as RGB,   // #33A6CD
  blueBg:   [229, 243, 250] as RGB,  // very light blue tint

  // Text
  ink:      [29, 41, 57]  as RGB,    // #1d2939
  text:     [52, 64, 84]  as RGB,    // #344054
  muted:    [102, 112, 133] as RGB,  // #667085
  faint:    [152, 162, 179] as RGB,  // #98a2b3
  line:     [230, 234, 240] as RGB,
  band:     [246, 247, 249] as RGB,
  bandAlt:  [251, 252, 253] as RGB,

  // Accents
  coral:    [230, 97, 79]  as RGB,   // #E6614F
  coralDk:  [200, 66, 50]  as RGB,
  greenDk:  [45, 116, 64]  as RGB,
  greenBg:  [237, 249, 241] as RGB,

  white:    [255, 255, 255] as RGB,
};

/* ─────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────── */

const money = (n: number, currency = "R"): string =>
  `${currency} ${Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

const shortDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
};

const sum = (rows: PayslipLineItem[]) => rows.reduce((a, r) => a + (r.amount || 0), 0);

/* ─────────────────────────────────────────────────────────────────────
 * Logo loader — fetch the imported asset once and cache as base64.
 * ────────────────────────────────────────────────────────────────── */

let logoPromise: Promise<string | null> | null = null;

const loadLogo = (): Promise<string | null> => {
  if (logoPromise) return logoPromise;
  logoPromise = fetch(logoUrl as string)
    .then(r => r.blob())
    .then(blob => new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    }))
    .catch(() => null);
  return logoPromise;
};

// Pre-warm the cache at module load time.
loadLogo();

/* ─────────────────────────────────────────────────────────────────────
 * Layout constants — A4 portrait, mm
 * ────────────────────────────────────────────────────────────────── */

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;

/* ─────────────────────────────────────────────────────────────────────
 * Drawing primitives (bind a doc-in-progress)
 * ────────────────────────────────────────────────────────────────── */

const setFill   = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const setStroke = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
const setText   = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);

const rrect = (
  d: jsPDF, x: number, y: number, w: number, h: number, r: number,
  fill?: RGB, stroke?: RGB,
) => {
  if (fill)   setFill(d, fill);
  if (stroke) setStroke(d, stroke);
  d.roundedRect(x, y, w, h, r, r, fill && stroke ? "FD" : fill ? "F" : "S");
};

/* ─────────────────────────────────────────────────────────────────────
 * Sections
 * ────────────────────────────────────────────────────────────────── */

// Shared by the payslip and the EMP201 so both documents carry the same header.
const drawBannerHeader = (
  d: jsPDF,
  data: Pick<PayslipData, "reference" | "period">,
  logoDataUrl: string | null,
  title = "PAYSLIP",
  pillLabel = "PAY PERIOD",
) => {
  const bannerH = 38;

  setFill(d, C.blueDk);
  d.rect(0, 0, PAGE_W, bannerH, "F");

  setFill(d, C.blue);
  d.rect(0, bannerH - 3, PAGE_W, 3, "F");

  // Decorative dots (top-right)
  setFill(d, [80, 180, 215]);
  for (let i = 0; i < 3; i++) {
    d.circle(PAGE_W - 12 - i * 6, 8 + i * 2, 1.6, "F");
  }

  // Logo (or K monogram fallback)
  if (logoDataUrl) {
    try {
      const h = 12;
      const w = 30;
      d.addImage(logoDataUrl, "PNG", M, (bannerH - h) / 2 - 2, w, h, undefined, "FAST");
    } catch { /* fall through */ }
  }
  if (!logoDataUrl) {
    setFill(d, C.white);
    d.roundedRect(M, (bannerH - 14) / 2, 14, 14, 3, 3, "F");
    setText(d, C.blueDk);
    d.setFontSize(14); d.setFont("helvetica", "bold");
    d.text("K", M + 7, (bannerH - 14) / 2 + 9.2, { align: "center" });
  }

  // Right side
  setText(d, C.white);
  d.setFontSize(24); d.setFont("helvetica", "bold");
  d.text(title, PAGE_W - M, bannerH / 2 - 1, { align: "right" });
  d.setFontSize(9); d.setFont("helvetica", "normal");
  setText(d, [220, 235, 245]);
  d.text(`Reference · ${data.reference}`, PAGE_W - M, bannerH / 2 + 5, { align: "right" });

  // Period pill straddling the boundary
  const pillW = 78;
  const pillH = 14;
  const pillX = (PAGE_W - pillW) / 2;
  const pillY = bannerH - pillH / 2;

  setFill(d, [235, 240, 244]);
  d.roundedRect(pillX + 0.6, pillY + 0.8, pillW, pillH, pillH / 2, pillH / 2, "F");
  setFill(d, C.white);
  setStroke(d, C.line);
  d.setLineWidth(0.3);
  d.roundedRect(pillX, pillY, pillW, pillH, pillH / 2, pillH / 2, "FD");

  setText(d, C.blueDk);
  d.setFontSize(7.5); d.setFont("helvetica", "bold");
  d.text(pillLabel, pillX + pillW / 2, pillY + 5.5, { align: "center" });
  setText(d, C.ink);
  d.setFontSize(10.5); d.setFont("helvetica", "bold");
  d.text(data.period, pillX + pillW / 2, pillY + 11, { align: "center" });
};

const drawEmployerStrip = (d: jsPDF, data: PayslipData, y: number): number => {
  setText(d, C.ink);
  d.setFontSize(11); d.setFont("helvetica", "bold");
  d.text(data.employer.name, M, y + 6);

  setText(d, C.muted);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  const meta = [
    data.employer.address,
    [
      data.employer.registrationNo ? `Reg No: ${data.employer.registrationNo}` : "",
      data.employer.payeReference  ? `PAYE: ${data.employer.payeReference}` : "",
    ].filter(Boolean).join("   ·   "),
  ].filter(Boolean).join("\n");
  const lines = d.splitTextToSize(meta, (PAGE_W - 2 * M) / 2);
  d.text(lines, M, y + 11);

  setText(d, C.blueDk);
  d.setFontSize(7.5); d.setFont("helvetica", "bold");
  d.text("PAYMENT DATE", PAGE_W - M, y + 6, { align: "right" });

  setText(d, C.ink);
  d.setFontSize(13); d.setFont("helvetica", "bold");
  d.text(shortDate(data.payDate), PAGE_W - M, y + 12, { align: "right" });

  setText(d, C.muted);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  d.text(
    `Cycle: ${shortDate(data.periodStart)} – ${shortDate(data.periodEnd)}`, // "→" isn't in the PDF's built-in font
    PAGE_W - M, y + 17, { align: "right" },
  );

  setStroke(d, C.line);
  d.setLineWidth(0.3);
  d.line(M, y + 22, PAGE_W - M, y + 22);

  return y + 26;
};

const drawEmployeeCard = (d: jsPDF, data: PayslipData, y: number): number => {
  const boxH = 32;
  rrect(d, M, y, PAGE_W - 2 * M, boxH, 3, C.blueBg, C.blue);

  setFill(d, C.blueDk);
  d.rect(M, y, 3, boxH, "F");

  setText(d, C.blueDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("EMPLOYEE", M + 7, y + 6);

  const cols = 4;
  const inner = PAGE_W - 2 * M - 12;
  const cellW = inner / cols;
  const cells = [
    { k: "Name",        v: data.employee.name },
    { k: "Employee No", v: data.employee.employeeNumber || "—" },
    { k: "ID Number",   v: data.employee.idNumber || "—" },
    { k: "Role",        v: [data.employee.position, data.employee.department].filter(Boolean).join(" · ") || "—" },
  ];
  cells.forEach((cell, i) => {
    const cx = M + 7 + i * cellW;
    setText(d, C.faint);
    d.setFontSize(7); d.setFont("helvetica", "bold");
    d.text(cell.k.toUpperCase(), cx, y + 14);
    setText(d, C.ink);
    d.setFontSize(10); d.setFont("helvetica", "bold");
    const wrapped = d.splitTextToSize(cell.v, cellW - 6);
    d.text(wrapped, cx, y + 20);
  });

  return y + boxH + 6;
};

const drawEarningsDeductions = (d: jsPDF, data: PayslipData, y: number): { y: number; gross: number; totalDed: number } => {
  const colGap = 4;
  const colW = (PAGE_W - 2 * M - colGap) / 2;
  const rowH = 6.5;
  const headerH = 8;
  const rows = Math.max(data.earnings.length, data.deductions.length, 4);
  const bodyH = rows * rowH;
  const totalH = 9;
  const tableH = headerH + bodyH + totalH;

  rrect(d, M, y, colW, tableH, 3, C.white, C.line);
  rrect(d, M + colW + colGap, y, colW, tableH, 3, C.white, C.line);

  setFill(d, C.blueDk);
  d.roundedRect(M, y, colW, headerH, 3, 3, "F");
  d.rect(M, y + headerH - 3, colW, 3, "F");
  d.roundedRect(M + colW + colGap, y, colW, headerH, 3, 3, "F");
  d.rect(M + colW + colGap, y + headerH - 3, colW, 3, "F");

  setText(d, C.white);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("EARNINGS",   M + 4, y + 5.3);
  d.text("AMOUNT",     M + colW - 4, y + 5.3, { align: "right" });
  d.text("DEDUCTIONS", M + colW + colGap + 4, y + 5.3);
  d.text("AMOUNT",     M + colW + colGap + colW - 4, y + 5.3, { align: "right" });

  d.setFontSize(9.5); d.setFont("helvetica", "normal");
  for (let i = 0; i < rows; i++) {
    const ry = y + headerH + i * rowH + rowH - 1.6;
    if (i % 2 === 1) {
      setFill(d, C.bandAlt);
      d.rect(M + 0.4, y + headerH + i * rowH, colW - 0.8, rowH, "F");
      d.rect(M + colW + colGap + 0.4, y + headerH + i * rowH, colW - 0.8, rowH, "F");
    }
    const e = data.earnings[i];
    const de = data.deductions[i];
    if (e) {
      setText(d, C.text);
      d.text(e.label, M + 4, ry);
      setText(d, C.ink);
      d.text(money(e.amount, data.currency), M + colW - 4, ry, { align: "right" });
    }
    if (de) {
      setText(d, C.text);
      d.text(de.label, M + colW + colGap + 4, ry);
      setText(d, C.ink);
      d.text(money(de.amount, data.currency), M + colW + colGap + colW - 4, ry, { align: "right" });
    }
  }

  const totalsY = y + headerH + bodyH;
  setFill(d, C.blueBg);
  d.rect(M + 0.4, totalsY, colW - 0.8, totalH, "F");
  d.rect(M + colW + colGap + 0.4, totalsY, colW - 0.8, totalH, "F");

  const gross = sum(data.earnings);
  const totalDed = sum(data.deductions);

  setText(d, C.blueDk);
  d.setFontSize(9.5); d.setFont("helvetica", "bold");
  d.text("GROSS PAY", M + 4, totalsY + 6.2);
  d.text(money(gross, data.currency), M + colW - 4, totalsY + 6.2, { align: "right" });
  d.text("TOTAL DEDUCTIONS", M + colW + colGap + 4, totalsY + 6.2);
  d.text(money(totalDed, data.currency), M + colW + colGap + colW - 4, totalsY + 6.2, { align: "right" });

  return { y: y + tableH + 8, gross, totalDed };
};

const drawNetPayHero = (d: jsPDF, data: PayslipData, y: number, net: number): number => {
  const h = 26;

  setFill(d, C.coral);
  d.roundedRect(M, y, PAGE_W - 2 * M, h, 5, 5, "F");

  const accentW = 76;
  setFill(d, C.coralDk);
  d.roundedRect(PAGE_W - M - accentW, y + 4, accentW - 4, h - 8, 3, 3, "F");

  // Decorative translucent rings — safe if GState API unavailable
  try {
    const G = (d as any).GState;
    if (G) {
      d.setGState(new G({ opacity: 0.14 }));
      setFill(d, [255, 255, 255]);
      d.circle(M + 68, y + h / 2, 14, "F");
      d.circle(M + 84, y + h / 2 + 4, 8, "F");
      d.setGState(new G({ opacity: 1 }));
    }
  } catch { /* decorative — safe to skip */ }

  setText(d, C.white);
  d.setFontSize(9.5); d.setFont("helvetica", "bold");
  d.text("NET PAY", M + 8, y + 10);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  setText(d, [255, 226, 220]);
  d.text(`For period ${shortDate(data.periodStart)} – ${shortDate(data.periodEnd)}`, M + 8, y + 16);
  d.text("Deposited via " + (data.employee.paymentMethod || "EFT"), M + 8, y + 21);

  setText(d, C.white);
  d.setFontSize(22); d.setFont("helvetica", "bold");
  d.text(money(net, data.currency), PAGE_W - M - 6, y + h / 2 + 2, { align: "right" });
  d.setFontSize(7.5); d.setFont("helvetica", "normal");
  setText(d, [255, 226, 220]);
  d.text("PAID TO ACCOUNT", PAGE_W - M - 6, y + 8, { align: "right" });

  return y + h + 8;
};

const drawYtdAndBank = (d: jsPDF, data: PayslipData, y: number): number => {
  const colGap = 6;
  const colW = (PAGE_W - 2 * M - colGap) / 2;
  const h = 30;

  rrect(d, M, y, colW, h, 3, C.blueBg, C.blue);
  setText(d, C.blueDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("YEAR-TO-DATE", M + 5, y + 6);

  const items = [
    { label: "Gross YTD", value: money(data.ytd.gross, data.currency) },
    { label: "Tax YTD",   value: money(data.ytd.tax,   data.currency) },
    { label: "Net YTD",   value: money(data.ytd.net,   data.currency) },
  ];
  const cellW = (colW - 10) / items.length;
  items.forEach((it, i) => {
    const cx = M + 5 + i * cellW;
    setText(d, C.muted);
    d.setFontSize(7); d.setFont("helvetica", "bold");
    d.text(it.label.toUpperCase(), cx, y + 13);
    setText(d, C.ink);
    d.setFontSize(11); d.setFont("helvetica", "bold");
    d.text(it.value, cx, y + 21);
  });

  const rx = M + colW + colGap;
  rrect(d, rx, y, colW, h, 3, C.white, C.line);
  setText(d, C.blueDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("PAYMENT DETAILS", rx + 5, y + 6);

  const payLines = [
    { label: "METHOD",  value: data.employee.paymentMethod || "EFT" },
    { label: "BANK",    value: data.employee.bank || "—" },
    { label: "ACCOUNT", value: data.employee.accountLast4 ? `**** **** **** ${data.employee.accountLast4}` : "—" },
  ];
  payLines.forEach((it, i) => {
    setText(d, C.faint);
    d.setFontSize(7); d.setFont("helvetica", "bold");
    d.text(it.label, rx + 5, y + 12 + i * 6);
    setText(d, C.ink);
    d.setFontSize(9); d.setFont("helvetica", "normal");
    d.text(it.value, rx + 28, y + 12 + i * 6);
  });

  return y + h + 6;
};

const drawLeaveBalances = (d: jsPDF, data: PayslipData, y: number): number => {
  if (!data.leaveBalances || data.leaveBalances.length === 0) return y;

  const h = 18;
  rrect(d, M, y, PAGE_W - 2 * M, h, 3, C.greenBg, C.line);
  setText(d, C.greenDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("LEAVE BALANCES", M + 5, y + 6);

  const items = data.leaveBalances;
  const cellW = (PAGE_W - 2 * M - 10) / items.length;
  items.forEach((it, i) => {
    const cx = M + 5 + i * cellW;
    setText(d, C.muted);
    d.setFontSize(7.5); d.setFont("helvetica", "normal");
    d.text(it.label, cx, y + 11.5);
    setText(d, C.ink);
    d.setFontSize(11); d.setFont("helvetica", "bold");
    d.text(`${it.days} days`, cx, y + 16);
  });

  return y + h + 6;
};

const drawFooter = (d: jsPDF, data: Pick<PayslipData, "notes">) => {
  const y = PAGE_H - 18;

  setFill(d, C.blueDk);
  d.rect(M, y - 8, 20, 1.5, "F");

  setText(d, C.muted);
  d.setFontSize(7.5); d.setFont("helvetica", "normal");
  const notes = data.notes || "This is a computer-generated payslip and does not require a signature.";
  const wrapped = d.splitTextToSize(notes, PAGE_W - 2 * M - 60);
  d.text(wrapped, M, y);

  setText(d, C.faint);
  d.setFontSize(7.5); d.setFont("helvetica", "bold");
  d.text(
    `Generated ${new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}`,
    PAGE_W - M, y, { align: "right" },
  );
  setText(d, C.blueDk);
  d.text("Kago Human Capital", PAGE_W - M, y + 4, { align: "right" });
};

/* ─────────────────────────────────────────────────────────────────────
 * Public API — async because we may need to fetch the logo asset once.
 * ────────────────────────────────────────────────────────────────── */

export const buildPayslipPdf = async (data: PayslipData): Promise<Blob> => {
  const logoDataUrl = await loadLogo();

  const d = new jsPDF({ unit: "mm", format: "a4", compress: true });
  d.setProperties({
    title: `Payslip — ${data.period} — ${data.employee.name}`,
    subject: "Employee Payslip",
    author: data.employer.name,
    creator: "Kago Human Capital",
    keywords: "payslip, kago, hr",
  });

  drawBannerHeader(d, data, logoDataUrl);
  let y = 44;
  y = drawEmployerStrip(d, data, y);
  y = drawEmployeeCard(d, data, y);
  const { y: y2, gross, totalDed } = drawEarningsDeductions(d, data, y);
  y = y2;
  y = drawNetPayHero(d, data, y, gross - totalDed);
  y = drawYtdAndBank(d, data, y);
  y = drawLeaveBalances(d, data, y);
  drawFooter(d, data);

  return d.output("blob");
};

export const buildPayslipObjectUrl = async (data: PayslipData): Promise<string> =>
  URL.createObjectURL(await buildPayslipPdf(data));

export const downloadPayslipPdf = async (data: PayslipData, fileName?: string): Promise<void> => {
  const url = await buildPayslipObjectUrl(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || `Payslip-${data.period.replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};

/* ─────────────────────────────────────────────────────────────────────
 * EMP201 — employer's monthly PAYE / SDL / UIF declaration, drawn with the
 * same Kago template as the payslip (banner, period pill, cards, footer).
 * ────────────────────────────────────────────────────────────────── */

export interface Emp201EmployeeRow {
  name: string;
  grossPay: number;
  paye: number;
  uifEmployee: number;
  uifEmployer: number;
  sdl: number;
  eti: number;
  netPay: number;
}

export interface Emp201Data {
  reference: string;
  period: string;          // "July 2026"
  periodStart: string;     // ISO
  periodEnd: string;       // ISO
  currency?: string;       // "R"
  employer: {
    name: string;
    address?: string;
    registrationNo?: string;
    payeReference?: string;
    sdlReference?: string;
    uifReference?: string;
  };
  employees: Emp201EmployeeRow[];
}

/** SARS: EMP201 is due by the 7th of the following month (earlier if the 7th is a weekend). */
const emp201DueDate = (periodEndIso: string): Date => {
  const end = new Date(periodEndIso);
  const base = Number.isNaN(end.getTime()) ? new Date() : end;
  const due = new Date(base.getFullYear(), base.getMonth() + 1, 7);
  while (due.getDay() === 0 || due.getDay() === 6) due.setDate(due.getDate() - 1);
  return due;
};

export const buildEmp201Pdf = async (data: Emp201Data): Promise<Blob> => {
  const logoDataUrl = await loadLogo();
  const cur = data.currency || "R";
  const d = new jsPDF({ unit: "mm", format: "a4", compress: true });
  d.setProperties({
    title: `EMP201 — ${data.period} — ${data.employer.name}`,
    subject: "EMP201 Monthly Employer Declaration",
    author: data.employer.name,
    creator: "Kago Human Capital",
    keywords: "emp201, paye, uif, sdl, kago",
  });

  const rows = data.employees;
  const tot = (k: keyof Emp201EmployeeRow) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const totals = {
    gross: tot("grossPay"), paye: tot("paye"), uifEmp: tot("uifEmployee"),
    uifEr: tot("uifEmployer"), sdl: tot("sdl"), eti: tot("eti"), net: tot("netPay"),
  };
  const payable = totals.paye + totals.sdl + totals.uifEmp + totals.uifEr - totals.eti;

  drawBannerHeader(d, data, logoDataUrl, "EMP201", "DECLARATION PERIOD");
  let y = 44;

  // Employer strip — same layout as the payslip's.
  setText(d, C.ink);
  d.setFontSize(11); d.setFont("helvetica", "bold");
  d.text(data.employer.name, M, y + 6);
  setText(d, C.muted);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  const meta = [
    data.employer.address,
    data.employer.registrationNo ? `Reg No: ${data.employer.registrationNo}` : "",
  ].filter(Boolean).join("\n");
  if (meta) d.text(d.splitTextToSize(meta, (PAGE_W - 2 * M) / 2), M, y + 11);

  setText(d, C.blueDk);
  d.setFontSize(7.5); d.setFont("helvetica", "bold");
  d.text("PAYMENT DUE BY", PAGE_W - M, y + 6, { align: "right" });
  setText(d, C.ink);
  d.setFontSize(13); d.setFont("helvetica", "bold");
  d.text(shortDate(emp201DueDate(data.periodEnd).toISOString()), PAGE_W - M, y + 12, { align: "right" });
  setText(d, C.muted);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  d.text(`Cycle: ${shortDate(data.periodStart)} – ${shortDate(data.periodEnd)}`, PAGE_W - M, y + 17, { align: "right" });
  setStroke(d, C.line);
  d.setLineWidth(0.3);
  d.line(M, y + 22, PAGE_W - M, y + 22);
  y += 26;

  // SARS reference card (styled like the payslip's employee card).
  const refs = [
    { k: "PAYE Ref", v: data.employer.payeReference },
    { k: "SDL Ref", v: data.employer.sdlReference },
    { k: "UIF Ref", v: data.employer.uifReference },
    { k: "Employees", v: String(rows.length) },
  ];
  const missing = !data.employer.registrationNo || !data.employer.payeReference || !data.employer.sdlReference;
  const cardH = missing ? 38 : 32;
  rrect(d, M, y, PAGE_W - 2 * M, cardH, 3, C.blueBg, C.blue);
  setFill(d, C.blueDk);
  d.rect(M, y, 3, cardH, "F");
  setText(d, C.blueDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("SARS REFERENCES", M + 7, y + 6);
  const cellW = (PAGE_W - 2 * M - 12) / refs.length;
  refs.forEach((cell, i) => {
    const cx = M + 7 + i * cellW;
    setText(d, C.faint);
    d.setFontSize(7); d.setFont("helvetica", "bold");
    d.text(cell.k.toUpperCase(), cx, y + 14);
    setText(d, cell.v ? C.ink : C.coralDk);
    d.setFontSize(10); d.setFont("helvetica", "bold");
    d.text(d.splitTextToSize(cell.v || "Not set", cellW - 6), cx, y + 20);
  });
  if (missing) {
    setText(d, C.coralDk);
    d.setFontSize(7.5); d.setFont("helvetica", "bold");
    d.text(
      "Not ready to submit: add the registration, PAYE and SDL numbers in Organisation settings, then download again.",
      M + 7, y + 33,
    );
  }
  y += cardH + 6;

  // Contributions table (same header band, zebra rows and totals band as the payslip).
  const tableW = PAGE_W - 2 * M;
  const headerH = 8;
  const rowH = 6.5;
  const lines = [
    { label: "PAYE (Pay-As-You-Earn)", amount: totals.paye },
    { label: "SDL (Skills Development Levy)", amount: totals.sdl },
    { label: "UIF — employee contribution", amount: totals.uifEmp },
    { label: "UIF — employer contribution", amount: totals.uifEr },
    { label: "ETI (Employment Tax Incentive)", amount: -totals.eti },
  ];
  const tableH = headerH + lines.length * rowH + 9;
  rrect(d, M, y, tableW, tableH, 3, C.white, C.line);
  setFill(d, C.blueDk);
  d.roundedRect(M, y, tableW, headerH, 3, 3, "F");
  d.rect(M, y + headerH - 3, tableW, 3, "F");
  setText(d, C.white);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("CONTRIBUTION", M + 4, y + 5.3);
  d.text("AMOUNT", M + tableW - 4, y + 5.3, { align: "right" });
  let ry = y + headerH;
  lines.forEach((ln, i) => {
    if (i % 2 === 1) { setFill(d, C.bandAlt); d.rect(M + 0.3, ry, tableW - 0.6, rowH, "F"); }
    setText(d, C.text);
    d.setFontSize(9); d.setFont("helvetica", "normal");
    d.text(ln.label, M + 4, ry + 4.5);
    d.text(money(ln.amount, cur), M + tableW - 4, ry + 4.5, { align: "right" });
    ry += rowH;
  });
  setFill(d, C.band);
  d.rect(M + 0.3, ry, tableW - 0.6, 8.7, "F");
  setText(d, C.ink);
  d.setFontSize(9.5); d.setFont("helvetica", "bold");
  d.text("Total liability", M + 4, ry + 6);
  d.text(money(payable, cur), M + tableW - 4, ry + 6, { align: "right" });
  y += tableH + 6;

  // Coral hero — the amount owed to SARS (the payslip's NET PAY strip).
  const heroH = 26;
  setFill(d, C.coral);
  d.roundedRect(M, y, tableW, heroH, 5, 5, "F");
  setFill(d, C.coralDk);
  d.roundedRect(PAGE_W - M - 76, y + 4, 72, heroH - 8, 3, 3, "F");
  setText(d, C.white);
  d.setFontSize(9.5); d.setFont("helvetica", "bold");
  d.text("TOTAL PAYABLE TO SARS", M + 8, y + 10);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  setText(d, [255, 226, 220]);
  d.text(`PAYE + SDL + UIF${totals.eti ? " less ETI" : ""} for ${data.period}`, M + 8, y + 16);
  d.text(`Payroll gross ${money(totals.gross, cur)} · ${rows.length} employee(s)`, M + 8, y + 21);
  setText(d, C.white);
  d.setFontSize(20); d.setFont("helvetica", "bold");
  d.text(money(payable, cur), PAGE_W - M - 6, y + heroH / 2 + 3, { align: "right" });
  y += heroH + 8;

  // Employee summary — paginates, repeating the header band.
  const cols = [
    { k: "EMPLOYEE", x: M + 4, align: "left" as const },
    { k: "GROSS", x: M + 92, align: "right" as const },
    { k: "PAYE", x: M + 120, align: "right" as const },
    { k: "UIF", x: M + 146, align: "right" as const },
    { k: "NET PAY", x: M + tableW - 4, align: "right" as const },
  ];
  const drawHeader = () => {
    setFill(d, C.blueDk);
    d.roundedRect(M, y, tableW, headerH, 3, 3, "F");
    d.rect(M, y + headerH - 3, tableW, 3, "F");
    setText(d, C.white);
    d.setFontSize(8); d.setFont("helvetica", "bold");
    cols.forEach((c) => d.text(c.k, c.x, y + 5.3, { align: c.align }));
    y += headerH;
  };
  const bottom = PAGE_H - 30;
  if (y + headerH + rowH * 2 + 6 > bottom) { d.addPage(); y = M + 4; }
  setText(d, C.blueDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("EMPLOYEE SUMMARY", M, y);
  y += 3;
  drawHeader();
  rows.forEach((r, i) => {
    if (y + rowH > bottom) { d.addPage(); y = M + 4; drawHeader(); }
    if (i % 2 === 1) { setFill(d, C.bandAlt); d.rect(M, y, tableW, rowH, "F"); }
    setText(d, C.text);
    d.setFontSize(8.5); d.setFont("helvetica", "normal");
    d.text(d.splitTextToSize(r.name || "Unknown", 70)[0], cols[0].x, y + 4.5);
    d.text(money(r.grossPay, cur), cols[1].x, y + 4.5, { align: "right" });
    d.text(money(r.paye, cur), cols[2].x, y + 4.5, { align: "right" });
    d.text(money(r.uifEmployee, cur), cols[3].x, y + 4.5, { align: "right" });
    d.text(money(r.netPay, cur), cols[4].x, y + 4.5, { align: "right" });
    y += rowH;
  });
  setStroke(d, C.line);
  d.setLineWidth(0.3);
  d.line(M, y, PAGE_W - M, y);
  y += 8;

  // Declaration + signature lines.
  if (y + 30 > bottom) { d.addPage(); y = M + 4; }
  setText(d, C.blueDk);
  d.setFontSize(8); d.setFont("helvetica", "bold");
  d.text("DECLARATION", M, y);
  setText(d, C.text);
  d.setFontSize(8.5); d.setFont("helvetica", "normal");
  d.text(
    d.splitTextToSize(
      "I declare that the information in this return is true and correct. I understand that submitting false information may result in penalties and interest.",
      tableW,
    ),
    M, y + 5,
  );
  setText(d, C.muted);
  d.text("Signature: ______________________", M, y + 20);
  d.text("Date: ________________", M + 75, y + 20);
  d.text("Capacity: ________________", M + 125, y + 20);

  // Footer on every page.
  const pages = d.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    d.setPage(p);
    drawFooter(d, { notes: "Computer-generated EMP201 summary. Submit the declaration and payment to SARS via eFiling by the due date." });
  }

  return d.output("blob");
};

export const downloadEmp201Pdf = async (data: Emp201Data, fileName?: string): Promise<void> => {
  const url = URL.createObjectURL(await buildEmp201Pdf(data));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || `EMP201-${data.period.replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
