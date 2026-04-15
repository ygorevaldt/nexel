import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { findUserById } from '@/repositories/UserRepository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  PRO: process.env.STRIPE_PRICE_PRO,
  SCOUT: process.env.STRIPE_PRICE_SCOUT,
};

const CheckoutSchema = z.object({
  planId: z.enum(['PRO', 'SCOUT']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = CheckoutSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const { planId } = body.data;
    const priceId = PLAN_PRICE_IDS[planId];

    if (!priceId) {
      return NextResponse.json(
        { error: `Plano ${planId} não está disponível para checkout.` },
        { status: 400 }
      );
    }

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // Reuse existing Stripe customer to avoid duplicates; fall back to email for new customers
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: user.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan: planId, userId: session.user.id },
      success_url: `${process.env.NEXTAUTH_URL}/subscription?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscription`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    console.error('[POST /api/checkout]', error);
    return NextResponse.json({ error: 'Falha ao criar sessão de checkout' }, { status: 500 });
  }
}
