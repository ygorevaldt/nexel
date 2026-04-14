import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfiles } from '@/repositories/ProfileRepository';
import { getFavoritedProfileIds } from '@/repositories/UserRepository';

/**
 * GET /api/feed
 *
 * Returns a list of player profiles for the Talent Scout discovery feed.
 * Supports filtering by: search (text), minScore, rank, sortBy, favoritesOnly.
 *
 * Contact info is NEVER returned from this endpoint regardless of auth status.
 * Use GET /api/profile/[id] with a SCOUT session to access contact info.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined;
    const rank = searchParams.get('rank') ?? undefined;
    const sortBy = (searchParams.get('sortBy') as 'global_score' | 'wins' | 'headshot_rate') || 'global_score';
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';

    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    let favoritedIds: string[] | undefined;
    if (favoritesOnly && viewerId) {
      favoritedIds = await getFavoritedProfileIds(viewerId);
    } else if (favoritesOnly && !viewerId) {
      return NextResponse.json({ data: [] });
    }

    const profiles = await findProfiles({ search, minScore, rank, sortBy, favoritedIds }, 30);

    const viewerFavoritedSet = viewerId && !favoritesOnly
      ? new Set(await getFavoritedProfileIds(viewerId))
      : favoritedIds
        ? new Set(favoritedIds)
        : null;

    const data = profiles.map((p) => {
      const matches = p.metrics?.matches_played ?? 0;
      const wins = p.metrics?.wins ?? 0;
      const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
      const profileId = String(p._id);

      return {
        id: profileId,
        nickname: p.nickname,
        rank: p.rank,
        score: p.global_score,
        matches,
        winRate: `${winRate}%`,
        wins,
        highlight_video_url: p.highlight_video_url ?? null,
        favorites_count: p.favorites_count ?? 0,
        is_favorited: viewerFavoritedSet ? viewerFavoritedSet.has(profileId) : false,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/feed]', error);
    return NextResponse.json({ error: 'Falha ao buscar perfis' }, { status: 500 });
  }
}
