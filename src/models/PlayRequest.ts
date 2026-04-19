import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayRequest extends Document {
  from_user_id: mongoose.Types.ObjectId;
  to_profile_id: mongoose.Types.ObjectId;
  status: 'PENDING' | 'RESPONDED';
  response_contact?: string;
  response_type?: 'whatsapp' | 'discord';
  createdAt: Date;
  updatedAt: Date;
}

const PlayRequestSchema: Schema<IPlayRequest> = new Schema(
  {
    from_user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to_profile_id: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    status: { type: String, enum: ['PENDING', 'RESPONDED'], default: 'PENDING' },
    response_contact: { type: String },
    response_type: { type: String, enum: ['whatsapp', 'discord'] },
  },
  { timestamps: true }
);

// Ensures one request per (from_user_id, to_profile_id) pair
PlayRequestSchema.index({ from_user_id: 1, to_profile_id: 1 }, { unique: true });

export const PlayRequest: Model<IPlayRequest> =
  (mongoose.models.PlayRequest as Model<IPlayRequest>) ??
  mongoose.model<IPlayRequest>('PlayRequest', PlayRequestSchema);
