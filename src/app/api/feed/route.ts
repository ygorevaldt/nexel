import { NextRequest, NextResponse } from 'next/server';
import { findProfiles } from '@/repositories/ProfileRepository';

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') ?? undefined;
    const profiles = await findProfiles(search, 30);

    const data = profiles.map((p) => ({
      id: String(p._id),
      nickname: p.nickname,
      rank: p.rank,
      score: p.global_score,
      matches: p.metrics?.matches_played ?? 0,
      winRate: p.metrics?.challenges_won
        ? `${Math.round((p.metrics.challenges_won / (p.metrics.matches_played || 1)) * 100)}%`
        : '0%',
      image: '',
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GET /api/feed]', error);
    return NextResponse.json({ error: 'Falha ao buscar perfis' }, { status: 500 });
  }
}
