import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserById } from '@/repositories/UserRepository';
import { findTransactionsByUser } from '@/repositories/TransactionRepository';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const [user, transactions] = await Promise.all([
      findUserById(session.user.id),
      findTransactionsByUser(session.user.id, 30),
    ]);

    const totalWon = transactions
      .filter((t) => t.type === 'CHALLENGE_WIN' || t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalFees = transactions
      .filter((t) => t.type === 'CHALLENGE_FEE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const inEscrow = transactions
      .filter((t) => t.type === 'CHALLENGE_STAKE' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const txData = transactions.map((t) => ({
      id: String(t._id),
      date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        new Date(t.createdAt)
      ),
      type: t.type,
      amount: t.amount,
      status: t.status,
      ref: t.reference_id ? String(t.reference_id) : '',
    }));

    return NextResponse.json({
      balance: user?.wallet_balance ?? 0,
      stats: { totalWon, totalFees, inEscrow },
      transactions: txData,
    });
  } catch (error) {
    console.error('[GET /api/wallet]', error);
    return NextResponse.json({ error: 'Falha ao buscar carteira' }, { status: 500 });
  }
}
