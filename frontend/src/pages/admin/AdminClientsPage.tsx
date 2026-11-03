import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useNotifications } from '../../context/NotificationContext';
import { User } from '../../types';
import { Plus, Search, Building2, Phone, Mail, Power } from 'lucide-react';

interface AdminClientsPageProps {
  onOpenCreateClient: () => void;
  onSelectClient?: (client: User) => void;
}

export function AdminClientsPage({ onOpenCreateClient }: AdminClientsPageProps) {
  const { addToast } = useNotifications();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Deactivate dialog
  const [confirmTarget, setConfirmTarget] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients');
      setClients(res.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleToggleStatus = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);

    const newStatus = confirmTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/clients/${confirmTarget.id}`, { status: newStatus });
      addToast(
        `Client ${confirmTarget.name} ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`,
        'success'
      );
      setConfirmTarget(null);
      fetchClients();
    } catch (err: any) {
      addToast(err.message || 'Failed to update client status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Client Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage client profiles, contact preferences, company info, and project accounts.
          </p>
        </div>

        <button
          onClick={onOpenCreateClient}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      <div className="p-3 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-3 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or company..."
          className="w-full bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading clients..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground border border-dashed rounded-2xl bg-card">
          No clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-card-foreground">{c.name}</h3>
                  {c.companyName && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="w-3 h-3" />
                      <span>{c.companyName}</span>
                    </div>
                  )}
                </div>
                <UserStatusBadge status={c.status} />
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border py-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{c.email}</span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase block">Projects</span>
                  <span className="font-bold text-card-foreground">{c.stats?.totalProjects || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase block">Paid</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${c.stats?.totalPaid || 0}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase block">Due</span>
                  <span className="font-bold text-card-foreground">
                    ${c.stats?.outstanding || 0}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Joined {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setConfirmTarget(c)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                    c.status === 'ACTIVE'
                      ? 'border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30'
                      : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
        title={confirmTarget?.status === 'ACTIVE' ? 'Deactivate Client Account?' : 'Activate Client Account?'}
        message={`Are you sure you want to ${
          confirmTarget?.status === 'ACTIVE' ? 'deactivate' : 'reactivate'
        } ${confirmTarget?.name}? ${
          confirmTarget?.status === 'ACTIVE'
            ? 'The client will be prevented from logging in or submitting new requests.'
            : 'The client will regain portal access.'
        }`}
        variant={confirmTarget?.status === 'ACTIVE' ? 'danger' : 'primary'}
      />
    </div>
  );
}

