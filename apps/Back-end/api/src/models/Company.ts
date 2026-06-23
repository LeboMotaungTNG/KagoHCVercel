import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  size: number;
  sector: string;
  email: string;
  phone: string;
  alternativePhone: string;
  website: string;
  fax: string;
  logoUrl?: string;
  taxId: string;
  registrationNumber: string;
  vatNumber: string;
  uifReference: string;
  sdlReference: string;
  workInjuryFundRef: string;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
    swiftCode: string;
  };
  contacts: {
    ceo: { name: string; email: string; phone: string };
    finance: { name: string; email: string; phone: string };
    payroll: { name: string; email: string; phone: string };
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    physicalAddress: string;
    postalAddress: string;
  };
  businessType: string;
  yearsInOperation: number;
  sarsBranch: string;
  incomeTaxNumber: string;
  payeReference: string;
  provisionalTaxpayer: boolean;
  taxComplianceStatus: string;
  language: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  status: string;
  verified: boolean;
  lastAuditDate: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: Date;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, default: '' },
  size: { type: Number, default: 0 },
  sector: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  alternativePhone: { type: String, default: '' },
  website: { type: String, default: '' },
  fax: { type: String, default: '' },
  logoUrl: { type: String },
  taxId: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  vatNumber: { type: String, default: '' },
  uifReference: { type: String, default: '' },
  sdlReference: { type: String, default: '' },
  workInjuryFundRef: { type: String, default: '' },
  bank: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branchCode: { type: String, default: '' },
    accountType: { type: String, default: 'Business Cheque' },
    swiftCode: { type: String, default: '' }
  },
  contacts: {
    ceo: { 
      name: { type: String, default: '' }, 
      email: { type: String, default: '' }, 
      phone: { type: String, default: '' } 
    },
    finance: { 
      name: { type: String, default: '' }, 
      email: { type: String, default: '' }, 
      phone: { type: String, default: '' } 
    },
    payroll: { 
      name: { type: String, default: '' }, 
      email: { type: String, default: '' }, 
      phone: { type: String, default: '' } 
    }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'South Africa' },
    postalCode: { type: String, default: '' },
    physicalAddress: { type: String, default: '' },
    postalAddress: { type: String, default: '' }
  },
  businessType: { type: String, default: '' },
  yearsInOperation: { type: Number, default: 0 },
  sarsBranch: { type: String, default: '' },
  incomeTaxNumber: { type: String, default: '' },
  payeReference: { type: String, default: '' },
  provisionalTaxpayer: { type: Boolean, default: false },
  taxComplianceStatus: { type: String, default: 'Pending' },
  language: { type: String, default: 'English' },
  timezone: { type: String, default: 'Africa/Johannesburg' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  fiscalYearStart: { type: String, default: () => `${new Date().getFullYear()}-03-01` },
  fiscalYearEnd: { type: String, default: () => `${new Date().getFullYear() + 1}-02-28` },
  status: { type: String, default: 'Active' },
  verified: { type: Boolean, default: false },
  lastAuditDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  onboardingCompleted: { type: Boolean, default: false },
  onboardingCompletedAt: { type: Date },
  country: { type: String }
}, { 
  timestamps: true 
});

export default mongoose.model<ICompany>('Company', CompanySchema);