import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class ProfileStats {
  @Prop({ default: 0 })
  kdRatio: number;

  @Prop({ default: 0 })
  winRate: number;

  @Prop({ default: 0 })
  headshotRate: number;

  @Prop({ default: 0 })
  matchesPlayed: number;

  @Prop({ default: '' })
  currentRank: string;
}

@Schema({ _id: false })
export class TechnicalScores {
  @Prop({ default: null })
  movement: number | null;

  @Prop({ default: null })
  combat: number | null;

  @Prop({ default: null })
  rotation: number | null;
}

@Schema({ timestamps: true, collection: 'profiles' })
export class Profile extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ required: true, unique: true, index: true })
  pubgAccountId: string;

  @Prop({ required: true })
  pubgPlayerTag: string;

  @Prop({ required: true, default: 'steam', enum: ['steam', 'xbox', 'psn', 'kakao'] })
  platform: string;

  @Prop({ default: 'ALL-ROUNDER' })
  gameStyle: string;

  @Prop({ default: 0 })
  favorites_count: number;

  @Prop({ default: () => new Date(0) })
  lastSyncedAt: Date;

  @Prop({ type: ProfileStats, default: () => ({}) })
  stats: ProfileStats;

  @Prop({ type: TechnicalScores, default: () => ({}) })
  scores: TechnicalScores;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
export const ProfileStatsSchema = SchemaFactory.createForClass(ProfileStats);
export const TechnicalScoresSchema = SchemaFactory.createForClass(TechnicalScores);
