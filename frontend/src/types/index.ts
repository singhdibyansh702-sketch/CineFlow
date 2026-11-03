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

export interface ClientProfile {
  companyName?: string;
  phone?: string;
  notes?: string;
}

export interface EditorProfile {
  phone?: string;
  skills?: string;
  experience?: string;
  portfolioLink?: string;
  paymentRate?: number;
  internalNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  clientProfile?: ClientProfile;
  editorProfile?: EditorProfile;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  editorId?: string;
  deliveryLink: string;
  submissionMessage?: string;
  version: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUESTED';
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Payment {
  id: string;
  projectId: string;
  type: 'CLIENT_PAYMENT' | 'EDITOR_PAYMENT';
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  referenceId?: string;
  project?: {
    id: string;
    projectCode: string;
    title: string;
    client?: { name: string };
    editor?: { name: string };
  };
}

export interface InternalNote {
  id: string;
  projectId?: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderRole: UserRole;
  senderName?: string;
  audience: string;
  message: string;
  createdAt: string;
  sender?: { id: string; name: string; role: string };
}

export interface Project {
  id: string;
  projectCode: string;
  title: string;
  description: string;
  videoType: string;
  editingRequirements?: string;
  referenceLink?: string;
  specDocUrl?: string;
  status: ProjectStatus;
  currency?: string; // 'USD' | 'INR'
  clientBudget?: number;
  adminQuoteNote?: string;
  clientId?: string;
  editorId?: string;
  client?: {
    id?: string;
    name: string;
    email?: string;
    clientProfile?: { companyName?: string; phone?: string; notes?: string };
  };
  editor?: {
    id?: string;
    name: string;
    email?: string;
    editorProfile?: { skills?: string; phone?: string; paymentRate?: number; portfolioLink?: string };
  };
  clientPrice?: number;
  editorPayment?: number;
  startDate?: string;
  deadline?: string;
  completedDate?: string;
  finalDeliveryLink?: string;
  createdAt: string;
  updatedAt: string;
  submissions?: ProjectSubmission[];
  payments?: Payment[];
  messages?: ProjectMessage[];
  internalNotes?: InternalNote[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string };
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; name: string; role: string };
}

export interface ChatUserConversation {
  id: string;
  name: string;
  email: string;
  role: string;
  clientProfile?: { companyName?: string };
  editorProfile?: { skills?: string };
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

