import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanySettings extends Document {
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

// Single flexible document that stores the company profile/legal/banking settings
// exactly as the Owner UI sends them. strict:false keeps it schema-agnostic.
const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    key: { type: String, default: 'default', unique: true },
  },
  { timestamps: true, strict: false }
);

export const CompanySettingsModel = mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema);
