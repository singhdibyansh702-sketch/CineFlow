import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { hashPassword } from '../utils/password';
import { recordAuditLog } from '../middleware/auditLogger';
import { sanitizeUser } from '../utils/privacySanitizer';

// ----------------------------------------------------
// OVERVIEW DASHBOARD
// ----------------------------------------------------
export async function getAdminOverview(req: AuthRequest, res: Response): Promise<void> {
  const now = new Date();

  // Project status counts
  const [
    totalClients,
    totalEditors,
    totalProjects,
    activeProjects,
    completedProjects,
    pendingProjects,
    overdueProjects,
    allProjects,
    allPayments,
    recentProjects,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'EDITOR' } }),
    prisma.project.count(),
    prisma.project.count({
      where: {
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'REVISION_REQUIRED'] },
      },
    }),
    prisma.project.count({
      where: { status: { in: ['COMPLETED', 'APPROVED'] } },
    }),
    prisma.project.count({
      where: { status: { in: ['NEW_REQUEST', 'PENDING_APPROVAL'] } },
    }),
    prisma.project.count({
      where: {
        deadline: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    }),
    prisma.project.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { clientPrice: true, editorPayment: true },
    }),
    prisma.payment.findMany({
      select: { type: true, amount: true },
    }),
    prisma.project.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, email: true } },
        editor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        deadline: { gte: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      take: 5,
      orderBy: { deadline: 'asc' },
      include: {
        client: { select: { id: true, name: true } },
        editor: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Financial calculations
  const totalClientAgreed = allProjects.reduce((sum, p) => sum + p.clientPrice, 0);
  const totalEditorAgreed = allProjects.reduce((sum, p) => sum + p.editorPayment, 0);

  const totalClientPaymentsReceived = allPayments
    .filter((p) => p.type === 'CLIENT_PAYMENT')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalEditorPaymentsMade = allPayments
    .filter((p) => p.type === 'EDITOR_PAYMENT')
    .reduce((sum, p) => sum + p.amount, 0);

  // Exact formulas requested:
  // Outstanding Client Payments = Total Client Amount - Total Client Payments Received
  // Outstanding Editor Payments = Total Editor Amount - Total Editor Payments Made
  // Agency Profit = Total Client Payments Received - Total Editor Payments Made
  const outstandingClientPayments = Math.max(0, totalClientAgreed - totalClientPaymentsReceived);
  const outstandingEditorPayments = Math.max(0, totalEditorAgreed - totalEditorPaymentsMade);
  const agencyProfit = totalClientPaymentsReceived - totalEditorPaymentsMade;

  res.json({
    metrics: {
      totalClients,
      totalEditors,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingProjects,
      overdueProjects,
      totalClientAgreed,
      totalEditorAgreed,
      totalClientPaymentsReceived,
      totalEditorPaymentsMade,
      outstandingClientPayments,
      outstandingEditorPayments,
      agencyProfit,
    },
    recentProjects,
    upcomingDeadlines,
  });
}

// ----------------------------------------------------
// CLIENT MANAGEMENT
// ----------------------------------------------------
export async function listClients(req: AuthRequest, res: Response): Promise<void> {
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    orderBy: { createdAt: 'desc' },
    include: {
      clientProfile: true,
      clientProjects: {
        select: {
          id: true,
          status: true,
          clientPrice: true,
          payments: {
            where: { type: 'CLIENT_PAYMENT' },
            select: { amount: true },
          },
        },
      },
    },
  });

  const formatted = clients.map((c) => {
    const totalProjects = c.clientProjects.length;
    const activeProjects = c.clientProjects.filter((p) =>
      ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'REVISION_REQUIRED'].includes(p.status)
    ).length;
    const totalAgreed = c.clientProjects.reduce((sum, p) => sum + p.clientPrice, 0);
    const totalPaid = c.clientProjects.reduce(
      (sum, p) => sum + p.payments.reduce((psum, pay) => psum + pay.amount, 0),
      0
    );

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      createdAt: c.createdAt,
      companyName: c.clientProfile?.companyName || null,
      phone: c.clientProfile?.phone || null,
      notes: c.clientProfile?.notes || null,
      stats: {
        totalProjects,
        activeProjects,
        totalAgreed,
        totalPaid,
        outstanding: Math.max(0, totalAgreed - totalPaid),
      },
    };
  });

  res.json({ clients: formatted });
}

