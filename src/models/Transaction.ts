import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Transaction types for the SaaS subscription model.
 * All betting-related types (CHALLENGE_FEE, CHALLENGE_WIN, CHALLENGE_STAKE, DEPOSIT, WITHDRAW)
 * have been permanently removed.
 */
export type TransactionType =
  | 'SUBSCRIPTION_PAYMENT'   // Recurring Stripe subscription charge
  | 'SUBSCRIPTION_REFUND'    // Stripe refund event
  | 'CREDIT_ADDED'           // Manual or promotional credit added by admin
  | 'ANALYSIS_CREDIT_USED';  // One AI analysis credit consumed (for metered billing)

export interface ITransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number; // In BRL cents (e.g. 2990 = R$ 29,90)
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  /** The plan this transaction relates to */
  plan?: 'PRO' | 'SCOUT';
  /** Stripe Payment Intent ID — populated for SUBSCRIPTION_PAYMENT events */
  stripe_payment_intent_id?: string;
  /** Stripe Invoice ID — populated for recurring payments */
  stripe_invoice_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['SUBSCRIPTION_PAYMENT', 'SUBSCRIPTION_REFUND', 'CREDIT_ADDED', 'ANALYSIS_CREDIT_USED'],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    plan: { type: String, enum: ['PRO', 'SCOUT'] },
    stripe_payment_intent_id: { type: String },
    stripe_invoice_id: { type: String },
  },
  { timestamps: true }
);

// Index for Stripe idempotency checks
TransactionSchema.index({ stripe_payment_intent_id: 1 }, { sparse: true });
TransactionSchema.index({ user_id: 1, createdAt: -1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
