import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 'FREE', enum: ['FREE', 'PRO', 'SCOUT'] })
  subscriptionStatus: string;

  @Prop({ default: 0 })
  welcome_analysis_credits: number;
  
  @Prop({ default: 'USER', enum: ['USER', 'ADM'] })
  systemRole: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
