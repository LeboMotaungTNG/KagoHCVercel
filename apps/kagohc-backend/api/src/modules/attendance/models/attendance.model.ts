import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'remote' | 'on-leave';

export interface IAttendance extends Document {
  attendance_id: number;
  employee_id: mongoose.Types.ObjectId;
  employee_name: string;
  employee_code: string;
  department: string;
  date: Date;
  clock_in?: Date;
  clock_out?: Date;
  hours_worked?: number;
  overtime_hours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  attendance_id: { type: Number, unique: true },
  employee_id: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employee_name: { type: String, required: true },
  employee_code: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  clock_in: Date,
  clock_out: Date,
  hours_worked: Number,
  overtime_hours: Number,
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'half-day', 'remote', 'on-leave'],
    default: 'present'
  },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Indexes
AttendanceSchema.index({ employee_id: 1, date: -1 });
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ department: 1, date: -1 });
AttendanceSchema.index({ status: 1 });

// Auto-increment attendance_id
AttendanceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const last = await mongoose.model('Attendance').findOne().sort({ attendance_id: -1 });
    this.attendance_id = last ? last.attendance_id + 1 : 3001;
  }
  next();
});

export const AttendanceModel = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const Attendance = AttendanceModel;
