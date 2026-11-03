import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { recordAuditLog } from '../middleware/auditLogger';
import { createNotification, notifyAllAdmins } from '../services/notification.service';
import { sanitizeProjectForRole, sanitizeProjectsListForRole } from '../utils/privacySanitizer';

// ----------------------------------------------------
// LIST PROJECTS (Role-filtered)
// ----------------------------------------------------
export async function listProjects(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { status, search } = req.query;

  const where: any = {};

  // Role filter
  if (user.role === 'CLIENT') {
    where.clientId = user.id;
  } else if (user.role === 'EDITOR') {
    where.editorId = user.id;
  }
  // Admin sees all

  // Status filter
  if (status && typeof status === 'string' && status !== 'ALL') {
    where.status = status;
  }

  // Search filter
  if (search && typeof search === 'string') {
    where.OR = [
      { title: { contains: search } },
      { projectCode: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { companyName: true, phone: true } },
        },
      },
      editor: {
        select: {
          id: true,
          name: true,
          email: true,
          editorProfile: { select: { skills: true, phone: true, paymentRate: true } },
        },
      },
      submissions: {
        orderBy: { version: 'desc' },
      },
      payments: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
      internalNotes: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  const sanitized = sanitizeProjectsListForRole(projects, user.role, user.id);
  res.json({ projects: sanitized });
}

// ----------------------------------------------------
// GET PROJECT BY ID (Permission-checked & sanitized)
// ----------------------------------------------------
export async function getProjectById(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientProfile: { select: { companyName: true, phone: true, notes: true } },
        },
      },
      editor: {
        select: {
          id: true,
          name: true,
          email: true,
          editorProfile: { select: { skills: true, phone: true, paymentRate: true, portfolioLink: true } },
        },
      },
      submissions: {
        orderBy: { version: 'desc' },
        include: { editor: { select: { id: true, name: true } } },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
      internalNotes: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  // Verify access permissions:
  if (user.role === 'CLIENT' && project.clientId !== user.id) {
    res.status(403).json({ error: 'Access denied. You can only view your own projects.' });
    return;
  }

  if (user.role === 'EDITOR' && project.editorId !== user.id) {
    res.status(403).json({ error: 'Access denied. You can only view projects assigned to you.' });
    return;
  }

  const sanitized = sanitizeProjectForRole(project, user.role, user.id);
  res.json({ project: sanitized });
}

// ----------------------------------------------------
// CREATE PROJECT MANUALLY (Admin only)
// ----------------------------------------------------
const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  videoType: z.string().default('General'),
  editingRequirements: z.string().optional(),
  referenceLink: z.string().url('Reference link must be a valid URL').optional().or(z.literal('')),
  specDocUrl: z.string().url('Spec doc link must be a valid URL').optional().or(z.literal('')),
  clientId: z.string().min(1, 'Client is required'),
  editorId: z.string().optional(),
  currency: z.enum(['USD', 'INR']).default('USD'),
  clientBudget: z.number().min(0).optional(),
  clientPrice: z.number().min(0).default(0),
  editorPayment: z.number().min(0).default(0),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string().default('ASSIGNED'),
});

