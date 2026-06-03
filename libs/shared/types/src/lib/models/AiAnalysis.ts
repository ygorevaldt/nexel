import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class WeaponAnalysis {
  @Prop({ required: true })
  spray_control_feedback: string;

  @Prop({ required: true })
  setup_recommendation: string;
}

@Schema({ _id: false })
export class AnalysisResult {
  @Prop({ required: true })
  overall_potential_score: number;

  @Prop({ required: true })
  movement_score: number;

  @Prop({ required: true })
  combat_score: number;

  @Prop({ required: true })
  rotation_efficiency: number;

  @Prop({ required: true })
  recruiter_feedback: string;

  @Prop({ type: [String], required: true })
  strengths: string[];

  @Prop({ type: [String], required: true })
  areas_for_improvement: string[];

  @Prop({ type: WeaponAnalysis, required: true })
  weapon_analysis: WeaponAnalysis;

  @Prop({ required: true })
  recommended_playstyle: string;
}

@Schema({ timestamps: true, collection: 'ai_analyses' })
export class AiAnalysis extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Profile', index: true })
  profileId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, index: true })
  matchId: string;

  @Prop({ required: true, default: 'PROCESSING', enum: ['PROCESSING', 'COMPLETED', 'FAILED'] })
  status: string;

  @Prop({ type: AnalysisResult, default: null })
  result: AnalysisResult | null;

  @Prop({ default: '' })
  errorMessage: string;

  @Prop({ default: 0 })
  tokenUsage: number;
}

export const AiAnalysisSchema = SchemaFactory.createForClass(AiAnalysis);
export const WeaponAnalysisSchema = SchemaFactory.createForClass(WeaponAnalysis);
export const AnalysisResultSchema = SchemaFactory.createForClass(AnalysisResult);
