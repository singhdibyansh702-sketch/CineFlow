import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Project } from '../../types';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSubmitted: () => void;
}

export function SubmitWorkModal({
  isOpen,
  onClose,
  project,
  onSubmitted,
}: SubmitWorkModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [deliveryLink, setDeliveryLink] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);

    try {
      await api.post(`/projects/${project.id}/submit-work`, {
        deliveryLink,
        submissionMessage: submissionMessage || undefined,
      });
      addToast('Work submitted for Admin review!', 'success');
      onSubmitted();
      onClose();
      setDeliveryLink('');
      setSubmissionMessage('');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit work', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Work: ${project?.projectCode || ''}`}
      description={project?.title}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Google Drive / Cloud Folder Link *
          </label>
          <input
            type="url"
            required
            value={deliveryLink}
            onChange={(e) => setDeliveryLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/your-rendered-edits..."
            className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Please make sure link sharing is set to "Anyone with the link can view".
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Submission Message / Editor Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={submissionMessage}
            onChange={(e) => setSubmissionMessage(e.target.value)}
            placeholder="Notes regarding music choices, color grading, variations included, etc."
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
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