export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  const data = createProjectSchema.parse(req.body);

  // Generate unique project code like PRJ-1006
  const count = await prisma.project.count();
  const projectCode = `PRJ-${1000 + count + 1}`;

  const client = await prisma.user.findUnique({
    where: { id: data.clientId },
  });
  if (!client || client.role !== 'CLIENT') {
    res.status(400).json({ error: 'Invalid client selected.' });
    return;
  }

  if (data.editorId) {
    const editor = await prisma.user.findUnique({
      where: { id: data.editorId },
    });
    if (!editor || editor.role !== 'EDITOR') {
      res.status(400).json({ error: 'Invalid editor selected.' });
      return;
    }
  }

  const project = await prisma.project.create({
    data: {
      projectCode,
      title: data.title.trim(),
      description: data.description.trim(),
      videoType: data.videoType,
      editingRequirements: data.editingRequirements || null,
      referenceLink: data.referenceLink || null,
      specDocUrl: data.specDocUrl || null,
      currency: data.currency,
      clientBudget: data.clientBudget !== undefined ? data.clientBudget : null,
      clientId: data.clientId,
      editorId: data.editorId || null,
      clientPrice: data.clientPrice,
      editorPayment: data.editorPayment,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      deadline: data.deadline ? new Date(data.deadline) : null,
      status: data.editorId ? 'ASSIGNED' : 'PENDING_APPROVAL',
    },
    include: { client: true, editor: true },
  });

  await recordAuditLog(
    req.user!.id,
    'PROJECT_CREATED',
    'PROJECT',
    project.id,
    `Admin created project ${project.projectCode} (${project.title}) for client ${client.name}`
  );

  // Notify client
  await createNotification({
    userId: client.id,
    title: 'New Project Created',
    message: `Your project "${project.title}" (${project.projectCode}) has been registered with the agency.`,
    link: '/client/projects',
    type: 'PROJECT_ASSIGNED',
  });

  // Notify editor if assigned
  if (data.editorId) {
    const currencySymbol = data.currency === 'INR' ? '₹' : '$';
    await createNotification({
      userId: data.editorId,
      title: 'New Project Assignment',
      message: `You have been assigned to project "${project.title}" (${project.projectCode}). Agreed payout: ${currencySymbol}${project.editorPayment}.`,
      link: '/editor/projects',
      type: 'PROJECT_ASSIGNED',
    });
  }

  res.status(201).json({
    message: 'Project created successfully',
    project: sanitizeProjectForRole(project, req.user!.role, req.user!.id),
  });
}

// ----------------------------------------------------
// UPDATE PROJECT (Admin only)
// ----------------------------------------------------
const updateProjectSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  videoType: z.string().optional(),
  editingRequirements: z.string().optional().nullable(),
  referenceLink: z.string().optional().nullable(),
  specDocUrl: z.string().optional().nullable(),
  clientPrice: z.number().min(0).optional(),
  editorPayment: z.number().min(0).optional(),
  deadline: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  finalDeliveryLink: z.string().optional().nullable(),
  status: z.string().optional(),
});

export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = updateProjectSchema.parse(req.body);

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const updateData: any = {};
  if (data.title) updateData.title = data.title.trim();
  if (data.description) updateData.description = data.description.trim();
  if (data.videoType) updateData.videoType = data.videoType;
  if (data.editingRequirements !== undefined) updateData.editingRequirements = data.editingRequirements;
  if (data.referenceLink !== undefined) updateData.referenceLink = data.referenceLink;
  if (data.specDocUrl !== undefined) updateData.specDocUrl = data.specDocUrl;
  if (data.clientPrice !== undefined) updateData.clientPrice = data.clientPrice;
  if (data.editorPayment !== undefined) updateData.editorPayment = data.editorPayment;
  if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.finalDeliveryLink !== undefined) updateData.finalDeliveryLink = data.finalDeliveryLink;
  if (data.status) updateData.status = data.status;

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    include: { client: true, editor: true },
  });

  await recordAuditLog(
    req.user!.id,
    'PROJECT_UPDATED',
    'PROJECT',
    updated.id,
    `Admin updated project ${updated.projectCode} details.`
  );

  res.json({
    message: 'Project updated successfully',
    project: sanitizeProjectForRole(updated, req.user!.role, req.user!.id),
  });
}

// ----------------------------------------------------
// ASSIGN / REASSIGN EDITOR (Admin only)
// ----------------------------------------------------
const assignEditorSchema = z.object({
  editorId: z.string().min(1, 'Editor is required'),
  editorPayment: z.number().min(0, 'Agreed payout must be non-negative'),
  currency: z.enum(['USD', 'INR']).optional(),
  deadline: z.string().optional(),
});

