import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phone?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'platform_admin' | 'owner' | 'admin' | 'manager' | 'user';
  ownerId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['platform_admin', 'owner', 'admin', 'manager', 'user'],
      default: 'user',
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    phone: { type: String },
    lastLogin: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// ── Password hashing on save ────────────────────────────────────────────────
// WHY THIS LOOKS UNUSUAL:
// Mongoose's pre('save') overloads can mismatch against certain
// mongoose/@types/mongoose version pairs, causing TypeScript to misidentify
// the callback's type as SaveOptions instead of a next() function — which
// has no call signature, breaking compilation even though the JS is correct
// at runtime. Casting the handler to `any` at the call site sidesteps
// TypeScript's overload resolution for this one call without weakening
// type safety anywhere else in the file.
async function hashPasswordBeforeSave(this: IUser, next: any) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
}
UserSchema.pre('save', hashPasswordBeforeSave as any);

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);