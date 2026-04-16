import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { updateSubscription } from '@/repositories/UserRepository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const VALID_PLANS = new Set(['PRO', 'SCOUT']);

/**
 * GET /api/checkout/verify?session_id=cs_xxx
 *
 * Verifica diretamente com a Stripe se o checkout foi pago e ativa o plano no banco.
 * Chamado pela página de assinatura logo após o redirect de sucesso, eliminando a
 * dependência de timing do webhook checkout.session.completed.
 * O webhook ainda é a fonte autoritativa para renovações e eventos de billing.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    // Garante que a session pertence ao usuário autenticado
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pagamento não confirmado' }, { status: 402 });
    }

    const planId = checkoutSession.metadata?.plan;
    if (!planId || !VALID_PLANS.has(planId)) {
      return NextResponse.json({ error: 'Plano inválido na session' }, { status: 400 });
    }

    const plan = planId as 'PRO' | 'SCOUT';

    // subscription foi expandido com expand: ['subscription'], portanto é um objeto
    // completo — nunca usar `as string` aqui, senão stripeSubscriptionId ficaria como "[object Object]"
    const sub = checkoutSession.subscription as Stripe.Subscription;
    const subscriptionId = sub.id;
    const periodEnd = sub.items.data[0]?.current_period_end;
    const subscriptionEndDate = periodEnd ? new Date(periodEnd * 1000) : undefined;

    const customerId = checkoutSession.customer as string;

    await updateSubscription(session.user.id, {
      subscriptionStatus: plan,
      accountType: plan === 'SCOUT' ? 'SCOUT' : 'PLAYER',
      role: plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionEndDate,
    });

    console.log(`[GET /api/checkout/verify] Plano ${plan} ativado para usuário ${session.user.id}`);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('[GET /api/checkout/verify]', error);
    return NextResponse.json({ error: 'Falha ao verificar checkout' }, { status: 500 });
  }
}
