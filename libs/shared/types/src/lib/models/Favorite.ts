import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'favorites' })
export class Favorite extends Document {
  @Prop({ required: true, index: true })
  scoutUserId: string;

  @Prop({ required: true, index: true })
  targetProfileId: string;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
