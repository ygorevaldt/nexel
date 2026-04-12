import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfileById } from '@/repositories/ProfileRepository';
import { findUserById } from '@/repositories/UserRepository';
import { findAnalysesByProfileIdPaginated } from '@/repositories/AiAnalysisRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 10;

    const session = await auth();

    const profile = await findProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Permission check
    let viewerSubscription: 'FREE' | 'PRO' | 'SCOUT' = 'FREE';
    let viewerId: string | null = null;
    if (session?.user?.id) {
      viewerId = session.user.id;
      if (session.user.subscriptionStatus) {
        viewerSubscription = session.user.subscriptionStatus as 'FREE' | 'PRO' | 'SCOUT';
      } else {
        const viewer = await findUserById(session.user.id);
        viewerSubscription = viewer?.subscriptionStatus ?? 'FREE';
      }
    }

    const isOwnProfile = viewerId !== null && profile.user_id.toString() === viewerId;
    // Análises de IA: apenas próprio perfil ou SCOUT
    const canViewAnalyses = isOwnProfile || viewerSubscription === 'SCOUT';

    if (!canViewAnalyses) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { analyses, total } = await findAnalysesByProfileIdPaginated(String(profile._id), page, limit);

    return NextResponse.json({
      analyses: analyses.map((a) => ({
        id: String(a._id),
        overall_potential_score: a.analysis_data?.overall_potential_score ?? 0,
        movement_score: a.analysis_data?.movement_score ?? 0,
        gloo_wall_usage: a.analysis_data?.gloo_wall_usage ?? 0,
        rotation_efficiency: a.analysis_data?.rotation_efficiency ?? 0,
        recruiter_feedback: a.analysis_data?.recruiter_feedback ?? null,
        strengths: a.analysis_data?.strengths ?? [],
        areas_for_improvement: a.analysis_data?.areas_for_improvement ?? [],
        highlights: a.analysis_data?.highlights ?? [],
        recommended_playstyle: a.analysis_data?.recommended_playstyle ?? null,
        video_url: a.video_url ?? null,
        analyzed_at: a.createdAt,
      })),
      total,
      page,
      has_more: page * limit < total,
    });
  } catch (error) {
    console.error('[GET /api/profile/[id]/analyses]', error);
    return NextResponse.json({ error: 'Falha ao buscar análises' }, { status: 500 });
  }
}
