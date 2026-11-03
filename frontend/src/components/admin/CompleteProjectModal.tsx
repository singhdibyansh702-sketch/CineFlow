import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Project } from '../../types';

interface CompleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onCompleted: () => void;
}

export function CompleteProjectModal({
  isOpen,
  onClose,
  project,
  onCompleted,
}: CompleteProjectModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [finalDeliveryLink, setFinalDeliveryLink] = useState(
    project?.finalDeliveryLink || project?.submissions?.[0]?.deliveryLink || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);

    try {
      await api.post(`/projects/${project.id}/complete`, {
        finalDeliveryLink,
      });
      addToast('Project completed and delivery link dispatched to client!', 'success');
      onCompleted();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to complete project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mark Completed: ${project?.projectCode || ''}`}
      description={project?.title}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Client Final Delivery Link *
          </label>
          <input
            type="url"
            required
            value={finalDeliveryLink}
            onChange={(e) => setFinalDeliveryLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/final-client-delivery..."
            className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This link will immediately become visible on the Client Portal for final download.
          </p>
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
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Finalizing...' : 'Complete & Deliver to Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

