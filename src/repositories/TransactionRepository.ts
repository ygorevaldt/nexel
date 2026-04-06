import dbConnect from '@/lib/db';
import { Transaction, ITransaction } from '@/models/Transaction';

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
  type: ITransaction['type'];
  amount: number;
  status?: ITransaction['status'];
  reference_id?: string;
}): Promise<ITransaction> {
  await dbConnect();
  return Transaction.create({ status: 'COMPLETED', ...data });
}
