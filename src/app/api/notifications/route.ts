import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  findNotificationsByUserId,
  countUnreadNotifications,
} from '@/repositories/NotificationRepository';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? 1));

    const [{ notifications, hasMore }, unread_count] = await Promise.all([
      findNotificationsByUserId(session.user.id, page),
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
      hasMore,
      unread_count,
    });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}
