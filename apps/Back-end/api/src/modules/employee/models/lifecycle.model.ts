import mongoose, { Schema, Document } from 'mongoose';

/**
 * Employee Lifecycle Model
 * 
 * Manages complete employee lifecycle with three phases:
 * 1. ONBOARDING (2-4 weeks): 12-step recruitment to active process
 * 2. ACTIVE_PROBATION → ACTIVE (ongoing employment)
 * 3. OFFBOARDING (1-4 weeks): Three exit paths (Dismissal, Retirement, Death)
 * 
 * Lifecycle Flow:
 * ONBOARDING → ACTIVE_PROBATION (90 days) → ACTIVE → OFFBOARDING → ARCHIVED
 */

export interface IOnboardingStep {
  step: number; // 1-12
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  completedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  notes?: string;
}

export interface IOffboardingStep {
  step: number;
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  completedBy?: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  notes?: string;
}

export interface IEmployeeLifecycle extends Document {
  employeeId: mongoose.Types.ObjectId;
  
  // Lifecycle status
  currentPhase: 'onboarding' | 'active_probation' | 'active' | 'offboarding' | 'archived';
  currentStatus: string;
  
  // Onboarding (Phase 1)
  onboardingStartDate?: Date;
  onboardingEndDate?: Date;
  onboardingSteps?: IOnboardingStep[];
  onboardingProgress?: number; // 0-100%
  
  // Active Employment (Phase 2)
  activeStartDate?: Date;
  probationEndDate?: Date; // 90 days after start
  probationStatus?: 'pending' | 'approved' | 'extended' | 'failed';
  probationNotes?: string;
  
  // Offboarding (Phase 3)
  offboardingStartDate?: Date;
  offboardingEndDate?: Date;
  offboardingSteps?: IOffboardingStep[];
  offboardingProgress?: number; // 0-100%
  
  // Exit details
  exitType?: 'dismissal' | 'resignation' | 'retirement' | 'death' | 'contract_end';
  exitReason?: string;
  exitDate?: Date;
  finalPaymentDate?: Date;
  
  // Dismissal details
  dismissal?: {
    reason: string;
    causedBy: mongoose.Types.ObjectId; // Manager/Owner who initiated
    cause: 'performance' | 'conduct' | 'redundancy' | 'medical' | 'other';
    severity: 'verbal_warning' | 'written_warning' | 'suspension' | 'termination';
    supportingDocuments: string[]; // URLs to uploaded docs
    approvedBy: mongoose.Types.ObjectId;
    approvalDate: Date;
    appealDeadline?: Date;
    notes?: string;
  };
  
  // Retirement details
  retirement?: {
    annualizedPension: number;
    pensionStartDate: Date;
    gratuity: number;
    notes?: string;
  };
  
  // Death details
  death?: {
    deathDate: Date;
    reportedBy: mongoose.Types.ObjectId;
    beneficiary: string;
    beneficiaryContact: string;
    notes?: string;
  };
  
  // Knowledge transfer
  knowledgeTransfer?: {
    assignedTo: mongoose.Types.ObjectId; // Employee taking over responsibilities
    documents: string[]; // URLs to documentation
    completedDate?: Date;
    notes?: string;
  };
  
  // Assets & Access
  assetReturn?: {
    laptop: boolean;
    phone: boolean;
    badge: boolean;
    keys: boolean;
    otherItems: string[];
    returnedDate?: Date;
    checkedBy?: mongoose.Types.ObjectId;
  };
  
  systemAccess?: {
    vpnDisabled: boolean;
    emailDisabled: boolean;
    systemsAccess: string[]; // Systems needing access removal
    disabledDate?: Date;
    checkedBy?: mongoose.Types.ObjectId;
  };
  
  // Final checklist
  finalChecklist?: {
    backgroundCheck: boolean;
    taxDocuments: boolean;
    beneficiaryDetails: boolean;
    exitInterview: boolean;
    allApprovals: boolean;
    completedDate?: Date;
  };
  
  // Multi-tenancy
  ownerId: mongoose.Types.ObjectId;
  
  // Audit
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
}

