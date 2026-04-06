import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  type: 'DEPOSIT' | 'WITHDRAW' | 'CHALLENGE_FEE' | 'CHALLENGE_WIN' | 'CHALLENGE_STAKE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reference_id?: mongoose.Types.ObjectId; // E.g., Challenge ID
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['DEPOSIT', 'WITHDRAW', 'CHALLENGE_FEE', 'CHALLENGE_WIN', 'CHALLENGE_STAKE'], required: true },
    amount: { type: Number, required: true }, // positive or negative
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    reference_id: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
