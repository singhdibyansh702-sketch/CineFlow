import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { ProjectStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Project } from '../../types';
import {
  Users,
  Film,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Plus,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (view: string) => void;
  onOpenProject: (p: Project) => void;
  onOpenCreateProject: () => void;
}

export function AdminDashboardPage({
  onNavigate,
  onOpenProject,
  onOpenCreateProject,
}: AdminDashboardPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) return <LoadingSpinner text="Loading agency overview..." />;
  if (!data) return null;

  const { metrics, recentProjects, upcomingDeadlines } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Agency Command Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete high-level visibility across projects, talent, clients, and cash flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Primary Project & Team Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={metrics.activeProjects}
          subtext={`${metrics.pendingProjects} pending approval`}
          icon={<FolderKanban className="w-4 h-4" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Completed Projects"
          value={metrics.completedProjects}
          subtext="Total fulfilled"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Total Clients"
          value={metrics.totalClients}
          subtext="Active client accounts"
          icon={<Users className="w-4 h-4" />}
          onClick={() => onNavigate('clients')}
        />
        <StatCard
          label="Total Editors"
          value={metrics.totalEditors}
          subtext="Vetted video talent"
          icon={<Film className="w-4 h-4" />}
          onClick={() => onNavigate('editors')}
        />
      </div>

      {/* Financial Health Overview Cards */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Financial Summary</h2>
            <p className="text-xs text-muted-foreground">
              Automated reconciliation of client collections, editor payouts, and agency profit.
            </p>
          </div>
          <button
            onClick={() => onNavigate('finance')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View Full Breakdown →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground font-semibold uppercase block">
              Client Payments Received
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              ${metrics.totalClientPaymentsReceived.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Outstanding: ${metrics.outstandingClientPayments.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground font-semibold uppercase block">
              Editor Payments Made
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
              ${metrics.totalEditorPaymentsMade.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Agreed Due: ${metrics.outstandingEditorPayments.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Agency Profit
            </span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
              ${metrics.agencyProfit.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Net collected cash margin
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground font-semibold uppercase block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Overdue Work
            </span>
            <span className={`text-xl font-bold mt-1 block ${metrics.overdueProjects > 0 ? 'text-red-500' : 'text-card-foreground'}`}>
              {metrics.overdueProjects}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Projects past target deadline
            </span>
          </div>
        </div>
      </div>

      {/* Tables: Recent Projects & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-card-foreground">Recent Projects</h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-primary hover:underline"
            >
              All Projects ({metrics.totalProjects}) →
            </button>
          </div>

          <div className="divide-y divide-border overflow-hidden">
            {recentProjects.map((p: any) => (
              <div
                key={p.id}
                onClick={() => onOpenProject(p)}
                className="py-3 px-2 rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {p.projectCode}
                    </span>
                    <span className="text-sm font-semibold text-card-foreground truncate">
                      {p.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    Client: {p.client?.name} • Editor: {p.editor?.name || 'Unassigned'}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <ProjectStatusBadge status={p.status} />
                  <span className="text-xs font-bold text-card-foreground hidden sm:block">
                    ${p.clientPrice}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines (1 col) */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-card-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Upcoming Deadlines
            </h2>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No active deadlines upcoming.
              </p>
            ) : (
              upcomingDeadlines.map((p: any) => {
                const deadlineDate = new Date(p.deadline);
                const isUrgent =
                  deadlineDate.getTime() - new Date().getTime() < 48 * 60 * 60 * 1000;

                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p)}
                    className="p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-card-foreground truncate max-w-[170px]">
                        {p.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isUrgent
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {deadlineDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      Editor: {p.editor?.name || 'Unassigned'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

