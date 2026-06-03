import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collection: 'play_requests' })
export class PlayRequest extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  senderId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  receiverId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: 'PENDING', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] })
  status: string;

  @Prop({ default: '' })
  message: string;
}

export const PlayRequestSchema = SchemaFactory.createForClass(PlayRequest);
