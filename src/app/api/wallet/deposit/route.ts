import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateWalletBalance } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';
import { z } from 'zod';

const depositSchema = z.object({
  amount: z.number().positive().max(10000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { amount } = parsed.data;

    const user = await updateWalletBalance(session.user.id, amount);
    await createTransaction({
      user_id: session.user.id,
      type: 'DEPOSIT',
      amount,
    });

    return NextResponse.json({ success: true, balance: user?.wallet_balance });
  } catch (error) {
    console.error('[POST /api/wallet/deposit]', error);
    return NextResponse.json({ error: 'Falha ao processar depósito' }, { status: 500 });
  }
}
