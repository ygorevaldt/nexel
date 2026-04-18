import mongoose, { Schema, Document, Model } from 'mongoose';

export type PlanConsentAction = 'CANCEL' | 'UPGRADE' | 'DOWNGRADE';
export type PlanTier = 'FREE' | 'PRO' | 'SCOUT';

export interface IPlanConsentLog extends Document {
  user_id: mongoose.Types.ObjectId;
  action: PlanConsentAction;
  from_plan: PlanTier;
  to_plan: PlanTier;
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlanConsentLogSchema: Schema<IPlanConsentLog> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['CANCEL', 'UPGRADE', 'DOWNGRADE'],
      required: true,
    },
    from_plan: {
      type: String,
      enum: ['FREE', 'PRO', 'SCOUT'],
      required: true,
    },
    to_plan: {
      type: String,
      enum: ['FREE', 'PRO', 'SCOUT'],
      required: true,
    },
    ip_address: { type: String },
    user_agent: { type: String },
  },
  { timestamps: true }
);

PlanConsentLogSchema.index({ user_id: 1, createdAt: -1 });

export const PlanConsentLog: Model<IPlanConsentLog> =
  mongoose.models.PlanConsentLog ||
  mongoose.model<IPlanConsentLog>('PlanConsentLog', PlanConsentLogSchema);
