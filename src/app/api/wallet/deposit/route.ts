import { NextResponse } from 'next/server';

/**
 * DEPRECATED — This route has been removed as part of the pivot from gambling to SaaS.
 * 
 * Wallet deposits (PIX/cash-in) are no longer supported.
 * Users upgrade their account via Stripe subscriptions:
 *   POST /api/checkout/session  (to be implemented when Stripe is configured)
 *   GET  /api/subscription      (current plan status)
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Esta funcionalidade foi descontinuada. Use /api/subscription para gerenciar seu plano.',
      redirect: '/subscription',
    },
    { status: 410 } // 410 Gone
  );
}
