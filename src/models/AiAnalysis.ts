import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiAnalysis extends Document {
  profile_id: mongoose.Types.ObjectId;
  video_url?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analysis_data?: {
    movement_score: number; // 0-100
    gloo_wall_usage: number; // 0-100
    rotation_efficiency: number; // 0-100
    mistakes: string[];
    highlights: string[];
  };
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error_message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiAnalysisSchema: Schema<IAiAnalysis> = new Schema(
  {
    profile_id: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    video_url: { type: String },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    analysis_data: {
      movement_score: { type: Number },
      gloo_wall_usage: { type: Number },
      rotation_efficiency: { type: Number },
      mistakes: [{ type: String }],
      highlights: [{ type: String }]
    },
    token_usage: {
      prompt_tokens: Number,
      completion_tokens: Number,
      total_tokens: Number
    },
    error_message: String,
  },
  { timestamps: true }
);

export const AiAnalysis: Model<IAiAnalysis> = mongoose.models.AiAnalysis || mongoose.model<IAiAnalysis>('AiAnalysis', AiAnalysisSchema);
