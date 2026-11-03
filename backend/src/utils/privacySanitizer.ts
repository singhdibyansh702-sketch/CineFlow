import { UserRole } from '../types';

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function sanitizeProjectForRole(project: any, role: UserRole, currentUserId?: string) {
  if (!project) return null;

  // Make a clone to avoid mutating database instance
  const safe = JSON.parse(JSON.stringify(project));

  if (role === 'ADMIN') {
    // Admin has full visibility
    if (safe.client) delete safe.client.passwordHash;
    if (safe.editor) delete safe.editor.passwordHash;
    return safe;
  }

  if (role === 'CLIENT') {
    // 1. Remove editor details completely
    delete safe.editorId;
    delete safe.editor;
    delete safe.editorPayment;
    delete safe.internalNotes;

    // 2. Client only sees client payments
    if (safe.payments) {
      safe.payments = safe.payments.filter((p: any) => p.type === 'CLIENT_PAYMENT');
    }

    // 3. Submissions: remove editor private info, only show approved delivery links or submission info
    if (safe.submissions) {
      safe.submissions = safe.submissions.map((sub: any) => ({
        id: sub.id,
        version: sub.version,
        status: sub.status,
        submittedAt: sub.submittedAt,
        deliveryLink: sub.status === 'APPROVED' ? sub.deliveryLink : undefined,
      }));
    }

    // 4. Messages: only show messages intended for client (ADMIN_CLIENT)
    if (safe.messages) {
      safe.messages = safe.messages
        .filter((m: any) => m.audience === 'ADMIN_CLIENT')
        .map((m: any) => ({
          id: m.id,
          senderRole: m.senderRole,
          senderName: m.senderRole === 'ADMIN' ? 'Agency Management' : (m.sender?.name || 'You'),
          message: m.message,
          createdAt: m.createdAt,
        }));
    }

    if (safe.client) {
      delete safe.client.passwordHash;
    }

    return safe;
  }

  if (role === 'EDITOR') {
    // 1. Redact client contact and personal information
    if (safe.client) {
      safe.client = {
        name: safe.client.name,
        companyName: safe.client.clientProfile?.companyName || null,
        // email, phone, notes are strictly redacted!
      };
    }
    delete safe.clientId;

    // 2. Hide client financial information and agency profit
    delete safe.clientPrice;
    delete safe.clientBudget;
    delete safe.adminQuoteNote;
    delete safe.internalNotes;

    // 3. Payments: only show editor payouts for this project
    if (safe.payments) {
      safe.payments = safe.payments.filter((p: any) => p.type === 'EDITOR_PAYMENT');
    }

    // 4. Submissions: editor only sees their own submissions
    if (safe.submissions) {
      safe.submissions = safe.submissions
        .filter((s: any) => !currentUserId || s.editorId === currentUserId)
        .map((s: any) => {
          delete s.editor;
          return s;
        });
    }

    // 5. Messages: only show messages intended for editor (ADMIN_EDITOR)
    if (safe.messages) {
      safe.messages = safe.messages
        .filter((m: any) => m.audience === 'ADMIN_EDITOR')
        .map((m: any) => ({
          id: m.id,
          senderRole: m.senderRole,
          senderName: m.senderRole === 'ADMIN' ? 'Agency Management' : 'You',
          message: m.message,
          createdAt: m.createdAt,
        }));
    }

    if (safe.editor) {
      delete safe.editor.passwordHash;
    }

    return safe;
  }

  return safe;
}

export function sanitizeProjectsListForRole(projects: any[], role: UserRole, currentUserId?: string) {
  return projects.map((p) => sanitizeProjectForRole(p, role, currentUserId));
}

