import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findChallengeById, acceptChallenge } from '@/repositories/ChallengeRepository';
import { findUserById, updateWalletBalance } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const challenge = await findChallengeById(id);

    if (!challenge) {
      return NextResponse.json({ error: 'Desafio não encontrado' }, { status: 404 });
    }
    if (challenge.status !== 'OPEN') {
      return NextResponse.json({ error: 'Desafio não está disponível' }, { status: 409 });
    }
    if (String(challenge.creator_id) === session.user.id) {
      return NextResponse.json({ error: 'Você não pode aceitar seu próprio desafio' }, { status: 400 });
    }

    const fee = challenge.stake_amount * 0.1;
    const totalCost = challenge.stake_amount + fee;

    const user = await findUserById(session.user.id);
    if (!user || user.wallet_balance < totalCost) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 402 });
    }

    await updateWalletBalance(session.user.id, -totalCost);
    const updated = await acceptChallenge(id, session.user.id);

    await createTransaction({
      user_id: session.user.id,
      type: 'CHALLENGE_STAKE',
      amount: -challenge.stake_amount,
      reference_id: id,
    });
    await createTransaction({
      user_id: session.user.id,
      type: 'CHALLENGE_FEE',
      amount: -fee,
      reference_id: id,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[POST /api/challenges/[id]/accept]', error);
    return NextResponse.json({ error: 'Falha ao aceitar desafio' }, { status: 500 });
  }
}
