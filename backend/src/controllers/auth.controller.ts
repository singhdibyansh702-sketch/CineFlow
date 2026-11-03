import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { verifyPassword } from '../utils/password';
import { generateToken, setSessionCookie, clearSessionCookie } from '../utils/token';
import { sanitizeUser } from '../utils/privacySanitizer';
import { AuthRequest } from '../types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      clientProfile: true,
      editorProfile: true,
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Your account has been deactivated. Please contact agency management.' });
    return;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as any,
    status: user.status as any,
  };

  const token = generateToken(sessionUser);
  setSessionCookie(res, token);

  res.json({
    message: 'Login successful',
    user: sanitizeUser(user),
    token, // Also return in body for client flexibility
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.json({ message: 'Logged out successfully' });
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      clientProfile: true,
      editorProfile: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: sanitizeUser(user) });
}

