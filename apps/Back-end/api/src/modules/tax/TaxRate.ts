import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface ITaxRate extends Document {
  ownerId: mongoose.Types.ObjectId;
  taxYear: number;
  payeBrackets: ITaxBracket[];
  primaryRebate: number;
  uifRate: number;
  uifMaxMonthly: number;
  sdlRate: number;
  skillsLevyRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaxBracketSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number },
  rate: { type: Number, required: true }
});

const TaxRateSchema = new Schema<ITaxRate>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  taxYear: { type: Number, required: true, default: new Date().getFullYear() },
  payeBrackets: [TaxBracketSchema],
  primaryRebate: { type: Number, default: 17235 },
  uifRate: { type: Number, default: 1.0 },
  uifMaxMonthly: { type: Number, default: 177.12 },
  sdlRate: { type: Number, default: 1.0 },
  skillsLevyRate: { type: Number, default: 1.0 }
}, { timestamps: true });

export default mongoose.model<ITaxRate>('TaxRate', TaxRateSchema);
