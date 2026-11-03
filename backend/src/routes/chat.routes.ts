import { Router } from 'express';
import {
  getAdminConversations,
  getChatMessages,
  sendChatMessage,
} from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);

// Admin-only conversation list
router.get('/conversations', requireRole('ADMIN'), asyncHandler(getAdminConversations));

// Thread messages (clients/editors fetch their thread with admin; admin fetches thread with specified userId)
router.get('/messages/:otherUserId', asyncHandler(getChatMessages));

// Send message
router.post('/messages', asyncHandler(sendChatMessage));

export default router;

