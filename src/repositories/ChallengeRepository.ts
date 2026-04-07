import dbConnect from '@/lib/db';
import { Challenge, IChallenge } from '@/models/Challenge';
import mongoose from 'mongoose';

export async function findOpenChallenges(
  limit = 20,
  difficulty?: IChallenge['difficulty']
): Promise<IChallenge[]> {
  await dbConnect();
  const query: Record<string, unknown> = { status: 'OPEN' };
  if (difficulty) query.difficulty = difficulty;
  return Challenge.find(query)
    .populate('creator_id', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function findChallengesByUser(userId: string): Promise<IChallenge[]> {
  await dbConnect();
  const oid = new mongoose.Types.ObjectId(userId);
  return Challenge.find({
    $or: [{ creator_id: oid }, { opponent_id: oid }],
  })
    .sort({ createdAt: -1 })
    .lean();
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
    { new: true }
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
    { new: true }
  ).lean();
}
