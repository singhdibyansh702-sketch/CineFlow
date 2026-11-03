import { Router } from 'express';
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  assignEditor,
  approveClientRequest,
  submitWork,
  reviewSubmission,
  completeProject,
  updateProjectStatus,
  addInternalNote,
  postProjectMessage,
} from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

// General listings & details (automatically filtered by role)
router.get('/', asyncHandler(listProjects));
router.get('/:id', asyncHandler(getProjectById));

// Admin-only creation & updates
router.post('/', requireRole('ADMIN'), asyncHandler(createProject));
router.put('/:id', requireRole('ADMIN'), asyncHandler(updateProject));
router.post('/:id/assign', requireRole('ADMIN'), asyncHandler(assignEditor));
router.post('/:id/approve-request', requireRole('ADMIN'), asyncHandler(approveClientRequest));
router.post('/:id/review-submission', requireRole('ADMIN'), asyncHandler(reviewSubmission));
router.post('/:id/complete', requireRole('ADMIN'), asyncHandler(completeProject));
router.post('/:id/notes', requireRole('ADMIN'), asyncHandler(addInternalNote));

// Editor actions
router.post('/:id/submit-work', requireRole('EDITOR'), asyncHandler(submitWork));

// Status updates (both Admin and Editor with constrained transitions)
router.post('/:id/status', requireRole('ADMIN', 'EDITOR'), asyncHandler(updateProjectStatus));

// Intermediated messages
router.post('/:id/messages', asyncHandler(postProjectMessage));

export default router;
