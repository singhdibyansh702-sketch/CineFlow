import { Router } from 'express';
import { getFinanceOverview, recordPayment, listPayments } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/overview', asyncHandler(getFinanceOverview));
router.get('/', asyncHandler(listPayments));
router.post('/', asyncHandler(recordPayment));

export default router;
