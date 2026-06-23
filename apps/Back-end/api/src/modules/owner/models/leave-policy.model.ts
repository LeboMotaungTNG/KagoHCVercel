import mongoose, { Schema, Document } from 'mongoose';

export interface ILeavePolicy extends Document {
  type: string;
  name: string;
  enabled: boolean;
  entitlementDays: number;
  daysPerYear: number;
  daysTotal: number;
  cycleYears: number;
  carryOver: boolean;
  maxAccrual: number;
  requiresDoctorNote: boolean;
  requiresApproval: boolean;
  paidPercentage: number;
  minimumServiceMonths: number;
  icon?: string;
  color?: string;
  description?: string;
  notes?: string;
  isStatutory: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// strict:false so the UI can persist any extra fields it sends without breaking saves.
const LeavePolicySchema = new Schema<ILeavePolicy>(
  {
    type: { type: String, required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    entitlementDays: { type: Number, default: 0 },
    daysPerYear: { type: Number, default: 0 },
    daysTotal: { type: Number, default: 0 },
    cycleYears: { type: Number, default: 1 },
    carryOver: { type: Boolean, default: false },
    maxAccrual: { type: Number, default: 0 },
    requiresDoctorNote: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: true },
    paidPercentage: { type: Number, default: 100 },
    minimumServiceMonths: { type: Number, default: 0 },
    icon: { type: String },
    color: { type: String },
    description: { type: String },
    notes: { type: String },
    isStatutory: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, strict: false }
);

// Statutory BCEA minimums – seeded automatically on first read so the UI always
// has the five statutory types available to edit (the UI only *updates* these).
export const BCEA_STATUTORY_DEFAULTS = [
  { type: 'annual', name: 'Annual Leave', entitlementDays: 15, daysPerYear: 15, daysTotal: 15, cycleYears: 1, carryOver: true, maxAccrual: 5, requiresDoctorNote: false, isStatutory: true },
  { type: 'sick', name: 'Sick Leave', entitlementDays: 30, daysPerYear: 30, daysTotal: 30, cycleYears: 3, carryOver: false, maxAccrual: 0, requiresDoctorNote: true, isStatutory: true },
  { type: 'family', name: 'Family Responsibility Leave', entitlementDays: 3, daysPerYear: 3, daysTotal: 3, cycleYears: 1, carryOver: false, maxAccrual: 0, requiresDoctorNote: false, isStatutory: true },
  { type: 'maternity', name: 'Maternity Leave', entitlementDays: 88, daysPerYear: 88, daysTotal: 88, cycleYears: 0, carryOver: false, maxAccrual: 0, requiresDoctorNote: false, isStatutory: true },
  { type: 'parental', name: 'Parental Leave', entitlementDays: 10, daysPerYear: 10, daysTotal: 10, cycleYears: 0, carryOver: false, maxAccrual: 0, requiresDoctorNote: false, isStatutory: true },
];

export const LeavePolicyModel = mongoose.model<ILeavePolicy>('LeavePolicy', LeavePolicySchema);
