import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProjectStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Project } from '../../types';
import { Search, Plus, Filter, Calendar, User, Film, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface AdminProjectsPageProps {
  onOpenProject: (p: Project) => void;
  onOpenCreateProject: () => void;
  onOpenAssign: (p: Project) => void;
  onOpenApprove: (p: Project) => void;
  onOpenReview: (p: Project) => void;
  onOpenComplete: (p: Project) => void;
  onOpenPayment: (p: Project) => void;
}

export function AdminProjectsPage({
  onOpenProject,
  onOpenCreateProject,
  onOpenAssign,
  onOpenApprove,
  onOpenReview,
  onOpenComplete,
  onOpenPayment,
}: AdminProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchTerm || undefined,
        },
      });
      setProjects(res.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Projects Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, assign, track milestones, and approve video editing workflows.
          </p>
        </div>

        <button
          onClick={onOpenCreateProject}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, title, or client..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW_REQUEST">New Request</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED_FOR_REVIEW">Submitted for Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Table / List */}
      {loading ? (
        <LoadingSpinner text="Fetching projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects match your criteria"
          description="Try adjusting your filter or create a new video editing project."
          actionText="Create Project"
          onAction={onOpenCreateProject}
        />
      ) : (
        <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Editor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Financials</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                    onClick={() => onOpenProject(p)}
                  >
                    {/* Project info */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-muted-foreground text-[10px]">
                          {p.projectCode}
                        </span>
                        <span className="font-semibold text-card-foreground text-sm group-hover:text-primary transition-colors">
                          {p.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{p.videoType}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-card-foreground">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate max-w-[120px]">{p.client?.name}</span>
                      </div>
                      {p.client?.clientProfile?.companyName && (
                        <span className="text-[10px] text-muted-foreground block">
                          {p.client.clientProfile.companyName}
                        </span>
                      )}
                    </td>

                    {/* Editor */}
                    <td className="py-3.5 px-4">
                      {p.editor ? (
                        <div className="flex items-center gap-1.5 text-card-foreground">
                          <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">{p.editor.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <ProjectStatusBadge status={p.status} />
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4 text-card-foreground whitespace-nowrap">
                      {p.deadline ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>{new Date(p.deadline).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Financials */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[11px]">
                        <span className="font-bold text-card-foreground">
                          {p.clientPrice ? formatCurrency(p.clientPrice, p.currency) : (
                            <span className="text-amber-500">
                              Budget: {formatCurrency(p.clientBudget, p.currency)}
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground block text-[10px]">
                          Payout: {formatCurrency(p.editorPayment, p.currency)}
                        </span>
                      </div>
                    </td>

                    {/* Quick action buttons */}
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => onOpenApprove(p)}
                            className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 shadow-sm"
                          >
                            Approve
                          </button>
                        )}

                        {p.status === 'SUBMITTED_FOR_REVIEW' && (
                          <button
                            onClick={() => onOpenReview(p)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 shadow-sm"
                          >
                            Review
                          </button>
                        )}

                        {!p.editorId && (
                          <button
                            onClick={() => onOpenAssign(p)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card text-[11px] font-semibold hover:bg-secondary"
                          >
                            Assign
                          </button>
                        )}

                        <button
                          onClick={() => onOpenProject(p)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                          title="View Details"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

