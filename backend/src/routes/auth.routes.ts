import { Router } from 'express';
import { login, logout, getCurrentUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/login', authLimiter, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

export default router;
