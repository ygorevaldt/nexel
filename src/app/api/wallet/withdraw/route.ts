import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserById, updateWalletBalance } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().positive().max(10000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { amount } = parsed.data;

    const user = await findUserById(session.user.id);
    if (!user || user.wallet_balance < amount) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 402 });
    }

    const updated = await updateWalletBalance(session.user.id, -amount);

    await createTransaction({
      user_id: session.user.id,
      type: 'WITHDRAW',
      amount: -amount,
      status: 'PENDING',
    });

    return NextResponse.json({ success: true, balance: updated?.wallet_balance });
  } catch (error) {
    console.error('[POST /api/wallet/withdraw]', error);
    return NextResponse.json({ error: 'Falha ao processar saque' }, { status: 500 });
  }
}
