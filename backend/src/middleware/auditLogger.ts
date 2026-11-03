import { prisma } from '../prisma';

export async function recordAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

