import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';

export async function getMyNotifications(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  res.json({
    notifications,
    unreadCount,
  });
}

export async function markNotificationAsRead(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });

  res.json({ success: true });
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true });
}

