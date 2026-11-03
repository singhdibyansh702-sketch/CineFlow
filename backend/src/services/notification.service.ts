import { prisma } from '../prisma';

export async function createNotification({
  userId,
  title,
  message,
  link,
  type = 'SYSTEM',
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link: link || null,
        type,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

export async function notifyAllAdmins({
  title,
  message,
  link,
  type,
}: {
  title: string;
  message: string;
  link?: string;
  type: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title,
        message,
        link,
        type,
      });
    }
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}

