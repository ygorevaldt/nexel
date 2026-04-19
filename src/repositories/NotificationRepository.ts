import dbConnect from '@/lib/db';
import { Notification, INotification } from '@/models/Notification';

const NOTIFICATION_LIMIT = 20;

export async function createNotification(data: {
  user_id: string;
  type: INotification['type'];
  message: string;
  metadata?: INotification['metadata'];
}): Promise<INotification> {
  await dbConnect();
  return Notification.create({ ...data, read: false });
}

export async function findNotificationsByUserId(userId: string): Promise<INotification[]> {
  await dbConnect();
  return Notification.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(NOTIFICATION_LIMIT)
    .lean();
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  await dbConnect();
  return Notification.countDocuments({ user_id: userId, read: false });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await dbConnect();
  await Notification.updateMany({ user_id: userId, read: false }, { $set: { read: true } });
}
