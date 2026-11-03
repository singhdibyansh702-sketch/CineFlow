import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken, COOKIE_NAME } from '../utils/token';
import { prisma } from '../prisma';

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    // Also support Authorization Bearer token header if present
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. No session found.' });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
      return;
    }

    // Check that user is still active in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User account not found.' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Your account has been deactivated. Please contact agency management.' });
      return;
    }

    req.user = user as any;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed.' });
  }
}

