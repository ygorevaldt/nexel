import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findProfiles } from '@/repositories/ProfileRepository';
import { getFavoritedProfileIds } from '@/repositories/UserRepository';

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') ?? undefined;
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined;
    const rank = searchParams.get('rank') ?? undefined;
    const sortBy = (searchParams.get('sortBy') as 'global_score' | 'wins' | 'headshot_rate') || 'global_score';
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
      { search, minScore, rank, sortBy, favoritedIds },
      PAGE_SIZE,
      page
    );

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

    return NextResponse.json({ data, hasMore });
  } catch (error) {
    console.error('[GET /api/feed]', error);
    return NextResponse.json({ error: 'Falha ao buscar perfis' }, { status: 500 });
  }
}
