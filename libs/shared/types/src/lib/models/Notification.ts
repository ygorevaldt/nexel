import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, default: false })
  isRead: boolean;

  @Prop({ default: 'INFO', enum: ['INFO', 'CHALLENGE', 'SYSTEM', 'ANALYSIS'] })
  type: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
