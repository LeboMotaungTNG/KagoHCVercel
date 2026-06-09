import mongoose, { Schema, Document } from 'mongoose';
import { IEmployee } from '../../employee/models/employee.model';

export interface IDisciplinaryCase extends Document {
  caseNumber: string;
  employeeId: mongoose.Types.ObjectId | IEmployee;
  reportedBy: mongoose.Types.ObjectId | IEmployee;
  incidentDate: Date;
  reportedDate: Date;
  category: DisciplinaryCategory;
  severity: SeverityLevel;
  description: string;
  evidence: Evidence[];
  witnesses: Witness[];
  status: CaseStatus;
  investigationOfficer?: mongoose.Types.ObjectId | IEmployee;
  investigationReport?: string;
  recommendedAction?: string;
  hrOfficer?: mongoose.Types.ObjectId | IEmployee;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

export enum DisciplinaryCategory {
  MISCONDUCT = 'misconduct',
  PERFORMANCE = 'performance',
  ATTENDANCE = 'attendance',
  HARASSMENT = 'harassment',
  DISCRIMINATION = 'discrimination',
  SAFETY_VIOLATION = 'safety_violation',
  FRAUD = 'fraud',
  CONFIDENTIALITY_BREACH = 'confidentiality_breach',
  THEFT = 'theft',
  INSUBORDINATION = 'insubordination',
  NEGLIGENCE = 'negligence',
  SUBSTANCE_ABUSE = 'substance_abuse',
  OTHER = 'other'
}

export enum SeverityLevel {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SERIOUS = 'serious',
  GROSS = 'gross'
}

export enum CaseStatus {
  REPORTED = 'reported',
  UNDER_INVESTIGATION = 'under_investigation',
  HEARING_SCHEDULED = 'hearing_scheduled',
  PENDING_DECISION = 'pending_decision',
  DECISION_MADE = 'decision_made',
  APPEAL_PENDING = 'appeal_pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ARCHIVED = 'archived'
}

interface Evidence {
  id: string;
  type: 'document' | 'photo' | 'video' | 'audio' | 'email' | 'witness_statement';
  title: string;
  description?: string;
  fileUrl?: string;
  fileKey?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

interface Witness {
  name: string;
  employeeId?: string;
  relationship: string;
  statement?: string;
  contactNumber?: string;
  email?: string;
}

const EvidenceSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['document', 'photo', 'video', 'audio', 'email', 'witness_statement'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String },
  fileKey: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const WitnessSchema = new Schema({
  name: { type: String, required: true },
  employeeId: { type: String },
  relationship: { type: String, required: true },
  statement: { type: String },
  contactNumber: { type: String },
  email: { type: String }
});

const DisciplinaryCaseSchema = new Schema({
  caseNumber: { type: String, required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  incidentDate: { type: Date, required: true },
  reportedDate: { type: Date, default: Date.now },
  category: { type: String, enum: Object.values(DisciplinaryCategory), required: true },
  severity: { type: String, enum: Object.values(SeverityLevel), required: true },
  description: { type: String, required: true },
  evidence: [EvidenceSchema],
  witnesses: [WitnessSchema],
  status: { type: String, enum: Object.values(CaseStatus), default: CaseStatus.REPORTED },
  investigationOfficer: { type: Schema.Types.ObjectId, ref: 'Employee' },
  investigationReport: { type: String },
  recommendedAction: { type: String },
  hrOfficer: { type: Schema.Types.ObjectId, ref: 'Employee' },
  closedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

DisciplinaryCaseSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('DisciplinaryCase').countDocuments();
    this.caseNumber = `DISC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const DisciplinaryCase = mongoose.model<IDisciplinaryCase>('DisciplinaryCase', DisciplinaryCaseSchema);
