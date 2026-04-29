import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'processed' | 'paid' | 'failed';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque';
export type PayrollPeriod = 'monthly' | 'weekly' | 'bi-weekly';

export interface IPayroll extends Document {
  payroll_id: number;
  period_name: string;
  period_type: PayrollPeriod;
  period_start: Date;
  period_end: Date;
  payment_date: Date;
  
  employees: Array<{
    employee_id: mongoose.Types.ObjectId;
    employee_name: string;
    employee_code: string;
    department: string;
    position: string;
    basic_salary: number;
    net_salary: number;
    payment_frequency: string;
    employment_type: string;
  }>;
  
  total_gross: number;
  total_net: number;
  total_tax: number;
  total_uif_employee: number;
  total_uif_employer: number;
  total_sdl: number;
  total_medical_aid: number;
  total_pension: number;
  
  status: PaymentStatus;
  processed_by?: mongoose.Types.ObjectId;
  processed_at?: Date;
  notes?: string;
  
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>({
  payroll_id: { type: Number, unique: true },
  period_name: { type: String, required: true },
  period_type: { type: String, enum: ['monthly', 'weekly', 'bi-weekly'], required: true },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  payment_date: { type: Date, required: true },
  
  employees: [{
    employee_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employee_name: String,
    employee_code: String,
    department: String,
    position: String,
    basic_salary: Number,
    net_salary: Number,
    payment_frequency: String,
    employment_type: String
  }],
  
  total_gross: { type: Number, default: 0 },
  total_net: { type: Number, default: 0 },
  total_tax: { type: Number, default: 0 },
  total_uif_employee: { type: Number, default: 0 },
  total_uif_employer: { type: Number, default: 0 },
  total_sdl: { type: Number, default: 0 },
  total_medical_aid: { type: Number, default: 0 },
  total_pension: { type: Number, default: 0 },
  
  status: { type: String, enum: ['pending', 'processed', 'paid', 'failed'], default: 'pending' },
  processed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  processed_at: Date,
  notes: String,
  
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes
PayrollSchema.index({ period_start: -1, period_end: -1 });
PayrollSchema.index({ payroll_id: 1 });
PayrollSchema.index({ status: 1 });

// Auto-increment payroll_id
PayrollSchema.pre('save', async function(next) {
  if (this.isNew) {
    const last = await mongoose.model('Payroll').findOne().sort({ payroll_id: -1 });
    this.payroll_id = last ? last.payroll_id + 1 : 5001;
  }
  next();
});

export const PayrollModel = mongoose.model<IPayroll>('Payroll', PayrollSchema);
