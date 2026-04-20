import mongoose, { Document } from 'mongoose';

export interface IKpiAssessment extends Document {
  employeeId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  periodId: mongoose.Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
  };
  status: 'draft' | 'submitted' | 'under_review' | 'reviewed' | 'approved' | 'rejected' | 'locked';
  selfAssessment: {
    metrics: {
      metricName: string;
      achieved: number;
      comments: string;
      attachments?: string[];
    }[];
    overallComments: string;
    submittedAt?: Date;
  };
  managerAssessment?: {
    metrics: {
      metricName: string;
      rating: number; // 1-5
      comments: string;
    }[];
    overallRating: number;
    overallComments: string;
    strengths: string[];
    improvements: string[];
    reviewedAt?: Date;
  };
  finalScore?: number;
  achievement?: number;
  submittedAt?: Date;
  reviewedAt?: Date;
  lockedAt?: Date;
  employeeComment?: string;
  managerComment?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const kpiAssessmentSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  templateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KpiTemplate', 
    required: true 
  },
  periodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KpiPeriod',
    required: true
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'under_review', 'reviewed', 'approved', 'rejected', 'locked'],
    default: 'draft'
  },
  selfAssessment: {
    metrics: [{
      metricName: { type: String, required: true },
      achieved: { type: Number, required: true },
      comments: String,
      attachments: [String]
    }],
    overallComments: String,
    submittedAt: Date
  },
  managerAssessment: {
    metrics: [{
      metricName: { type: String, required: true },
      rating: { type: Number, min: 1, max: 5 },
      comments: String
    }],
    overallRating: { type: Number, min: 1, max: 5 },
    overallComments: String,
    strengths: [String],
    improvements: [String],
    reviewedAt: Date
  },
  finalScore: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  achievement: { 
    type: Number,
    min: 0,
    max: 100
  },
  submittedAt: Date,
  reviewedAt: Date,
  lockedAt: Date,
  employeeComment: String,
  managerComment: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// Index for efficient queries
kpiAssessmentSchema.index({ employeeId: 1, 'period.startDate': -1 });
kpiAssessmentSchema.index({ periodId: 1 });
kpiAssessmentSchema.index({ status: 1 });
kpiAssessmentSchema.index({ templateId: 1 });
kpiAssessmentSchema.index({ periodId: 1, employeeId: 1 }, { unique: true });

const KpiAssessment = mongoose.models.KpiAssessment || mongoose.model<IKpiAssessment>('KpiAssessment', kpiAssessmentSchema);
export default KpiAssessment;
