import mongoose, { Schema, Document } from 'mongoose';
import { IDisciplinaryCase } from './disciplinaryCase.model';
import { IDisciplinarySanction } from './disciplinarySanction.model';

export interface IDisciplinaryAppeal extends Document {
  caseId: mongoose.Types.ObjectId | IDisciplinaryCase;
  sanctionId: mongoose.Types.ObjectId | IDisciplinarySanction;
  appealDate: Date;
  grounds: AppealGrounds[];
  reason: string;
  supportingDocuments: AppealDocument[];
  status: AppealStatus;
  hearingDate?: Date;
  appealOutcome?: AppealOutcome;
  outcomeReason?: string;
  decisionDate?: Date;
  decidedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

export enum AppealGrounds {
  PROCEDURAL_UNFAIRNESS = 'procedural_unfairness',
  SUBSTANTIVE_UNFAIRNESS = 'substantive_unfairness',
  NEW_EVIDENCE = 'new_evidence',
  DISPROPORTIONATE_SANCTION = 'disproportionate_sanction',
  BIAS = 'bias',
  OTHER = 'other'
}

export enum AppealStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  HEARING_SCHEDULED = 'hearing_scheduled',
  DECISION_PENDING = 'decision_pending',
  DECIDED = 'decided',
  WITHDRAWN = 'withdrawn'
}

export enum AppealOutcome {
  UPHELD = 'upheld',
  PARTIALLY_UPHELD = 'partially_upheld',
  DISMISSED = 'dismissed',
  SANCTION_REDUCED = 'sanction_reduced',
  SANCTION_INCREASED = 'sanction_increased',
  CASE_REOPENED = 'case_reopened'
}

interface AppealDocument {
  id: string;
  title: string;
  fileUrl: string;
  fileKey: string;
  uploadedAt: Date;
}

const AppealDocumentSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileKey: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const DisciplinaryAppealSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: 'DisciplinaryCase', required: true },
  sanctionId: { type: Schema.Types.ObjectId, ref: 'DisciplinarySanction', required: true },
  appealDate: { type: Date, default: Date.now },
  grounds: [{ type: String, enum: Object.values(AppealGrounds), required: true }],
  reason: { type: String, required: true },
  supportingDocuments: [AppealDocumentSchema],
  status: { type: String, enum: Object.values(AppealStatus), default: AppealStatus.SUBMITTED },
  hearingDate: { type: Date },
  appealOutcome: { type: String, enum: Object.values(AppealOutcome) },
  outcomeReason: { type: String },
  decisionDate: { type: Date },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const DisciplinaryAppeal = mongoose.model<IDisciplinaryAppeal>('DisciplinaryAppeal', DisciplinaryAppealSchema);
