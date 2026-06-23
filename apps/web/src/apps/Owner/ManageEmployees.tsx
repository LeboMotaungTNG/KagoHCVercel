
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";
import PhoneInput from "../../shared/components/PhoneInput";
import {
  BRAND,
  PROVINCES as provinces,
  DEPARTMENTS as departments,
  COUNTRIES as countries,
  ALLOWANCE_TYPES as allowanceTypes,
  DEDUCTION_TYPES as deductionTypes,
  ZAF_BANKS,
  defaultForm,
  generateRandomEmployeeCode,
  validateSAIdNumber,
  validateEmployee,
  extractDobFromId,
  calcAge,
  calcETI,
  getFullName,
  uifRequired,
  benefitsForType,
  createEmployeeWithOnboarding,
  extractEmployeeDocument,
  saveQueueDraft,
  toQueueItem,
  queueItemFromTableRow,
  type Employee,
  type Allowance,
  type Deduction,
  type EmploymentType,
  type IdentificationType,
  type PaymentMethod,
  type Mode,
  type FormTab,
  type QueueItem,
  type TableRowData,
} from "../../shared/utils/manageEmployees";

// All Employee/QueueItem/Allowance/Deduction types, defaults, helpers, validation,
// reference lists, brand tokens and API calls live in shared/utils/manageEmployees.

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 11a2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  IdCard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Briefcase: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  Dollar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Save: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Upload: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Grid: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Inbox: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  RefreshCw: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Sliders: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  AlertCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Lightbulb: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 3 2 5 2 5h8s2-2 2-5a6 6 0 0 0-6-6z"/></svg>,
  Flag: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Layers: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Book: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Hash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  CreditCard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Activity: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Map: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Mail2: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8z"/><polyline points="15 9 18 9 18 11"/><path d="M6.5 5C4 5 2 7 2 9.5v.5"/><line x1="2" y1="14" x2="22" y2="14"/></svg>,
};

// ─── Field components ──────────────────────────────────────────────────────────
const S = {
  inputWrap: { position: "relative" as const },
  iconLeft: { position: "absolute" as const, left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3", display: "flex" as const, alignItems: "center" as const, pointerEvents: "none" as const },
  input: (hasIcon = true): React.CSSProperties => ({
    width: "100%", padding: hasIcon ? "10px 12px 10px 38px" : "10px 13px",
    border: "1px solid #e4e7ec", borderRadius: 10, fontSize: 13.5, outline: "none",
    color: BRAND.ink, background: "#fff", boxSizing: "border-box",
    transition: "border-color .15s ease, box-shadow .15s ease, background .15s ease",
  }),
  select: (hasIcon = true): React.CSSProperties => ({
    width: "100%", padding: hasIcon ? "10px 32px 10px 38px" : "10px 32px 10px 13px",
    border: "1px solid #e4e7ec", borderRadius: 10, fontSize: 13.5, outline: "none",
    color: BRAND.ink, background: "#fff", boxSizing: "border-box",
    appearance: "none" as const,
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2.5'><polyline points='6 9 12 15 18 9'/></svg>\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
    transition: "border-color .15s ease, box-shadow .15s ease",
  }),
  label: { display: "block" as const, marginBottom: 6, color: BRAND.text, fontWeight: 600 as const, fontSize: 12.5, letterSpacing: 0.1 },
  fieldGroup: { marginBottom: 14 },
  row2: { display: "grid" as const, gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  row3: { display: "grid" as const, gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 },
  // Soft banner-style section title — also styles its inline leading svg as a chip
  sectionTitle: {
    display: "flex" as const, alignItems: "center" as const, gap: 10,
    fontSize: 13.5, fontWeight: 700 as const, color: BRAND.primaryDeep,
    margin: "4px 0 16px",
    padding: "10px 14px",
    borderRadius: 10,
    background: `linear-gradient(90deg, ${BRAND.tint100} 0%, ${BRAND.tint50} 100%)`,
    border: `1px solid ${BRAND.tint200}`,
    borderLeft: `3px solid ${BRAND.primary}`,
    letterSpacing: -0.1,
  } as React.CSSProperties,
  badge: (color: string = BRAND.primary): React.CSSProperties => ({
    background: color + "1f", color, padding: "2px 8px", borderRadius: 6,
    fontSize: 11, fontWeight: 600,
  }),
  notice: (type: "info"|"warn"|"success" = "info"): React.CSSProperties => ({
    background: type === "info" ? BRAND.tint50 : type === "warn" ? "#fffaeb" : "#ecfdf3",
    border: `1px solid ${type === "info" ? BRAND.tint200 : type === "warn" ? "#fedf89" : "#abefc6"}`,
    color: type === "info" ? BRAND.primaryDeep : type === "warn" ? "#92400e" : "#166534",
    padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 16,
    display: "flex" as const, gap: 8, alignItems: "flex-start" as const,
  }),
  btn: (variant: "primary"|"secondary"|"danger"|"success" = "primary"): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
    background: variant === "primary" ? BRAND.primary
              : variant === "secondary" ? "#fff"
              : variant === "danger" ? BRAND.danger
              : BRAND.success,
    color: variant === "secondary" ? BRAND.text : "#fff",
    boxShadow: variant === "primary" ? `0 1px 2px rgba(15,107,142,0.18), 0 2px 8px rgba(51,166,205,0.22)`
             : variant === "success" ? "0 1px 2px rgba(0,0,0,0.06)"
             : variant === "danger" ? "0 1px 2px rgba(240,68,56,0.18)"
             : "none",
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease",
    ...(variant === "secondary" ? { border: `1px solid ${BRAND.border}` } : {}),
  }),
};

function FI({ icon, label, required, children }: { icon?: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label} {required && <span style={{ color: "#f04438" }}>*</span>}</label>
      {icon ? (
        <div style={S.inputWrap}>
          <span style={S.iconLeft}>{icon}</span>
          {children}
        </div>
      ) : children}
    </div>
  );
}

function TextInput({ icon, value, onChange, placeholder, type = "text", maxLength, readOnly }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; maxLength?: number; readOnly?: boolean;
}) {
  // Phone fields are routed to the country-aware PhoneInput automatically
  // so every phone capture across the form respects the active country.
  if (type === "tel") {
    return <PhoneInput value={value || ""} onChange={onChange} readOnly={readOnly} size="md" />;
  }
  return (
    <div style={S.inputWrap}>
      {icon && <span style={S.iconLeft}>{icon}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} readOnly={readOnly}
        style={S.input(!!icon)} />
    </div>
  );
}

function SelectInput({ icon, value, onChange, children }: {
  icon?: React.ReactNode; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div style={S.inputWrap}>
      {icon && <span style={S.iconLeft}>{icon}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select(!!icon)}>
        {children}
      </select>
    </div>
  );
}

function Checkbox({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 8 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#33a6cd" : "#d0d5dd"}`,
        background: checked ? "#33a6cd" : "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s",
      }}>
        {checked && <Ic.Check />}
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#344054", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{sub}</div>}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: "none" }} />
    </label>
  );
}

function RadioGroup({ value, onChange, options, horizontal }: {
  value: string; onChange: (v: string) => void; options: string[]; horizontal?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: horizontal ? "row" : "column", gap: 8, flexWrap: "wrap" }}>
      {options.map(o => (
        <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            border: `2px solid ${value === o ? "#33a6cd" : "#d0d5dd"}`,
            background: value === o ? "#33a6cd" : "#fff", transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {value === o && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
          </div>
          <span style={{ fontSize: 13, color: "#344054" }}>{o}</span>
          <input type="radio" checked={value === o} onChange={() => onChange(o)} style={{ display: "none" }} />
        </label>
      ))}
    </div>
  );
}

// Reference data (provinces, departments, countries, allowanceTypes, deductionTypes,
// ZAF_BANKS) is imported at the top of the file from shared/utils/manageEmployees.

// ─── TAB COMPONENTS ──────────────────────────────────────────────────────────

