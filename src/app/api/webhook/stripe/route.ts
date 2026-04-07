import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhook/stripe
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 * 
 * PRODUCTION SETUP REQUIRED:
 * 1. Install stripe: npm install stripe
 * 2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.local
 * 3. Configure your Stripe Dashboard webhook to send events to this endpoint
 * 4. Uncomment the Stripe SDK code below
 *
 * Handled events:
 *   - checkout.session.completed  → Activate PRO or SCOUT subscription
 *   - customer.subscription.deleted → Revert to FREE
 *   - invoice.payment_failed → Mark subscription as past_due (optional)
 */

// ─── STRIPE PRODUCTION INTEGRATION ───────────────────────────────────────────
// Uncomment this entire block when Stripe is installed and configured:
/*
import Stripe from 'stripe';
import { findUserByStripeCustomerId, updateSubscription, cancelSubscription } from '@/repositories/UserRepository';
import { createTransaction } from '@/repositories/TransactionRepository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

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

        const user = await findUserByStripeCustomerId(customerId);
        if (!user) {
          console.error('[Stripe Webhook] User not found for customer:', customerId);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await updateSubscription(String(user._id), {
          subscriptionStatus: planId,
          accountType: planId === 'SCOUT' ? 'SCOUT' : 'PLAYER',
          role: planId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
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
*/
// ─────────────────────────────────────────────────────────────────────────────

// PLACEHOLDER: Returns 501 until Stripe is configured
export async function POST(req: NextRequest) {
  console.warn('[Stripe Webhook] Stripe not configured. Uncomment the production code in this file.');
  return NextResponse.json(
    { error: 'Stripe integration not yet configured. See comments in /api/webhook/stripe/route.ts' },
    { status: 501 }
  );
}
