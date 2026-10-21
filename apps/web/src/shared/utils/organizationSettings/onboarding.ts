/**
 * Onboarding-completeness scoring for the Company Details tab.
 * Returns the individual checks + percentage so the UI can render
 * both a progress bar and a per-item list.
 */

import type { CompanyData } from "./types";

export interface OnboardingCheck {
  label: string;
  done:  boolean;
}

export interface OnboardingResult {
  items:  OnboardingCheck[];
  done:   number;
  total:  number;
  pct:    number;
  color:  string;
}

const filled = (...vals: unknown[]): boolean =>
  vals.some((v) => v !== undefined && v !== null && String(v).trim().length > 0);

/** Build the onboarding checklist for a (possibly partial) company record. */
export function computeOnboardingProgress(data: CompanyData): OnboardingResult {
  const bank = data.bank || ({} as CompanyData["bank"]);
  const address = data.address || ({} as CompanyData["address"]);
  const contacts = data.contacts || ({} as CompanyData["contacts"]);
  const extra = data as CompanyData & {
    taxId?: string;
    contacts?: CompanyData["contacts"] & { ceo?: { name?: string } };
  };

  const items: OnboardingCheck[] = [
    { label: "Company name",          done: filled(data.name) },
    { label: "CIPC registration no.", done: filled(data.registrationNumber) },
    { label: "Income tax number",     done: filled(data.incomeTaxNumber, extra.taxId) },
    { label: "PAYE reference",        done: filled(data.payeReference) },
    { label: "UIF reference",         done: filled(data.uifReference) },
    { label: "Banking details",       done: filled(bank.accountNumber, bank.bankName) },
    { label: "Physical address",      done: filled(address.physicalAddress, address.street, address.city) },
    { label: "Primary contact",       done: filled(contacts.primaryContact?.name, extra.contacts?.ceo?.name) },
    { label: "Payroll contact",       done: filled(contacts.payroll?.name) },
    { label: "Fiscal year configured", done: filled(data.fiscalYearStart) && filled(data.fiscalYearEnd) },
  ];

  const done = items.filter((c) => c.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  // Traffic-light colour: green at 100%, amber at ≥60%, red below.
  const color = pct === 100 ? "#059669" : pct >= 60 ? "#D97706" : "#EF4444";

  return { items, done, total, pct, color };
}
