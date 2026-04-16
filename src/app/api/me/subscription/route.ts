import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { findUserById, cancelSubscription } from '@/repositories/UserRepository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.subscriptionStatus === 'FREE') {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa' }, { status: 400 });
    }

    if (!user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'ID de assinatura não encontrado' }, { status: 400 });
    }

    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // Atualiza o banco imediatamente para feedback instantâneo.
    // O evento customer.subscription.deleted também atualizará como confirmação.
    await cancelSubscription(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/me/subscription]', error);
    return NextResponse.json({ error: 'Falha ao cancelar assinatura' }, { status: 500 });
  }
}
