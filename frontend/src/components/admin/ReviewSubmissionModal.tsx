import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Project, ProjectSubmission } from '../../types';
import { ExternalLink, CheckCircle, RotateCcw } from 'lucide-react';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  submission: ProjectSubmission | null;
  onReviewed: () => void;
}

export function ReviewSubmissionModal({
  isOpen,
  onClose,
  project,
  submission,
  onReviewed,
}: ReviewSubmissionModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'APPROVE' | 'REQUEST_REVISION'>('APPROVE');
  const [feedback, setFeedback] = useState('Work looks great! Approved for final delivery.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !submission) return;
    setLoading(true);

    try {
      await api.post(`/projects/${project.id}/review-submission`, {
        submissionId: submission.id,
        action,
        feedback,
      });
      addToast(
        action === 'APPROVE' ? 'Work submission approved!' : 'Revision requested from editor!',
        'success'
      );
      onReviewed();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Submission v${submission?.version || 1}: ${project?.projectCode || ''}`}
      description={project?.title}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Link preview card */}
        <div className="p-4 rounded-xl border border-border bg-secondary/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Submitted Delivery Link
          </span>
          <a
            href={submission?.deliveryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 break-all"
          >
            <span>{submission?.deliveryLink}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>

          {submission?.submissionMessage && (
            <div className="mt-2 text-xs text-card-foreground bg-card p-2.5 rounded-lg border border-border">
              <span className="font-semibold block text-muted-foreground mb-0.5">Editor Message:</span>
              "{submission.submissionMessage}"
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1.5">
            Decision *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAction('APPROVE');
                setFeedback('Work looks great! Approved for final delivery.');
              }}
              className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                action === 'APPROVE'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Approve Work
            </button>

            <button
              type="button"
              onClick={() => {
                setAction('REQUEST_REVISION');
                setFeedback('Please adjust the following: ');
              }}
              className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                action === 'REQUEST_REVISION'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Request Revision
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            {action === 'APPROVE' ? 'Approval Message / Feedback' : 'Revision Instructions for Editor *'}
          </label>
          <textarea
            rows={3}
            required
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              action === 'APPROVE'
                ? 'Great pacing and sound design!'
                : 'Specific timecodes and changes needed...'
            }
            className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 ${
              action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading ? 'Submitting...' : action === 'APPROVE' ? 'Confirm Approval' : 'Send Revision Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

