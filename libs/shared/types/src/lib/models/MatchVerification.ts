import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'match_verifications' })
export class MatchVerification extends Document {
  @Prop({ required: true, unique: true, index: true })
  matchId: string;

  @Prop({ required: true, index: true })
  pubgAccountId: string;

  @Prop({ required: true })
  isVictory: boolean;

  @Prop({ required: true })
  winPlace: number;

  @Prop({ required: true })
  kills: number;

  @Prop({ required: true })
  damageDealt: number;

  @Prop({ required: true })
  timeSurvived: number;
}

export const MatchVerificationSchema = SchemaFactory.createForClass(MatchVerification);
