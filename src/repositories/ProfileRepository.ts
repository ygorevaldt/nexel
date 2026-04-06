import dbConnect from '@/lib/db';
import { Profile, IProfile } from '@/models/Profile';

export async function findProfiles(search?: string, limit = 20): Promise<IProfile[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};
  if (search) {
    query.$text = { $search: search };
  }
  return Profile.find(query).limit(limit).sort({ global_score: -1 }).lean();
}

export async function findProfileById(id: string): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findById(id).lean();
}

export async function findProfileByUserId(userId: string): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findOne({ user_id: userId }).lean();
}

export async function upsertProfile(
  userId: string,
  data: Partial<Omit<IProfile, '_id' | 'user_id' | 'createdAt' | 'updatedAt'>>
): Promise<IProfile> {
  await dbConnect();
  const profile = await Profile.findOneAndUpdate(
    { user_id: userId },
    { $set: { user_id: userId, ...data } },
    { upsert: true, new: true }
  );
  return profile;
}
