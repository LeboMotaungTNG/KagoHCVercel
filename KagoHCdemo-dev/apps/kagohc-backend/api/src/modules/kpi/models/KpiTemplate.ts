import mongoose, { Document } from 'mongoose';

export interface IKpiTemplate extends Document {
  name: string;
  description: string;
  category: 'individual' | 'team' | 'company';
  department?: string;
  metrics: {
    name: string;
    description: string;
    weight: number; // 0-100%
    target: number;
    unit: string;
    isRequired: boolean;
  }[];
  frequency: 'monthly' | 'quarterly' | 'yearly';
  createdBy: mongoose.Types.ObjectId;
   weight: number;           // How much this KPI counts (0-100)
  unit: 'percentage' | 'number' | 'hours' | 'days';
  targetType: 'higher_is_better' | 'lower_is_better' | 'exact';
  isActive: boolean;

}

const kpiTemplateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['individual', 'team', 'company'],
    required: true 
  },
  department: { 
    type: String 
  },
  metrics: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    target: { type: Number, required: true },
    unit: { type: String, default: '%' },
    isRequired: { type: Boolean, default: true }
  }],
  frequency: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

const KpiTemplate = mongoose.models.KpiTemplate || mongoose.model<IKpiTemplate>('KpiTemplate', kpiTemplateSchema);
export default KpiTemplate;
