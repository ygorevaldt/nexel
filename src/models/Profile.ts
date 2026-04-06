import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  game_id: string; // Free Fire ID
  nickname: string;
  bio?: string;
  global_score: number; // 0-100 Ai calculated health score
  rank: string;
  social_links?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  metrics: {
    matches_played: number;
    challenges_won: number;
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
    global_score: { type: Number, default: 50, min: 0, max: 100 },
    rank: { type: String, default: 'Bronze' },
    social_links: {
      instagram: String,
      youtube: String,
      tiktok: String,
    },
    metrics: {
      matches_played: { type: Number, default: 0 },
      challenges_won: { type: Number, default: 0 },
      headshot_rate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes for searching players
ProfileSchema.index({ nickname: 'text' });

export const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
