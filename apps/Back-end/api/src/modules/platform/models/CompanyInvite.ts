import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyInvite extends Document {
  companyId: mongoose.Types.ObjectId;
  email: string;       // owner's email the invite was sent to
  token: string;       // raw token returned to platform admin (share via link)
  expiresAt: Date;     // 48 hours from creation
  used: boolean;
  usedAt?: Date;
  createdBy: mongoose.Types.ObjectId; // platform_admin who created it
  createdAt: Date;
  updatedAt: Date;
}

const CompanyInviteSchema = new Schema<ICompanyInvite>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-expire documents 7 days after expiresAt so the collection
// doesn't grow unbounded. TTL index runs on expiresAt + 7 days offset.
CompanyInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default mongoose.model<ICompanyInvite>('CompanyInvite', CompanyInviteSchema);
