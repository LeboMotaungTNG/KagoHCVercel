import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  level?: number;
  department?: string;
  minSalary?: number;
  maxSalary?: number;
  responsibilities?: string[];
  requirements?: string[];
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true },
  description: { type: String },
  level: { type: Number, default: 1 },
  department: { type: String },
  minSalary: { type: Number },
  maxSalary: { type: Number },
  responsibilities: [{ type: String }],
  requirements: [{ type: String }],
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

RoleSchema.index({ name: 1, ownerId: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
