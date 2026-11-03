import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getMyNotifications));
router.put('/read-all', asyncHandler(markAllNotificationsAsRead));
router.put('/:id/read', asyncHandler(markNotificationAsRead));

export default router;
