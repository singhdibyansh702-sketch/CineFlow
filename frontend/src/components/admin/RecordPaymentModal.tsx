import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Project } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onPaymentRecorded: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  project,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const currency = project?.currency || 'USD';
  const symbol = getCurrencySymbol(currency);

  const [formData, setFormData] = useState({
    type: 'CLIENT_PAYMENT' as 'CLIENT_PAYMENT' | 'EDITOR_PAYMENT',
    amount: currency === 'INR' ? 10000 : 250,
    paymentMethod: currency === 'INR' ? 'UPI' : 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceId: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setLoading(true);

    try {
      await api.post('/payments', {
        projectId: project.id,
        type: formData.type,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: new Date(formData.paymentDate).toISOString(),
        referenceId: formData.referenceId || undefined,
        notes: formData.notes || undefined,
      });
      addToast(
        `${formData.type === 'CLIENT_PAYMENT' ? 'Client Payment' : 'Editor Payout'} of ${formatCurrency(formData.amount, currency)} recorded!`,
        'success'
      );
      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment: ${project?.projectCode || ''}`}
      description={`${project?.title || ''} • Currency: ${currency} (${symbol})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Payment Category *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'CLIENT_PAYMENT' })}
              className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                formData.type === 'CLIENT_PAYMENT'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              Client Payment (Inflow)
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'EDITOR_PAYMENT' })}
              className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                formData.type === 'EDITOR_PAYMENT'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary'
              }`}
            >
              Editor Payout (Outflow)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Amount ({symbol} {currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                {symbol}
              </span>
              <input
                type="number"
                min={1}
                step="any"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Payment Method *
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {currency === 'INR' ? (
                <>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">NEFT / RTGS / IMPS</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cash">Cash / Other</option>
                </>
              ) : (
                <>
                  <option value="Bank Transfer">Bank Wire / ACH</option>
                  <option value="Stripe">Stripe / Credit Card</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Wise">Wise</option>
                  <option value="Cash">Cash / Other</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              value={formData.referenceId}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
              placeholder="e.g. TX-9821734"
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
            Transaction Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. 50% milestone payment, final delivery release payout..."
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
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

