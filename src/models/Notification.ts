import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  type: 'PLAY_REQUEST_RECEIVED' | 'PLAY_REQUEST_RESPONDED' | 'SUPPORT_TICKET_RESOLVED';
  message: string;
  read: boolean;
  metadata: {
    nickname?: string;
    game_id?: string;
    contact?: string;
    response_type?: string;
    play_request_id?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['PLAY_REQUEST_RECEIVED', 'PLAY_REQUEST_RESPONDED', 'SUPPORT_TICKET_RESOLVED'],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ user_id: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ??
  mongoose.model<INotification>('Notification', NotificationSchema);
