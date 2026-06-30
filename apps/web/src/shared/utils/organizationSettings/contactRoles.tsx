/**
 * Definitions for the contact-person cards (CEO / Finance / Payroll / HR)
 * shown on the Company Details → Contacts sub-tab. Icons are professional
 * Lucide glyphs instead of the previous emoji set.
 */

import React from "react";
import { User, Briefcase, CreditCard, HeartHandshake } from "lucide-react";

export interface ContactRole {
  /** Dotted path into the company data object. */
  key:   string;
  title: string;
  color: string;
  icon:  React.ReactNode;
}

export const CONTACT_ROLES: ContactRole[] = [
  { key: "contacts.primaryContact", title: "Primary Contact / CEO",   color: "#0369A1", icon: <User           size={16} /> },
  { key: "contacts.finance",        title: "Finance Director / CFO",  color: "#7C3AED", icon: <Briefcase      size={16} /> },
  { key: "contacts.payroll",        title: "Payroll Manager",         color: "#059669", icon: <CreditCard     size={16} /> },
  { key: "contacts.hr",             title: "HR Manager",              color: "#EC4899", icon: <HeartHandshake size={16} /> },
];