export async function assignEditor(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = assignEditorSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id },
    include: { editor: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const editor = await prisma.user.findUnique({
    where: { id: data.editorId },
    include: { editorProfile: true },
  });

  if (!editor || editor.role !== 'EDITOR') {
    res.status(400).json({ error: 'Invalid editor selected.' });
    return;
  }

  const finalCurrency = data.currency || project.currency || 'USD';
  const currencySymbol = finalCurrency === 'INR' ? '₹' : '$';

  const updated = await prisma.project.update({
    where: { id },
    data: {
      editorId: editor.id,
      editorPayment: data.editorPayment,
      currency: finalCurrency,
      status: project.status === 'PENDING_APPROVAL' || project.status === 'NEW_REQUEST' ? 'ASSIGNED' : project.status,
      deadline: data.deadline ? new Date(data.deadline) : project.deadline,
    },
    include: { client: true, editor: true },
  });

  await recordAuditLog(
    req.user!.id,
    'EDITOR_ASSIGNED',
    'PROJECT',
    project.id,
    `Admin assigned project ${project.projectCode} to editor ${editor.name} (${currencySymbol}${data.editorPayment})`
  );

  // Notify editor
  await createNotification({
    userId: editor.id,
    title: 'New Project Assignment',
    message: `You have been assigned to project "${project.title}" (${project.projectCode}). Agreed payment: ${currencySymbol}${data.editorPayment}.`,
    link: '/editor/projects',
    type: 'PROJECT_ASSIGNED',
  });

  res.json({
    message: `Project assigned to editor ${editor.name}`,
    project: sanitizeProjectForRole(updated, req.user!.role, req.user!.id),
  });
}

// ----------------------------------------------------
// APPROVE CLIENT REQUEST (Admin only)
// ----------------------------------------------------
const approveRequestSchema = z.object({
  clientPrice: z.number().min(0, 'Client price is required'),
  currency: z.enum(['USD', 'INR']).optional(),
  adminQuoteNote: z.string().optional(),
  editorId: z.string().optional(),
  editorPayment: z.number().min(0).optional(),
  deadline: z.string().optional(),
});

export async function approveClientRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = approveRequestSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const newStatus = data.editorId ? 'ASSIGNED' : 'APPROVED';
  const finalCurrency = data.currency || project.currency || 'USD';
  const currencySymbol = finalCurrency === 'INR' ? '₹' : '$';

  const updated = await prisma.project.update({
    where: { id },
    data: {
      clientPrice: data.clientPrice,
      currency: finalCurrency,
      adminQuoteNote: data.adminQuoteNote || null,
      editorId: data.editorId || null,
      editorPayment: data.editorPayment || 0,
      deadline: data.deadline ? new Date(data.deadline) : project.deadline,
      status: newStatus,
      startDate: new Date(),
    },
    include: { client: true, editor: true },
  });

  await recordAuditLog(
    req.user!.id,
    'PROJECT_APPROVED',
    'PROJECT',
    project.id,
    `Admin approved/quoted project ${project.projectCode}. Set price: ${currencySymbol}${data.clientPrice} (${finalCurrency})${
      data.adminQuoteNote ? ` Note: ${data.adminQuoteNote}` : ''
    }`
  );

  // Notify client
  await createNotification({
    userId: project.clientId,
    title: 'Project Price Quote / Approved',
    message: `Your project "${project.title}" has been reviewed! Confirmed price: ${currencySymbol}${data.clientPrice}.${
      data.adminQuoteNote ? ` Admin note: "${data.adminQuoteNote}"` : ''
    }`,
    link: '/client/projects',
    type: 'PROJECT_APPROVED',
  });

  // Notify editor if assigned immediately
  if (data.editorId) {
    await createNotification({
      userId: data.editorId,
      title: 'New Project Assignment',
      message: `You have been assigned to project "${project.title}" (${project.projectCode}). Agreed payout: ${currencySymbol}${data.editorPayment || 0}.`,
      link: '/editor/projects',
      type: 'PROJECT_ASSIGNED',
    });
  }

  res.json({
    message: 'Project approved successfully',
    project: sanitizeProjectForRole(updated, req.user!.role, req.user!.id),
  });
}

// ----------------------------------------------------
// SUBMIT WORK (Editor only)
// ----------------------------------------------------
const submitWorkSchema = z.object({
  deliveryLink: z.string().url('Please enter a valid Google Drive or download URL'),
  submissionMessage: z.string().optional(),
});

