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

export async function findUserByStripeCustomerId(
  customerId: string
): Promise<IUser | null> {
  await dbConnect();
  return User.findOne({ stripeCustomerId: customerId }).lean();
}

/**
 * Updates the user's subscription status after a successful Stripe webhook event.
 * This is the ONLY secure way to upgrade a user's plan — called from the webhook endpoint,
 * never directly from the frontend.
 */
export async function updateSubscription(
  userId: string,
  data: {
    subscriptionStatus: IUser['subscriptionStatus'];
    accountType?: IUser['accountType'];
    role?: IUser['role'];
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionEndDate?: Date;
  }
): Promise<IUser | null> {
  await dbConnect();
  return User.findByIdAndUpdate(userId, { $set: data }, { new: true }).lean();
}

/**
 * Cancels a user's subscription, reverting them to the FREE tier.
 * Called from the customer.subscription.deleted Stripe webhook event.
 */
export async function cancelSubscription(userId: string): Promise<IUser | null> {
  await dbConnect();
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        subscriptionStatus: 'FREE',
        role: 'FREE',
        stripeSubscriptionId: undefined,
        subscriptionEndDate: undefined,
      },
    },
    { new: true }
  ).lean();
}
