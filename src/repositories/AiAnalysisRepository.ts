import dbConnect from '@/lib/db';
import { AiAnalysis, IAiAnalysis, IAiAnalysisData } from '@/models/AiAnalysis';
import mongoose from 'mongoose';

export async function findLatestCompletedAnalysis(profileId: string): Promise<IAiAnalysis | null> {
  await dbConnect();
  return AiAnalysis.findOne({ profile_id: profileId, status: 'COMPLETED' })
    .sort({ createdAt: -1 })
    .lean();
}

export async function countTodayAnalyses(profileId: string): Promise<number> {
  await dbConnect();
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  return AiAnalysis.countDocuments({
    profile_id: profileId,
    status: 'COMPLETED',
    createdAt: { $gte: todayMidnight },
  });
}

export async function findCachedContextForToday(profileId: string): Promise<string | null> {
  await dbConnect();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const existing = await AiAnalysis.findOne({
    profile_id: profileId,
    cached_context_id: { $exists: true, $ne: null },
    createdAt: { $gte: todayStart },
  })
    .sort({ createdAt: -1 })
    .lean();
  return existing?.cached_context_id ?? null;
}

export async function createAnalysis(data: {
  profile_id: string;
  status: IAiAnalysis['status'];
  analysis_data?: IAiAnalysisData;
  cached_context_id?: string;
  token_usage?: IAiAnalysis['token_usage'];
  video_url?: string;
}): Promise<IAiAnalysis> {
  await dbConnect();
  return AiAnalysis.create(data);
}

export async function findAnalysesByProfileId(
  profileId: string,
  limit = 50
): Promise<IAiAnalysis[]> {
  await dbConnect();
  return AiAnalysis.find({ profile_id: profileId, status: 'COMPLETED' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('_id analysis_data createdAt video_url')
    .lean();
}

export async function findAnalysesByProfileIdPaginated(
  profileId: string,
  page = 1,
  limit = 10
): Promise<{ analyses: IAiAnalysis[]; total: number }> {
  await dbConnect();
  const skip = (page - 1) * limit;
  const [analyses, total] = await Promise.all([
    AiAnalysis.find({ profile_id: profileId, status: 'COMPLETED' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id analysis_data createdAt video_url')
      .lean(),
    AiAnalysis.countDocuments({ profile_id: profileId, status: 'COMPLETED' }),
  ]);
  return { analyses, total };
}

/**
 * Finds an analysis by ID and verifies it belongs to the given profile.
 * Used for ownership checks to prevent IDOR attacks.
 */
export async function findAnalysisByIdAndProfileId(
  analysisId: string,
  profileId: string
): Promise<IAiAnalysis | null> {
  if (!mongoose.isValidObjectId(analysisId) || !mongoose.isValidObjectId(profileId)) {
    return null;
  }
  await dbConnect();
  return AiAnalysis.findOne({ _id: analysisId, profile_id: profileId }).lean();
}
