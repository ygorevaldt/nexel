import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  freefire_id: string;
  passwordHash: string;
  role: 'FREE' | 'PRO' | 'SCOUT' | 'ADMIN';
  /** Account type determines the user's role in the ecosystem */
  accountType: 'PLAYER' | 'SCOUT';
  /** Current subscription tier */
  subscriptionStatus: 'FREE' | 'PRO' | 'SCOUT';
  /** Stripe Customer ID — set on first checkout, used for webhook matching */
  stripeCustomerId?: string;
  /** Stripe Subscription ID — set after checkout.session.completed webhook */
  stripeSubscriptionId?: string;
  /** When the current subscription period ends */
  subscriptionEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    freefire_id: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['FREE', 'PRO', 'SCOUT', 'ADMIN'], default: 'FREE' },
    accountType: { type: String, enum: ['PLAYER', 'SCOUT'], default: 'PLAYER' },
    subscriptionStatus: { type: String, enum: ['FREE', 'PRO', 'SCOUT'], default: 'FREE' },
    stripeCustomerId: { type: String, sparse: true },
    stripeSubscriptionId: { type: String, sparse: true },
    subscriptionEndDate: { type: Date },
  },
  { timestamps: true }
);

// Index for Stripe webhooks to quickly find users by customerId
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>('User', UserSchema);
