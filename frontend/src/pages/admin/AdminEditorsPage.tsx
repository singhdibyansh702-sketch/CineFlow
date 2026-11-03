import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useNotifications } from '../../context/NotificationContext';
import { Plus, Search, Mail, Phone, ExternalLink, Power, ShieldCheck } from 'lucide-react';

interface AdminEditorsPageProps {
  onOpenCreateEditor: () => void;
}

export function AdminEditorsPage({ onOpenCreateEditor }: AdminEditorsPageProps) {
  const { addToast } = useNotifications();
  const [editors, setEditors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEditors = async () => {
    try {
      const res = await api.get('/admin/editors');
      setEditors(res.editors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditors();
  }, []);

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);

    const newStatus = confirmTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/editors/${confirmTarget.id}`, { status: newStatus });
      addToast(
        `Editor ${confirmTarget.name} ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`,
        'success'
      );
      setConfirmTarget(null);
      fetchEditors();
    } catch (err: any) {
      addToast(err.message || 'Failed to update editor status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = editors.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.skills && e.skills.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Editor Talent Roster
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage video editors, pay rates, skills, assigned projects, and payouts.
          </p>
        </div>

        <button
          onClick={onOpenCreateEditor}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Editor</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="p-3 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, software, or skills..."
            className="w-full bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-xl border border-border">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Strict privacy: Editors never see client direct contacts or other editors</span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading editor roster..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground border border-dashed rounded-2xl bg-card">
          No editors found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-card-foreground">{e.name}</h3>
                  <span className="text-xs font-semibold text-primary block mt-0.5">
                    ${e.paymentRate}/video base
                  </span>
                </div>
                <UserStatusBadge status={e.status} />
              </div>

              {/* Skills */}
              {e.skills && (
                <div className="flex flex-wrap gap-1">
                  {e.skills.split(',').map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-secondary text-[11px] text-muted-foreground font-medium"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Contacts */}
              <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border py-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{e.email}</span>
                </div>
                {e.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{e.phone}</span>
                  </div>
                )}
                {e.portfolioLink && (
                  <a
                    href={e.portfolioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                  >
                    <span>View Portfolio Reel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase block">Assigned</span>
                  <span className="font-bold text-card-foreground">{e.stats?.activeProjects || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase block">Done</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {e.stats?.completedProjects || 0}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase block">Earned</span>
                  <span className="font-bold text-card-foreground">
                    ${e.stats?.totalPaid || 0}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Due: ${e.stats?.outstanding || 0}
                </span>
                <button
                  onClick={() => setConfirmTarget(e)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                    e.status === 'ACTIVE'
                      ? 'border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30'
                      : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {e.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleToggleStatus}
        loading={actionLoading}
        title={confirmTarget?.status === 'ACTIVE' ? 'Deactivate Editor Account?' : 'Activate Editor Account?'}
        message={`Are you sure you want to ${
          confirmTarget?.status === 'ACTIVE' ? 'deactivate' : 'reactivate'
        } ${confirmTarget?.name}? ${
          confirmTarget?.status === 'ACTIVE'
            ? 'The editor will be removed from future project assignments and cannot log in.'
            : 'The editor will regain access to submit work on assigned projects.'
        }`}
        variant={confirmTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
      />
    </div>
  );
}

