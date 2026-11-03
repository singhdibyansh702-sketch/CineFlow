import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Project, User } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface ApproveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onApproved: () => void;
}

export function ApproveRequestModal({
  isOpen,
  onClose,
  project,
  onApproved,
}: ApproveRequestModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [editors, setEditors] = useState<User[]>([]);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [clientPrice, setClientPrice] = useState(750);
  const [adminQuoteNote, setAdminQuoteNote] = useState('');
  const [editorId, setEditorId] = useState('');
  const [editorPayment, setEditorPayment] = useState(300);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen && project) {
      api.get('/admin/editors').then((res) => {
        const list = (res.editors || []).filter((e: User) => e.status === 'ACTIVE');
        setEditors(list);
      }).catch(console.error);

      const projCurrency = (project.currency === 'INR' ? 'INR' : 'USD') as 'USD' | 'INR';
      setCurrency(projCurrency);

      if (project.clientBudget) {
        setClientPrice(project.clientBudget);
      } else if (project.clientPrice) {
        setClientPrice(project.clientPrice);
      } else {
        setClientPrice(projCurrency === 'INR' ? 15000 : 600);
      }

      if (project.deadline) {
        setDeadline(new Date(project.deadline).toISOString().split('T')[0]);
      }
    }
  }, [isOpen, project]);

  const symbol = getCurrencySymbol(currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);

    try {
      await api.post(`/projects/${project.id}/approve-request`, {
        clientPrice: Number(clientPrice),
        currency,
        adminQuoteNote: adminQuoteNote || undefined,
        editorId: editorId || undefined,
        editorPayment: editorId ? Number(editorPayment) : 0,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      addToast('Project request approved / quoted successfully!', 'success');
      onApproved();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to approve request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review & Quote Request: ${project?.projectCode || ''}`}
      description={project?.title}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Brief & Proposed Budget Info */}
        <div className="p-4 rounded-2xl border border-border bg-secondary/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <p><span className="font-semibold text-card-foreground">Client:</span> {project?.client?.name}</p>
            <span className="font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {project?.videoType}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
            <span className="text-muted-foreground font-medium">Client Proposed Budget:</span>
            <span className="font-bold text-sm text-card-foreground">
              {project?.clientBudget
                ? formatCurrency(project.clientBudget, project.currency)
                : 'Not specified'} ({project?.currency || 'USD'})
            </span>
          </div>

          <p className="text-muted-foreground line-clamp-2">
            <span className="font-semibold text-card-foreground">Instructions:</span> {project?.description}
          </p>
        </div>

        {/* Currency & Price Negotiation */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
          <span className="text-xs font-semibold uppercase text-card-foreground tracking-wider block">
            Pricing & Negotiation
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
                Currency *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    currency === 'USD'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    currency === 'INR'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  ₹ INR
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
                Approved / Quoted Price ({symbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  {symbol}
                </span>
                <input
                  type="number"
                  min={0}
                  required
                  value={clientPrice}
                  onChange={(e) => setClientPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Negotiation / Quote Note for Client (Optional)
            </label>
            <input
              type="text"
              value={adminQuoteNote}
              onChange={(e) => setAdminQuoteNote(e.target.value)}
              placeholder="e.g. Budget accepted / Includes 2 revision passes / Counter-offered due to 4K color grading..."
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Editor Assignment & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Assign Editor (Optional)
            </label>
            <select
              value={editorId}
              onChange={(e) => {
                setEditorId(e.target.value);
                const found = editors.find((ed) => ed.id === e.target.value);
                if (found?.editorProfile?.paymentRate) {
                  setEditorPayment(found.editorProfile.paymentRate);
                }
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Leave Unassigned for Now</option>
              {editors.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name} (${ed.editorProfile?.paymentRate || 0}/video)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Confirmed Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {editorId && (
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Editor Payout ({symbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                {symbol}
              </span>
              <input
                type="number"
                min={0}
                required
                value={editorPayment}
                onChange={(e) => setEditorPayment(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-all"
          >
            {loading ? 'Approving...' : 'Confirm Quote & Approve'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
