import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiScoreEntry {
  score: number;
  date: Date;
}

export interface IProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  game_id: string; // Free Fire ID
  nickname: string;
  bio?: string;
  /** AI-calculated talent potential score (0-100). Updated after each analysis. */
  global_score: number;
  rank: string;
  social_links?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  /**
   * Contact info — only exposed via API to users with subscriptionStatus === 'SCOUT'.
   * Never returned to FREE or PRO users.
   */
  contact_info?: {
    discord?: string;
    whatsapp?: string;
  };
  /** URL of the player's best gameplay clip, shown in the Scout View */
  highlight_video_url?: string;
  /**
   * Up to 5 AiAnalysis IDs the player chose to highlight for Scouts.
   * These are shown prominently on the player's public profile.
   */
  highlighted_analysis_ids: mongoose.Types.ObjectId[];
  /** History of AI scores for evolution charts on the dashboard */
  ai_score_history: IAiScoreEntry[];
  metrics: {
    matches_played: number;
    wins: number;
    losses: number;
    headshot_rate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema<IProfile> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    game_id: { type: String, required: true },
    nickname: { type: String, required: true },
    bio: { type: String, maxlength: 500 },
    global_score: { type: Number, default: 0, min: 0, max: 100 },
    rank: { type: String, default: 'Bronze' },
    social_links: {
      instagram: String,
      youtube: String,
      tiktok: String,
    },
    contact_info: {
      discord: String,
      whatsapp: String,
    },
    highlight_video_url: { type: String },
    highlighted_analysis_ids: [{ type: Schema.Types.ObjectId, ref: 'AiAnalysis' }],
    ai_score_history: [
      {
        score: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    metrics: {
      matches_played: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      headshot_rate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes for searching and ranking players
ProfileSchema.index({ nickname: 'text' });
ProfileSchema.index({ global_score: -1 });
ProfileSchema.index({ rank: 1, global_score: -1 });

export const Profile: Model<IProfile> =
  mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
