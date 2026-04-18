import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createPlanConsentLog } from '@/repositories/PlanConsentLogRepository';

const ConsentSchema = z.object({
  action: z.enum(['CANCEL', 'UPGRADE', 'DOWNGRADE']),
  from_plan: z.enum(['FREE', 'PRO', 'SCOUT']),
  to_plan: z.enum(['FREE', 'PRO', 'SCOUT']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = ConsentSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    }

    const ip_address =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined;

    const user_agent = req.headers.get('user-agent') ?? undefined;

    await createPlanConsentLog({
      user_id: session.user.id,
      ...body.data,
      ip_address,
      user_agent,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/me/subscription/consent]', error);
    return NextResponse.json({ error: 'Falha ao registrar consentimento' }, { status: 500 });
  }
}
