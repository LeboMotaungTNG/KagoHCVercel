import mongoose, { Schema, Document } from 'mongoose';
import { IDisciplinaryCase } from './disciplinaryCase.model';
import { IEmployee } from '../../employee/models/employee.model';

export interface IDisciplinaryHearing extends Document {
  caseId: mongoose.Types.ObjectId | IDisciplinaryCase;
  hearingDate: Date;
  hearingTime: string;
  venue: string;
  chairperson: mongoose.Types.ObjectId | IEmployee;
  employeeRepresentative?: mongoose.Types.ObjectId | IEmployee;
  employerRepresentative?: mongoose.Types.ObjectId | IEmployee;
  witnesses: HearingWitness[];
  status: HearingStatus;
  outcome?: HearingOutcome;
  minutes?: string;
  decision?: string;
  decisionDate?: Date;
  communicatedToEmployee?: boolean;
  communicatedDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

export enum HearingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  ADJOURNED = 'adjourned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export enum HearingOutcome {
  DISMISSED = 'dismissed',
  WARNING = 'warning',
  SUSPENSION = 'suspension',
  DEMOTION = 'demotion',
  FINAL_WARNING = 'final_warning',
  TERMINATION = 'termination',
  REFERRED_TO_ARBITRATION = 'referred_to_arbitration',
  NO_FURTHER_ACTION = 'no_further_action'
}

interface HearingWitness {
  witnessId?: mongoose.Types.ObjectId;
  name: string;
  type: 'employee' | 'external';
  calledBy: 'employee' | 'employer';
  testimony?: string;
  present: boolean;
}

const HearingWitnessSchema = new Schema({
  witnessId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  name: { type: String, required: true },
  type: { type: String, enum: ['employee', 'external'], required: true },
  calledBy: { type: String, enum: ['employee', 'employer'], required: true },
  testimony: { type: String },
  present: { type: Boolean, default: false }
});

const DisciplinaryHearingSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: 'DisciplinaryCase', required: true },
  hearingDate: { type: Date, required: true },
  hearingTime: { type: String, required: true },
  venue: { type: String, required: true },
  chairperson: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeRepresentative: { type: Schema.Types.ObjectId, ref: 'Employee' },
  employerRepresentative: { type: Schema.Types.ObjectId, ref: 'Employee' },
  witnesses: [HearingWitnessSchema],
  status: { type: String, enum: Object.values(HearingStatus), default: HearingStatus.SCHEDULED },
  outcome: { type: String, enum: Object.values(HearingOutcome) },
  minutes: { type: String },
  decision: { type: String },
  decisionDate: { type: Date },
  communicatedToEmployee: { type: Boolean, default: false },
  communicatedDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const DisciplinaryHearing = mongoose.model<IDisciplinaryHearing>('DisciplinaryHearing', DisciplinaryHearingSchema);
