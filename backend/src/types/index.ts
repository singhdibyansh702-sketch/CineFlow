import { Request } from 'express';

export type UserRole = 'ADMIN' | 'EDITOR' | 'CLIENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type ProjectStatus =
  | 'NEW_REQUEST'
  | 'PENDING_APPROVAL'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentType = 'CLIENT_PAYMENT' | 'EDITOR_PAYMENT';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface ClientProfileData {
  companyName?: string;
  phone?: string;
  notes?: string;
}

export interface EditorProfileData {
  phone?: string;
  skills?: string;
  experience?: string;
  portfolioLink?: string;
  paymentRate?: number;
  internalNotes?: string;
}

