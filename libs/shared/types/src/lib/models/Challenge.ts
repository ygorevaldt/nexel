import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'challenges' })
export class Challenge extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  creatorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true, default: null })
  opponentId: MongooseSchema.Types.ObjectId | null;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, default: 0 })
  betAmount: number;

  @Prop({ required: true, default: 'OPEN', enum: ['OPEN', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] })
  status: string;

  @Prop({ default: '' })
  pubgMatchId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  winnerId: MongooseSchema.Types.ObjectId | null;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
