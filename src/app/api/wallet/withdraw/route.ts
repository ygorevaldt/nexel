import { NextResponse } from 'next/server';

/**
 * DEPRECATED — This route has been removed as part of the pivot from gambling to SaaS.
 * 
 * Cash withdrawals are no longer supported. This platform is now subscription-based.
 * Users manage their subscription via /api/subscription and /subscription page.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Esta funcionalidade foi descontinuada. Use /subscription para gerenciar seu plano.',
      redirect: '/subscription',
    },
    { status: 410 }
  );
}
