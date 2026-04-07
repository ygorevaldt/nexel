import { NextRequest, NextResponse } from 'next/server';
import { findProfiles } from '@/repositories/ProfileRepository';

/**
 * GET /api/feed
 *
 * Returns a list of player profiles for the Talent Scout discovery feed.
 * Supports filtering by: search (text), minScore, rank, sortBy.
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

    const profiles = await findProfiles({ search, minScore, rank, sortBy }, 30);

    const data = profiles.map((p) => {
      const matches = p.metrics?.matches_played ?? 0;
      const wins = p.metrics?.wins ?? 0;
      const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

      return {
        id: String(p._id),
        nickname: p.nickname,
        rank: p.rank,
        score: p.global_score,
        matches,
        winRate: `${winRate}%`,
        wins,
        highlight_video_url: p.highlight_video_url ?? null,
        // Contact info intentionally omitted — only in /api/profile/[id] for SCOUT users
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/feed]', error);
    return NextResponse.json({ error: 'Falha ao buscar perfis' }, { status: 500 });
  }
}