function Tab1Personal({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const age = calcAge(f.date_of_birth);
  return (
    <div>
      <div style={S.sectionTitle}><Ic.User /> Employee Type & Code</div>
      <div style={S.row2}>
        <FI label="Employee Type" required>
          <RadioGroup value={f.employeeType} onChange={v => upd("employeeType", v)}
            options={["Person","Personal Service Provider"]} horizontal />
        </FI>
        <FI label="Employee Code" required icon={<Ic.Hash />}>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={f.employee_code} onChange={e => upd("employee_code", e.target.value)}
              style={{ ...S.input(false), flex: 1 }} />
            <button type="button" onClick={() => upd("employee_code", generateRandomEmployeeCode())}
              style={{ ...S.btn("secondary"), padding: "8px 10px" }}><Ic.RefreshCw /></button>
          </div>
        </FI>
      </div>

      <div style={S.sectionTitle}><Ic.User /> Name Details</div>
      <div style={S.row3}>
        <FI label="Title"><SelectInput value={f.title} onChange={v => upd("title", v)}><option value="">—</option>{["Mr","Ms","Mrs","Dr","Prof"].map(t => <option key={t}>{t}</option>)}</SelectInput></FI>
        <FI label="Initials" icon={<Ic.Hash />}><TextInput value={f.initials} onChange={v => upd("initials", v)} placeholder="J.D." /></FI>
        <FI label="Known As" icon={<Ic.User />}><TextInput value={f.known_as} onChange={v => upd("known_as", v)} placeholder="Nickname" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="First Name" required icon={<Ic.User />}><TextInput value={f.first_name} onChange={v => upd("first_name", v)} placeholder="John" /></FI>
        <FI label="Second Name" icon={<Ic.User />}><TextInput value={f.second_name} onChange={v => upd("second_name", v)} placeholder="David" /></FI>
      </div>
      <FI label="Surname" required icon={<Ic.User />}><TextInput value={f.surname} onChange={v => upd("surname", v)} placeholder="Smith" /></FI>

      <div style={S.sectionTitle}><Ic.IdCard /> Identification</div>
      <FI label="Identification Type" required>
        <RadioGroup value={f.identification_type}
          onChange={v => upd("identification_type", v as IdentificationType)}
          options={["RSA ID Number","Passport Number","Asylum Seeker Permit","Refugee Permit"]}
          horizontal />
      </FI>

      {f.identification_type === "RSA ID Number" && (
        <FI label="RSA ID Number" required icon={<Ic.IdCard />}>
          <TextInput value={f.id_number} onChange={v => {
            upd("id_number", v);
            if (v.length >= 6) upd("date_of_birth", extractDobFromId(v));
          }} placeholder="8501015009087" maxLength={13} />
          {f.id_number && !validateSAIdNumber(f.id_number) && f.id_number.length === 13 &&
            <div style={{ color: "#f04438", fontSize: 11, marginTop: 4 }}>⚠ Invalid Luhn checksum</div>}
          {f.id_number.length === 13 && validateSAIdNumber(f.id_number) &&
            <div style={{ color: "#12b76a", fontSize: 11, marginTop: 4 }}>✓ Valid SA ID</div>}
        </FI>
      )}
      {f.identification_type === "Passport Number" && (
        <div style={S.row2}>
          <FI label="Passport Number" required icon={<Ic.Book />}><TextInput value={f.passport_number} onChange={v => upd("passport_number", v)} placeholder="M12345678" /></FI>
          <FI label="Passport Country" required icon={<Ic.Flag />}><SelectInput value={f.passport_country} onChange={v => upd("passport_country", v)}><option value="">Select</option>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
        </div>
      )}
      {f.identification_type === "Asylum Seeker Permit" && (
        <div style={S.row3}>
          <FI label="Permit Number" required icon={<Ic.IdCard />}><TextInput value={f.asylum_permit_number} onChange={v => upd("asylum_permit_number", v)} /></FI>
          <FI label="Country of Origin" required icon={<Ic.Flag />}><SelectInput value={f.asylum_country} onChange={v => upd("asylum_country", v)}><option value="">Select</option>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
          <FI label="Permit Expiry" required><TextInput type="date" value={f.asylum_expiry} onChange={v => upd("asylum_expiry", v)} /></FI>
        </div>
      )}
      {f.identification_type === "Refugee Permit" && (
        <div style={S.row3}>
          <FI label="Permit Number" required icon={<Ic.IdCard />}><TextInput value={f.refugee_permit_number} onChange={v => upd("refugee_permit_number", v)} /></FI>
          <FI label="Country of Origin" required icon={<Ic.Flag />}><SelectInput value={f.refugee_country} onChange={v => upd("refugee_country", v)}><option value="">Select</option>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
          <FI label="Permit Expiry" required><TextInput type="date" value={f.refugee_expiry} onChange={v => upd("refugee_expiry", v)} /></FI>
        </div>
      )}

      <div style={S.sectionTitle}><Ic.User /> Demographics</div>
      <div style={S.row2}>
        <FI label={`Date of Birth${age > 0 ? ` (Age: ${age})` : ""}`} required>
          <TextInput type="date" value={f.date_of_birth} onChange={v => upd("date_of_birth", v)} />
        </FI>
        <FI label="Gender"><SelectInput value={f.gender} onChange={v => upd("gender", v)}><option value="">Select</option>{["Male","Female","Other","Prefer not to say"].map(g => <option key={g}>{g}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Nationality"><SelectInput value={f.nationality} onChange={v => upd("nationality", v)}><option value="">Select</option>{["South African","Zimbabwean","Nigerian","Kenyan","British","American","Other"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
        <FI label="Marital Status"><SelectInput value={f.marital_status} onChange={v => upd("marital_status", v)}><option value="">Select</option>{["Single","Married","Divorced","Widowed","Domestic Partnership"].map(m => <option key={m}>{m}</option>)}</SelectInput></FI>
      </div>
    </div>
  );
}

function Tab2Contact({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  return (
    <div>
      <div style={S.sectionTitle}><Ic.Home /> Physical / Residential Address</div>
      <div style={S.row3}>
        <FI label="Unit Number"><TextInput value={f.phys_unit} onChange={v => upd("phys_unit", v)} placeholder="A101" /></FI>
        <FI label="Complex Name"><TextInput value={f.phys_complex} onChange={v => upd("phys_complex", v)} placeholder="Riviera Gardens" /></FI>
        <FI label="Street Number"><TextInput value={f.phys_street_no} onChange={v => upd("phys_street_no", v)} placeholder="123" /></FI>
      </div>
      <FI label="Street / Farm Name" required icon={<Ic.MapPin />}><TextInput value={f.phys_street} onChange={v => upd("phys_street", v)} placeholder="Main Street" /></FI>
      <div style={S.row2}>
        <FI label="Suburb / District"><TextInput value={f.phys_suburb} onChange={v => upd("phys_suburb", v)} placeholder="Sandton" /></FI>
        <FI label="City / Town" required icon={<Ic.Map />}><TextInput value={f.phys_city} onChange={v => upd("phys_city", v)} placeholder="Johannesburg" /></FI>
      </div>
      <div style={S.row3}>
        <FI label="Province" required icon={<Ic.Flag />}><SelectInput value={f.phys_province} onChange={v => upd("phys_province", v)}><option value="">Select</option>{provinces.map(p => <option key={p}>{p}</option>)}</SelectInput></FI>
        <FI label="Postal Code" required icon={<Ic.Hash />}><TextInput value={f.phys_postal} onChange={v => upd("phys_postal", v)} placeholder="2000" maxLength={4} /></FI>
        <FI label="Country" required icon={<Ic.Flag />}><SelectInput value={f.phys_country} onChange={v => upd("phys_country", v)}>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Residential Status"><SelectInput value={f.phys_status} onChange={v => upd("phys_status", v)}><option value="">Select</option>{["Owner","Tenant","Living with family","Other"].map(s => <option key={s}>{s}</option>)}</SelectInput></FI>
        <FI label="Years at Address"><TextInput type="number" value={f.phys_years} onChange={v => upd("phys_years", v)} placeholder="5" /></FI>
      </div>

      <div style={S.sectionTitle}><Ic.Mail /> Postal Address</div>
      <Checkbox checked={f.postal_same_as_phys} onChange={v => upd("postal_same_as_phys", v)} label="Same as physical/residential address" />
      {!f.postal_same_as_phys && (
        <>
          <div style={S.row2}>
            <FI label="Address Type"><RadioGroup value={f.postal_type} onChange={v => upd("postal_type", v)} options={["Post Box","Street Address"]} horizontal /></FI>
            {f.postal_type === "Post Box" && <FI label="Box Type"><RadioGroup value={f.postal_box_type} onChange={v => upd("postal_box_type", v)} options={["PO Box","Private Bag"]} horizontal /></FI>}
          </div>
          <div style={S.row2}>
            <FI label="Box Number"><TextInput value={f.postal_box_no} onChange={v => upd("postal_box_no", v)} /></FI>
            <FI label="Post Office Branch"><TextInput value={f.postal_branch} onChange={v => upd("postal_branch", v)} /></FI>
          </div>
          <div style={S.row3}>
            <FI label="City / Town"><TextInput value={f.postal_city} onChange={v => upd("postal_city", v)} /></FI>
            <FI label="Postal Code"><TextInput value={f.postal_postal} onChange={v => upd("postal_postal", v)} maxLength={4} /></FI>
            <FI label="Country"><SelectInput value={f.postal_country} onChange={v => upd("postal_country", v)}>{countries.map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
          </div>
          <div style={S.row2}>
            <FI label="Care of (c/o)"><TextInput value={f.postal_care_of} onChange={v => upd("postal_care_of", v)} placeholder="c/o Someone" /></FI>
            <FI label="Delivery Instructions"><TextInput value={f.postal_delivery} onChange={v => upd("postal_delivery", v)} /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Valid From"><TextInput type="date" value={f.postal_valid_from} onChange={v => upd("postal_valid_from", v)} /></FI>
            <FI label="Valid To"><TextInput type="date" value={f.postal_valid_to} onChange={v => upd("postal_valid_to", v)} /></FI>
          </div>
        </>
      )}

      <div style={S.sectionTitle}><Ic.Briefcase /> Work Address</div>
      <div style={{ marginBottom: 12 }}>
        <Checkbox checked={f.work_same_as_phys} onChange={v => upd("work_same_as_phys", v)} label="Same as physical address" />
        <Checkbox checked={f.work_same_as_company} onChange={v => upd("work_same_as_company", v)} label="Same as company address" />
      </div>
      {!f.work_same_as_phys && !f.work_same_as_company && (
        <>
          <div style={S.row3}>
            <FI label="Unit"><TextInput value={f.work_unit} onChange={v => upd("work_unit", v)} /></FI>
            <FI label="Complex"><TextInput value={f.work_complex} onChange={v => upd("work_complex", v)} /></FI>
            <FI label="Building"><TextInput value={f.work_building} onChange={v => upd("work_building", v)} /></FI>
          </div>
          <FI label="Street / Farm Name" icon={<Ic.MapPin />}><TextInput value={f.work_street} onChange={v => upd("work_street", v)} /></FI>
          <div style={S.row3}>
            <FI label="City"><TextInput value={f.work_city} onChange={v => upd("work_city", v)} /></FI>
            <FI label="Province"><SelectInput value={f.work_province} onChange={v => upd("work_province", v)}><option value="">Select</option>{provinces.map(p => <option key={p}>{p}</option>)}</SelectInput></FI>
            <FI label="Postal Code"><TextInput value={f.work_postal} onChange={v => upd("work_postal", v)} maxLength={4} /></FI>
          </div>
          <FI label="Office Location Name"><TextInput value={f.work_office_name} onChange={v => upd("work_office_name", v)} placeholder="Johannesburg Head Office" /></FI>
        </>
      )}

      <div style={S.sectionTitle}><Ic.Phone /> Communication Details</div>
      <div style={S.row2}>
        <FI label="Home Number" icon={<Ic.Phone />}><TextInput value={f.home_number} onChange={v => upd("home_number", v)} placeholder="0111234567" /></FI>
        <FI label="Work Number" icon={<Ic.Phone />}><TextInput value={f.work_number} onChange={v => upd("work_number", v)} placeholder="0111234567" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Cell Number" required icon={<Ic.Phone />}><TextInput type="tel" value={f.cell_number} onChange={v => upd("cell_number", v)} /></FI>
        <FI label="Alternative Cell" icon={<Ic.Phone />}><TextInput value={f.alt_cell} onChange={v => upd("alt_cell", v)} placeholder="0831234567" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Email Address" required icon={<Ic.Mail />}><TextInput type="email" value={f.email} onChange={v => upd("email", v)} placeholder="john@company.com" /></FI>
        <FI label="Alternative Email" icon={<Ic.Mail />}><TextInput type="email" value={f.alt_email} onChange={v => upd("alt_email", v)} placeholder="personal@gmail.com" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Fax Number" icon={<Ic.Phone />}><TextInput value={f.fax_number} onChange={v => upd("fax_number", v)} placeholder="0111234567" /></FI>
        <FI label="Preferred Contact Method"><SelectInput value={f.preferred_contact} onChange={v => upd("preferred_contact", v)}>{["Email","Phone","SMS","WhatsApp"].map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
      </div>

      <div style={S.sectionTitle}><Ic.Shield /> Emergency Contact</div>
      <div style={S.row2}>
        <FI label="Contact Person" required icon={<Ic.User />}><TextInput value={f.emergency_name} onChange={v => upd("emergency_name", v)} /></FI>
        <FI label="Relationship" required><SelectInput value={f.emergency_rel} onChange={v => upd("emergency_rel", v)}><option value="">Select</option>{["Spouse","Parent","Sibling","Friend","Other"].map(r => <option key={r}>{r}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Primary Phone" required icon={<Ic.Phone />}><TextInput type="tel" value={f.emergency_phone1} onChange={v => upd("emergency_phone1", v)} /></FI>
        <FI label="Secondary Phone" icon={<Ic.Phone />}><TextInput type="tel" value={f.emergency_phone2} onChange={v => upd("emergency_phone2", v)} /></FI>
      </div>
      <FI label="Emergency Email" icon={<Ic.Mail />}><TextInput type="email" value={f.emergency_email} onChange={v => upd("emergency_email", v)} /></FI>
      <FI label="Medical Conditions / Alerts" icon={<Ic.Activity />}>
        <textarea value={f.emergency_medical} onChange={e => upd("emergency_medical", e.target.value)}
          placeholder="Any medical information first responders should know..."
          style={{ ...S.input(true), height: 72, resize: "vertical" as const }} />
      </FI>
    </div>
  );
}

function Tab3Employment({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const benefits = benefitsForType(f.employment_type);
  const toggleBenefit = (b: string) => {
    const cur = f.benefits_package;
    upd("benefits_package", cur.includes(b) ? cur.filter(x => x !== b) : [...cur, b]);
  };

  return (
    <div>
      <div style={S.sectionTitle}><Ic.Briefcase /> Position & Department</div>
      <div style={S.row2}>
        <FI label="Position" required icon={<Ic.Briefcase />}>
          <TextInput value={f.position} onChange={v => upd("position", v)} placeholder="Sales Representative" />
        </FI>
        <FI label="Department" required icon={<Ic.Layers />}>
          <SelectInput value={f.department} onChange={v => upd("department", v)}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </SelectInput>
        </FI>
      </div>
      <FI label="Start Date" required><TextInput type="date" value={f.start_date} onChange={v => upd("start_date", v)} /></FI>

      <div style={S.sectionTitle}><Ic.Clock /> Employment Type</div>
      <FI label="Employment Type" required>
        <RadioGroup value={f.employment_type} onChange={v => upd("employment_type", v as EmploymentType)}
          options={["Full Time","Part Time","Contract","Intern","Temporary","Casual","Probation"]} horizontal />
      </FI>

      {/* Benefits notice */}
      {f.employment_type === "Intern" && (
        <div style={S.notice("warn")}><Ic.AlertCircle />
          <div><strong>Intern Policy:</strong> Interns receive stipend only — no medical aid, retirement fund, or leave benefits. UIF is not required.</div>
        </div>
      )}
      {f.employment_type === "Casual" && (
        <div style={S.notice("warn")}><Ic.AlertCircle />
          <div><strong>Casual Policy:</strong> No standard benefits, leave, or UIF unless working regular hours above threshold.</div>
        </div>
      )}

      {/* Full Time fields */}
      {f.employment_type === "Full Time" && (
        <>
          <div style={S.sectionTitle}><Ic.CheckCircle /> Full-Time Benefits</div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Benefits Package</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Medical Aid","Retirement Fund","Disability Cover","Life Insurance","Funeral Cover"].map(b => (
                <label key={b} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  border: `1px solid ${f.benefits_package.includes(b) ? "#33a6cd" : "#d0d5dd"}`,
                  borderRadius: 20, cursor: "pointer", fontSize: 12,
                  background: f.benefits_package.includes(b) ? "#33a6cd1f" : "#fff",
                  color: f.benefits_package.includes(b) ? "#0f6b8e" : "#344054",
                }}>
                  <input type="checkbox" checked={f.benefits_package.includes(b)}
                    onChange={() => toggleBenefit(b)} style={{ display: "none" }} />
                  {f.benefits_package.includes(b) && <Ic.Check />} {b}
                </label>
              ))}
            </div>
          </div>
          <div style={S.row2}>
            <FI label="Leave Entitlement"><SelectInput value={f.leave_entitlement} onChange={v => upd("leave_entitlement", v)}>{["15 days","20 days","25 days","30 days"].map(l => <option key={l}>{l}</option>)}</SelectInput></FI>
            <FI label="Notice Period"><SelectInput value={f.notice_period} onChange={v => upd("notice_period", v)}>{["1 month","2 months","3 months"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
          </div>
          <div style={S.row2}>
            <FI label="Sick Leave"><SelectInput value={f.sick_leave} onChange={v => upd("sick_leave", v)}>{["Standard (30 days per 36 months)","Enhanced"].map(s => <option key={s}>{s}</option>)}</SelectInput></FI>
            <FI label="Probation Period"><SelectInput value={f.probation_period} onChange={v => upd("probation_period", v)}>{["3 months","6 months","None"].map(p => <option key={p}>{p}</option>)}</SelectInput></FI>
          </div>
        </>
      )}

      {/* Part Time fields */}
      {f.employment_type === "Part Time" && (
        <>
          <div style={S.sectionTitle}><Ic.Clock /> Part-Time Details</div>
          <div style={S.row2}>
            <FI label="Min Hours/Week"><TextInput type="number" value={f.pt_min_hours} onChange={v => upd("pt_min_hours", v)} placeholder="20" /></FI>
            <FI label="Max Hours/Week"><TextInput type="number" value={f.pt_max_hours} onChange={v => upd("pt_max_hours", v)} placeholder="30" /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Benefits Eligibility"><SelectInput value={f.pt_benefits} onChange={v => upd("pt_benefits", v)}><option value="">Select</option>{["Pro-rated benefits","No benefits","Full benefits after hours threshold"].map(b => <option key={b}>{b}</option>)}</SelectInput></FI>
            <FI label="Shift Pattern"><SelectInput value={f.pt_shift} onChange={v => upd("pt_shift", v)}><option value="">Select</option>{["Fixed","Rotating","Flexible"].map(s => <option key={s}>{s}</option>)}</SelectInput></FI>
          </div>
        </>
      )}

      {/* Contract fields */}
      {f.employment_type === "Contract" && (
        <>
          <div style={S.sectionTitle}><Ic.IdCard /> Contract Details</div>
          <div style={S.row2}>
            <FI label="Contract Start Date" required><TextInput type="date" value={f.contract_start} onChange={v => upd("contract_start", v)} /></FI>
            <FI label="Contract End Date" required><TextInput type="date" value={f.contract_end} onChange={v => upd("contract_end", v)} /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Contract Renewal"><SelectInput value={f.contract_renewal} onChange={v => upd("contract_renewal", v)}>{["Automatically renew","Fixed term no renewal","Renewable by agreement"].map(r => <option key={r}>{r}</option>)}</SelectInput></FI>
            <FI label="Notice Period"><SelectInput value={f.contract_notice} onChange={v => upd("contract_notice", v)}>{["1 week","2 weeks","1 month","As per contract"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
          </div>
          <Checkbox checked={f.contract_bonus} onChange={v => upd("contract_bonus", v)} label="Completion Bonus" />
          {f.contract_bonus && <FI label="Bonus Amount (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.contract_bonus_amount} onChange={v => upd("contract_bonus_amount", v)} placeholder="10000" /></FI>}
        </>
      )}

      {/* Intern fields */}
      {f.employment_type === "Intern" && (
        <>
          <div style={S.sectionTitle}><Ic.Book /> Internship Details</div>
          <div style={S.row2}>
            <FI label="Internship Type"><SelectInput value={f.intern_type} onChange={v => upd("intern_type", v)}>{["Graduate","Student","Vocational","Learnership"].map(t => <option key={t}>{t}</option>)}</SelectInput></FI>
            <FI label="Duration"><SelectInput value={f.intern_duration} onChange={v => upd("intern_duration", v)}>{["6 months","12 months","18 months","24 months"].map(d => <option key={d}>{d}</option>)}</SelectInput></FI>
          </div>
          <div style={S.row2}>
            <FI label="Monthly Stipend (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.intern_stipend} onChange={v => upd("intern_stipend", v)} placeholder="6000" /></FI>
            <FI label="Study Release Hours/Week"><TextInput type="number" value={f.intern_study_hours} onChange={v => upd("intern_study_hours", v)} placeholder="4" /></FI>
          </div>
          <FI label="Assigned Mentor" icon={<Ic.User />}><TextInput value={f.intern_mentor} onChange={v => upd("intern_mentor", v)} placeholder="John Smith" /></FI>
          <FI label="Qualification Required"><TextInput value={f.intern_qualification} onChange={v => upd("intern_qualification", v)} placeholder="BCom Degree" /></FI>
          <Checkbox checked={f.intern_learning_signed} onChange={v => upd("intern_learning_signed", v)} label="Learning Agreement Signed" />
        </>
      )}

      {/* Temporary fields */}
      {f.employment_type === "Temporary" && (
        <>
          <div style={S.sectionTitle}><Ic.Clock /> Temporary Assignment</div>
          <div style={S.row2}>
            <FI label="Assignment Duration"><TextInput value={f.temp_duration} onChange={v => upd("temp_duration", v)} placeholder="3 months" /></FI>
            <FI label="Expected End Date"><TextInput type="date" value={f.temp_end} onChange={v => upd("temp_end", v)} /></FI>
          </div>
          <Checkbox checked={f.temp_agency} onChange={v => upd("temp_agency", v)} label="Placed through agency" />
          {f.temp_agency && <FI label="Agency Name" icon={<Ic.Briefcase />}><TextInput value={f.temp_agency_name} onChange={v => upd("temp_agency_name", v)} /></FI>}
        </>
      )}

      {/* Casual fields */}
      {f.employment_type === "Casual" && (
        <>
          <div style={S.sectionTitle}><Ic.Activity /> Casual Details</div>
          <div style={S.row2}>
            <FI label="Hourly Rate (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.casual_hourly} onChange={v => upd("casual_hourly", v)} placeholder="75" /></FI>
            <FI label="Max Hours/Week"><TextInput type="number" value={f.casual_max_hours} onChange={v => upd("casual_max_hours", v)} placeholder="20" /></FI>
          </div>
          <Checkbox checked={f.casual_oncall} onChange={v => upd("casual_oncall", v)} label="On-call requirement" />
        </>
      )}

      {/* Probation fields */}
      {f.employment_type === "Probation" && (
        <>
          <div style={S.sectionTitle}><Ic.Activity /> Probation Details</div>
          <div style={S.row3}>
            <FI label="Duration"><SelectInput value={f.probation_duration} onChange={v => upd("probation_duration", v)}>{["1 month","3 months","6 months"].map(d => <option key={d}>{d}</option>)}</SelectInput></FI>
            <FI label="Convert To"><SelectInput value={f.probation_convert} onChange={v => upd("probation_convert", v)}>{["Full Time","Part Time","Contract"].map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
            <FI label="Notice Period"><SelectInput value={f.notice_period} onChange={v => upd("notice_period", v)}>{["1 month","2 months","3 months"].map(n => <option key={n}>{n}</option>)}</SelectInput></FI>
          </div>
          <FI label="Performance KPIs / Targets">
            <textarea value={f.probation_kpis} onChange={e => upd("probation_kpis", e.target.value)}
              placeholder="List key performance indicators..."
              style={{ ...S.input(false), height: 80, resize: "vertical" as const }} />
          </FI>
        </>
      )}

      {/* UIF */}
      <div style={S.sectionTitle}><Ic.Shield /> UIF (Unemployment Insurance Fund)</div>
      {!uifRequired(f.employment_type) ? (
        <div style={S.notice("info")}><Ic.Info /><div>UIF is not applicable for <strong>{f.employment_type}</strong> employees.</div></div>
      ) : (
        <>
          <Checkbox checked={f.uif_exemption} onChange={v => upd("uif_exemption", v)} label="UIF Exemption applies" />
          {!f.uif_exemption ? (
            <div style={S.row3}>
              <FI label="UIF Number" required icon={<Ic.Hash />}><TextInput value={f.uif_number} onChange={v => upd("uif_number", v)} /></FI>
              <FI label="Contribution"><SelectInput value={f.uif_contribution} onChange={v => upd("uif_contribution", v)}><option>1%</option></SelectInput></FI>
              <FI label="Declaration Date"><TextInput type="date" value={f.uif_declaration_date} onChange={v => upd("uif_declaration_date", v)} /></FI>
            </div>
          ) : (
            <FI label="Exemption Reason"><SelectInput value={f.uif_exemption_reason} onChange={v => upd("uif_exemption_reason", v)}><option value="">Select</option>{["Over 65","Expatriate","Other"].map(r => <option key={r}>{r}</option>)}</SelectInput></FI>
          )}
        </>
      )}

      {/* SDL */}
      <div style={S.sectionTitle}><Ic.Layers /> SDL (Skills Development Levy)</div>
      <div style={S.row2}>
        <FI label="SDL Number"><TextInput value={f.sdl_number} onChange={v => upd("sdl_number", v)} /></FI>
        <FI label="SDL Contribution"><SelectInput value={f.sdl_contribution} onChange={v => upd("sdl_contribution", v)}><option>1%</option><option>Exempt</option></SelectInput></FI>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Checkbox checked={f.sdl_learnership} onChange={v => upd("sdl_learnership", v)} label="Learnership Agreement" />
        <Checkbox checked={f.sdl_apprenticeship} onChange={v => upd("sdl_apprenticeship", v)} label="Apprenticeship" />
      </div>

      {/* OID */}
      <div style={S.sectionTitle}><Ic.Activity /> OID (Occupational Injuries & Diseases)</div>
      <div style={S.row2}>
        <FI label="OID Classification" icon={<Ic.Hash />}><TextInput value={f.oid_classification} onChange={v => upd("oid_classification", v)} placeholder="Occupation code" /></FI>
        <FI label="Disability %" icon={<Ic.Activity />}><TextInput type="number" value={f.oid_disability_pct} onChange={v => upd("oid_disability_pct", v)} placeholder="0" /></FI>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Checkbox checked={f.oid_exclude} onChange={v => upd("oid_exclude", v)} label="Exclude from OID report" />
        <Checkbox checked={f.oid_modified_duty} onChange={v => upd("oid_modified_duty", v)} label="Modified duty required" />
      </div>
      {f.oid_return_date && <FI label="Return to Work Date"><TextInput type="date" value={f.oid_return_date} onChange={v => upd("oid_return_date", v)} /></FI>}
    </div>
  );
}

function Tab4Payment({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const monthly = f.annual_salary ? (parseFloat(f.annual_salary) / 12).toFixed(2) : "";

  const addAllowance = () => upd("allowances", [...f.allowances, { type: allowanceTypes[0], taxable: true, calcMethod: "fixed", amount: 0 }]);
  const removeAllowance = (i: number) => upd("allowances", f.allowances.filter((_, idx) => idx !== i));
  const updateAllowance = (i: number, key: keyof Allowance, val: any) => upd("allowances", f.allowances.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  const addDeduction = () => upd("deductions", [...f.deductions, { type: deductionTypes[0], mandatory: false, amount: 0 }]);
  const removeDeduction = (i: number) => upd("deductions", f.deductions.filter((_, idx) => idx !== i));
  const updateDeduction = (i: number, key: keyof Deduction, val: any) => upd("deductions", f.deductions.map((d, idx) => idx === i ? { ...d, [key]: val } : d));

  return (
    <div>
      <div style={S.sectionTitle}><Ic.Dollar /> Payment Method</div>
      <div style={S.row2}>
        <FI label="Payment Method" required>
          <RadioGroup value={f.payment_method} onChange={v => upd("payment_method", v as PaymentMethod)}
            options={["Bank Transfer","Cash","Cheque"]} horizontal />
        </FI>
        <FI label="Payment Frequency"><SelectInput value={f.payment_frequency} onChange={v => upd("payment_frequency", v)}>{["Weekly","Bi-weekly","Semi-monthly","Monthly"].map(x => <option key={x}>{x}</option>)}</SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="Payment Day"><SelectInput value={f.payment_day} onChange={v => upd("payment_day", v)}>{["Monday","Tuesday","Wednesday","Thursday","Friday"].map(d => <option key={d}>{d}</option>)}</SelectInput></FI>
        <FI label="Currency"><SelectInput value={f.payment_currency} onChange={v => upd("payment_currency", v)}>{["ZAR","USD","GBP","EUR"].map(c => <option key={c}>{c}</option>)}</SelectInput></FI>
      </div>

      {f.payment_method === "Bank Transfer" && (
        <>
          <div style={S.sectionTitle}><Ic.CreditCard /> Bank Details</div>
          <div style={S.row2}>
            <FI label="Bank Name" required icon={<Ic.CreditCard />}><SelectInput value={f.bank_name} onChange={v => upd("bank_name", v)}><option value="">Select Bank</option>{ZAF_BANKS.map(b => <option key={b}>{b}</option>)}</SelectInput></FI>
            <FI label="Branch Name" icon={<Ic.MapPin />}><TextInput value={f.bank_branch} onChange={v => upd("bank_branch", v)} /></FI>
          </div>
          <div style={S.row2}>
            <FI label="Branch Code (6 digits)" required icon={<Ic.Hash />}><TextInput value={f.bank_branch_code} onChange={v => upd("bank_branch_code", v)} maxLength={6} /></FI>
            <FI label="Account Type" required><SelectInput value={f.bank_account_type} onChange={v => upd("bank_account_type", v)}>{["Cheque","Savings","Transmission","Investment"].map(t => <option key={t}>{t}</option>)}</SelectInput></FI>
          </div>
          <FI label="Account Holder Name" required icon={<Ic.User />}><TextInput value={f.bank_account_holder} onChange={v => upd("bank_account_holder", v)} /></FI>
          <div style={S.row2}>
            <FI label="Account Number" required icon={<Ic.Hash />}><TextInput value={f.bank_account_number} onChange={v => upd("bank_account_number", v)} /></FI>
            <FI label="Confirm Account Number" required icon={<Ic.Hash />}>
              <TextInput value={f.bank_account_confirm} onChange={v => upd("bank_account_confirm", v)} />
              {f.bank_account_confirm && f.bank_account_number !== f.bank_account_confirm &&
                <div style={{ color: "#f04438", fontSize: 11, marginTop: 4 }}>⚠ Account numbers do not match</div>}
            </FI>
          </div>
          <FI label="SWIFT / BIC Code (for international transfers)" icon={<Ic.Hash />}><TextInput value={f.bank_swift} onChange={v => upd("bank_swift", v)} /></FI>
        </>
      )}

      <div style={S.sectionTitle}><Ic.Dollar /> Compensation Structure</div>
      <div style={S.row2}>
        <FI label="Annual Salary (R)" required icon={<Ic.Dollar />}>
          <TextInput type="number" value={f.annual_salary} onChange={v => {
            upd("annual_salary", v);
            upd("monthly_salary", v ? (parseFloat(v) / 12).toFixed(2) : "");
          }} placeholder="360000" />
        </FI>
        <FI label="Monthly Salary (R) — auto" icon={<Ic.Dollar />}>
          <TextInput type="number" value={f.monthly_salary} onChange={v => {
            upd("monthly_salary", v);
            upd("annual_salary", v ? (parseFloat(v) * 12).toFixed(2) : "");
          }} placeholder="30000" />
        </FI>
      </div>
      {f.annual_salary && (
        <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#667085", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[["Weekly", (parseFloat(f.annual_salary) / 52).toFixed(2)], ["Daily", (parseFloat(f.annual_salary) / 260).toFixed(2)], ["Hourly", (parseFloat(f.annual_salary) / 2080).toFixed(2)], ["Overtime (1.5x)", (parseFloat(f.annual_salary) / 2080 * 1.5).toFixed(2)]].map(([label, val]) => (
            <div key={label as string}><div style={{ fontWeight: 600, color: "#344054" }}>R {parseFloat(val as string).toLocaleString()}</div><div>{label}</div></div>
          ))}
        </div>
      )}

      <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Ic.Plus /> Allowances</span>
        <button type="button" onClick={addAllowance} style={S.btn("secondary")}><Ic.Plus /> Add</button>
      </div>
      {f.allowances.map((a, i) => (
        <div key={i} style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <FI label="Allowance Type">
              <SelectInput value={a.type} onChange={v => updateAllowance(i, "type", v)}>
                {allowanceTypes.map(t => <option key={t}>{t}</option>)}
              </SelectInput>
            </FI>
            <FI label="Amount (R)"><TextInput type="number" value={String(a.amount)} onChange={v => updateAllowance(i, "amount", parseFloat(v) || 0)} /></FI>
            <FI label="Taxable?">
              <RadioGroup value={a.taxable ? "Yes" : "No"} onChange={v => updateAllowance(i, "taxable", v === "Yes")} options={["Yes","No"]} horizontal />
            </FI>
            <button type="button" onClick={() => removeAllowance(i)} style={{ ...S.btn("danger"), padding: "8px 10px", alignSelf: "flex-end", marginBottom: 16 }}><Ic.Trash /></button>
          </div>
        </div>
      ))}
      {f.allowances.length === 0 && <div style={{ color: "#98a2b3", fontSize: 12, marginBottom: 16 }}>No allowances added yet.</div>}

      <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Ic.Trash /> Deductions</span>
        <button type="button" onClick={addDeduction} style={S.btn("secondary")}><Ic.Plus /> Add</button>
      </div>
      {f.deductions.map((d, i) => (
        <div key={i} style={{ background: "#fff8f8", border: "1px solid #fee4e2", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, alignItems: "end" }}>
            <FI label="Deduction Type">
              <SelectInput value={d.type} onChange={v => updateDeduction(i, "type", v)}>
                {deductionTypes.map(t => <option key={t}>{t}</option>)}
              </SelectInput>
            </FI>
            <FI label="Amount (R)"><TextInput type="number" value={String(d.amount)} onChange={v => updateDeduction(i, "amount", parseFloat(v) || 0)} /></FI>
            <button type="button" onClick={() => removeDeduction(i)} style={{ ...S.btn("danger"), padding: "8px 10px", alignSelf: "flex-end", marginBottom: 16 }}><Ic.Trash /></button>
          </div>
        </div>
      ))}
      {f.deductions.length === 0 && <div style={{ color: "#98a2b3", fontSize: 12, marginBottom: 16 }}>No deductions added yet.</div>}

      <div style={S.sectionTitle}><Ic.Lock /> Account Setup</div>
      <div style={S.row2}>
        <FI label="Password" icon={<Ic.Lock />}><TextInput type="password" value={f.password} onChange={v => upd("password", v)} placeholder="Min. 6 characters" /></FI>
        <FI label="Confirm Password" icon={<Ic.Lock />}><TextInput type="password" value={f.confirm_password} onChange={v => upd("confirm_password", v)} placeholder="Re-enter password" /></FI>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Checkbox checked={f.create_account} onChange={v => upd("create_account", v)} label="Create system account" sub="Employee can log in with their email and password" />
        <Checkbox checked={f.send_email} onChange={v => upd("send_email", v)} label="Send welcome email" sub="Email credentials to employee" />
      </div>
    </div>
  );
}

function Tab5ETI({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const age = calcAge(f.date_of_birth);
  const wage = parseFloat(f.eti_remuneration || f.monthly_salary || "0");
  const months = f.start_date ? Math.max(0, Math.floor((Date.now() - new Date(f.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
  const etiAmt = calcETI(wage, months);
  const ageEligible = age > 0 && age < 30;

  return (
    <div>
      <div style={S.notice("info")}><Ic.Info />
        <div><strong>ETI (Employment Tax Incentive):</strong> A government incentive to encourage youth employment. Employers can reduce PAYE by the ETI amount for qualifying employees under 30, earning under R8,000/month.</div>
      </div>

      <div style={S.sectionTitle}><Ic.CheckCircle /> Eligibility Criteria</div>
      {age > 0 && (
        <div style={S.notice(ageEligible ? "success" : "warn")}>
          {ageEligible ? <Ic.CheckCircle /> : <Ic.AlertCircle />}
          <div>Employee is <strong>{age} years old</strong>. {ageEligible ? "Age-eligible for ETI." : age < 30 ? "Partially eligible." : "Not eligible — over 29."}</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        <Checkbox checked={f.eti_employed_after_2013} onChange={v => upd("eti_employed_after_2013", v)} label="Employed after 1 October 2013" />
        <Checkbox checked={f.eti_valid_id} onChange={v => upd("eti_valid_id", v)} label="Has valid South African ID or passport" />
        <Checkbox checked={f.eti_not_connected} onChange={v => upd("eti_not_connected", v)} label="Not a connected person to employer" />
        <Checkbox checked={f.eti_not_domestic} onChange={v => upd("eti_not_domestic", v)} label="Not a domestic worker" />
        <Checkbox checked={f.eti_not_broker} onChange={v => upd("eti_not_broker", v)} label="Not a labour broker" />
        <Checkbox checked={f.eti_not_contractor} onChange={v => upd("eti_not_contractor", v)} label="Not an independent contractor" />
      </div>

      <div style={S.sectionTitle}><Ic.Activity /> Monthly ETI Declaration</div>
      <div style={S.row3}>
        <FI label="Hours Worked in Month"><TextInput type="number" value={f.eti_hours_worked} onChange={v => upd("eti_hours_worked", v)} placeholder="230 (max for full claim)" /></FI>
        <FI label="Days Worked"><TextInput type="number" value={f.eti_days_worked} onChange={v => upd("eti_days_worked", v)} placeholder="22" /></FI>
        <FI label="Remuneration Paid (R)" icon={<Ic.Dollar />}><TextInput type="number" value={f.eti_remuneration} onChange={v => upd("eti_remuneration", v)} placeholder="Monthly amount" /></FI>
      </div>
      <div style={S.row2}>
        <FI label="Declaration Date"><TextInput type="date" value={f.eti_declaration_date} onChange={v => upd("eti_declaration_date", v)} /></FI>
        <FI label="Declaration Signed By" icon={<Ic.User />}><TextInput value={f.eti_signed_by} onChange={v => upd("eti_signed_by", v)} /></FI>
      </div>

      <div style={S.sectionTitle}><Ic.Zap /> ETI Calculation Summary</div>
      <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            ["Monthly Wage", `R ${wage.toLocaleString()}`],
            ["Months Employed", months.toString()],
            ["ETI Claim Amount", `R ${etiAmt.toLocaleString()}`],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center", padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e4e7ec" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: etiAmt > 0 ? "#12b76a" : "#344054" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        {etiAmt === 0 && wage > 0 && <div style={{ marginTop: 12, color: "#667085", fontSize: 12, textAlign: "center" }}>No ETI applicable — wage exceeds R8,000 or employee has been with company 24+ months.</div>}
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 16 }}>ETI Scale Reference</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr style={{ background: "#f9fafb" }}>
          {["Period","Monthly Wage < R6,000","Monthly Wage R6,001–R8,000","Monthly Wage > R8,000"].map(h => (
            <th key={h} style={{ padding: "8px 12px", border: "1px solid #e4e7ec", textAlign: "left", color: "#344054", fontWeight: 600 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {[["First 12 months","R1,500","Sliding scale","R0"],["Next 12 months","R1,000","Sliding scale","R0"],["After 24 months","R0","R0","R0"]].map(([period, ...vals], i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
              <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec", fontWeight: 500 }}>{period}</td>
              {vals.map((v, j) => <td key={j} style={{ padding: "8px 12px", border: "1px solid #e4e7ec", color: v.startsWith("R0") ? "#98a2b3" : "#12b76a", fontWeight: v.startsWith("R0") ? 400 : 600 }}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tab6Hours({ f, upd }: { f: Employee; upd: (k: keyof Employee, v: any) => void }) {
  const hpd = parseFloat(f.hours_per_day || "8");
  const dpw = parseFloat(f.days_per_week || "5");
  const hpw = hpd * dpw;
  const hpm = (hpw * 52 / 12).toFixed(1);

  const benefits = benefitsForType(f.employment_type);

  return (
    <div>
      <div style={S.sectionTitle}><Ic.Clock /> Standard Hours</div>
      <div style={S.row2}>
        <FI label="Working Hours Per Day"><TextInput type="number" value={f.hours_per_day} onChange={v => upd("hours_per_day", v)} placeholder="8" /></FI>
        <FI label="Working Days Per Week"><TextInput type="number" value={f.days_per_week} onChange={v => upd("days_per_week", v)} placeholder="5" /></FI>
      </div>
      <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
        {[["Hours/Week", hpw.toFixed(0)], ["Hours/Month", hpm], ["Annual Hours", (hpw * 52).toFixed(0)]].map(([label, val]) => (
          <div key={label}><div style={{ fontWeight: 700, fontSize: 16, color: "#1d2939" }}>{val}</div><div style={{ color: "#667085" }}>{label}</div></div>
        ))}
      </div>
      <div style={S.row2}>
        <FI label="Lunch Break (hours)"><TextInput type="number" value={f.lunch_break} onChange={v => upd("lunch_break", v)} placeholder="1" /></FI>
        <FI label="Paid Break (hours)"><TextInput type="number" value={f.paid_break} onChange={v => upd("paid_break", v)} placeholder="0" /></FI>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <Checkbox checked={f.flexi_time} onChange={v => upd("flexi_time", v)} label="Flexi-time allowed" sub="Employee can vary start/end times" />
        <Checkbox checked={f.compressed_week} onChange={v => upd("compressed_week", v)} label="Compressed work week" sub="E.g. 4 days × 10 hours" />
      </div>

      <div style={S.sectionTitle}><Ic.Activity /> Overtime Rules</div>
      <div style={S.row3}>
        <FI label="Weekday OT Rate"><SelectInput value={f.ot_weekday_rate} onChange={v => upd("ot_weekday_rate", v)}><option>1.5x</option><option>2x</option></SelectInput></FI>
        <FI label="Saturday OT Rate"><SelectInput value={f.ot_saturday_rate} onChange={v => upd("ot_saturday_rate", v)}><option>1.5x</option><option>2x</option></SelectInput></FI>
        <FI label="Max OT/Week (hrs)"><SelectInput value={f.ot_max_per_week} onChange={v => upd("ot_max_per_week", v)}><option>10</option><option>15</option><option>Unlimited</option></SelectInput></FI>
      </div>
      <div style={S.row2}>
        <FI label="OT Meal Allowance (R)"><TextInput type="number" value={f.ot_meal_allowance} onChange={v => upd("ot_meal_allowance", v)} placeholder="Per shift" /></FI>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <Checkbox checked={f.ot_approval} onChange={v => upd("ot_approval", v)} label="Overtime requires manager approval" />
        <Checkbox checked={f.ot_transport} onChange={v => upd("ot_transport", v)} label="Transport provided after late shift" />
      </div>

      <div style={S.sectionTitle}><Ic.CheckCircle /> Leave Entitlements Summary</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f9fafb" }}>
            {["Leave Type","Entitlement","Applicable"].map(h => (
              <th key={h} style={{ padding: "8px 12px", border: "1px solid #e4e7ec", textAlign: "left", color: "#344054", fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              ["Annual Leave", f.leave_entitlement || "15–30 days", benefits.leave],
              ["Sick Leave", "30 days per 36 months", benefits.leave],
              ["Family Responsibility", f.family_leave || "3 days/year", benefits.leave],
              ["Maternity Leave", "4 months", true],
              ["Paternity Leave", "10 days", true],
              ["Study Leave", "By arrangement", benefits.leave],
              ["Unpaid Leave", "Available on request", true],
            ].map(([type, entitlement, applicable]) => (
              <tr key={type as string}>
                <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec", fontWeight: 500 }}>{type as string}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec", color: "#667085" }}>{applicable ? entitlement as string : "Not applicable"}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #e4e7ec" }}>
                  <span style={{ ...S.badge(applicable ? "#12b76a" : "#98a2b3") }}>{applicable ? "✓ Yes" : "✗ No"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 20 }}><Ic.Layers /> Benefits Matrix for {f.employment_type}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          ["Medical Aid", benefits.medical],
          ["Retirement Fund", benefits.retirement],
          ["Annual Leave", benefits.leave],
          ["UIF", benefits.uif],
          ["Bonus Eligible", benefits.bonus],
          ["Training Budget", benefits.leave],
        ].map(([label, has]) => (
          <div key={label as string} style={{
            padding: "10px 14px", borderRadius: 8,
            background: has ? "#ecfdf3" : "#f9fafb",
            border: `1px solid ${has ? "#abefc6" : "#e4e7ec"}`,
            display: "flex", alignItems: "center", gap: 8, fontSize: 12,
          }}>
            <span style={{ color: has ? "#12b76a" : "#98a2b3" }}>{has ? <Ic.CheckCircle /> : <Ic.X />}</span>
            <span style={{ fontWeight: 500, color: has ? "#166534" : "#667085" }}>{label as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Queue Item Component ─────────────────────────────────────────────────────
function QueueCard({ item, index, onRemove }: { item: QueueItem; index: number; onRemove: () => void }) {
  const age = calcAge(item.date_of_birth);
  const benefits = benefitsForType(item.employment_type);
  const fullName = getFullName(item);
  const initials = fullName
    ? fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join("")
    : "—";
  return (
    <div className="me-queue-card" style={{
      background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12,
      marginBottom: 10, overflow: "hidden",
      boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
    }}>
      <div style={{
        padding: "5px 7px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${BRAND.borderSoft}`,
        background: `linear-gradient(180deg, ${BRAND.tint50} 0%, #ffffff 100%)`,
      }}>
        <span style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, letterSpacing: 0.4,
        }}>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: BRAND.ink, fontSize: 13, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fullName || "Untitled employee"}
          </div>
          <div style={{ fontSize: 11, color: BRAND.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.email || "No email"}
          </div>
        </div>
        <span style={S.badge(BRAND.primary)}>#{index + 1}</span>
        <button className="me-btn" onClick={onRemove} title="Remove from queue" style={{
          background: "transparent", border: "none", padding: 6, borderRadius: 8,
          color: BRAND.danger, cursor: "pointer", display: "flex",
        }}><Ic.Trash /></button>
      </div>
      <div style={{
        padding: "10px 14px", fontSize: 11.5, color: BRAND.textMuted,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px",
      }}>
        <div><span style={{ color: BRAND.textFaint }}>Dept</span> · {item.department || "—"}</div>
        <div><span style={{ color: BRAND.textFaint }}>Position</span> · {item.position || "—"}</div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          <span style={S.badge(item.employment_type === "Intern" ? "#f79009" : BRAND.success)}>{item.employment_type}</span>
          {age > 0 && <span style={S.badge(age < 30 ? "#f59e0b" : BRAND.textMuted)}>Age {age}{age < 30 ? " · ETI" : ""}</span>}
          {uifRequired(item.employment_type) && <span style={S.badge(BRAND.primary)}>UIF</span>}
          {benefits.medical && <span style={S.badge("#7c3aed")}>Medical</span>}
          <span style={S.badge(BRAND.textMuted)}>{item.payment_method}</span>
        </div>
        {item.start_date && (
          <div style={{ gridColumn: "1 / -1", marginTop: 4, color: BRAND.textFaint }}>
            Start · {item.start_date}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table Mode ───────────────────────────────────────────────────────────────
// TableRowData type is imported from shared/utils/manageEmployees.

function TableModeRow({ data, index, onChange, onRemove }: { data: Partial<TableRowData>; index: number; onChange: (k: keyof TableRowData, v: string) => void; onRemove: () => void }) {
  const inp: React.CSSProperties = { padding: "6px 8px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12.5, outline: "none", width: "100%", boxSizing: "border-box", minWidth: 90 };
  const sel: React.CSSProperties = { ...inp, appearance: "none" as const };
  return (
    <tr style={{ background: index % 2 === 0 ? "#fff" : "#f9fafb", height: "auto" }}>
      <td style={{ padding: "6px 8px", textAlign: "center", color: "#667085", fontSize: 12, fontWeight: 600 }}>{index}</td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 150 }} placeholder="First name" value={data.full_name || ""} onChange={e => onChange("full_name", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 80 }} placeholder="Surname" value={data.phone || ""} onChange={e => onChange("phone", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 160 }} type="email" placeholder="email@company.com" value={data.email || ""} onChange={e => onChange("email", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}>
        <select style={{ ...sel, minWidth: 100 }} value={data.identification_type || "RSA ID Number"} onChange={e => onChange("identification_type", e.target.value)}>
          {["RSA ID Number","Passport Number","Asylum Seeker Permit","Refugee Permit"].map(t => <option key={t} value={t}>{t === "RSA ID Number" ? "RSA ID" : t === "Passport Number" ? "Passport" : t}</option>)}
        </select>
      </td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 120 }} placeholder="ID/Passport" value={data.id_number || ""} onChange={e => onChange("id_number", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 110 }} placeholder="0821234567" value={data.phone || ""} onChange={e => onChange("phone", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 120 }} placeholder="Gender" value={data.gender || ""} onChange={e => onChange("gender", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 120 }} type="date" value={data.date_of_birth || ""} onChange={e => onChange("date_of_birth", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 160 }} placeholder="Street address" value={data.address_street || ""} onChange={e => onChange("address_street", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 100 }} placeholder="City" value={data.address_city || ""} onChange={e => onChange("address_city", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}>
        <select style={{ ...sel, minWidth: 110 }} value={data.address_province || ""} onChange={e => onChange("address_province", e.target.value)}>
          <option value="">Province</option>{provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 70 }} placeholder="2000" maxLength={4} value={data.address_postal_code || ""} onChange={e => onChange("address_postal_code", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}>
        <select style={{ ...sel, minWidth: 120 }} value={data.department || ""} onChange={e => onChange("department", e.target.value)}>
          <option value="">Dept</option>{departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 130 }} placeholder="Position" value={data.position || ""} onChange={e => onChange("position", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}>
        <select style={{ ...sel, minWidth: 110 }} value={data.employment_type || ""} onChange={e => onChange("employment_type", e.target.value)}>
          <option value="">Type</option>{(["Full Time","Part Time","Contract","Intern","Temporary","Casual","Probation"] as EmploymentType[]).map(t => <option key={t}>{t}</option>)}
        </select>
      </td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 120 }} type="date" value={data.start_date || ""} onChange={e => onChange("start_date", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}><input style={{ ...inp, minWidth: 100 }} type="number" placeholder="Annual salary" value={data.annual_salary || ""} onChange={e => onChange("annual_salary", e.target.value)} /></td>
      <td style={{ padding: "5px 7px" }}>
        <select style={{ ...sel, minWidth: 100 }} value={data.payment_method || "Bank Transfer"} onChange={e => onChange("payment_method", e.target.value)}>
          {["Bank Transfer","Cash","Cheque"].map(m => <option key={m}>{m}</option>)}
        </select>
      </td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <button type="button" onClick={onRemove} style={{ ...S.btn("danger"), padding: "4px 8px" }}><Ic.Trash /></button>
      </td>
    </tr>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ManageEmployeesContent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("form");
  const [activeTab, setActiveTab] = useState<FormTab>(1);
  const [form, setForm] = useState<Employee>(defaultForm());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [tableRows, setTableRows] = useState<Partial<TableRowData>[]>([]);
  const [bulkDept, setBulkDept] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  const upd = useCallback((k: keyof Employee, v: any) => setForm(prev => ({ ...prev, [k]: v })), []);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const clearForm = () => { setForm(defaultForm()); setActiveTab(1); };

  const addToQueue = (continueAdding = false) => {
    const result = validateEmployee(form);
    if (!result.valid) { alert(result.errors.join("\n")); return; }
    setQueue(prev => [...prev, toQueueItem(form)]);
    showToast(`${getFullName(form)} added to queue!`);
    if (continueAdding) clearForm();
  };

  const processQueue = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("Session expired. Please login again."); return; }
    if (queue.length === 0) { alert("No employees in queue"); return; }
    if (!window.confirm(`Process ${queue.length} employee(s)? This will add them to the database.`)) return;

    setProcessing(true);
    let successCount = 0;
    let failCount = 0;
    for (const emp of queue) {
      const result = await createEmployeeWithOnboarding(emp, token);
      if (result.ok) {
        successCount++;
      } else {
        failCount++;
        console.error(`Failed to create ${emp.email}: ${result.message || "unknown error"}`);
      }
    }

    showToast(
      `${successCount} employee(s) added${failCount > 0 ? ` · ${failCount} failed` : ""}.`,
      failCount > 0 ? "error" : "success",
    );
    setQueue([]);
    clearForm();
    setProcessing(false);
  };

  const saveDraft = () => {
    if (queue.length === 0) { alert("No employees in queue"); return; }
    saveQueueDraft(queue);
    showToast("Draft saved locally.");
  };

  const tabs: { label: string; icon: React.ReactNode }[] = [
    { label: "Personal", icon: <Ic.User /> },
    { label: "Contact", icon: <Ic.Phone /> },
    { label: "Employment", icon: <Ic.Briefcase /> },
    { label: "Payment", icon: <Ic.Dollar /> },
    { label: "ETI", icon: <Ic.Zap /> },
    { label: "Hours", icon: <Ic.Clock /> },
  ];

  const MODE_OPTIONS: { id: Mode; label: string; blurb: string; icon: React.ReactNode }[] = [
    { id: "form",   label: "Form Mode",       blurb: "Capture one employee in detail",   icon: <Ic.Edit />   },
    { id: "table",  label: "Table Mode",      blurb: "Bulk-enter rows in a spreadsheet", icon: <Ic.Grid />   },
    { id: "upload", label: "Upload Document", blurb: "Auto-extract from PDF / Excel",    icon: <Ic.Upload /> },
  ];

  // Sibling-page card styling (matches ManagersPage / EmployeesPage exactly)
  const siblingCard: React.CSSProperties = {
    borderRadius: 10,
    padding: 5,
    borderWidth: 2, borderStyle: "solid", borderColor: BRAND.cardBorder,
    boxShadow: BRAND.cardShadow,
    background: "#fff",
  };
  const siblingCardTitle: React.CSSProperties = {
    width: "100%", display: "flex", padding: 5,
    justifyContent: "center", alignItems: "center",
    fontSize: 16, fontWeight: 800, color: BRAND.ink,
  };
  // Pill button (mirrors ButtonBtn / SearchInput pill radius 20)
  const pillBtn = (variant: "primary" | "secondary" | "ghost" = "primary"): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 18px", borderRadius: 20,
    fontWeight: 600, fontSize: 13, cursor: "pointer",
    borderWidth: 2, borderStyle: "solid",
    background:    variant === "primary" ? BRAND.primary : "#fff",
    color:         variant === "primary" ? "#fff"        : BRAND.text,
    borderColor:   variant === "primary" ? BRAND.primary : BRAND.cardBorder,
    boxShadow:     variant === "primary" ? BRAND.primaryGlow : "none",
    transition: "transform .12s ease, box-shadow .12s ease",
    opacity: variant === "ghost" ? 0.85 : 1,
  });

  return (
    <div className="container-fluid mt-3 mb-5 w-100" style={{ padding: "0 12px" }}>
      {/* Scoped CSS for interactive states that cannot be expressed inline */}
      <style>{`
        .me-page input:not([type=checkbox]):not([type=radio]):focus,
        .me-page select:focus,
        .me-page textarea:focus {
          border-color: ${BRAND.primary} !important;
          box-shadow: 0 0 0 4px ${BRAND.primary}1f !important;
        }
        .me-page input:hover:not(:focus):not([readonly]),
        .me-page select:hover:not(:focus),
        .me-page textarea:hover:not(:focus) {
          border-color: ${BRAND.tint300} !important;
        }
        .me-btn { transition: transform .12s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease; }
        .me-btn:hover { transform: translateY(-1px); }
        .me-btn:active { transform: translateY(0); }
        .me-tile { transition: transform .15s ease, border-color .15s ease, background .15s ease, box-shadow .15s ease; }
        .me-tile:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(15,23,42,0.06); border-color: ${BRAND.tint300} !important; }
        .me-step { transition: color .18s ease, background .18s ease; }
        .me-step:hover .me-step-num { box-shadow: 0 0 0 4px ${BRAND.primary}1a; }
        .me-queue-card { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .me-queue-card:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(15,23,42,0.06); }
        .me-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .me-scroll::-webkit-scrollbar-track { background: transparent; }
        .me-scroll::-webkit-scrollbar-thumb { background: ${BRAND.tint200}; border-radius: 999px; }
        .me-scroll::-webkit-scrollbar-thumb:hover { background: ${BRAND.tint300}; }
        @keyframes meFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .me-fade { animation: meFadeIn .25s ease both; }
      `}</style>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 84, right: 24, zIndex: 9999,
          padding: "12px 18px", borderRadius: 12,
          background: toast.type === "success" ? BRAND.successBg : "#fef2f2",
          color:      toast.type === "success" ? "#027a48"        : "#b42318",
          border: `1px solid ${toast.type === "success" ? BRAND.successLine : "#fecaca"}`,
          display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500,
          boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
        }}>
          {toast.type === "success" ? <Ic.CheckCircle /> : <Ic.AlertCircle />}
          {toast.msg}
        </div>
      )}

      <div className="me-page" style={{ width: "100%" }}>
        {/* ── Top action row — mirrors sibling pages exactly ──────────────── */}
        <div className="mt-3 mb-3" style={{
          width: "100%",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 16, flexWrap: "wrap",
        }}>
          {/* Title pill — same dimensions as sibling SearchInput */}
          <div style={{
            width: 300, height: "3em",
            display: "flex", alignItems: "center",
            background: "#ffffff",
            paddingTop: ".58rem", paddingBottom: ".5rem",
            paddingLeft: "1rem", paddingRight: "1rem",
            marginRight: 32,
            border: "solid", borderWidth: 0.1,
            borderRadius: 20,
            gap: 10,
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: BRAND.primary, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}><Ic.Users /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.ink, lineHeight: 1.15 }}>
                Manage Employees
              </div>
              <div style={{ fontSize: 11, color: BRAND.textMuted, lineHeight: 1.2 }}>
                UIF · ETI · SDL · OID compliance
              </div>
            </div>
          </div>

          {/* Right actions — pill buttons mirroring sibling ButtonBtn */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 18, fontWeight: "bolder" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 20,
              background: BRAND.tint100, color: BRAND.primaryDeep,
              border: `2px solid ${BRAND.tint200}`,
              fontSize: 13, fontWeight: 700,
            }}>
              <Ic.Inbox /> {queue.length} in queue
            </span>
            <button className="me-btn" onClick={saveDraft} style={pillBtn("secondary")}><Ic.Save /> Save Draft</button>
            <button className="me-btn" onClick={() => window.history.back()} aria-label="Close" title="Close"
              style={{ ...pillBtn("secondary"), padding: "9px 12px" }}><Ic.X /></button>
          </div>
        </div>

        {/* ── Mode Selector — sibling-style bordered Card ─────────────────── */}
        <div style={{ ...siblingCard, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {MODE_OPTIONS.map(opt => {
              const active = mode === opt.id;
              return (
                <button key={opt.id} type="button" className="me-tile" onClick={() => setMode(opt.id)} style={{
                  textAlign: "left", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  background: active ? BRAND.tint100 : "#fff",
                  border: `2px solid ${active ? BRAND.primary : BRAND.cardBorder}`,
                  position: "relative",
                }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: active ? BRAND.primary : `${BRAND.primary}1a`,
                    color: active ? "#fff" : BRAND.primary,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{opt.icon}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{
                      display: "block", fontSize: 14, fontWeight: 700,
                      color: active ? BRAND.primaryDeep : BRAND.ink,
                    }}>{opt.label}</span>
                    <span style={{ display: "block", fontSize: 12, color: BRAND.textMuted, marginTop: 2 }}>
                      {opt.blurb}
                    </span>
                  </span>
                  {active && (
                    <span aria-hidden style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: BRAND.primary, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}><Ic.Check /></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left Panel — sibling-style bordered Card with centered title */}
        <div style={{ ...siblingCard, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ ...siblingCardTitle, padding: "14px 5px 6px" }}>
            {mode === "form" ? "Employee Form" : mode === "table" ? "Bulk Entry Table" : "Document Upload"}
          </div>
          <div style={{
            textAlign: "center", fontSize: 12, color: BRAND.textMuted,
            padding: "0 16px 12px", borderBottom: `1px solid ${BRAND.borderSoft}`,
          }}>
            {mode === "form"
              ? (getFullName(form) ? <>Editing: <strong style={{ color: BRAND.text }}>{getFullName(form)}</strong> · Section <strong style={{ color: BRAND.primaryDeep }}>{activeTab}</strong> of 6</> : <>Fill in all 6 sections, then add to the queue</>)
              : mode === "table"
                ? <>{tableRows.length} draft row{tableRows.length === 1 ? "" : "s"}</>
                : <>Drop a PDF, DOCX, or spreadsheet — we&apos;ll extract the fields</>}
          </div>

          {/* FORM MODE */}
          {mode === "form" && (
            <>
              {/* Numbered stepper */}
              <div style={{ padding: "18px 24px 8px", background: "#fff" }}>
                <div className="me-scroll" style={{ overflowX: "auto", paddingBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: "max-content" }}>
                    {tabs.map((tab, i) => {
                      const tabNum = (i + 1) as FormTab;
                      const active = activeTab === tabNum;
                      const completed = tabNum < activeTab;
                      return (
                        <React.Fragment key={i}>
                          <button type="button" className="me-step" onClick={() => setActiveTab(tabNum)} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 14px 8px 8px", border: "none", borderRadius: 999,
                            background: active ? BRAND.tint100 : "transparent",
                            cursor: "pointer", whiteSpace: "nowrap",
                            color: active ? BRAND.primaryDeep : completed ? BRAND.ink : BRAND.textMuted,
                          }}>
                            <span className="me-step-num" style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 800,
                              background: active
                                ? `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`
                                : completed ? BRAND.success : "#fff",
                              color: active || completed ? "#fff" : BRAND.textMuted,
                              border: active ? "none" : `1.5px solid ${completed ? BRAND.success : BRAND.border}`,
                              boxShadow: active ? BRAND.primaryGlow : "none",
                              transition: "background .2s ease, box-shadow .2s ease",
                            }}>
                              {completed ? <Ic.Check /> : tabNum}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: active ? 700 : 600 }}>
                              <span style={{ opacity: 0.85 }}>{tab.icon}</span>
                              <span>{tab.label}</span>
                            </span>
                          </button>
                          {i < tabs.length - 1 && (
                            <span aria-hidden style={{
                              flex: "0 0 18px", height: 2, borderRadius: 2,
                              background: tabNum < activeTab ? BRAND.success : BRAND.border,
                            }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                {/* Live progress bar */}
                <div style={{
                  marginTop: 12, height: 4, borderRadius: 999,
                  background: BRAND.tint100, overflow: "hidden",
                }}>
                  <div style={{
                    width: `${(activeTab / 6) * 100}%`, height: "100%",
                    background: `linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
                    borderRadius: 999,
                    transition: "width .3s ease",
                  }} />
                </div>
              </div>

              {/* Tab Content */}
              <div key={activeTab} className="me-scroll me-fade" style={{
                padding: "20px 28px 28px", overflowY: "auto",
                maxHeight: "calc(100vh - 420px)",
              }}>
                {activeTab === 1 && <Tab1Personal f={form} upd={upd} />}
                {activeTab === 2 && <Tab2Contact f={form} upd={upd} />}
                {activeTab === 3 && <Tab3Employment f={form} upd={upd} />}
                {activeTab === 4 && <Tab4Payment f={form} upd={upd} />}
                {activeTab === 5 && <Tab5ETI f={form} upd={upd} />}
                {activeTab === 6 && <Tab6Hours f={form} upd={upd} />}
              </div>

              {/* Tab Footer */}
              <div style={{
                padding: "14px 24px",
                borderTop: `1px solid ${BRAND.border}`,
                background: `linear-gradient(180deg, ${BRAND.tint50} 0%, #ffffff 100%)`,
                display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {activeTab > 1 && <button type="button" className="me-btn" onClick={() => setActiveTab(prev => (prev - 1) as FormTab)} style={S.btn("secondary")}><Ic.ChevronLeft /> Back</button>}
                  {activeTab < 6 && <button type="button" className="me-btn" onClick={() => setActiveTab(prev => (prev + 1) as FormTab)} style={S.btn("primary")}>Next <Ic.ChevronRight /></button>}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="me-btn" onClick={clearForm} style={S.btn("secondary")}><Ic.X /> Clear</button>
                  <button type="button" className="me-btn" onClick={() => addToQueue(true)} style={S.btn("primary")}><Ic.Plus /> Add &amp; Continue</button>
                  <button type="button" className="me-btn" onClick={() => addToQueue(false)} style={{ ...S.btn("success") }}><Ic.CheckCircle /> Add to Queue</button>
                </div>
              </div>
            </>
          )}

          {/* TABLE MODE */}
          {mode === "table" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f2f4f7" }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1d2939" }}>Table Mode</h3>
                  <p style={{ fontSize: 12, color: "#667085" }}>Enter multiple employees at once — scroll right to see all {20} columns</p>
                </div>
                <button type="button" onClick={() => setTableRows(prev => [...prev, {}])} style={S.btn("primary")}><Ic.Plus /> Add Row</button>
              </div>

              <div style={{ padding: "12px 20px" }}>
                <div style={S.notice("info")}><Ic.Info />
                  <div><strong>Wide Table:</strong> 20 columns including employment type, salary, payment method. <strong>Scroll right</strong> to fill all fields.</div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div style={{ padding: "0 20px 12px" }}>
                <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: 8, padding: "5px 7px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#344054", marginBottom: 8 }}><Ic.Sliders /> Bulk Actions — Apply to empty cells:</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select value={bulkDept} onChange={e => setBulkDept(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                      <option value="">Department</option>{departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select value={bulkType} onChange={e => setBulkType(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                      <option value="">Employment Type</option>{(["Full Time","Part Time","Contract","Intern","Temporary","Casual","Probation"] as EmploymentType[]).map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #d0d5dd", borderRadius: 6, fontSize: 12 }} />
                    <button type="button" onClick={() => {
                      setTableRows(prev => prev.map(row => ({
                        ...row,
                        department: row.department || bulkDept || row.department,
                        employment_type: row.employment_type || bulkType || row.employment_type,
                        start_date: row.start_date || bulkDate || row.start_date,
                      })));
                      showToast("Bulk values applied!");
                    }} style={S.btn("primary")}><Ic.Check /> Apply</button>
                  </div>
                </div>
              </div>

              <div className="me-scroll" style={{
                overflowX: "auto", overflowY: "auto",
                margin: "0 20px",
                maxHeight: 420,
                border: `1px solid ${BRAND.border}`, borderRadius: 8,
                background: "#fafafa",
              }}>
                <table style={{ minWidth: 2200, borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", position: "sticky", top: 0, zIndex: 1 }}>
                      {["#","First Name","Surname","Email","ID Type","ID/Passport","Phone","Gender","DOB","Street Address","City","Province","Postal","Department","Position","Emp. Type","Start Date","Annual Salary","Payment Method","Actions"].map(h => (
                        <th key={h} style={{ padding: "8px 8px", border: `1px solid ${BRAND.border}`, textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#344054", whiteSpace: "nowrap", background: "#f9fafb", letterSpacing: 0.2, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <TableModeRow key={i} data={row} index={i + 1}
                        onChange={(k, v) => setTableRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r))}
                        onRemove={() => setTableRows(prev => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                    {tableRows.length === 0 && (
                      <tr><td colSpan={20} style={{ padding: "32px 20px", textAlign: "center", color: BRAND.textFaint, fontSize: 13 }}>
                        <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: BRAND.tint300 }}><Ic.Inbox /></div>
                        No rows yet. Click <strong style={{ color: BRAND.text }}>Add Row</strong> to start entering employees.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: "16px 20px", borderTop: "1px solid #f2f4f7", display: "flex", gap: 10 }}>
                <button type="button" onClick={() => {
                  if (tableRows.length === 0) { alert("No rows to add"); return; }
                  const items = tableRows.map(queueItemFromTableRow);
                  setQueue(prev => [...prev, ...items]);
                  setTableRows([]);
                  showToast(`${items.length} employee(s) added to queue!`);
                }} style={S.btn("primary")}><Ic.ArrowRight /> Add All to Queue ({tableRows.length})</button>
              </div>
            </>
          )}

          {/* UPLOAD MODE */}
          {mode === "upload" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #f2f4f7" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1d2939" }}>Upload Document</h3>
                <span style={S.badge("#12b76a")}>Auto-extract data</span>
              </div>
              <div style={{ padding: 28 }}>
                <div style={S.notice("info")}><Ic.Info />
                  <div>Upload a PDF, Excel, CSV or Word document containing employee data. The system will extract employee information and add them to the queue for review.</div>
                </div>
                <div style={{
                  border: "2px dashed #d0d5dd", borderRadius: 12, padding: "60px 20px",
                  textAlign: "center", cursor: "pointer", background: "#f9fafb",
                  transition: "all 0.2s",
                }}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) document.getElementById("fileInput")?.click();
                  }}
                >
                  <div style={{ color: "#98a2b3", marginBottom: 16 }}><Ic.Upload /></div>
                  <h4 style={{ color: "#1d2939", marginBottom: 8, fontWeight: 600 }}>
                    {uploading ? "Processing Document..." : "Upload Employee Document"}
                  </h4>
                  <p style={{ color: "#667085", fontSize: 13, marginBottom: 4 }}>Drag & drop or click to upload</p>
                  <p style={{ color: "#98a2b3", fontSize: 12, marginBottom: 20 }}>Supports: PDF, Excel (.xlsx, .xls), CSV, Word (.docx)</p>
                  <input id="fileInput" type="file" accept=".pdf,.xlsx,.xls,.csv,.docx" onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const token = localStorage.getItem("token");
                    if (!token) { showToast("Session expired. Please login again.", "error"); return; }
                    setUploading(true);
                    const result = await extractEmployeeDocument(file, token);
                    if (result.ok && result.employees?.length) {
                      const extracted: QueueItem[] = result.employees.map(emp =>
                        toQueueItem({ ...defaultForm(), ...emp, employee_code: generateRandomEmployeeCode() } as Employee),
                      );
                      setQueue(prev => [...prev, ...extracted]);
                      showToast(`${extracted.length} employee(s) extracted and added to queue!`);
                      setMode("form");
                    } else {
                      showToast(result.message || "Extraction API not available — use Form or Table mode instead.", "error");
                    }
                    setUploading(false);
                  }} style={{ display: "none" }} />
                  <button type="button" onClick={e => { e.stopPropagation(); document.getElementById("fileInput")?.click(); }} style={S.btn("primary")}><Ic.Upload /> Choose File</button>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontWeight: 600, color: "#344054", fontSize: 13, marginBottom: 10 }}>Download Template</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {[["Excel Template","xlsx","#12b76a"],["CSV Template","csv","#667085"],["PDF Guide","pdf","#f04438"]].map(([label, ext, color]) => (
                      <button key={ext} type="button" style={{ padding: "10px 14px", border: `1px solid ${color}22`, borderRadius: 8, background: `${color}11`, color, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
                        ↓ {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel – Queue (sibling-style bordered Card with centered title) */}
        <div style={{
          ...siblingCard, padding: 0,
          display: "flex", flexDirection: "column",
          position: "sticky", top: 20, maxHeight: "calc(100vh - 44px)",
          overflow: "hidden",
        }}>
          <div style={{ ...siblingCardTitle, padding: "14px 5px 10px", gap: 10 }}>
            <span>Onboarding Queue</span>
            <span style={{
              background: BRAND.primary, color: "#fff",
              padding: "2px 10px", borderRadius: 999,
              fontSize: 12, fontWeight: 700, minWidth: 26, textAlign: "center",
              marginLeft: 8,
            }}>{queue.length}</span>
          </div>

          {/* Summary card */}
          <div style={{
            background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDark} 100%)`,
            margin: "16px 16px 0", borderRadius: 12, padding: "16px 18px", color: "#fff",
            boxShadow: "0 6px 18px rgba(15,107,142,0.20)",
            position: "relative", overflow: "hidden",
          }}>
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at 85% 0%, rgba(255,255,255,0.20) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Ic.Users />
              <div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>Employees Ready to Process</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{queue.length}</div>
              </div>
            </div>
            {queue.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["Full Time","Part Time","Contract","Intern"] as EmploymentType[]).map(t => {
                  const count = queue.filter(q => q.employment_type === t).length;
                  return count > 0 ? <span key={t} style={{ background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{count} {t}</span> : null;
                })}
              </div>
            )}
          </div>

          <div className="me-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{
                  width: 64, height: 64, margin: "0 auto 14px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${BRAND.tint100} 0%, ${BRAND.tint200} 100%)`,
                  border: `1px solid ${BRAND.tint200}`,
                  color: BRAND.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><Ic.Inbox /></div>
                <div style={{ fontWeight: 700, color: BRAND.ink, fontSize: 14, marginBottom: 4 }}>
                  Your queue is empty
                </div>
                <div style={{ fontSize: 12, color: BRAND.textMuted, maxWidth: 220, margin: "0 auto" }}>
                  Add employees using <strong>Form</strong>, <strong>Table</strong>, or <strong>Upload</strong> mode to begin onboarding.
                </div>
              </div>
            ) : (
              queue.map((item, i) => (
                <QueueCard key={item.tempId} item={item} index={i} onRemove={() => setQueue(prev => prev.filter(q => q.tempId !== item.tempId))} />
              ))
            )}
          </div>

          <div style={{
            padding: "14px 16px",
            borderTop: `1px solid ${BRAND.border}`,
            background: `linear-gradient(180deg, ${BRAND.tint50} 0%, #ffffff 100%)`,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {queue.length > 0 && (
              <button type="button" className="me-btn" onClick={() => { if (window.confirm("Clear all employees from queue?")) setQueue([]); }} style={S.btn("secondary")}><Ic.Trash /> Clear All</button>
            )}
            <button type="button" className="me-btn" onClick={processQueue} disabled={queue.length === 0 || processing}
              style={{ ...S.btn(queue.length === 0 ? "secondary" : "success"), opacity: queue.length === 0 ? 0.55 : 1, cursor: queue.length === 0 ? "not-allowed" : "pointer" }}>
              {processing ? "Processing..." : <><Ic.ArrowRight /> Process All ({queue.length})</>}
            </button>
          </div>
        </div>
      </div>

        {/* Footer tip — sibling-style bordered Card */}
        <div className="mt-3" style={{
          ...siblingCard, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
          color: BRAND.text, fontSize: 12.5,
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: `${BRAND.primary}1a`,
            color: BRAND.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Ic.Lightbulb /></span>
          <span>
            <strong style={{ color: BRAND.ink }}>Pro tip:</strong> complete all 6 sections per employee for full compliance coverage — UIF, ETI (under-30), SDL and OID classification are all derived from the data you capture here.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
// `embedded` skips the SharedLayout wrapper so this page can be rendered
// inside another shell (e.g. when the Owner dashboard mounts it under one of
// its own routes that already provides chrome).
const ManageEmployees: React.FC<{ embedded?: boolean }> = ({ embedded = false }) =>
  embedded ? (
    <ManageEmployeesContent />
  ) : (
    <SharedLayout title="Manage Employees">
      <ManageEmployeesContent />
    </SharedLayout>
  );

export default ManageEmployees;