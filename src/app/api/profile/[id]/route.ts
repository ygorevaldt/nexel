import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfileById } from '@/repositories/ProfileRepository';
import { findUserById, isFavorited } from '@/repositories/UserRepository';
import { findAnalysesByProfileIdPaginated } from '@/repositories/AiAnalysisRepository';
import { findVictoryHistoryByUserId } from '@/repositories/ChallengeRepository';
import mongoose from 'mongoose';

// Badges computed from existing data — no separate collection needed
function computeBadges(profile: {
  global_score: number;
  metrics: { wins: number; matches_played: number };
  ai_score_history: { score: number; date: Date }[];
  highlighted_analysis_ids: mongoose.Types.ObjectId[];
}, totalAnalyses: number) {
  return [
    {
      id: 'first_analysis',
      label: 'Primeira Análise',
      description: 'Enviou o primeiro clipe para análise de IA',
      unlocked: totalAnalyses >= 1,
      icon: 'BrainCircuit',
    },
    {
      id: 'score_70',
      label: 'Talento Emergente',
      description: 'Atingiu score 70 ou mais',
      unlocked: profile.global_score >= 70,
      icon: 'TrendingUp',
    },
    {
      id: 'score_90',
      label: 'Elite',
      description: 'Atingiu score 90 ou mais',
      unlocked: profile.global_score >= 90,
      icon: 'Crown',
    },
    {
      id: 'wins_5',
      label: '5 Vitórias',
      description: 'Conquistou 5 vitórias em desafios',
      unlocked: profile.metrics.wins >= 5,
      icon: 'Trophy',
    },
    {
      id: 'wins_20',
      label: 'Veterano',
      description: 'Conquistou 20 vitórias em desafios',
      unlocked: profile.metrics.wins >= 20,
      icon: 'Shield',
    },
    {
      id: 'active',
      label: 'Jogador Ativo',
      description: 'Disputou 10 ou mais partidas',
      unlocked: profile.metrics.matches_played >= 10,
      icon: 'Zap',
    },
    {
      id: 'highlighted',
      label: 'Em Destaque',
      description: 'Possui análises destacadas no perfil',
      unlocked: (profile.highlighted_analysis_ids?.length ?? 0) > 0,
      icon: 'Star',
    },
  ];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const profile = await findProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Determine viewer's subscription and ownership
    let viewerSubscription: 'FREE' | 'PRO' | 'SCOUT' = 'FREE';
    let viewerId: string | null = null;
    if (session?.user?.id) {
      viewerId = session.user.id;
      // ADM always gets full SCOUT-level access regardless of personal subscription
      if (session.user.systemRole === 'ADM') {
        viewerSubscription = 'SCOUT';
      } else if (session.user.subscriptionStatus) {
        viewerSubscription = session.user.subscriptionStatus as 'FREE' | 'PRO' | 'SCOUT';
      } else {
        const viewer = await findUserById(session.user.id);
        viewerSubscription = viewer?.subscriptionStatus ?? 'FREE';
      }
    }

    const isOwnProfile = viewerId !== null && profile.user_id.toString() === viewerId;

    // Acesso completo à página: PRO e SCOUT veem stats, scores e histórico
    const isFullAccess = isOwnProfile || viewerSubscription === 'PRO' || viewerSubscription === 'SCOUT';
    const viewer_permission = isFullAccess ? 'full' : 'partial';

    // Análises de IA: apenas próprio perfil ou SCOUT
    const canViewAnalyses = isOwnProfile || viewerSubscription === 'SCOUT';

    // Get profile owner's plan
    const profileOwnerUser = await findUserById(profile.user_id.toString());
    const ownerPlan = profileOwnerUser?.subscriptionStatus ?? 'FREE';

    const viewerHasFavorited =
      viewerId && !isOwnProfile
        ? await isFavorited(viewerId, String(profile._id))
        : false;

    const hasAnyContact = !!(
      profile.contact_info?.discord ||
      profile.contact_info?.whatsapp
    );

    // Base data (always returned)
    const baseData = {
      id: String(profile._id),
      nickname: profile.nickname,
      game_id: profile.game_id,
      rank: profile.rank,
      global_score: profile.global_score,
      plan: ownerPlan,
      viewer_permission,
      is_own_profile: isOwnProfile,
      favorites_count: profile.favorites_count ?? 0,
      is_favorited: viewerHasFavorited,
      has_any_contact: hasAnyContact,
    };

    // Partial response for FREE viewing other profiles
    if (!isFullAccess) {
      return NextResponse.json({ data: baseData });
    }

    // Full response — fetch analyses and victories in parallel
    const [{ analyses, total: analyses_total }, victoriesData] = await Promise.all([
      findAnalysesByProfileIdPaginated(String(profile._id), 1, 10),
      isFullAccess
        ? findVictoryHistoryByUserId(profile.user_id.toString())
        : Promise.resolve({ total_matches: 0, total_wins: 0, total_losses: 0, win_rate: 0, by_month: [] as Array<{ year: number; month: number; matches: number; wins: number; losses: number }> }),
    ]);

    // Latest analysis (first in sorted list)
    const latestAnalysis = analyses[0] ?? null;

    // Scores de habilidade: visíveis para PRO e SCOUT (não dependem do gate de análises)
    const scores = latestAnalysis?.analysis_data
      ? {
          movement: latestAnalysis.analysis_data.movement_score ?? 0,
          gloo_wall: latestAnalysis.analysis_data.gloo_wall_usage ?? 0,
          rotation: latestAnalysis.analysis_data.rotation_efficiency ?? 0,
        }
      : null;

    // Score delta e histórico: apenas próprio perfil ou SCOUT
    const history = canViewAnalyses ? (profile.ai_score_history ?? []) : [];
    const scoreDelta = canViewAnalyses && history.length >= 2
      ? (history[history.length - 1].score - history[history.length - 2].score)
      : null;

    // Contact info — SCOUT only
    let contactInfo: { discord?: string; whatsapp?: string; email?: string; instagram?: string } | null = null;
    if (viewerSubscription === 'SCOUT') {
      contactInfo = profile.contact_info ?? null;
    }

    // Clipes: apenas próprio perfil ou SCOUT
    const clips = canViewAnalyses
      ? analyses
          .filter((a) => a.video_url)
          .map((a) => ({
            id: String(a._id),
            video_url: a.video_url ?? null,
            analyzed_at: a.createdAt,
            score: a.analysis_data?.overall_potential_score ?? 0,
          }))
      : [];

    const badges = computeBadges(
      {
        global_score: profile.global_score,
        metrics: profile.metrics ?? { wins: 0, matches_played: 0 },
        ai_score_history: profile.ai_score_history ?? [],
        highlighted_analysis_ids: profile.highlighted_analysis_ids ?? [],
      },
      analyses_total
    );

    const data = {
      ...baseData,
      bio: profile.bio ?? null,
      social_links: profile.social_links ?? {},
      metrics: {
        matches_played: profile.metrics?.matches_played ?? 0,
        wins: profile.metrics?.wins ?? 0,
        losses: profile.metrics?.losses ?? 0,
        headshot_rate: profile.metrics?.headshot_rate ?? 0,
        winRate: (profile.metrics?.matches_played ?? 0) > 0
          ? Math.round(((profile.metrics?.wins ?? 0) / (profile.metrics?.matches_played ?? 1)) * 100)
          : 0,
      },
      scores,
      score_delta: canViewAnalyses ? scoreDelta : null,
      ai_score_history: history.map((e) => ({
        score: e.score,
        date: e.date,
      })),
      // Análises de IA: apenas próprio perfil ou SCOUT
      latest_analysis: canViewAnalyses && latestAnalysis
        ? {
            id: String(latestAnalysis._id),
            overall_potential_score: latestAnalysis.analysis_data?.overall_potential_score ?? 0,
            movement_score: latestAnalysis.analysis_data?.movement_score ?? 0,
            gloo_wall_usage: latestAnalysis.analysis_data?.gloo_wall_usage ?? 0,
            rotation_efficiency: latestAnalysis.analysis_data?.rotation_efficiency ?? 0,
            recruiter_feedback: latestAnalysis.analysis_data?.recruiter_feedback ?? null,
            strengths: latestAnalysis.analysis_data?.strengths ?? [],
            areas_for_improvement: latestAnalysis.analysis_data?.areas_for_improvement ?? [],
            highlights: latestAnalysis.analysis_data?.highlights ?? [],
            recommended_playstyle: latestAnalysis.analysis_data?.recommended_playstyle ?? null,
            analyzed_at: latestAnalysis.createdAt,
          }
        : null,
      analyses: canViewAnalyses
        ? analyses.map((a) => ({
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
          }))
        : [],
      analyses_total: canViewAnalyses ? analyses_total : 0,
      victories: victoriesData,
      badges,
      clips,
      contact_info: contactInfo,
      is_contact_visible: contactInfo !== null,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/profile/[id]]', error);
    return NextResponse.json({ error: 'Falha ao buscar perfil' }, { status: 500 });
  }
}