const EmployeeLifecycleSchema = new Schema<IEmployeeLifecycle>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true
    },
    
    // Lifecycle status
    currentPhase: {
      type: String,
      enum: ['onboarding', 'active_probation', 'active', 'offboarding', 'archived'],
      default: 'onboarding'
    },
    currentStatus: {
      type: String,
      default: 'onboarding'
    },
    
    // === ONBOARDING PHASE (12 Steps) ===
    onboardingStartDate: Date,
    onboardingEndDate: Date,
    onboardingSteps: [
      {
        step: Number,
        name: String,
        description: String,
        dueDate: Date,
        completedDate: Date,
        completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'] },
        notes: String
      }
    ],
    onboardingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // === ACTIVE EMPLOYMENT PHASE ===
    activeStartDate: Date,
    probationEndDate: Date,
    probationStatus: {
      type: String,
      enum: ['pending', 'approved', 'extended', 'failed'],
      default: 'pending'
    },
    probationNotes: String,
    
    // === OFFBOARDING PHASE ===
    offboardingStartDate: Date,
    offboardingEndDate: Date,
    offboardingSteps: [
      {
        step: Number,
        name: String,
        description: String,
        dueDate: Date,
        completedDate: Date,
        completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'] },
        notes: String
      }
    ],
    offboardingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // === EXIT DETAILS ===
    exitType: {
      type: String,
      enum: ['dismissal', 'resignation', 'retirement', 'death', 'contract_end']
    },
    exitReason: String,
    exitDate: Date,
    finalPaymentDate: Date,
    
    // === DISMISSAL (EXIT PATH 1) ===
    dismissal: {
      reason: String,
      causedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      cause: {
        type: String,
        enum: ['performance', 'conduct', 'redundancy', 'medical', 'other']
      },
      severity: {
        type: String,
        enum: ['verbal_warning', 'written_warning', 'suspension', 'termination']
      },
      supportingDocuments: [String],
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: Date,
      appealDeadline: Date,
      notes: String
    },
    
    // === RETIREMENT (EXIT PATH 2) ===
    retirement: {
      annualizedPension: Number,
      pensionStartDate: Date,
      gratuity: Number,
      notes: String
    },
    
    // === DEATH (EXIT PATH 3) ===
    death: {
      deathDate: Date,
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      beneficiary: String,
      beneficiaryContact: String,
      notes: String
    },
    
    // === KNOWLEDGE TRANSFER ===
    knowledgeTransfer: {
      assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
      documents: [String],
      completedDate: Date,
      notes: String
    },
    
    // === ASSET RETURN ===
    assetReturn: {
      laptop: Boolean,
      phone: Boolean,
      badge: Boolean,
      keys: Boolean,
      otherItems: [String],
      returnedDate: Date,
      checkedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    
    // === SYSTEM ACCESS REMOVAL ===
    systemAccess: {
      vpnDisabled: Boolean,
      emailDisabled: Boolean,
      systemsAccess: [String],
      disabledDate: Date,
      checkedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    
    // === FINAL CHECKLIST ===
    finalChecklist: {
      backgroundCheck: Boolean,
      taxDocuments: Boolean,
      beneficiaryDetails: Boolean,
      exitInterview: Boolean,
      allApprovals: Boolean,
      completedDate: Date
    },
    
    // Multi-tenancy
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes
EmployeeLifecycleSchema.index({ employeeId: 1 });
EmployeeLifecycleSchema.index({ currentPhase: 1, ownerId: 1 });
EmployeeLifecycleSchema.index({ probationEndDate: 1, currentPhase: 1 });

export const EmployeeLifecycle = mongoose.model<IEmployeeLifecycle>(
  'EmployeeLifecycle',
  EmployeeLifecycleSchema
);

/**
 * 12-Step Onboarding Pipeline
 * 
 * 1. Job Posting & Recruitment
 * 2. Candidate Screening
 * 3. Interview Process
 * 4. Offer & Negotiation
 * 5. Acceptance & Paperwork
 * 6. Background Check
 * 7. IT Setup (Hardware, Software, Accounts)
 * 8. First Day Orientation
 * 9. Department Onboarding
 * 10. Role-Specific Training
 * 11. 30-Day Check-in
 * 12. 90-Day Probation Review
 */

export const ONBOARDING_STEPS = [
  { step: 1, name: 'Job Posting & Recruitment', duration: 'Ongoing' },
  { step: 2, name: 'Candidate Screening', duration: '1 week' },
  { step: 3, name: 'Interview Process', duration: '2 weeks' },
  { step: 4, name: 'Offer & Negotiation', duration: '3 days' },
  { step: 5, name: 'Acceptance & Paperwork', duration: '5 days' },
  { step: 6, name: 'Background Check', duration: '1 week' },
  { step: 7, name: 'IT Setup (Hardware/Software)', duration: '3 days' },
  { step: 8, name: 'First Day Orientation', duration: '1 day' },
  { step: 9, name: 'Department Onboarding', duration: '1 week' },
  { step: 10, name: 'Role-Specific Training', duration: '2 weeks' },
  { step: 11, name: '30-Day Check-in', duration: '1 day' },
  { step: 12, name: '90-Day Probation Review', duration: '1 day' }
];

/**
 * Offboarding Workflow (3 Exit Paths)
 * All paths include common offboarding steps
 */

export const OFFBOARDING_STEPS = [
  { step: 1, name: 'Initiate Exit Process', description: 'Create offboarding record' },
  { step: 2, name: 'Knowledge Transfer', description: 'Assign replacement, document responsibilities' },
  { step: 3, name: 'Email & System Access Removal', description: 'Disable VPN, email, system access' },
  { step: 4, name: 'Asset Return', description: 'Collect laptop, phone, badge, keys' },
  { step: 5, name: 'Exit Interview', description: 'Conduct exit interview' },
  { step: 6, name: 'Final Paycheck', description: 'Process final payment' },
  { step: 7, name: 'Benefits Continuation (COBRA)', description: 'Setup health insurance continuation' },
  { step: 8, name: 'Final Checklist', description: 'Verify all tasks completed' }
];
