import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { recordAuditLog } from '../middleware/auditLogger';
import { createNotification } from '../services/notification.service';

// ----------------------------------------------------
// FINANCE OVERVIEW & METRICS (Admin only)
// ----------------------------------------------------
export async function getFinanceOverview(req: AuthRequest, res: Response): Promise<void> {
  const [allProjects, allPayments] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        id: true,
        projectCode: true,
        title: true,
        status: true,
        clientPrice: true,
        editorPayment: true,
        client: { select: { id: true, name: true, email: true } },
        editor: { select: { id: true, name: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      orderBy: { paymentDate: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            title: true,
            clientPrice: true,
            editorPayment: true,
            client: { select: { name: true } },
            editor: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  // Aggregate numbers
  const totalClientAmount = allProjects.reduce((sum, p) => sum + p.clientPrice, 0);
  const totalEditorAmount = allProjects.reduce((sum, p) => sum + p.editorPayment, 0);

  const totalClientPaymentsReceived = allPayments
    .filter((p) => p.type === 'CLIENT_PAYMENT')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalEditorPaymentsMade = allPayments
    .filter((p) => p.type === 'EDITOR_PAYMENT')
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingClientPayments = Math.max(0, totalClientAmount - totalClientPaymentsReceived);
  const outstandingEditorPayments = Math.max(0, totalEditorAmount - totalEditorPaymentsMade);
  const agencyProfit = totalClientPaymentsReceived - totalEditorPaymentsMade;

  // Project finance breakdown table
  const projectBreakdown = allProjects.map((p) => {
    const clientPaid = p.payments
      .filter((pay) => pay.type === 'CLIENT_PAYMENT')
      .reduce((sum, pay) => sum + pay.amount, 0);

    const editorPaid = p.payments
      .filter((pay) => pay.type === 'EDITOR_PAYMENT')
      .reduce((sum, pay) => sum + pay.amount, 0);

    const clientBalance = Math.max(0, p.clientPrice - clientPaid);
    const editorBalance = Math.max(0, p.editorPayment - editorPaid);

    let clientPaymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid' = 'Unpaid';
    if (clientPaid >= p.clientPrice && p.clientPrice > 0) {
      clientPaymentStatus = 'Fully Paid';
    } else if (clientPaid > 0) {
      clientPaymentStatus = 'Partially Paid';
    }

    let editorPaymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid' = 'Unpaid';
    if (editorPaid >= p.editorPayment && p.editorPayment > 0) {
      editorPaymentStatus = 'Fully Paid';
    } else if (editorPaid > 0) {
      editorPaymentStatus = 'Partially Paid';
    }

    return {
      id: p.id,
      projectCode: p.projectCode,
      title: p.title,
      status: p.status,
      clientName: p.client.name,
      editorName: p.editor?.name || 'Unassigned',
      // Client finance
      clientPrice: p.clientPrice,
      clientPaid,
      clientBalance,
      clientPaymentStatus,
      // Editor finance
      editorPayment: p.editorPayment,
      editorPaid,
      editorBalance,
      editorPaymentStatus,
      // Project net margin
      netMargin: p.clientPrice - p.editorPayment,
    };
  });

  res.json({
    metrics: {
      totalClientAmount,
      totalClientPaymentsReceived,
      outstandingClientPayments,
      totalEditorAmount,
      totalEditorPaymentsMade,
      outstandingEditorPayments,
      agencyProfit,
    },
    projectBreakdown,
    recentPayments: allPayments.slice(0, 15),
  });
}

// ----------------------------------------------------
// RECORD PAYMENT (Admin only)
// ----------------------------------------------------
const recordPaymentSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  type: z.enum(['CLIENT_PAYMENT', 'EDITOR_PAYMENT']),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.string().default('Bank Transfer'),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
});

export async function recordPayment(req: AuthRequest, res: Response): Promise<void> {
  const data = recordPaymentSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: { client: true, editor: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (data.type === 'EDITOR_PAYMENT' && !project.editorId) {
    res.status(400).json({ error: 'Cannot record editor payment on a project with no assigned editor.' });
    return;
  }

  const payment = await prisma.payment.create({
    data: {
      projectId: project.id,
      type: data.type,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      notes: data.notes?.trim() || null,
      referenceId: data.referenceId?.trim() || null,
    },
  });

  await recordAuditLog(
    req.user!.id,
    'PAYMENT_RECORDED',
    'PAYMENT',
    payment.id,
    `Admin recorded ${data.type} of $${data.amount} for project ${project.projectCode} via ${data.paymentMethod}`
  );

  // Send relevant notification
  if (data.type === 'CLIENT_PAYMENT') {
    await createNotification({
      userId: project.clientId,
      title: 'Payment Received',
      message: `Your payment of $${data.amount} for project ${project.projectCode} has been confirmed. Thank you!`,
      link: '/client/projects',
      type: 'PAYMENT_RECEIVED',
    });
  } else if (data.type === 'EDITOR_PAYMENT' && project.editorId) {
    await createNotification({
      userId: project.editorId,
      title: 'Payout Processed',
      message: `A payout of $${data.amount} for project ${project.projectCode} has been issued to you.`,
      link: '/editor/projects',
      type: 'PAYMENT_MADE',
    });
  }

  res.status(201).json({
    message: 'Payment recorded successfully',
    payment,
  });
}

// ----------------------------------------------------
// LIST PAYMENTS (Admin only)
// ----------------------------------------------------
export async function listPayments(req: AuthRequest, res: Response): Promise<void> {
  const { type, projectId } = req.query;

  const where: any = {};
  if (type && typeof type === 'string' && type !== 'ALL') {
    where.type = type;
  }
  if (projectId && typeof projectId === 'string') {
    where.projectId = projectId;
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { paymentDate: 'desc' },
    include: {
      project: {
        select: {
          id: true,
          projectCode: true,
          title: true,
          client: { select: { id: true, name: true } },
          editor: { select: { id: true, name: true } },
        },
      },
    },
  });

  res.json({ payments });
}

