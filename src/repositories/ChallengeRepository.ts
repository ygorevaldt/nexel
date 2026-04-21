import dbConnect from '@/lib/db';
import { Challenge, IChallenge } from '@/models/Challenge';
import mongoose from 'mongoose';

export async function findOpenChallenges(
  page = 1,
  limit = 25,
  difficulty?: IChallenge['difficulty']
): Promise<{ challenges: IChallenge[]; hasMore: boolean }> {
  await dbConnect();
  const query: Record<string, unknown> = { status: 'OPEN' };
  if (difficulty) query.difficulty = difficulty;
  const skip = (page - 1) * limit;
  const raw = await Challenge.find(query)
    .populate('creator_id', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();
  const hasMore = raw.length > limit;
  return { challenges: hasMore ? raw.slice(0, limit) : raw, hasMore };
}

export async function findChallengesByUser(
  userId: string,
  page = 1,
  limit = 25
): Promise<{ challenges: IChallenge[]; hasMore: boolean }> {
  await dbConnect();
  const oid = new mongoose.Types.ObjectId(userId);
  const skip = (page - 1) * limit;
  const raw = await Challenge.find({
    $or: [{ creator_id: oid }, { opponent_id: oid }],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();
  const hasMore = raw.length > limit;
  return { challenges: hasMore ? raw.slice(0, limit) : raw, hasMore };
}

export async function findChallengesByDifficulty(
  difficulty: IChallenge['difficulty'],
  limit = 20
): Promise<IChallenge[]> {
  await dbConnect();
  return Challenge.find({ difficulty, status: 'OPEN' })
    .populate('creator_id', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function findChallengeById(id: string): Promise<IChallenge | null> {
  await dbConnect();
  return Challenge.findById(id).lean();
}

export async function createChallenge(data: {
  creator_id: string;
  type: '1v1' | '4v4';
  matchType: 'RANKED' | 'FRIENDLY';
  difficulty: IChallenge['difficulty'];
}): Promise<IChallenge> {
  await dbConnect();
  return Challenge.create(data);
}

export async function acceptChallenge(
  challengeId: string,
  opponentId: string
): Promise<IChallenge | null> {
  await dbConnect();
  return Challenge.findByIdAndUpdate(
    challengeId,
    { opponent_id: opponentId, status: 'ACCEPTED' },
    { returnDocument: 'after' }
  ).lean();
}

export async function updateChallengeStatus(
  challengeId: string,
  status: IChallenge['status'],
  extra?: Partial<IChallenge>
): Promise<IChallenge | null> {
  await dbConnect();
  return Challenge.findByIdAndUpdate(
    challengeId,
    { status, ...extra },
    { returnDocument: 'after' }
  ).lean();
}

/**
 * Returns victory/defeat history for a user, grouped by month, from RANKED completed challenges.
 * userId deve ser o User._id (não o Profile._id).
 */
export async function findVictoryHistoryByUserId(userId: string): Promise<{
  total_matches: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  by_month: Array<{ year: number; month: number; matches: number; wins: number; losses: number }>;
}> {
  await dbConnect();
  const oid = new mongoose.Types.ObjectId(userId);

  const challenges = await Challenge.find({
    $or: [{ creator_id: oid }, { opponent_id: oid }],
    status: 'COMPLETED',
    matchType: 'RANKED',
  })
    .select('winner_id createdAt')
    .lean();

  const byMonth: Record<string, { year: number; month: number; matches: number; wins: number; losses: number }> = {};

  for (const c of challenges) {
    const date = new Date(c.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    if (!byMonth[key]) byMonth[key] = { year, month, matches: 0, wins: 0, losses: 0 };
    byMonth[key].matches++;
    if (c.winner_id && c.winner_id.equals(oid)) {
      byMonth[key].wins++;
    } else {
      byMonth[key].losses++;
    }
  }

  const total_matches = challenges.length;
  const total_wins = challenges.filter((c) => c.winner_id && c.winner_id.equals(oid)).length;
  const total_losses = total_matches - total_wins;
  const win_rate = total_matches > 0 ? Math.round((total_wins / total_matches) * 100) : 0;

  return {
    total_matches,
    total_wins,
    total_losses,
    win_rate,
    by_month: Object.values(byMonth).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
  };
}
