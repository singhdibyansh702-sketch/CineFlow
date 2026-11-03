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
  AlertCircle,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Film,
} from 'lucide-react';

interface EditorDashboardPageProps {
  onNavigate: (view: string) => void;
  onOpenProject: (p: Project) => void;
  onOpenSubmitWork: (p: Project) => void;
}

export function EditorDashboardPage({
  onNavigate,
  onOpenProject,
  onOpenSubmitWork,
}: EditorDashboardPageProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/editor/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading editor workspace..." />;
  if (!data) return null;

  const { metrics, projects } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          Editor Workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your editing pipeline, submit completed renders, and manage revision feedback.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned to Edit"
          value={metrics.assignedProjects}
          subtext="Ready to start"
          icon={<Film className="w-4 h-4" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="In Progress / Revisions"
          value={metrics.inProgressProjects}
          subtext="Currently editing"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Under Review"
          value={metrics.submittedProjects}
          subtext="Awaiting admin sign-off"
          icon={<FolderKanban className="w-4 h-4 text-amber-500" />}
          onClick={() => onNavigate('projects')}
        />
        <StatCard
          label="Total Payouts Earned"
          value={`$${metrics.totalEarnedAndPaid}`}
          subtext={`$${metrics.pendingPayouts} currently queued`}
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Assigned Projects Pipeline */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Active Editing Tasks</h2>
            <p className="text-xs text-muted-foreground">
              Projects assigned specifically to your editing queue.
            </p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All ({projects.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            You currently have no active project assignments. Check back soon!
          </p>
        ) : (
          <div className="divide-y divide-border">
            {projects.slice(0, 5).map((p: Project) => {
              const isRevision = p.status === 'REVISION_REQUIRED';

              return (
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
                        Client: {p.client?.name} • Payout: ${p.editorPayment}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <ProjectStatusBadge status={p.status} />
                      {p.deadline && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Due {new Date(p.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Revision callout if applicable */}
                  {isRevision && (
                    <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Admin has requested revisions. Open project to see timecoded instructions.</span>
                    </div>
                  )}

                  {/* Raw footage link */}
                  {p.referenceLink && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Footage:</span>
                      <a
                        href={p.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline flex items-center gap-1 font-medium truncate max-w-sm"
                      >
                        <span>{p.referenceLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

