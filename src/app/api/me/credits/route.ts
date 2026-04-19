import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { findUserById } from '@/repositories/UserRepository';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await findUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        subscriptionStatus: user.subscriptionStatus,
        welcome_analysis_credits: user.welcome_analysis_credits ?? 0,
        welcome_booyah_credits: user.welcome_booyah_credits ?? 0,
      },
    });
  } catch (error) {
    console.error('[GET /api/me/credits]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
