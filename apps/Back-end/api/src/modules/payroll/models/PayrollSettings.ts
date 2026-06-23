import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollSettings extends Document {
  ownerId: mongoose.Types.ObjectId;
  standardHoursPerDay: number;
  standardDaysPerMonth: number;
  overtimeRate: number;
  weekendRate: number;
  holidayRate: number;
  uifRate: number;
  sdlRate: number;
  payeEnabled: boolean;
  taxYear: string;
}

const PayrollSettingsSchema = new Schema({
  ownerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  standardHoursPerDay: { type: Number, default: 8 },
  standardDaysPerMonth: { type: Number, default: 20 },
  overtimeRate: { type: Number, default: 1.5 },
  weekendRate: { type: Number, default: 2.0 },
  holidayRate: { type: Number, default: 2.5 },
  uifRate: { type: Number, default: 0.01 },
  sdlRate: { type: Number, default: 0.01 },
  payeEnabled: { type: Boolean, default: true },
  taxYear: { type: String, default: '2026' }
}, { 
  timestamps: true 
});

// CRITICAL: Check if model exists before creating
const PayrollSettings = mongoose.models.PayrollSettings || mongoose.model('PayrollSettings', PayrollSettingsSchema);

export default PayrollSettings;
