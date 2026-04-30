import mongoose, { Schema, Document } from 'mongoose';

export type AllowExceedType = 'allow_without_warning' | 'allow_with_warning' | 'do_not_allow';

export interface ILeaveCycle extends Document {
  cycle_start_date: Date;
  cycle_length: string;
  cycle_recurs: string;
  entitlement_value: number;
  leave_accrual: string;
  balance_at_end_of_cycle: number;
  leave_taken_order: number;
  allow_exceed: AllowExceedType;
}

export interface ILeaveRule extends Document {
  name: string;
  description: string;
  is_active: boolean;
  cycles: ILeaveCycle[];
  created_by: mongoose.Types.ObjectId;
  updated_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveCycleSchema = new Schema<ILeaveCycle>({
  cycle_start_date: { type: Date, required: true },
  cycle_length: { type: String, default: '12 months' },
  cycle_recurs: { type: String, default: 'Annually' },
  entitlement_value: { type: Number, required: true },
  leave_accrual: { type: String, default: 'Upfront' },
  balance_at_end_of_cycle: { type: Number, default: 0 },
  leave_taken_order: { type: Number, default: 1 },
  allow_exceed: { 
    type: String, 
    enum: ['allow_without_warning', 'allow_with_warning', 'do_not_allow'],
    default: 'do_not_allow'
  }
}, { _id: true });

const LeaveRuleSchema = new Schema<ILeaveRule>({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  cycles: [LeaveCycleSchema],
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Indexes
LeaveRuleSchema.index({ name: 1 });
LeaveRuleSchema.index({ is_active: 1 });

export const LeaveRuleModel = mongoose.model<ILeaveRule>('LeaveRule', LeaveRuleSchema);
