import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChallenge extends Document {
  creator_id: mongoose.Types.ObjectId;
  opponent_id?: mongoose.Types.ObjectId; // Optional until someone accepts
  type: '1v1' | '4v4';
  stake_amount: number;
  status: 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'RESOLVING' | 'COMPLETED' | 'DISPUTED';
  winner_id?: mongoose.Types.ObjectId;
  proof_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema<IChallenge> = new Schema(
  {
    creator_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponent_id: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['1v1', '4v4'], required: true },
    stake_amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVING', 'COMPLETED', 'DISPUTED'], default: 'OPEN' },
    winner_id: { type: Schema.Types.ObjectId, ref: 'User' },
    proof_url: { type: String }, // Screenshot from end game
  },
  { timestamps: true }
);

export const Challenge: Model<IChallenge> = mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);
