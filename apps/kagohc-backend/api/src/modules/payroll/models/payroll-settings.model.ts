import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollSettings extends Document {
  // Frequency settings
  frequency: string;
  pay_day: number;
  currency: string;
  tax_year: string;
  
  // Overtime rates
  overtime_rate: number;
  weekend_rate: number;
  holiday_rate: number;
  
  // UIF settings
  uif_enabled: boolean;
  uif_rate: number;
  
  // SDL settings
  sdl_enabled: boolean;
  sdl_rate: number;
  
  // PAYE settings
  paye_enabled: boolean;
  
  // Payslip settings
  auto_generate_payslips: boolean;
  allow_self_service_payslips: boolean;
  
  // Metadata
  created_by: mongoose.Types.ObjectId;
  updated_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSettingsSchema = new Schema<IPayrollSettings>({
  // Frequency settings
  frequency: { type: String, default: 'Monthly' },
  pay_day: { type: Number, default: 25 },
  currency: { type: String, default: 'ZAR' },
  tax_year: { type: String, default: new Date().getFullYear().toString() },
  
  // Overtime rates
  overtime_rate: { type: Number, default: 1.5 },
  weekend_rate: { type: Number, default: 2.0 },
  holiday_rate: { type: Number, default: 2.5 },
  
  // UIF settings
  uif_enabled: { type: Boolean, default: true },
  uif_rate: { type: Number, default: 1 },
  
  // SDL settings
  sdl_enabled: { type: Boolean, default: true },
  sdl_rate: { type: Number, default: 1 },
  
  // PAYE settings
  paye_enabled: { type: Boolean, default: true },
  
  // Payslip settings
  auto_generate_payslips: { type: Boolean, default: true },
  allow_self_service_payslips: { type: Boolean, default: true },
  
  // Metadata
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const PayrollSettingsModel = mongoose.model<IPayrollSettings>('PayrollSettings', PayrollSettingsSchema);
