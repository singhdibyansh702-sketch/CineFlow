import { Router } from 'express';
import { getEditorDashboard } from '../controllers/editor.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('EDITOR'));

router.get('/dashboard', asyncHandler(getEditorDashboard));

export default router;
