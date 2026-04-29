import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: mongoose.Types.ObjectId;
  position?: string;
  jobTitle?: string;
  employmentType?: 'permanent' | 'contract' | 'intern' | 'temporary';
  startDate: Date;
  endDate?: Date;
  salary?: number;
  salaryType?: 'monthly' | 'hourly' | 'annual';
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  taxNumber?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  roles: mongoose.Types.ObjectId[];
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    position: { type: String },
    jobTitle: { type: String },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'intern', 'temporary'],
      default: 'permanent'
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    salary: { type: Number },
    salaryType: {
      type: String,
      enum: ['monthly', 'hourly', 'annual'],
      default: 'monthly'
    },
    bankName: { type: String },
    bankAccount: { type: String },
    bankBranch: { type: String },
    taxNumber: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String }
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String }
    },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated', 'on_leave'],
      default: 'active'
    },
    profileImage: { type: String }
  },
  {
    timestamps: true
  }
);

// Generate employee ID before saving
EmployeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
