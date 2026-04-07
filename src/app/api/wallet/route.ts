import { NextResponse } from 'next/server';

/**
 * DEPRECATED — This route has been removed as part of the pivot from gambling to SaaS.
 * 
 * Wallet and escrow endpoints are no longer supported. This platform is now subscription-based.
 * Users get their data from /api/subscription.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Esta funcionalidade foi descontinuada. Use /subscription para gerenciar seu plano.',
      redirect: '/subscription',
    },
    { status: 410 }
  );
}
