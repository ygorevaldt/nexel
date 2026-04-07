import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfileById } from '@/repositories/ProfileRepository';
import { findUserById } from '@/repositories/UserRepository';
import dbConnect from '@/lib/db';
import { AiAnalysis } from '@/models/AiAnalysis';

/**
 * GET /api/profile/[id]
 *
 * Returns public profile data. Contact info is gated behind SCOUT subscription.
 * The most recent AI analysis (recruiter_feedback, highlights) is included for all users.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    await dbConnect();

    const profile = await findProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Get the most recent completed analysis
    const latestAnalysis = await AiAnalysis.findOne({
      profile_id: id,
      status: 'COMPLETED',
    })
      .sort({ createdAt: -1 })
      .lean();

    // Check if requester has SCOUT access to contact info
    let contactInfo: { discord?: string; whatsapp?: string } | null = null;
    if (session?.user?.id) {
      const viewer = await findUserById(session.user.id);
      if (viewer?.subscriptionStatus === 'SCOUT') {
        contactInfo = profile.contact_info ?? null;
      }
    }

    const data = {
      id: String(profile._id),
      nickname: profile.nickname,
      game_id: profile.game_id,
      bio: profile.bio ?? null,
      rank: profile.rank,
      global_score: profile.global_score,
      highlight_video_url: profile.highlight_video_url ?? null,
      social_links: profile.social_links ?? {},
      metrics: {
        matches_played: profile.metrics?.matches_played ?? 0,
        wins: profile.metrics?.wins ?? 0,
        losses: profile.metrics?.losses ?? 0,
        headshot_rate: profile.metrics?.headshot_rate ?? 0,
        winRate:
          (profile.metrics?.matches_played ?? 0) > 0
            ? Math.round(
                ((profile.metrics?.wins ?? 0) / (profile.metrics?.matches_played ?? 1)) * 100
              )
            : 0,
      },
      // Score history for the evolution chart (last 20 entries)
      ai_score_history: (profile.ai_score_history ?? []).slice(-20),
      // AI analysis — full recruiter_feedback available for all
      latest_analysis: latestAnalysis
        ? {
            overall_potential_score: latestAnalysis.analysis_data?.overall_potential_score ?? 0,
            recruiter_feedback: latestAnalysis.analysis_data?.recruiter_feedback ?? null,
            strengths: latestAnalysis.analysis_data?.strengths ?? [],
            highlights: latestAnalysis.analysis_data?.highlights ?? [],
            recommended_playstyle: latestAnalysis.analysis_data?.recommended_playstyle ?? null,
            analyzed_at: latestAnalysis.createdAt,
          }
        : null,
      // Contact info: null for non-SCOUT users
      contact_info: contactInfo,
      is_contact_visible: contactInfo !== null,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/profile/[id]]', error);
    return NextResponse.json({ error: 'Falha ao buscar perfil' }, { status: 500 });
  }
}
