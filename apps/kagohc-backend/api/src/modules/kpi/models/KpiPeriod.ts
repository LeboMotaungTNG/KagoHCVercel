import mongoose, { Document } from 'mongoose';

export interface IKpiPeriod extends Document {
  name: string;
  type: 'quarterly' | 'annual' | 'monthly';
  openDate: Date;
  closeDate: Date;
  reviewStartDate: Date;
  reviewEndDate: Date;
  reviewDate?: Date; // Deprecated, use reviewEndDate
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: mongoose.Types.ObjectId;
  status: 'upcoming' | 'open' | 'review' | 'closed' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const kpiPeriodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
    // Removed enum to allow any period name
  },
  type: {
    type: String,
    required: true,
    enum: ['quarterly', 'annual', 'monthly']
  },
  openDate: {
    type: Date,
    required: true
  },
  closeDate: {
    type: Date,
    required: true
  },
  reviewStartDate: {
    type: Date,
    required: true
  },
  reviewEndDate: {
    type: Date,
    required: true
  },
  reviewDate: {
    type: Date
    // Kept for backward compatibility
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['upcoming', 'open', 'review', 'closed', 'archived'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Auto-update status based on dates
kpiPeriodSchema.pre('save', function(next) {
  const now = new Date();
  const reviewEnd = this.reviewEndDate || this.reviewDate;
  
  if (now < this.openDate) {
    this.status = 'upcoming';
  } else if (now >= this.openDate && now <= this.closeDate) {
    this.status = 'open';
  } else if (now > this.closeDate && reviewEnd && now <= reviewEnd) {
    this.status = 'review';
  } else if (reviewEnd && now > reviewEnd && !this.isLocked) {
    this.status = 'closed';
  }
  
  next();
});

// Indexes for performance
kpiPeriodSchema.index({ status: 1 });
kpiPeriodSchema.index({ openDate: 1, closeDate: 1 });
kpiPeriodSchema.index({ reviewEndDate: 1 });
kpiPeriodSchema.index({ isLocked: 1 });

export const KpiPeriod = mongoose.model<IKpiPeriod>('KpiPeriod', kpiPeriodSchema);