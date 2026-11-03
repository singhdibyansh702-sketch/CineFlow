import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { notifyAllAdmins } from '../services/notification.service';
import { sanitizeProjectsListForRole, sanitizeProjectForRole } from '../utils/privacySanitizer';

// ----------------------------------------------------
// CLIENT DASHBOARD OVERVIEW
// ----------------------------------------------------
export async function getClientDashboard(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;

  const [activeCount, pendingCount, completedCount, myProjects] = await Promise.all([
    prisma.project.count({
      where: {
        clientId: user.id,
        status: { in: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'REVISION_REQUIRED'] },
      },
    }),
    prisma.project.count({
      where: {
        clientId: user.id,
        status: { in: ['NEW_REQUEST', 'PENDING_APPROVAL'] },
      },
    }),
    prisma.project.count({
      where: {
        clientId: user.id,
        status: { in: ['APPROVED', 'COMPLETED'] },
      },
    }),
    prisma.project.findMany({
      where: { clientId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: {
        payments: { where: { type: 'CLIENT_PAYMENT' } },
        submissions: { where: { status: 'APPROVED' }, select: { deliveryLink: true, version: true } },
      },
    }),
  ]);

  const sanitizedProjects = sanitizeProjectsListForRole(myProjects, 'CLIENT', user.id);

  res.json({
    metrics: {
      activeProjects: activeCount,
      pendingRequests: pendingCount,
      completedProjects: completedCount,
      totalProjects: activeCount + pendingCount + completedCount,
    },
    recentProjects: sanitizedProjects,
  });
}

// ----------------------------------------------------
// SUBMIT A NEW EDITING REQUEST (Client only)
// ----------------------------------------------------
const clientRequestSchema = z.object({
  title: z.string().min(3, 'Project title must be at least 3 characters'),
  videoType: z.string().min(2, 'Please specify the video type'),
  referenceLink: z.string().url('Reference link must be a valid URL'),
  specDocUrl: z.string().url('Spec doc link must be a valid URL').optional().or(z.literal('')),
  budget: z.number().min(0).optional(),
  currency: z.enum(['USD', 'INR']).default('USD'),
  deadline: z.string().optional(),
  description: z.string().min(10, 'Please provide editing instructions or project description'),
});

export async function submitClientRequest(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const data = clientRequestSchema.parse(req.body);

  const count = await prisma.project.count();
  const projectCode = `PRJ-${1000 + count + 1}`;

  const currencySymbol = data.currency === 'INR' ? '₹' : '$';

  const project = await prisma.project.create({
    data: {
      projectCode,
      title: data.title.trim(),
      description: data.description.trim(),
      videoType: data.videoType,
      referenceLink: data.referenceLink.trim(),
      specDocUrl: data.specDocUrl ? data.specDocUrl.trim() : null,
      currency: data.currency,
      clientBudget: data.budget !== undefined ? data.budget : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      status: 'PENDING_APPROVAL',
      clientId: user.id,
      clientPrice: 0.0, // Agency Admin sets the quote/negotiation upon review
      editorPayment: 0.0,
    },
  });

  // Notify Agency Admin
  await notifyAllAdmins({
    title: 'New Client Video Request',
    message: `${user.name} submitted a request: "${project.title}" (${project.projectCode}). Proposed budget: ${currencySymbol}${data.budget || 0} (${data.currency}). Needs review & quote.`,
    link: '/admin/projects',
    type: 'PROJECT_REQUEST',
  });

  res.status(201).json({
    message: 'Your editing request has been submitted successfully! Our agency will review and confirm your quote shortly.',
    project: sanitizeProjectForRole(project, 'CLIENT', user.id),
  });
}

