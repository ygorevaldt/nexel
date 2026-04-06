import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findOpenChallenges, findChallengesByUser, createChallenge } from '@/repositories/ChallengeRepository';
import { findUserById, updateWalletBalance } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';
import { z } from 'zod';

const createSchema = z.object({
  type: z.enum(['1v1', '4v4']),
  stake_amount: z.number().positive(),
});

export async function GET(req: NextRequest) {
  try {
    const tab = req.nextUrl.searchParams.get('tab');
    const session = await auth();

    if (tab === 'history') {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
      const challenges = await findChallengesByUser(session.user.id);
      return NextResponse.json({ data: challenges });
    }

    const challenges = await findOpenChallenges(20);

    const data = challenges.map((c) => ({
      id: String(c._id),
      creator: (c.creator_id as unknown as { name?: string })?.name ?? 'Unknown',
      type: c.type,
      stake: c.stake_amount,
      status: c.status,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ data });
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

    const { type, stake_amount } = parsed.data;
    const fee = stake_amount * 0.1;
    const totalCost = stake_amount + fee;

    const user = await findUserById(session.user.id);
    if (!user || user.wallet_balance < totalCost) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 402 });
    }

    await updateWalletBalance(session.user.id, -totalCost);

    const challenge = await createChallenge({
      creator_id: session.user.id,
      type,
      stake_amount,
    });

    await createTransaction({
      user_id: session.user.id,
      type: 'CHALLENGE_STAKE',
      amount: -stake_amount,
      reference_id: String(challenge._id),
    });
    await createTransaction({
      user_id: session.user.id,
      type: 'CHALLENGE_FEE',
      amount: -fee,
      reference_id: String(challenge._id),
    });

    return NextResponse.json({ success: true, data: challenge }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/challenges]', error);
    return NextResponse.json({ error: 'Falha ao criar desafio' }, { status: 500 });
  }
}
