import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfiles } from '@/repositories/ProfileRepository';
import { getFavoritedProfileIds } from '@/repositories/UserRepository';

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sortBy = (searchParams.get('sortBy') as 'global_score' | 'wins' | 'headshot_rate') || 'global_score';
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined;
    const rank = searchParams.get('rank') ?? undefined;
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));

    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    let favoritedIds: string[] | undefined;
    if (favoritesOnly && viewerId) {
      favoritedIds = await getFavoritedProfileIds(viewerId);
    } else if (favoritesOnly && !viewerId) {
      return NextResponse.json({ data: [], hasMore: false });
    }

    const { profiles, hasMore } = await findProfiles(
      { sortBy, minScore, rank, favoritedIds },
      PAGE_SIZE,
      page
    );

    const viewerFavoritedSet = viewerId && !favoritesOnly
      ? new Set(await getFavoritedProfileIds(viewerId))
      : favoritedIds
        ? new Set(favoritedIds)
        : null;

    const positionOffset = (page - 1) * PAGE_SIZE;

    const data = profiles.map((p, idx) => {
      const matches = p.metrics?.matches_played ?? 0;
      const wins = p.metrics?.wins ?? 0;
      const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
      const globalScore = Math.round((p.global_score ?? 0) * 0.6 + winRate * 0.4);
      const profileId = String(p._id);

      return {
        position: positionOffset + idx + 1,
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

    return NextResponse.json({ data, hasMore });
  } catch (error) {
    console.error('[GET /api/ranking]', error);
    return NextResponse.json({ error: 'Falha ao buscar ranking' }, { status: 500 });
  }
}