export async function submitWork(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const data = submitWorkSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id },
    include: { submissions: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  if (project.editorId !== user.id) {
    res.status(403).json({ error: 'You are not assigned to this project.' });
    return;
  }

  const nextVersion = (project.submissions.length || 0) + 1;

  // Create submission record
  const submission = await prisma.projectSubmission.create({
    data: {
      projectId: project.id,
      editorId: user.id,
      deliveryLink: data.deliveryLink.trim(),
      submissionMessage: data.submissionMessage?.trim() || null,
      version: nextVersion,
      status: 'PENDING_REVIEW',
    },
  });

  // Update project status to SUBMITTED_FOR_REVIEW
  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      status: 'SUBMITTED_FOR_REVIEW',
    },
    include: { client: true, editor: true, submissions: true },
  });

  // Notify Admin
  await notifyAllAdmins({
    title: 'Work Submitted for Review',
    message: `Editor ${user.name} submitted v${nextVersion} for project ${project.projectCode} (${project.title}).`,
    link: '/admin/projects',
    type: 'WORK_SUBMITTED',
  });

  res.status(201).json({
    message: 'Work submitted for review successfully',
    submission,
    project: sanitizeProjectForRole(updatedProject, user.role, user.id),
  });
}

// ----------------------------------------------------
// REVIEW SUBMISSION / REQUEST REVISION / APPROVE (Admin only)
// ----------------------------------------------------
const reviewSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  action: z.enum(['APPROVE', 'REQUEST_REVISION']),
  feedback: z.string().min(5, 'Feedback is required'),
});

export async function reviewSubmission(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = reviewSubmissionSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id },
    include: { editor: true, client: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const isApproved = data.action === 'APPROVE';
  const newStatus = isApproved ? 'APPROVED' : 'REVISION_REQUIRED';

  await prisma.projectSubmission.update({
    where: { id: data.submissionId },
    data: {
      status: isApproved ? 'APPROVED' : 'REVISION_REQUESTED',
      adminFeedback: data.feedback,
      reviewedAt: new Date(),
    },
  });

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      status: newStatus,
    },
    include: { client: true, editor: true, submissions: true },
  });

  await recordAuditLog(
    req.user!.id,
    isApproved ? 'SUBMISSION_APPROVED' : 'REVISION_REQUESTED',
    'PROJECT',
    project.id,
    `Admin ${isApproved ? 'approved' : 'requested revision for'} submission on ${project.projectCode}`
  );

  // Notify Editor
  if (project.editorId) {
    await createNotification({
      userId: project.editorId,
      title: isApproved ? 'Submission Approved!' : 'Revision Requested',
      message: isApproved
        ? `Great news! Your submission for ${project.projectCode} was approved by Admin.`
        : `Admin requested revisions for ${project.projectCode}: "${data.feedback}"`,
      link: '/editor/projects',
      type: isApproved ? 'PROJECT_APPROVED' : 'REVISION_REQUESTED',
    });
  }

  res.json({
    message: isApproved ? 'Submission approved' : 'Revision requested',
    project: sanitizeProjectForRole(updatedProject, req.user!.role, req.user!.id),
  });
}

// ----------------------------------------------------
// MARK COMPLETED & DELIVER TO CLIENT (Admin only)
// ----------------------------------------------------
const completeProjectSchema = z.object({
  finalDeliveryLink: z.string().url('Final delivery link must be a valid URL'),
  adminNote: z.string().optional(),
});

export async function completeProject(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = completeProjectSchema.parse(req.body);

  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: true, editor: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
      finalDeliveryLink: data.finalDeliveryLink.trim(),
    },
    include: { client: true, editor: true, submissions: true, payments: true },
  });

  await recordAuditLog(
    req.user!.id,
    'PROJECT_COMPLETED',
    'PROJECT',
    project.id,
    `Admin marked project ${project.projectCode} as COMPLETED and dispatched delivery link.`
  );

  // Notify Client
  await createNotification({
    userId: project.clientId,
    title: 'Project Completed & Ready!',
    message: `Your video "${project.title}" (${project.projectCode}) is completed! Click to view your final delivery link.`,
    link: '/client/projects',
    type: 'PROJECT_COMPLETED',
  });

  // Notify Editor
  if (project.editorId) {
    await createNotification({
      userId: project.editorId,
      title: 'Project Finalized',
      message: `Project "${project.title}" (${project.projectCode}) has been completed and delivered to client.`,
      link: '/editor/projects',
      type: 'PROJECT_COMPLETED',
    });
  }

  res.json({
    message: 'Project marked as completed successfully',
    project: sanitizeProjectForRole(updated, req.user!.role, req.user!.id),
  });
}

