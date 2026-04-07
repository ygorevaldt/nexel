import dbConnect from '@/lib/db';
import { Transaction, ITransaction, TransactionType } from '@/models/Transaction';

export async function findTransactionsByUser(
  userId: string,
  limit = 20
): Promise<ITransaction[]> {
  await dbConnect();
  return Transaction.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createTransaction(data: {
  user_id: string;
  type: TransactionType;
  amount: number;
  status?: ITransaction['status'];
  plan?: 'PRO' | 'SCOUT';
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
}): Promise<ITransaction> {
  await dbConnect();
  return Transaction.create({ status: 'COMPLETED', ...data });
}

/**
 * Finds a transaction by Stripe Payment Intent ID.
 * Used for idempotency checks in the webhook handler to avoid duplicate processing.
 */
export async function findTransactionByStripeIntent(
  stripePaymentIntentId: string
): Promise<ITransaction | null> {
  await dbConnect();
  return Transaction.findOne({ stripe_payment_intent_id: stripePaymentIntentId }).lean();
}
