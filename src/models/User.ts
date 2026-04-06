import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: 'FREE' | 'PRO' | 'ADMIN';
  wallet_balance: number;
  stripe_customer_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: { type: String, enum: ['FREE', 'PRO', 'ADMIN'], default: 'FREE' },
    wallet_balance: { type: Number, default: 0 },
    stripe_customer_id: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
