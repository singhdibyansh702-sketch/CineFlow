import React, { useState } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { PlusCircle, ArrowLeft, Send, DollarSign } from 'lucide-react';
import { getCurrencySymbol } from '../../utils/currency';

interface ClientNewRequestPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ClientNewRequestPage({ onBack, onSuccess }: ClientNewRequestPageProps) {
  const { addToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    videoType: 'YouTube Explainer',
    currency: 'USD' as 'USD' | 'INR',
    budget: 500,
    referenceLink: '',
    specDocUrl: '',
    deadline: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/client/requests', {
        ...formData,
        budget: Number(formData.budget),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        specDocUrl: formData.specDocUrl || undefined,
      });
      addToast(
        'Your editing request has been received! Our agency team will review and confirm your quote shortly.',
        'success'
      );
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentSymbol = getCurrencySymbol(formData.currency);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Submit New Video Request
          </h1>
          <p className="text-sm text-muted-foreground">
            Specify your project details, preferred currency, and estimated budget. Admin will review or negotiate.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Weekly SaaS Feature Release Walkthrough"
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
                Video Category *
              </label>
              <select
                value={formData.videoType}
                onChange={(e) => setFormData({ ...formData, videoType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="YouTube Explainer">YouTube Explainer</option>
                <option value="Instagram Reels / TikTok">Instagram Reels / TikTok</option>
                <option value="YouTube Documentary">YouTube Documentary</option>
                <option value="Corporate / SaaS Showcase">Corporate / SaaS Showcase</option>
                <option value="Podcast Clip">Podcast Clip</option>
                <option value="Vlog / Lifestyle">Vlog / Lifestyle</option>
                <option value="Commercial Ad">Commercial Ad</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
                Desired Delivery Date
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* CURRENCY & BUDGET SELECTION */}
          <div className="p-4 rounded-2xl border border-border bg-secondary/30 space-y-3">
            <span className="text-xs font-semibold text-card-foreground uppercase tracking-wider block">
              Budget & Currency Preference
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Currency *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'USD', budget: 500 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formData.currency === 'USD'
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>$ US Dollar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'INR', budget: 15000 })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      formData.currency === 'INR'
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>₹ Indian Rupee</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Proposed Project Budget ({currentSymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    {currentSymbol}
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Admin will review your proposed budget. If adjustments are necessary, agency management will provide a quote note or negotiate with you.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Raw Footage / Google Drive Link *
            </label>
            <input
              type="url"
              required
              value={formData.referenceLink}
              onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Ensure Google Drive sharing permissions are enabled for view/download.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Specification Document / Script Link (Optional)
            </label>
            <input
              type="url"
              value={formData.specDocUrl}
              onChange={(e) => setFormData({ ...formData, specDocUrl: e.target.value })}
              placeholder="https://docs.google.com/document/d/..."
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-card-foreground mb-1">
              Editing Instructions & Creative Brief * <span className="text-[10px] text-muted-foreground font-normal">(Min 10 characters)</span>
            </label>
            <textarea
              rows={4}
              required
              minLength={10}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail your desired video style, pacing, callouts, B-roll preferences, and any specific branding requirements..."
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
