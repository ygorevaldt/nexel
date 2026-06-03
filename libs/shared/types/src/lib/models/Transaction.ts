import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  stripeSessionId: string;

  @Prop({ required: true, default: 0 })
  amount: number;

  @Prop({ required: true, default: 'BRL' })
  currency: string;

  @Prop({ required: true, default: 'PENDING', enum: ['PENDING', 'COMPLETED', 'FAILED'] })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
