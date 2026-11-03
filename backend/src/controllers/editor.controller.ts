import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { sanitizeProjectsListForRole } from '../utils/privacySanitizer';

// ----------------------------------------------------
// EDITOR DASHBOARD OVERVIEW
// ----------------------------------------------------
export async function getEditorDashboard(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const now = new Date();

  const [
    assignedCount,
    inProgressCount,
    submittedCount,
    completedCount,
    overdueCount,
    myProjects,
    payouts,
  ] = await Promise.all([
    prisma.project.count({
      where: { editorId: user.id, status: 'ASSIGNED' },
    }),
    prisma.project.count({
      where: { editorId: user.id, status: { in: ['IN_PROGRESS', 'REVISION_REQUIRED'] } },
    }),
    prisma.project.count({
      where: { editorId: user.id, status: 'SUBMITTED_FOR_REVIEW' },
    }),
    prisma.project.count({
      where: { editorId: user.id, status: { in: ['COMPLETED', 'APPROVED'] } },
    }),
    prisma.project.count({
      where: {
        editorId: user.id,
        deadline: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    }),
    prisma.project.findMany({
      where: { editorId: user.id },
      orderBy: { deadline: 'asc' },
      include: {
        client: {
          select: {
            name: true,
            clientProfile: { select: { companyName: true } },
          },
        },
        submissions: { orderBy: { version: 'desc' } },
        payments: { where: { type: 'EDITOR_PAYMENT' } },
      },
    }),
    prisma.payment.findMany({
      where: {
        project: { editorId: user.id },
        type: 'EDITOR_PAYMENT',
      },
      select: { amount: true },
    }),
  ]);

  const totalAgreed = myProjects.reduce((sum, p) => sum + p.editorPayment, 0);
  const totalEarnedAndPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = Math.max(0, totalAgreed - totalEarnedAndPaid);

  const sanitizedProjects = sanitizeProjectsListForRole(myProjects, 'EDITOR', user.id);

  res.json({
    metrics: {
      assignedProjects: assignedCount,
      inProgressProjects: inProgressCount,
      submittedProjects: submittedCount,
      completedProjects: completedCount,
      overdueProjects: overdueCount,
      totalAgreed,
      totalEarnedAndPaid,
      pendingPayouts,
    },
    projects: sanitizedProjects,
  });
}

