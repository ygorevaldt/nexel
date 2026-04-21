import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { findUserById, findUserByStripeCustomerId, updateSubscription, cancelSubscription } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';
import { findAllActivePlans } from '@/repositories/PlanRepository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const planId = session.metadata?.plan as 'PRO' | 'SCOUT';
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('[Stripe Webhook] Missing userId in session metadata:', session.id);
          break;
        }

        // userId in metadata is the authoritative lookup — stripeCustomerId may not be
        // persisted yet on first-time checkout (customer created by Stripe during session)
        const user = await findUserById(userId);
        if (!user) {
          console.error('[Stripe Webhook] User not found for userId:', userId);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        // current_period_end lives on SubscriptionItem since Stripe SDK v17
        const periodEnd = subscription.items.data[0]?.current_period_end;

        await updateSubscription(String(user._id), {
          subscriptionStatus: planId,
          accountType: planId === 'SCOUT' ? 'SCOUT' : 'PLAYER',
          role: planId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionEndDate: periodEnd ? new Date(periodEnd * 1000) : undefined,
        });

        await createTransaction({
          user_id: String(user._id),
          type: 'SUBSCRIPTION_PAYMENT',
          amount: session.amount_total ?? 0,
          status: 'COMPLETED',
          plan: planId,
          stripe_payment_intent_id: session.payment_intent as string,
        });

        console.log(`[Stripe Webhook] Subscription activated: ${planId} for user ${user._id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status !== 'active') break;

        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;

        const plans = await findAllActivePlans();
        const activePlan = plans.find(p => p.stripePriceId === priceId);
        const planId = activePlan?.planId as 'PRO' | 'SCOUT' | undefined;

        if (!planId) {
          console.log(`[Stripe Webhook] subscription.updated: price desconhecido ${priceId}, ignorando`);
          break;
        }

        const userToUpdate = await findUserByStripeCustomerId(customerId);
        if (!userToUpdate) {
          console.error('[Stripe Webhook] User not found for customer:', customerId);
          break;
        }

        const periodEnd = subscription.items.data[0]?.current_period_end;

        await updateSubscription(String(userToUpdate._id), {
          subscriptionStatus: planId,
          accountType: planId === 'SCOUT' ? 'SCOUT' : 'PLAYER',
          role: planId,
          stripeSubscriptionId: subscription.id,
          subscriptionEndDate: periodEnd ? new Date(periodEnd * 1000) : undefined,
        });

        console.log(`[Stripe Webhook] Plano sincronizado para ${planId} — usuário ${userToUpdate._id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const deletedSubscriptionId = subscription.id;

        const user = await findUserByStripeCustomerId(customerId);
        if (!user) {
          console.error('[Stripe Webhook] User not found for customer:', customerId);
          break;
        }

        // Se o usuário já está em FREE, o cancelamento foi processado diretamente
        // pela rota DELETE /api/me/subscription antes do webhook chegar — não há nada a fazer.
        if (user.subscriptionStatus === 'FREE') {
          console.log(`[Stripe Webhook] Cancelamento já processado para usuário ${user._id}, ignorando`);
          break;
        }

        // Guard: só cancela se a assinatura deletada ainda é a ativa no banco.
        // Em upgrades, a assinatura antiga pode ser deletada depois que a nova já
        // foi salva — ignorar esse evento evita reverter o plano incorretamente.
        if (user.stripeSubscriptionId !== deletedSubscriptionId) {
          console.log(`[Stripe Webhook] Deleção de assinatura antiga ignorada: ${deletedSubscriptionId} (usuário ${user._id} em ${user.stripeSubscriptionId})`);
          break;
        }

        await cancelSubscription(String(user._id));
        console.log(`[Stripe Webhook] Subscription cancelled for user ${user._id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Processing error:', err);
    // Return 200 to prevent Stripe from retrying — log for manual review
  }

  return NextResponse.json({ received: true });
}
