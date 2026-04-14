import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfiles } from '@/repositories/ProfileRepository';
import { getFavoritedProfileIds } from '@/repositories/UserRepository';

/**
 * GET /api/ranking
 *
 * Global talent ranking. The Global Score formula is:
 *   global_score (from AI analysis, 0-100) × 60%
 *   + (wins / matches_played × 100) × 40%
 *
 * Querystring filters:
 *   - sortBy: 'global_score' | 'wins' | 'headshot_rate'  (default: global_score)
 *   - minScore: number  (minimum AI score, 0-100)
 *   - rank: string  (e.g. 'Diamond', 'Gold')
 *   - limit: number  (max 50, default 30)
 *   - favoritesOnly: boolean  (show only favorited profiles)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sortBy = (searchParams.get('sortBy') as 'global_score' | 'wins' | 'headshot_rate') || 'global_score';
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined;
    const rank = searchParams.get('rank') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? 30), 50);
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';

    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    let favoritedIds: string[] | undefined;
    if (favoritesOnly && viewerId) {
      favoritedIds = await getFavoritedProfileIds(viewerId);
    } else if (favoritesOnly && !viewerId) {
      return NextResponse.json({ data: [] });
    }

    const profiles = await findProfiles({ sortBy, minScore, rank, favoritedIds }, limit);

    const viewerFavoritedSet = viewerId && !favoritesOnly
      ? new Set(await getFavoritedProfileIds(viewerId))
      : favoritedIds
        ? new Set(favoritedIds)
        : null;

    const data = profiles.map((p, idx) => {
      const matches = p.metrics?.matches_played ?? 0;
      const wins = p.metrics?.wins ?? 0;
      const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

      // Global Score formula: AI score (60%) + win rate (40%)
      const globalScore = Math.round(
        (p.global_score ?? 0) * 0.6 + winRate * 0.4
      );

      const profileId = String(p._id);

      return {
        position: idx + 1,
        id: profileId,
        nickname: p.nickname,
        rank: p.rank,
        globalScore,
        aiScore: p.global_score,
        winRate,
        wins,
        matches,
        headshot_rate: p.metrics?.headshot_rate ?? 0,
        favorites_count: p.favorites_count ?? 0,
        is_favorited: viewerFavoritedSet ? viewerFavoritedSet.has(profileId) : false,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/ranking]', error);
    return NextResponse.json({ error: 'Falha ao buscar ranking' }, { status: 500 });
  }
}
