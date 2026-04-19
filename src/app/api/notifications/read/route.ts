import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAllNotificationsRead } from '@/repositories/NotificationRepository';

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/notifications/read]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
