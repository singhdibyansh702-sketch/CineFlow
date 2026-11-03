import React from 'react';
import { ProjectStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-secondary text-secondary-foreground border-border',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus | string }) {
  switch (status) {
    case 'NEW_REQUEST':
      return <Badge variant="slate">New Request</Badge>;
    case 'PENDING_APPROVAL':
      return <Badge variant="warning">Pending Approval</Badge>;
    case 'ASSIGNED':
      return <Badge variant="purple">Assigned</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="info">In Progress</Badge>;
    case 'SUBMITTED_FOR_REVIEW':
      return <Badge variant="warning">Submitted for Review</Badge>;
    case 'REVISION_REQUIRED':
      return <Badge variant="danger">Revision Required</Badge>;
    case 'APPROVED':
      return <Badge variant="success">Approved</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="slate">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function PaymentStatusBadge({
  status,
}: {
  status: 'Unpaid' | 'Partially Paid' | 'Fully Paid' | string;
}) {
  switch (status) {
    case 'Fully Paid':
      return <Badge variant="success">Fully Paid</Badge>;
    case 'Partially Paid':
      return <Badge variant="warning">Partially Paid</Badge>;
    case 'Unpaid':
      return <Badge variant="danger">Unpaid</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function UserStatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' | string }) {
  return status === 'ACTIVE' ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="slate">Inactive</Badge>
  );
}

