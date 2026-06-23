import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  manager?: string;
  parentDepartment?: mongoose.Types.ObjectId;
  budget?: number;
  employeeCount?: number;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true },
  description: { type: String },
  manager: { type: String },
  parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  budget: { type: Number, default: 0 },
  employeeCount: { type: Number, default: 0 },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

DepartmentSchema.index({ name: 1, ownerId: 1 }, { unique: true });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
