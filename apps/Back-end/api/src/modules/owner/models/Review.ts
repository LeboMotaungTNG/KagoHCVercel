import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
  };
  status: 'Pending Review' | 'In Progress' | 'Closed' | 'Not Completed' | 'Outstanding';
  assessment: {
    self: {
      total: number;
      sections: Array<{ name: string; score: number; comments: string }>;
    };
    manager: {
      total: number;
      sections: Array<{ name: string; score: number; comments: string }>;
      feedback: string;
    };
  };
  goals: Array<{
    title: string;
    description: string;
    targetDate: Date;
    achieved: boolean;
  }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  status: {
    type: String,
    enum: ['Pending Review', 'In Progress', 'Closed', 'Not Completed', 'Outstanding'],
    default: 'Pending Review'
  },
  assessment: {
    self: {
      total: { type: Number, default: 0 },
      sections: [{
        name: String,
        score: Number,
        comments: String
      }]
    },
    manager: {
      total: { type: Number, default: 0 },
      sections: [{
        name: String,
        score: Number,
        comments: String
      }],
      feedback: String
    }
  },
  goals: [{
    title: String,
    description: String,
    targetDate: Date,
    achieved: { type: Boolean, default: false }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
