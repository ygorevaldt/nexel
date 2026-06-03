import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'plans' })
export class Plan extends Document {
  @Prop({ required: true, unique: true })
  planId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  priceMonthly: number;

  @Prop({ type: [String], default: [] })
  features: string[];
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
