import dbConnect from '@/lib/db';
import { User, IUser } from '@/models/User';

export async function findUserById(id: string): Promise<IUser | null> {
  await dbConnect();
  return User.findById(id).lean();
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  await dbConnect();
  return User.findOne({ email }).lean();
}

export async function updateWalletBalance(
  userId: string,
  delta: number
): Promise<IUser | null> {
  await dbConnect();
  return User.findByIdAndUpdate(
    userId,
    { $inc: { wallet_balance: delta } },
    { new: true }
  ).lean();
}