const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClient(req: AuthRequest, res: Response): Promise<void> {
  const data = createClientSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    res.status(400).json({ error: 'A user with this email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: 'CLIENT',
      status: 'ACTIVE',
      clientProfile: {
        create: {
          companyName: data.companyName?.trim() || null,
          phone: data.phone?.trim() || null,
          notes: data.notes?.trim() || null,
        },
      },
    },
    include: { clientProfile: true },
  });

  await recordAuditLog(
    req.user!.id,
    'CLIENT_CREATED',
    'USER',
    user.id,
    `Admin created client account for ${user.name} (${user.email})`
  );

  res.status(201).json({
    message: 'Client created successfully',
    client: sanitizeUser(user),
  });
}

const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateClient(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = updateClientSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { clientProfile: true },
  });

  if (!existing || existing.role !== 'CLIENT') {
    res.status(404).json({ error: 'Client not found.' });
    return;
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.email) updateData.email = data.email.toLowerCase().trim();
  if (data.status) updateData.status = data.status;
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      clientProfile: {
        upsert: {
          create: {
            companyName: data.companyName ?? null,
            phone: data.phone ?? null,
            notes: data.notes ?? null,
          },
          update: {
            companyName: data.companyName !== undefined ? data.companyName : undefined,
            phone: data.phone !== undefined ? data.phone : undefined,
            notes: data.notes !== undefined ? data.notes : undefined,
          },
        },
      },
    },
    include: { clientProfile: true },
  });

  await recordAuditLog(
    req.user!.id,
    'CLIENT_UPDATED',
    'USER',
    updated.id,
    `Admin updated client ${updated.name}. Status: ${updated.status}`
  );

  res.json({
    message: 'Client updated successfully',
    client: sanitizeUser(updated),
  });
}

export async function getClientProfile(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      clientProfile: true,
      clientProjects: {
        orderBy: { createdAt: 'desc' },
        include: {
          editor: { select: { id: true, name: true, email: true } },
          payments: { where: { type: 'CLIENT_PAYMENT' } },
        },
      },
    },
  });

  if (!client || client.role !== 'CLIENT') {
    res.status(404).json({ error: 'Client not found.' });
    return;
  }

  res.json({ client: sanitizeUser(client) });
}

// ----------------------------------------------------
// EDITOR MANAGEMENT
// ----------------------------------------------------
export async function listEditors(req: AuthRequest, res: Response): Promise<void> {
  const editors = await prisma.user.findMany({
    where: { role: 'EDITOR' },
    orderBy: { createdAt: 'desc' },
    include: {
      editorProfile: true,
      editorProjects: {
        select: {
          id: true,
          status: true,
          editorPayment: true,
          payments: {
            where: { type: 'EDITOR_PAYMENT' },
            select: { amount: true },
          },
        },
      },
    },
  });

  const formatted = editors.map((e) => {
    const totalProjects = e.editorProjects.length;
    const activeProjects = e.editorProjects.filter((p) =>
      ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'REVISION_REQUIRED'].includes(p.status)
    ).length;
    const completedProjects = e.editorProjects.filter((p) =>
      ['COMPLETED', 'APPROVED'].includes(p.status)
    ).length;

    const totalAgreedPay = e.editorProjects.reduce((sum, p) => sum + p.editorPayment, 0);
    const totalPaid = e.editorProjects.reduce(
      (sum, p) => sum + p.payments.reduce((psum, pay) => psum + pay.amount, 0),
      0
    );

    return {
      id: e.id,
      name: e.name,
      email: e.email,
      status: e.status,
      createdAt: e.createdAt,
      phone: e.editorProfile?.phone || null,
      skills: e.editorProfile?.skills || null,
      experience: e.editorProfile?.experience || null,
      portfolioLink: e.editorProfile?.portfolioLink || null,
      paymentRate: e.editorProfile?.paymentRate || 0,
      internalNotes: e.editorProfile?.internalNotes || null,
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalAgreedPay,
        totalPaid,
        outstanding: Math.max(0, totalAgreedPay - totalPaid),
      },
    };
  });

  res.json({ editors: formatted });
}

const createEditorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
  portfolioLink: z.string().optional(),
  paymentRate: z.number().min(0).optional(),
  internalNotes: z.string().optional(),
});

export async function createEditor(req: AuthRequest, res: Response): Promise<void> {
  const data = createEditorSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    res.status(400).json({ error: 'A user with this email already exists.' });
    return;
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
      editorProfile: {
        create: {
          phone: data.phone?.trim() || null,
          skills: data.skills?.trim() || null,
          experience: data.experience?.trim() || null,
          portfolioLink: data.portfolioLink?.trim() || null,
          paymentRate: data.paymentRate || 0,
          internalNotes: data.internalNotes?.trim() || null,
        },
      },
    },
    include: { editorProfile: true },
  });

  await recordAuditLog(
    req.user!.id,
    'EDITOR_CREATED',
    'USER',
    user.id,
    `Admin created editor account for ${user.name} (${user.email})`
  );

  res.status(201).json({
    message: 'Editor created successfully',
    editor: sanitizeUser(user),
  });
}

const updateEditorSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  phone: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
  portfolioLink: z.string().optional(),
  paymentRate: z.number().min(0).optional(),
  internalNotes: z.string().optional(),
});

export async function updateEditor(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = updateEditorSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { editorProfile: true },
  });

  if (!existing || existing.role !== 'EDITOR') {
    res.status(404).json({ error: 'Editor not found.' });
    return;
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.email) updateData.email = data.email.toLowerCase().trim();
  if (data.status) updateData.status = data.status;
  if (data.password) updateData.passwordHash = await hashPassword(data.password);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      editorProfile: {
        upsert: {
          create: {
            phone: data.phone ?? null,
            skills: data.skills ?? null,
            experience: data.experience ?? null,
            portfolioLink: data.portfolioLink ?? null,
            paymentRate: data.paymentRate ?? 0,
            internalNotes: data.internalNotes ?? null,
          },
          update: {
            phone: data.phone !== undefined ? data.phone : undefined,
            skills: data.skills !== undefined ? data.skills : undefined,
            experience: data.experience !== undefined ? data.experience : undefined,
            portfolioLink: data.portfolioLink !== undefined ? data.portfolioLink : undefined,
            paymentRate: data.paymentRate !== undefined ? data.paymentRate : undefined,
            internalNotes: data.internalNotes !== undefined ? data.internalNotes : undefined,
          },
        },
      },
    },
    include: { editorProfile: true },
  });

  await recordAuditLog(
    req.user!.id,
    'EDITOR_UPDATED',
    'USER',
    updated.id,
    `Admin updated editor ${updated.name}. Status: ${updated.status}`
  );

  res.json({
    message: 'Editor updated successfully',
    editor: sanitizeUser(updated),
  });
}

export async function getEditorProfile(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const editor = await prisma.user.findUnique({
    where: { id },
    include: {
      editorProfile: true,
      editorProjects: {
        orderBy: { createdAt: 'desc' },
        include: {
          submissions: { orderBy: { createdAt: 'desc' } },
          payments: { where: { type: 'EDITOR_PAYMENT' } },
        },
      },
    },
  });

  if (!editor || editor.role !== 'EDITOR') {
    res.status(404).json({ error: 'Editor not found.' });
    return;
  }

  res.json({ editor: sanitizeUser(editor) });
}

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);

  res.json({
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

