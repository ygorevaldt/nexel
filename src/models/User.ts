import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  freefire_id: string;
  passwordHash: string;
  role: 'FREE' | 'PRO' | 'SCOUT' | 'ADMIN';
  /** System-level role — separate from subscription plan to avoid webhook conflicts */
  systemRole: 'USER' | 'ADM';
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
  /** Profile IDs this user has favorited */
  favorited_profile_ids: mongoose.Types.ObjectId[];
  /** Welcome credits granted at registration — consumed before plan limits kick in */
  welcome_analysis_credits: number;
  welcome_booyah_credits: number;
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
    systemRole: { type: String, enum: ['USER', 'ADM'], default: 'USER' },
    accountType: { type: String, enum: ['PLAYER', 'SCOUT'], default: 'PLAYER' },
    subscriptionStatus: { type: String, enum: ['FREE', 'PRO', 'SCOUT'], default: 'FREE' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionEndDate: { type: Date },
    favorited_profile_ids: [{ type: Schema.Types.ObjectId, ref: 'Profile', default: [] }],
    welcome_analysis_credits: { type: Number, default: 5, min: 0 },
    welcome_booyah_credits: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

// Index for Stripe webhooks to quickly find users by customerId
UserSchema.index({ stripeCustomerId: 1 }, { sparse: true });

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>('User', UserSchema);
