import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phone?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  // platform_admin: your internal team — sits above all tenants, not scoped
  //                 to any company, can create company shells and send invites.
  // owner:          top of a single tenant, ownerId === self._id.
  // admin/manager:  tenant-scoped staff, ownerId points to their owner.
  // user:           regular employee account.
  role: 'platform_admin' | 'owner' | 'admin' | 'manager' | 'user';
  ownerId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin: Date;
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
    // platform_admin users intentionally have no ownerId.
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    phone: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
