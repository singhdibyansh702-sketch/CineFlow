import { Router } from 'express';
import { getClientDashboard, submitClientRequest } from '../controllers/client.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('CLIENT'));

router.get('/dashboard', asyncHandler(getClientDashboard));
router.post('/requests', asyncHandler(submitClientRequest));

export default router;
