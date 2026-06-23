import mongoose, { Schema, Document } from 'mongoose';

export interface IOnboardingStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  notes?: string;
  documents?: any[];
}

export interface IFirstDayChecklist {
  hardwareReceived: boolean;
  softwareAccess: boolean;
  badgeReceived: boolean;
  deskAssigned: boolean;
  orientationCompleted: boolean;
}

export interface IEmployee extends Document {
  ownerId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;

  // Onboarding / lifecycle fields — these MUST also exist as real Schema
  // fields below (not just on this interface), or Mongoose's strict mode
  // will silently drop them on .create()/.save().
  employeeId: string;
  onboardingSteps?: IOnboardingStep[];
  firstDayChecklist?: IFirstDayChecklist;
  assignedMentorId?: mongoose.Types.ObjectId;
  onboardingCompletedDate?: Date;
  probationReviewDates?: Date[];

  // Personal Information
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  idNumber?: string;
  passportNumber?: string;

  // Employment Information
  position: string;
  department: string;
  role?: string;
  employmentType: 'permanent' | 'contract' | 'probation' | 'intern' | 'part-time' | 'temporary' | 'casual';
  startDate: Date;
  endDate?: Date;

  // Compensation
  salary: number;
  salaryFrequency: 'monthly' | 'weekly' | 'hourly';
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  taxReferenceNumber: string;
  uifReferenceNumber: string;

  // Allowances
  allowances: {
    housing?: number;
    transport?: number;
    medical?: number;
    communication?: number;
    other?: number;
  };

  // Manager Info
  isManager: boolean;
  managerLevel?: 'team_lead' | 'manager' | 'senior_manager' | 'director';
  managerSince?: Date;
  promotedBy?: mongoose.Types.ObjectId;
  reportsTo?: mongoose.Types.ObjectId;

  // Promotion/Demotion History
  promotionHistory: Array<{
    previousRole: string;
    newRole: string;
    promotedBy: mongoose.Types.ObjectId;
    promotedAt: Date;
    reason?: string;
  }>;
  demotionHistory: Array<{
    previousRole: string;
    newRole: string;
    demotedBy: mongoose.Types.ObjectId;
    demotedAt: Date;
    reason?: string;
  }>;

  // Onboarding Status
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  onboardingProgress: number;
  onboardingCompletedAt?: Date;
  onboardingStartDate?: Date;
  welcomeEmailSent?: boolean;

  // Probation
  isOnProbation: boolean;
  probationStartDate?: Date;
  probationEndDate?: Date;
  probationStatus: 'active' | 'completed' | 'extended' | 'terminated';

  // Employment Status
  employmentStatus: 'active' | 'on_leave' | 'terminated' | 'suspended';
  terminationDate?: Date;
  terminationReason?: string;

  // Documents
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }>;

  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };

  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingStepSchema = new Schema<IOnboardingStep>(
  {
    stepNumber: { type: Number, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    documents: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const FirstDayChecklistSchema = new Schema<IFirstDayChecklist>(
  {
    hardwareReceived: { type: Boolean, default: false },
    softwareAccess: { type: Boolean, default: false },
    badgeReceived: { type: Boolean, default: false },
    deskAssigned: { type: Boolean, default: false },
    orientationCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const EmployeeSchema = new Schema<IEmployee>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },

  // Stable external/business identifier. This is the field that was
  // declared on IEmployee but missing from the schema, causing every
  // insert to silently store `employeeId: null` and collide with the
  // pre-existing unique index `employeeId_1`.
  employeeId: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      return `EMP${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
    },
    index: true,
  },

  // Onboarding sub-documents — also previously missing from the schema.
  onboardingSteps: { type: [OnboardingStepSchema], default: [] },
  firstDayChecklist: { type: FirstDayChecklistSchema, default: () => ({}) },
  assignedMentorId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  onboardingCompletedDate: { type: Date },
  probationReviewDates: { type: [Date], default: [] },
  onboardingStartDate: { type: Date },
  welcomeEmailSent: { type: Boolean, default: false },

  // Personal Information
  employeeCode: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      return `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    },
    index: true,
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  alternativePhone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  nationality: { type: String },
  idNumber: { type: String },
  passportNumber: { type: String },

  // Employment Information
  position: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String },
  employmentType: {
    type: String,
    enum: ['permanent', 'contract', 'probation', 'intern', 'part-time', 'temporary', 'casual'],
    default: 'permanent',
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },

  // Compensation
  salary: { type: Number, required: true },
  salaryFrequency: { type: String, enum: ['monthly', 'weekly', 'hourly'], default: 'monthly' },
  bankName: { type: String, required: true },
  bankAccountNumber: { type: String, required: true },
  bankBranchCode: { type: String, required: true },
  taxReferenceNumber: { type: String },
  uifReferenceNumber: { type: String },

  // Allowances
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },

  // Manager Info
  isManager: { type: Boolean, default: false },
  managerLevel: { type: String, enum: ['team_lead', 'manager', 'senior_manager', 'director'] },
  managerSince: { type: Date },
  promotedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reportsTo: { type: Schema.Types.ObjectId, ref: 'Employee' },

  // Promotion/Demotion History
  promotionHistory: [
    {
      previousRole: { type: String, required: true },
      newRole: { type: String, required: true },
      promotedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      promotedAt: { type: Date, default: Date.now },
      reason: { type: String },
    },
  ],
  demotionHistory: [
    {
      previousRole: { type: String, required: true },
      newRole: { type: String, required: true },
      demotedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      demotedAt: { type: Date, default: Date.now },
      reason: { type: String },
    },
  ],

  // Onboarding
  onboardingStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
  onboardingProgress: { type: Number, default: 0 },
  onboardingCompletedAt: { type: Date },

  // Probation
  isOnProbation: { type: Boolean, default: true },
  probationStartDate: { type: Date },
  probationEndDate: { type: Date },
  probationStatus: {
    type: String,
    enum: ['active', 'completed', 'extended', 'terminated'],
    default: 'active',
  },

  // Employment Status
  employmentStatus: {
    type: String,
    enum: ['active', 'on_leave', 'terminated', 'suspended'],
    default: 'active',
  },
  terminationDate: { type: Date },
  terminationReason: { type: String },

  // Documents
  documents: [
    {
      name: { type: String },
      url: { type: String },
      type: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  // Emergency Contact
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String },
  },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Generate employee code before saving (kept as a safety net in addition
// to the schema-level `default` above).
EmployeeSchema.pre('save', async function (next) {
  if (!this.employeeCode) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeCode = `EMP${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.employeeId) {
    this.employeeId = `EMP${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);