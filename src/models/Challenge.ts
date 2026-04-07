import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChallenge extends Document {
  creator_id: mongoose.Types.ObjectId;
  opponent_id?: mongoose.Types.ObjectId;
  /** 1v1 or 4v4 format */
  type: '1v1' | '4v4';
  /**
   * Match type determines if results affect the global ranking.
   * RANKED matches update wins/losses and contribute to the Global Score.
   * FRIENDLY matches are practice-only.
   */
  matchType: 'RANKED' | 'FRIENDLY';
  /**
   * Difficulty bracket for matchmaking — players are matched within the same bracket.
   * This replaces the old gambling-based stake_amount tiers.
   */
  difficulty: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  status: 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  winner_id?: mongoose.Types.ObjectId;
  /** Optional link to the AI analysis that decided this match */
  analysis_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema<IChallenge> = new Schema(
  {
    creator_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponent_id: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['1v1', '4v4'], required: true },
    matchType: { type: String, enum: ['RANKED', 'FRIENDLY'], default: 'RANKED' },
    difficulty: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    winner_id: { type: Schema.Types.ObjectId, ref: 'User' },
    analysis_id: { type: Schema.Types.ObjectId, ref: 'AiAnalysis' },
  },
  { timestamps: true }
);

// Index for matchmaking queries
ChallengeSchema.index({ status: 1, difficulty: 1, type: 1 });

export const Challenge: Model<IChallenge> =
  mongoose.models.Challenge || mongoose.model<IChallenge>('Challenge', ChallengeSchema);
