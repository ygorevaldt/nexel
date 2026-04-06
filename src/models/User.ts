import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  freefire_id: string;
  passwordHash: string;
  role: 'FREE' | 'PRO' | 'ADMIN';
  wallet_balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    freefire_id: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['FREE', 'PRO', 'ADMIN'], default: 'FREE' },
    wallet_balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// In development, delete the cached model so schema changes are always applied
// after hot reloads. Without this, Mongoose silently strips new fields (strict mode).
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as Record<string, unknown>).User;
}

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
