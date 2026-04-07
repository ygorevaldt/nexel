import dbConnect from '@/lib/db';
import { Profile, IProfile } from '@/models/Profile';

export interface ProfileFilters {
  search?: string;
  minScore?: number;
  rank?: string;
  sortBy?: 'global_score' | 'wins' | 'headshot_rate';
}

export async function findProfiles(
  filters: ProfileFilters = {},
  limit = 20
): Promise<IProfile[]> {
  await dbConnect();
  const query: Record<string, unknown> = {};

  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  if (filters.rank) {
    query.rank = filters.rank;
  }
  if (typeof filters.minScore === 'number') {
    query.global_score = { $gte: filters.minScore };
  }

  const sort: Record<string, 1 | -1> = {};
  switch (filters.sortBy) {
    case 'wins':
      sort['metrics.wins'] = -1;
      break;
    case 'headshot_rate':
      sort['metrics.headshot_rate'] = -1;
      break;
    default:
      sort['global_score'] = -1;
  }

  return Profile.find(query).limit(limit).sort(sort).lean();
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

/**
 * Appends a new AI score entry to the profile's history and updates the current global_score.
 * Called after every successful AI analysis to keep evolution charts up-to-date.
 */
export async function addAiScoreToHistory(
  profileId: string,
  score: number
): Promise<IProfile | null> {
  await dbConnect();
  return Profile.findByIdAndUpdate(
    profileId,
    {
      $set: { global_score: score },
      $push: {
        ai_score_history: {
          $each: [{ score, date: new Date() }],
          $slice: -50, // Keep only the last 50 entries to control document size
        },
      },
    },
    { new: true }
  ).lean();
}

/**
 * Increments win or loss count after a RANKED match completes.
 */
export async function recordMatchResult(
  profileId: string,
  result: 'win' | 'loss'
): Promise<IProfile | null> {
  await dbConnect();
  const inc: Record<string, number> = { 'metrics.matches_played': 1 };
  if (result === 'win') inc['metrics.wins'] = 1;
  else inc['metrics.losses'] = 1;
  return Profile.findByIdAndUpdate(profileId, { $inc: inc }, { new: true }).lean();
}
