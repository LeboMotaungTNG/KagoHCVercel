import mongoose, { Schema, Document } from 'mongoose';

export interface IDisciplinaryIncident extends Document {
  incidentNumber: string;
  employeeId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  incidentType: IncidentType;
  incidentDate: Date;
  description: string;
  location: string;
  witnesses: string[];
  immediateAction?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  investigatedBy?: mongoose.Types.ObjectId;
  investigationFindings?: string;
  caseId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

export enum IncidentType {
  ACCIDENT = 'accident',
  NEAR_MISS = 'near_miss',
  DAMAGE_TO_PROPERTY = 'damage_to_property',
  THEFT = 'theft',
  ASSAULT = 'assault',
  HARASSMENT = 'harassment',
  DISCRIMINATION = 'discrimination',
  SAFETY_VIOLATION = 'safety_violation',
  POLICY_VIOLATION = 'policy_violation',
  OTHER = 'other'
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  REPORTED = 'reported',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REFERRED_TO_HR = 'referred_to_hr'
}

const DisciplinaryIncidentSchema = new Schema({
  incidentNumber: { type: String, required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  incidentType: { type: String, enum: Object.values(IncidentType), required: true },
  incidentDate: { type: Date, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  witnesses: [{ type: String }],
  immediateAction: { type: String },
  severity: { type: String, enum: Object.values(IncidentSeverity), required: true },
  status: { type: String, enum: Object.values(IncidentStatus), default: IncidentStatus.REPORTED },
  investigatedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  investigationFindings: { type: String },
  caseId: { type: Schema.Types.ObjectId, ref: 'DisciplinaryCase' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

DisciplinaryIncidentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('DisciplinaryIncident').countDocuments();
    this.incidentNumber = `INC-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const DisciplinaryIncident = mongoose.model<IDisciplinaryIncident>('DisciplinaryIncident', DisciplinaryIncidentSchema);
