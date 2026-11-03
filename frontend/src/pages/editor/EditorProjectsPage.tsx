import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProjectStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Project } from '../../types';
import { Search, ExternalLink, Calendar, Upload, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface EditorProjectsPageProps {
  onOpenProject: (p: Project) => void;
  onOpenSubmitWork: (p: Project) => void;
}

export function EditorProjectsPage({ onOpenProject, onOpenSubmitWork }: EditorProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = projects.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.projectCode.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          My Editing Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Access raw footage, video instructions, submit your cut versions, and view admin approvals.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assigned projects..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="ALL">All Projects</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="SUBMITTED_FOR_REVIEW">Submitted</option>
          <option value="REVISION_REQUIRED">Revision Required</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching assigned projects..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No projects match this filter"
          description="You will see projects here as soon as management assigns them to you."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const isRevision = p.status === 'REVISION_REQUIRED';

            return (
              <div
                key={p.id}
                onClick={() => onOpenProject(p)}
                className={`p-5 rounded-2xl border bg-card shadow-sm space-y-4 hover:border-primary/40 transition-colors cursor-pointer flex flex-col justify-between ${
                  isRevision ? 'border-red-500/30' : 'border-border'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        {p.projectCode}
                      </span>
                      <h3 className="font-bold text-sm text-card-foreground line-clamp-1">
                        {p.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">{p.videoType}</span>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>

                  {isRevision && (
                    <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Revision required! Review feedback and re-submit your render.</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    {p.referenceLink && (
                      <a
                        href={p.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-lg border border-border bg-secondary/50 text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <span>Raw Footage</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {p.specDocUrl && (
                      <a
                        href={p.specDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-lg border border-border bg-secondary/50 text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <span>Spec Sheet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'Flexible'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-card-foreground mr-1">
                      {formatCurrency(p.editorPayment, p.currency)}
                    </span>

                    {['IN_PROGRESS', 'REVISION_REQUIRED'].includes(p.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSubmitWork(p);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Cut</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

