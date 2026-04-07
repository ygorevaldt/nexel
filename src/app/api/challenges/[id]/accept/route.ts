import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findChallengeById, acceptChallenge } from '@/repositories/ChallengeRepository';

/**
 * POST /api/challenges/[id]/accept
 *
 * Accepts an open challenge. No financial stake required — this is pure social matchmaking.
 * The challenge moves from OPEN → ACCEPTED → IN_PROGRESS → COMPLETED.
 * RANKED results will update the Global Score leaderboard.
 */
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

    const updated = await acceptChallenge(id, session.user.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Desafio ${challenge.matchType} de ${challenge.type} aceito! Boa sorte!`,
    });
  } catch (error) {
    console.error('[POST /api/challenges/[id]/accept]', error);
    return NextResponse.json({ error: 'Falha ao aceitar desafio' }, { status: 500 });
  }
}
