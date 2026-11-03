import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProjectStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Project } from '../../types';
import { Search, Plus, Calendar, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface ClientProjectsPageProps {
  onOpenProject: (p: Project) => void;
  onOpenNewRequest: () => void;
}

export function ClientProjectsPage({ onOpenProject, onOpenNewRequest }: ClientProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.videoType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            My Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Track status, expected delivery dates, download links, and chat with agency managers.
          </p>
        </div>

        <button
          onClick={onOpenNewRequest}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="p-3 rounded-2xl border border-border bg-card shadow-sm max-w-md flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title or project code..."
          className="w-full bg-transparent text-xs focus:outline-none text-foreground"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching your projects..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Ready for your next viral video? Submit a request to get started."
          actionText="Submit New Request"
          onAction={onOpenNewRequest}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => onOpenProject(p)}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 hover:border-primary/40 transition-colors cursor-pointer flex flex-col justify-between"
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

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {p.description}
                </p>

                {/* Final download banner if completed */}
                {p.finalDeliveryLink && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Master Delivery Link:
                    </span>
                    <a
                      href={p.finalDeliveryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Download</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Deadline:{' '}
                    {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'Under assessment'}
                  </span>
                </div>

                {p.clientPrice ? (
                  <span className="font-bold text-card-foreground">
                    Quote: {formatCurrency(p.clientPrice, p.currency)}
                  </span>
                ) : p.clientBudget ? (
                  <span className="text-amber-500 font-medium">
                    Budget: {formatCurrency(p.clientBudget, p.currency)} (Reviewing)
                  </span>
                ) : (
                  <span className="text-amber-500 font-medium">Pending Quote</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

