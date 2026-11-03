import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Project, User } from '../../types';
import { getCurrencySymbol } from '../../utils/currency';

interface AssignEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onAssigned: () => void;
}

export function AssignEditorModal({ isOpen, onClose, project, onAssigned }: AssignEditorModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [editors, setEditors] = useState<User[]>([]);
  const [selectedEditorId, setSelectedEditorId] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [editorPayment, setEditorPayment] = useState(250);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen && project) {
      const projCurrency = (project.currency === 'INR' ? 'INR' : 'USD') as 'USD' | 'INR';
      setCurrency(projCurrency);

      api.get('/admin/editors')
        .then((res) => {
          const list = (res.editors || []).filter((e: User) => e.status === 'ACTIVE');
          setEditors(list);
          if (project.editorId) {
            setSelectedEditorId(project.editorId);
          } else if (list.length > 0) {
            setSelectedEditorId(list[0].id);
          }
          const defaultRate = projCurrency === 'INR' ? 8000 : 250;
          setEditorPayment(project.editorPayment || (list[0]?.editorProfile?.paymentRate || defaultRate));
          if (project.deadline) {
            setDeadline(new Date(project.deadline).toISOString().split('T')[0]);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, project]);

  const symbol = getCurrencySymbol(currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedEditorId) return;
    setLoading(true);

    try {
      await api.post(`/projects/${project.id}/assign`, {
        editorId: selectedEditorId,
        editorPayment: Number(editorPayment),
        currency,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      addToast(`Editor assigned successfully (${symbol}${editorPayment})!`, 'success');
      onAssigned();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to assign editor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Editor: ${project?.projectCode || ''}`}
      description={project?.title}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Select Active Editor *
          </label>
          <select
            required
            value={selectedEditorId}
            onChange={(e) => {
              setSelectedEditorId(e.target.value);
              const found = editors.find((ed) => ed.id === e.target.value);
              if (found?.editorProfile?.paymentRate) {
                setEditorPayment(found.editorProfile.paymentRate);
              }
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {editors.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.name} — {ed.editorProfile?.skills?.substring(0, 30) || 'General'} (Base: {symbol}{ed.editorProfile?.paymentRate || 0}/video)
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selector (USD vs INR) */}
        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Payout Currency *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (currency !== 'USD') {
                  setCurrency('USD');
                  if (editorPayment > 1000) setEditorPayment(Math.round(editorPayment / 80));
                }
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                currency === 'USD'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              $ USD (Dollars)
            </button>
            <button
              type="button"
              onClick={() => {
                if (currency !== 'INR') {
                  setCurrency('INR');
                  if (editorPayment < 1000) setEditorPayment(Math.round(editorPayment * 80));
                }
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                currency === 'INR'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              ₹ INR (Rupees)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Agreed Payout ({symbol}) *
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
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Project Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground">
          <p className="font-semibold text-card-foreground mb-1">Privacy Guarantee:</p>
          The assigned editor will receive the editing requirements and video links, but will NEVER see client contact details, client prices, or agency margins.
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
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

