// api/src/modules/company/models/Company.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  ownerId: mongoose.Types.ObjectId;
  // Basic Information
  name: string;
  size: number;
  sector: string;
  email: string;
  phone: string;
  alternativePhone: string;
  website: string;
  fax: string;
  language: string;
  timezone: string;
  dateFormat: string;
  status: string;
  logoUrl?: string;
  
  // Registration & Legal
  registrationNumber: string;
  companyType: string;
  companyStatus: string;
  registrationDate: string;
  taxId: string;
  vatNumber: string;
  uifReference: string;
  sdlReference: string;
  workInjuryFundRef: string;
  incomeTaxNumber: string;
  payeReference: string;
  sarsBranch: string;
  provisionalTaxpayer: boolean;
  taxComplianceStatus: string;
  
  // B-BBEE
  blackOwnership: number;
  womenOwnership: number;
  youthOwnership: number;
  bbbeeLevel: string;
  
  // Banking
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
    swiftCode: string;
  };
  
  // Contacts
  contacts: {
    ceo: { name: string; email: string; phone: string };
    finance: { name: string; email: string; phone: string };
    payroll: { name: string; email: string; phone: string };
  };
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    physicalAddress: string;
    postalAddress: string;
  };
  
  // Fiscal
  fiscalYearStart: string;
  fiscalYearEnd: string;
  lastAuditDate: string;
  yearsInOperation: number;
  businessType: string;
  
  // Onboarding
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Date;
  country?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Basic Information
  name: { type: String, default: '' },
  size: { type: Number, default: 0 },
  sector: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  alternativePhone: { type: String, default: '' },
  website: { type: String, default: '' },
  fax: { type: String, default: '' },
  language: { type: String, default: 'English' },
  timezone: { type: String, default: 'Africa/Johannesburg' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  status: { type: String, default: 'Active' },
  logoUrl: { type: String },
  
  // Registration & Legal
  registrationNumber: { type: String, default: '' },
  companyType: { type: String, default: '' },
  companyStatus: { type: String, default: 'Active' },
  registrationDate: { type: String, default: '' },
  taxId: { type: String, default: '' },
  vatNumber: { type: String, default: '' },
  uifReference: { type: String, default: '' },
  sdlReference: { type: String, default: '' },
  workInjuryFundRef: { type: String, default: '' },
  incomeTaxNumber: { type: String, default: '' },
  payeReference: { type: String, default: '' },
  sarsBranch: { type: String, default: '' },
  provisionalTaxpayer: { type: Boolean, default: false },
  taxComplianceStatus: { type: String, default: 'Pending' },
  
  // B-BBEE
  blackOwnership: { type: Number, default: 0 },
  womenOwnership: { type: Number, default: 0 },
  youthOwnership: { type: Number, default: 0 },
  bbbeeLevel: { type: String, default: '' },
  
  // Banking
  bank: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branchCode: { type: String, default: '' },
    accountType: { type: String, default: 'Business Cheque' },
    swiftCode: { type: String, default: '' }
  },
  
  // Contacts
  contacts: {
    ceo: { name: { type: String, default: '' }, email: { type: String, default: '' }, phone: { type: String, default: '' } },
    finance: { name: { type: String, default: '' }, email: { type: String, default: '' }, phone: { type: String, default: '' } },
    payroll: { name: { type: String, default: '' }, email: { type: String, default: '' }, phone: { type: String, default: '' } }
  },
  
  // Address
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'South Africa' },
    postalCode: { type: String, default: '' },
    physicalAddress: { type: String, default: '' },
    postalAddress: { type: String, default: '' }
  },
  
  // Fiscal
  fiscalYearStart: { type: String, default: '' },
  fiscalYearEnd: { type: String, default: '' },
  lastAuditDate: { type: String, default: '' },
  yearsInOperation: { type: Number, default: 0 },
  businessType: { type: String, default: '' },
  
  // Onboarding
  onboardingCompleted: { type: Boolean, default: false },
  onboardingCompletedAt: { type: Date },
  country: { type: String }
}, { timestamps: true });

export default mongoose.model<ICompany>('Company', CompanySchema);