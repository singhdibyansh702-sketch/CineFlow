import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { ProjectStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Project } from '../../types';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ClientDashboardPageProps {
  onNavigate: (view: string) => void;
  onOpenProject: (p: Project) => void;
  onOpenNewRequest: () => void;
}

export function ClientDashboardPage({
  onNavigate,
  onOpenProject,
  onOpenNewRequest,
}: ClientDashboardPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your agency client portal..." />;
  if (!data) return null;

  const { metrics, recentProjects } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Professional Video Production
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Client Production Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Order new video edits, track production timelines, review cuts, and download final high-resolution masters.
          </p>
        </div>

        <button
          onClick={onOpenNewRequest}
          className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-md shadow-primary/20 flex items-center gap-2 shrink-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New Request</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Projects"
          value={metrics.activeProjects}
          subtext="In production right now"
          icon={<FolderKanban className="w-4 h-4 text-primary" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Pending Quotes"
          value={metrics.pendingRequests}
          subtext="Under agency review"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Delivered & Completed"
          value={metrics.completedProjects}
          subtext="Ready for download"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          onClick={() => onNavigate('projects')}
        />
      </div>

      {/* Recent Projects Stream */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Your Projects</h2>
            <p className="text-xs text-muted-foreground">
              Real-time progress updates from our production team.
            </p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All ({metrics.totalProjects})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No active project orders. Click above to submit your first video editing request!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentProjects.map((p: Project) => (
              <div
                key={p.id}
                onClick={() => onOpenProject(p)}
                className="py-4 hover:bg-secondary/30 px-3 rounded-xl transition-colors cursor-pointer space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {p.projectCode}
                      </span>
                      <span className="text-sm font-semibold text-card-foreground">
                        {p.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Type: {p.videoType} • Ordered {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <ProjectStatusBadge status={p.status} />
                    {p.finalDeliveryLink && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        Ready to Download
                      </span>
                    )}
                  </div>
                </div>

                {/* Final download quick link */}
                {p.finalDeliveryLink && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      Final Delivery Link Ready:
                    </span>
                    <a
                      href={p.finalDeliveryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Download Assets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

