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

/** Build the onboarding checklist for a (possibly partial) company record. */
export function computeOnboardingProgress(data: CompanyData): OnboardingResult {
  const items: OnboardingCheck[] = [
    { label: "Company name",           done: !!data.name },
    { label: "CIPC registration no.",  done: !!data.registrationNumber },
    { label: "Income tax number",      done: !!data.incomeTaxNumber },
    { label: "PAYE reference",         done: !!data.payeReference },
    { label: "UIF reference",          done: !!data.uifReference },
    { label: "Banking details",        done: !!data.bank?.accountNumber },
    { label: "Physical address",       done: !!data.address?.physicalAddress },
    { label: "Primary contact",        done: !!data.contacts?.primaryContact?.name },
    { label: "Payroll contact",        done: !!data.contacts?.payroll?.name },
    { label: "Fiscal year configured", done: !!(data.fiscalYearStart && data.fiscalYearEnd) },
  ];

  const done = items.filter((c) => c.done).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  // Traffic-light colour: green at 100%, amber at ≥60%, red below.
  const color = pct === 100 ? "#059669" : pct >= 60 ? "#D97706" : "#EF4444";

  return { items, done, total, pct, color };
}
