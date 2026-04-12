import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiAnalysisData {
  /** Overall talent potential score (0-100) — becomes the player's new global_score */
  overall_potential_score: number;
  movement_score: number;        // 0-100
  gloo_wall_usage: number;       // 0-100
  rotation_efficiency: number;   // 0-100
  /** Narrative feedback from the "Elite Recruiter" persona — 2-3 paragraphs */
  recruiter_feedback: string;
  /** Key competitive advantages of this player */
  strengths: string[];
  /** Specific areas requiring improvement */
  areas_for_improvement: string[];
  /** Critical gameplay errors observed in the frames */
  mistakes: string[];
  /** Outstanding tactical decisions or mechanically impressive plays */
  highlights: string[];
  /** Suggested role/playstyle for competitive teams */
  recommended_playstyle: string;
}

export interface IAiAnalysis extends Document {
  profile_id: mongoose.Types.ObjectId;
  video_url?: string;
  content_hash?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  analysis_data?: IAiAnalysisData;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    /** Whether a cached context was used (reduces prompt token cost ~75%) */
    cache_hit: boolean;
  };
  /** Gemini Context Cache ID for reuse within the same session/day */
  cached_context_id?: string;
  error_message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiAnalysisSchema: Schema<IAiAnalysis> = new Schema(
  {
    profile_id: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    video_url: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    analysis_data: {
      overall_potential_score: { type: Number, min: 0, max: 100 },
      movement_score: { type: Number, min: 0, max: 100 },
      gloo_wall_usage: { type: Number, min: 0, max: 100 },
      rotation_efficiency: { type: Number, min: 0, max: 100 },
      recruiter_feedback: { type: String },
      strengths: [{ type: String }],
      areas_for_improvement: [{ type: String }],
      mistakes: [{ type: String }],
      highlights: [{ type: String }],
      recommended_playstyle: { type: String },
    },
    token_usage: {
      prompt_tokens: Number,
      completion_tokens: Number,
      total_tokens: Number,
      cache_hit: { type: Boolean, default: false },
    },
    cached_context_id: { type: String },
    content_hash: { type: String },
    error_message: String,
  },
  { timestamps: true }
);

AiAnalysisSchema.index({ profile_id: 1, createdAt: -1 });
// Sparse index: most documents won't have content_hash (legacy), so sparse avoids indexing nulls
AiAnalysisSchema.index({ content_hash: 1 }, { sparse: true });

export const AiAnalysis: Model<IAiAnalysis> =
  mongoose.models.AiAnalysis || mongoose.model<IAiAnalysis>('AiAnalysis', AiAnalysisSchema);
