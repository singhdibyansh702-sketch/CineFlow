import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { User } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<User[]>([]);
  const [editors, setEditors] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    videoType: 'YouTube Video',
    clientId: '',
    editorId: '',
    currency: 'USD' as 'USD' | 'INR',
    clientPrice: 600,
    editorPayment: 250,
    deadline: '',
    referenceLink: '',
    specDocUrl: '',
    description: '',
    editingRequirements: '',
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.get('/admin/clients'), api.get('/admin/editors')])
        .then(([cRes, eRes]) => {
          setClients(cRes.clients || []);
          setEditors(eRes.editors || []);
          if (cRes.clients?.length > 0 && !formData.clientId) {
            setFormData((prev) => ({ ...prev, clientId: cRes.clients[0].id }));
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      addToast('Please select a client', 'error');
      return;
    }
    setLoading(true);

    try {
      await api.post('/projects', {
        ...formData,
        clientPrice: Number(formData.clientPrice),
        editorPayment: Number(formData.editorPayment),
        editorId: formData.editorId || undefined,
        referenceLink: formData.referenceLink || undefined,
        specDocUrl: formData.specDocUrl || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      });
      addToast('Project created successfully!', 'success');
      onProjectCreated();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 5 Tech Gadgets Breakdown"
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Video Type *
            </label>
            <select
              value={formData.videoType}
              onChange={(e) => setFormData({ ...formData, videoType: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="YouTube Explainer">YouTube Explainer</option>
              <option value="Instagram Reels / TikTok">Instagram Reels / TikTok</option>
              <option value="YouTube Documentary">YouTube Documentary</option>
              <option value="Corporate / SaaS Showcase">Corporate / SaaS Showcase</option>
              <option value="Podcast Highlight">Podcast Highlight</option>
              <option value="Vlog / Lifestyle">Vlog / Lifestyle</option>
              <option value="Commercial Ad">Commercial Ad</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Client *
            </label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select a Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.clientProfile?.companyName ? `(${c.clientProfile.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Assign Editor (Optional)
            </label>
            <select
              value={formData.editorId}
              onChange={(e) => setFormData({ ...formData, editorId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Unassigned (Assign Later)</option>
              {editors
                .filter((e) => e.status === 'ACTIVE')
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} (${e.editorProfile?.paymentRate}/video)
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Currency *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'USD' | 'INR' })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="USD">$ USD (Dollars)</option>
              <option value="INR">₹ INR (Rupees)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Client Price ({formData.currency === 'INR' ? '₹' : '$'}) *
            </label>
            <input
              type="number"
              min={0}
              required
              value={formData.clientPrice}
              onChange={(e) => setFormData({ ...formData, clientPrice: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Editor Pay ({formData.currency === 'INR' ? '₹' : '$'}) *
            </label>
            <input
              type="number"
              min={0}
              required
              value={formData.editorPayment}
              onChange={(e) => setFormData({ ...formData, editorPayment: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Expected Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Raw Footage Link (Google Drive / Dropbox)
            </label>
            <input
              type="url"
              value={formData.referenceLink}
              onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Specification Document Link (Optional)
            </label>
            <input
              type="url"
              value={formData.specDocUrl}
              onChange={(e) => setFormData({ ...formData, specDocUrl: e.target.value })}
              placeholder="https://docs.google.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Project Description *
          </label>
          <textarea
            rows={2}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Overview of the video and goals..."
            className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Editing Requirements / Guidelines
          </label>
          <textarea
            rows={2}
            value={formData.editingRequirements}
            onChange={(e) => setFormData({ ...formData, editingRequirements: e.target.value })}
            placeholder="Pacing, caption style, sound effects, B-roll instructions..."
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
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

