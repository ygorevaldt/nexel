import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { User, IUser } from '@/models/User';

export async function checkUserExists(
  email: string,
  freefireId: string
): Promise<{ emailExists: boolean; idExists: boolean }> {
  await dbConnect();
  const [emailUser, idUser] = await Promise.all([
    User.findOne({ email }).lean(),
    User.findOne({ freefire_id: freefireId }).lean(),
  ]);
  return { emailExists: !!emailUser, idExists: !!idUser };
}

export async function createUser(data: {
  name: string;
  email: string;
  freefire_id: string;
  passwordHash: string;
}): Promise<IUser> {
  await dbConnect();
  return User.create({
    ...data,
    role: 'FREE',
    subscriptionStatus: 'FREE',
    accountType: 'PLAYER',
  });
}

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

// ─── Favorites ───────────────────────────────────────────────────────────────

/**
 * Returns the list of profile IDs this user has favorited.
 */
export async function getFavoritedProfileIds(userId: string): Promise<string[]> {
  await dbConnect();
  const user = await User.findById(userId).select('favorited_profile_ids').lean();
  return (user?.favorited_profile_ids ?? []).map((id) => id.toString());
}

/**
 * Checks whether a user has favorited a specific profile.
 */
export async function isFavorited(userId: string, profileId: string): Promise<boolean> {
  await dbConnect();
  const user = await User.findById(userId).select('favorited_profile_ids').lean();
  const objectId = new mongoose.Types.ObjectId(profileId);
  return (user?.favorited_profile_ids ?? []).some((id) => id.equals(objectId));
}

/**
 * Adds a profile to the user's favorites. No-op if already favorited.
 */
export async function addFavorite(userId: string, profileId: string): Promise<void> {
  await dbConnect();
  const objectId = new mongoose.Types.ObjectId(profileId);
  await User.findByIdAndUpdate(userId, { $addToSet: { favorited_profile_ids: objectId } });
}

/**
 * Removes a profile from the user's favorites. No-op if not favorited.
 */
export async function removeFavorite(userId: string, profileId: string): Promise<void> {
  await dbConnect();
  const objectId = new mongoose.Types.ObjectId(profileId);
  await User.findByIdAndUpdate(userId, { $pull: { favorited_profile_ids: objectId } });
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