// ----------------------------------------------------
// UPDATE STATUS (General transitions)
// ----------------------------------------------------
export async function updateProjectStatus(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { status } = req.body;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  // Permission checks:
  if (user.role === 'EDITOR') {
    if (project.editorId !== user.id) {
      res.status(403).json({ error: 'You are not assigned to this project.' });
      return;
    }
    // Editor can only move from ASSIGNED to IN_PROGRESS
    if (status === 'IN_PROGRESS' && project.status === 'ASSIGNED') {
      // Allowed
    } else {
      res.status(403).json({ error: 'Editors can only mark assigned projects as IN_PROGRESS.' });
      return;
    }
  } else if (user.role === 'CLIENT') {
    res.status(403).json({ error: 'Clients cannot directly alter project status.' });
    return;
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status },
    include: { client: true, editor: true },
  });

  await recordAuditLog(
    user.id,
    'STATUS_CHANGED',
    'PROJECT',
    project.id,
    `${user.role} changed status of ${project.projectCode} from ${project.status} to ${status}`
  );

  res.json({
    message: `Status updated to ${status}`,
    project: sanitizeProjectForRole(updated, user.role, user.id),
  });
}

// ----------------------------------------------------
// INTERNAL NOTES (Admin only)
// ----------------------------------------------------
export async function addInternalNote(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Note content cannot be empty.' });
    return;
  }

  const note = await prisma.internalNote.create({
    data: {
      projectId: id,
      authorId: user.id,
      content: content.trim(),
    },
    include: { author: { select: { id: true, name: true } } },
  });

  res.status(201).json({ note });
}

// ----------------------------------------------------
// PROJECT MESSAGES (Intermediated communication)
// ----------------------------------------------------
export async function postProjectMessage(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user!;
  const { id } = req.params;
  const { message, audience } = req.body;

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: true, editor: true },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  let finalAudience = 'ADMIN_CLIENT';

  if (user.role === 'CLIENT') {
    if (project.clientId !== user.id) {
      res.status(403).json({ error: 'You do not own this project.' });
      return;
    }
    finalAudience = 'ADMIN_CLIENT'; // Client always talks to Admin
  } else if (user.role === 'EDITOR') {
    if (project.editorId !== user.id) {
      res.status(403).json({ error: 'You are not assigned to this project.' });
      return;
    }
    finalAudience = 'ADMIN_EDITOR'; // Editor always talks to Admin
  } else if (user.role === 'ADMIN') {
    // Admin chooses audience: ADMIN_CLIENT or ADMIN_EDITOR
    finalAudience = audience === 'ADMIN_EDITOR' ? 'ADMIN_EDITOR' : 'ADMIN_CLIENT';
  }

  const msg = await prisma.projectMessage.create({
    data: {
      projectId: id,
      senderId: user.id,
      senderRole: user.role,
      audience: finalAudience,
      message: message.trim(),
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  // Send notifications:
  if (user.role === 'ADMIN') {
    if (finalAudience === 'ADMIN_CLIENT') {
      await createNotification({
        userId: project.clientId,
        title: 'New Agency Message',
        message: `Agency management sent an update on project ${project.projectCode}`,
        link: `/client/projects`,
        type: 'SYSTEM',
      });
    } else if (finalAudience === 'ADMIN_EDITOR' && project.editorId) {
      await createNotification({
        userId: project.editorId,
        title: 'New Agency Message',
        message: `Agency management sent instructions for project ${project.projectCode}`,
        link: `/editor/projects`,
        type: 'SYSTEM',
      });
    }
  } else {
    // Client or Editor sent message -> Notify Admin
    await notifyAllAdmins({
      title: `New Message from ${user.name} (${user.role})`,
      message: `Message received on project ${project.projectCode}: "${message.substring(0, 80)}"`,
      link: `/admin/projects`,
      type: 'SYSTEM',
    });
  }

  res.status(201).json({ message: msg });
}

