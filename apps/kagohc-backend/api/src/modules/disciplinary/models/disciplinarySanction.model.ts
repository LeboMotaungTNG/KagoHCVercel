import mongoose, { Schema, Document } from 'mongoose';
import { IDisciplinaryCase } from './disciplinaryCase.model';
import { IDisciplinaryHearing } from './disciplinaryHearing.model';

export interface IDisciplinarySanction extends Document {
  caseId: mongoose.Types.ObjectId | IDisciplinaryCase;
  hearingId: mongoose.Types.ObjectId | IDisciplinaryHearing;
  type: SanctionType;
  severity: SanctionSeverity;
  description: string;
  effectiveDate: Date;
  expiryDate?: Date;
  details: SanctionDetails;
  conditions?: string[];
  status: SanctionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewDate?: Date;
  reviewNotes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

export enum SanctionType {
  VERBAL_WARNING = 'verbal_warning',
  WRITTEN_WARNING = 'written_warning',
  FINAL_WRITTEN_WARNING = 'final_written_warning',
  SUSPENSION = 'suspension',
  DEMOTION = 'demotion',
  PAY_CUT = 'pay_cut',
  TRANSFER = 'transfer',
  TERMINATION = 'termination',
  TRAINING = 'training',
  COUNSELING = 'counseling',
  PROBATION_EXTENSION = 'probation_extension'
}

export enum SanctionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SanctionStatus {
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  IMPLEMENTED = 'implemented',
  APPEALED = 'appealed',
  OVERTURNED = 'overturned',
  EXPIRED = 'expired'
}

interface SanctionDetails {
  suspensionDays?: number;
  suspensionWithPay?: boolean;
  payCutPercentage?: number;
  payCutDuration?: number;
  previousPosition?: string;
  newPosition?: string;
  previousSalary?: number;
  newSalary?: number;
  previousDepartment?: string;
  newDepartment?: string;
  trainingProgram?: string;
  trainingDuration?: number;
  trainingProvider?: string;
}

const SanctionDetailsSchema = new Schema({
  suspensionDays: { type: Number },
  suspensionWithPay: { type: Boolean },
  payCutPercentage: { type: Number },
  payCutDuration: { type: Number },
  previousPosition: { type: String },
  newPosition: { type: String },
  previousSalary: { type: Number },
  newSalary: { type: Number },
  previousDepartment: { type: String },
  newDepartment: { type: String },
  trainingProgram: { type: String },
  trainingDuration: { type: Number },
  trainingProvider: { type: String }
});

const DisciplinarySanctionSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: 'DisciplinaryCase', required: true },
  hearingId: { type: Schema.Types.ObjectId, ref: 'DisciplinaryHearing', required: true },
  type: { type: String, enum: Object.values(SanctionType), required: true },
  severity: { type: String, enum: Object.values(SanctionSeverity), required: true },
  description: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  expiryDate: { type: Date },
  details: SanctionDetailsSchema,
  conditions: [{ type: String }],
  status: { type: String, enum: Object.values(SanctionStatus), default: SanctionStatus.PROPOSED },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewDate: { type: Date },
  reviewNotes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const DisciplinarySanction = mongoose.model<IDisciplinarySanction>('DisciplinarySanction', DisciplinarySanctionSchema);
