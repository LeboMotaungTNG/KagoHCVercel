import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  managerId?: mongoose.Types.ObjectId;
  parentDepartment?: mongoose.Types.ObjectId;
  budget: number;
  headCount: number;
  location: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  budget: { type: Number, default: 0 },
  headCount: { type: Number, default: 0 },
  location: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Index for searching
DepartmentSchema.index({ name: 'text', description: 'text' });

export const DepartmentModel = mongoose.model<IDepartment>('Department', DepartmentSchema);
