import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'plan_consent_logs' })
export class PlanConsentLog extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true, default: true })
  consentGiven: boolean;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;
}

export const PlanConsentLogSchema = SchemaFactory.createForClass(PlanConsentLog);
