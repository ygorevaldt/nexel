import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { findUserById, findUserByStripeCustomerId, updateSubscription, cancelSubscription } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';

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

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (!user) {
          console.error('[Stripe Webhook] User not found for customer:', customerId);
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
