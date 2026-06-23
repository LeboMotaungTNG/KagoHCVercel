import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRun extends Document {
  ownerId: mongoose.Types.ObjectId;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  status: 'draft' | 'attendance_imported' | 'calculated' | 'approved' | 'reports_generated' | 'submitted';
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  items?: any[];
  attendanceData?: any;
  calculatedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  submittedAt?: Date;
  submissionReceipt?: string;
  notes?: string;
  // Company details for EMP201
  payeReference?: string;
  sdlReference?: string;
  companyName?: string;
  registrationNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayrollCalculation extends Document {
  payrollRunId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  employeeCode: string;
  employeeName: string;
  
  // Earnings
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
    total: number;
  };
  overtime: {
    hours: number;
    rate: number;
    amount: number;
  };
  bonuses: number;
  commissions: number;
  grossEarnings: number;
  
  // Deductions
  deductions: {
    paye: number;
    uif: number;
    sdl: number;
    pension: number;
    medicalAid: number;
    other: number;
    total: number;
  };
  
  netPay: number;
  
  // Employer costs
  employerCosts: {
    uif: number;
    sdl: number;
    skillsLevy: number;
    total: number;
  };
  
  // Payslip data
  payslipGenerated: boolean;
  payslipUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PayrollRunSchema = new Schema<IPayrollRun>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  frequency: { type: String, enum: ['weekly', 'bi-weekly', 'monthly'], default: 'monthly' },
  status: { 
    type: String, 
    enum: ['draft', 'attendance_imported', 'calculated', 'approved', 'reports_generated', 'submitted'],
    default: 'draft'
  },
  employeeCount: { type: Number, default: 0 },
  totalGross: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  totalNetPay: { type: Number, default: 0 },
  items: { type: Array, default: [] },
  attendanceData: { type: Object, default: null },
  calculatedAt: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  submittedAt: { type: Date },
  submissionReceipt: { type: String },
  notes: { type: String },
  // Company details for EMP201
  payeReference: { type: String },
  sdlReference: { type: String },
  companyName: { type: String },
  registrationNumber: { type: String }
}, { timestamps: true });

const PayrollCalculationSchema = new Schema<IPayrollCalculation>({
  payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeCode: { type: String, required: true },
  employeeName: { type: String, required: true },
  
  basicSalary: { type: Number, required: true },
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 1.5 },
    amount: { type: Number, default: 0 }
  },
  bonuses: { type: Number, default: 0 },
  commissions: { type: Number, default: 0 },
  grossEarnings: { type: Number, required: true },
  
  deductions: {
    paye: { type: Number, default: 0 },
    uif: { type: Number, default: 0 },
    sdl: { type: Number, default: 0 },
    pension: { type: Number, default: 0 },
    medicalAid: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  netPay: { type: Number, required: true },
  
  employerCosts: {
    uif: { type: Number, default: 0 },
    sdl: { type: Number, default: 0 },
    skillsLevy: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  payslipGenerated: { type: Boolean, default: false },
  payslipUrl: { type: String }
}, { timestamps: true });

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);
export const PayrollCalculation = mongoose.model<IPayrollCalculation>('PayrollCalculation', PayrollCalculationSchema);
