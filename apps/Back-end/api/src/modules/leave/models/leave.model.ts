import mongoose, { Schema, Document } from 'mongoose';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
// Leave types are now defined dynamically by the owner in Organization Settings
// (LeavePolicyModel). Keep this as an open string so custom company leave types
// (bereavement, birthday, wellness, etc.) can be submitted and reviewed.
export type LeaveType = string;

export interface ILeave extends Document {
  leave_id: number;
  employee_id: mongoose.Types.ObjectId;
  full_name: string;
  employee_code: string;
  department: string;
  position: string;
  leave_type: LeaveType;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  submitted_at: Date;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewer_name?: string;
  reviewed_at?: Date;
  rejection_reason?: string;
  attachment_path?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>({
  leave_id: { type: Number, unique: true },
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  full_name: { type: String, required: true },
  employee_code: { type: String, required: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  leave_type: { 
    type: String, 
    required: true 
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  total_days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  submitted_at: { type: Date, default: Date.now },
  reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewer_name: String,
  reviewed_at: Date,
  rejection_reason: String,
  attachment_path: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Indexes for searching
LeaveSchema.index({ leave_id: 1 });
LeaveSchema.index({ employee_id: 1 });
LeaveSchema.index({ status: 1 });
LeaveSchema.index({ leave_type: 1 });
LeaveSchema.index({ start_date: 1, end_date: 1 });
LeaveSchema.index({ full_name: 'text', employee_code: 'text' });

// Auto-increment leave_id
LeaveSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastLeave = await mongoose.model('Leave').findOne().sort({ leave_id: -1 });
    this.leave_id = lastLeave ? lastLeave.leave_id + 1 : 1001;
  }
  next();
});

export const LeaveModel = mongoose.model<ILeave>('Leave', LeaveSchema);

