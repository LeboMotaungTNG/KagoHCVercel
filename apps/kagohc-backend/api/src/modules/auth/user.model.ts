import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'manager' | 'hr' | 'owner' | 'employee';
  isActive: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'manager', 'hr', 'owner', 'employee'], default: 'user' },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String }
}, {
  timestamps: true
});

// Index for searching
UserSchema.index({ email: 1 });
UserSchema.index({ firstName: 'text', lastName: 'text' });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
