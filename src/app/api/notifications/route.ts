import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  findNotificationsByUserId,
  countUnreadNotifications,
} from '@/repositories/NotificationRepository';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const [notifications, unread_count] = await Promise.all([
      findNotificationsByUserId(session.user.id),
      countUnreadNotifications(session.user.id),
    ]);

    return NextResponse.json({
      data: notifications.map((n) => ({
        id: String(n._id),
        type: n.type,
        message: n.message,
        read: n.read,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
      unread_count,
    });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
