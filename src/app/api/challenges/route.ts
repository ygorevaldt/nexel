import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findOpenChallenges, findChallengesByUser, createChallenge } from '@/repositories/ChallengeRepository';
import { z } from 'zod';

const PAGE_SIZE = 25;

const createSchema = z.object({
  type: z.enum(['1v1', '4v4']),
  matchType: z.enum(['RANKED', 'FRIENDLY']).default('RANKED'),
  difficulty: z.enum(['BRONZE', 'SILVER', 'GOLD', 'DIAMOND']),
});

export async function GET(req: NextRequest) {
  try {
    const tab = req.nextUrl.searchParams.get('tab');
    const difficulty = req.nextUrl.searchParams.get('difficulty') as
      | 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND'
      | null;
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1));
    const session = await auth();

    if (tab === 'history') {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const { challenges, hasMore } = await findChallengesByUser(session.user.id, page, PAGE_SIZE);
      return NextResponse.json({ data: challenges, hasMore });
    }

    const { challenges, hasMore } = await findOpenChallenges(page, PAGE_SIZE, difficulty || undefined);

    const data = challenges.map((c) => ({
      id: String(c._id),
      creator: (c.creator_id as unknown as { name?: string })?.name ?? 'Unknown',
      type: c.type,
      matchType: c.matchType,
      difficulty: c.difficulty,
      status: c.status,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ data, hasMore });
  } catch (error) {
    console.error('[GET /api/challenges]', error);
    return NextResponse.json({ error: 'Falha ao buscar desafios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { type, matchType, difficulty } = parsed.data;

    const challenge = await createChallenge({
      creator_id: session.user.id,
      type,
      matchType,
      difficulty,
    });

    return NextResponse.json({ success: true, data: challenge }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/challenges]', error);
    return NextResponse.json({ error: 'Falha ao criar desafio' }, { status: 500 });
  }
}
