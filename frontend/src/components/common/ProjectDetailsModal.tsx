import React, { useState } from 'react';
import { Modal } from './Modal';
import { ProjectStatusBadge } from './Badge';
import { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import {
  ExternalLink,
  MessageSquare,
  FileText,
  DollarSign,
  Send,
  Lock,
  Layers,
  Calendar,
} from 'lucide-react';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectUpdated: () => void;
  onOpenAssign?: (project: Project) => void;
  onOpenReview?: (project: Project) => void;
  onOpenComplete?: (project: Project) => void;
  onOpenPayment?: (project: Project) => void;
  onOpenSubmitWork?: (project: Project) => void;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
  onOpenAssign,
  onOpenReview,
  onOpenComplete,
  onOpenPayment,
  onOpenSubmitWork,
}: ProjectDetailsModalProps) {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'messages' | 'finance' | 'notes'>('details');

  // Messages state
  const [newMessage, setNewMessage] = useState('');
  const [messageAudience, setMessageAudience] = useState<'ADMIN_CLIENT' | 'ADMIN_EDITOR'>('ADMIN_CLIENT');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Notes state (Admin)
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  if (!project) return null;

  const role = user?.role;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMessage(true);

    try {
      await api.post(`/projects/${project.id}/messages`, {
        message: newMessage,
        audience: role === 'ADMIN' ? messageAudience : undefined,
      });
      setNewMessage('');
      onProjectUpdated();
      addToast('Message dispatched', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);

    try {
      await api.post(`/projects/${project.id}/notes`, { content: newNote });
      setNewNote('');
      onProjectUpdated();
      addToast('Internal note saved', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${project.projectCode}: ${project.title}`}
      description={`Video Type: ${project.videoType} • Created on ${new Date(project.createdAt).toLocaleDateString()}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'bg-secondary text-foreground border border-border shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'bg-secondary text-foreground border border-border shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Submissions {project.submissions?.length ? `(${project.submissions.length})` : ''}
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'bg-secondary text-foreground border border-border shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Agency Messages {project.messages?.length ? `(${project.messages.length})` : ''}
          </button>

          {role === 'ADMIN' && (
            <>
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'finance'
                    ? 'bg-secondary text-foreground border border-border shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Financials
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-secondary text-foreground border border-border shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Internal Notes {project.internalNotes?.length ? `(${project.internalNotes.length})` : ''}
              </button>
            </>
          )}
        </div>

        {/* TAB 1: OVERVIEW & DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-secondary/30">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Current Status:</span>
                <ProjectStatusBadge status={project.status} />
              </div>

              {/* Action buttons based on role & status */}
              <div className="flex items-center gap-2">
                {role === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => onOpenAssign && onOpenAssign(project)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold hover:bg-secondary transition-colors"
                    >
                      {project.editorId ? 'Change Editor' : 'Assign Editor'}
                    </button>

                    {project.status === 'SUBMITTED_FOR_REVIEW' && (
                      <button
                        onClick={() => onOpenReview && onOpenReview(project)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        Review Submission
                      </button>
                    )}

                    {project.status !== 'COMPLETED' && (
                      <button
                        onClick={() => onOpenComplete && onOpenComplete(project)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        Mark Completed
                      </button>
                    )}
                  </>
                )}

                {role === 'EDITOR' && (
                  <>
                    {project.status === 'ASSIGNED' && (
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/projects/${project.id}/status`, { status: 'IN_PROGRESS' });
                            onProjectUpdated();
                            addToast('Project marked In Progress', 'success');
                          } catch (err: any) {
                            addToast(err.message, 'error');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                      >
                        Start Editing
                      </button>
                    )}

                    {['IN_PROGRESS', 'REVISION_REQUIRED'].includes(project.status) && (
                      <button
                        onClick={() => onOpenSubmitWork && onOpenSubmitWork(project)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
                      >
                        Submit Video Render
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Final delivery highlight if completed */}
            {project.finalDeliveryLink && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                    Final Approved Delivery Link
                  </span>
                  <a
                    href={project.finalDeliveryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                  >
                    <span>{project.finalDeliveryLink}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {/* Budget & Negotiation Quote Note (Client & Admin visibility) */}
            {(project.clientBudget || project.adminQuoteNote || (role === 'CLIENT' && project.clientPrice)) && role !== 'EDITOR' && (
              <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  {project.clientBudget && (
                    <p>
                      <span className="font-semibold text-card-foreground">Proposed Budget:</span>{' '}
                      <span className="font-bold text-primary">{formatCurrency(project.clientBudget, project.currency)} ({project.currency || 'USD'})</span>
                    </p>
                  )}
                  {project.clientPrice ? (
                    <p>
                      <span className="font-semibold text-card-foreground">Agreed Price Quote:</span>{' '}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(project.clientPrice, project.currency)}</span>
                    </p>
                  ) : null}
                </div>
                {project.adminQuoteNote && (
                  <p className="text-muted-foreground pt-1 border-t border-primary/10">
                    <span className="font-semibold text-card-foreground">Agency Quote / Negotiation Note:</span> "{project.adminQuoteNote}"
                  </p>
                )}
              </div>
            )}

            {/* Description & Requirements */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Project Description
                </span>
                <p className="text-sm text-card-foreground bg-secondary/20 p-3 rounded-xl border border-border leading-relaxed">
                  {project.description}
                </p>
              </div>

              {project.editingRequirements && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Editing Guidelines & Instructions
                  </span>
                  <p className="text-sm text-card-foreground bg-secondary/20 p-3 rounded-xl border border-border leading-relaxed">
                    {project.editingRequirements}
                  </p>
                </div>
              )}
            </div>

            {/* Links & Dates grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                  Raw Assets / Footage
                </span>
                {project.referenceLink ? (
                  <a
                    href={project.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 break-all"
                  >
                    <span>{project.referenceLink}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">None provided</span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                  Spec Document
                </span>
                {project.specDocUrl ? (
                  <a
                    href={project.specDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 break-all"
                  >
                    <span>{project.specDocUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">None provided</span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                  Deadline
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No deadline set'}
                  </span>
                </div>
              </div>

              {/* Stakeholders info strictly respecting role privacy */}
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                  Assignment Status
                </span>
                {role === 'ADMIN' && (
                  <div className="text-xs text-card-foreground">
                    <p><span className="text-muted-foreground">Client:</span> {project.client?.name}</p>
                    <p><span className="text-muted-foreground">Editor:</span> {project.editor ? project.editor.name : 'Unassigned'}</p>
                  </div>
                )}
                {role === 'CLIENT' && (
                  <span className="text-xs text-card-foreground font-medium">
                    Managed by CineFlow Agency Editing Team
                  </span>
                )}
                {role === 'EDITOR' && (
                  <div className="text-xs text-card-foreground">
                    <p><span className="text-muted-foreground">Client Organization:</span> {project.client?.clientProfile?.companyName || project.client?.name}</p>
                    <p><span className="text-muted-foreground">Agreed Payout:</span> {formatCurrency(project.editorPayment, project.currency)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBMISSIONS & REVISIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {role === 'EDITOR' && ['IN_PROGRESS', 'REVISION_REQUIRED'].includes(project.status) && (
              <div className="flex justify-end">
                <button
                  onClick={() => onOpenSubmitWork && onOpenSubmitWork(project)}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
                >
                  Submit New Render
                </button>
              </div>
            )}

            {project.submissions?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No draft submissions uploaded yet.
              </p>
            ) : (
              project.submissions?.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-card-foreground">
                      Draft Version {sub.version}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  <a
                    href={sub.deliveryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 break-all"
                  >
                    <span>{sub.deliveryLink}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>

                  {sub.submissionMessage && (
                    <p className="text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border">
                      <span className="font-semibold block text-card-foreground">Editor Note:</span>
                      {sub.submissionMessage}
                    </p>
                  )}

                  {sub.adminFeedback && (
                    <div className="text-xs p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <span className="font-semibold block">Admin Feedback / Revision Request:</span>
                      {sub.adminFeedback}
                    </div>
                  )}

                  {role === 'ADMIN' && sub.status === 'PENDING_REVIEW' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onOpenReview && onOpenReview(project)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
                      >
                        Review This Draft
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: AGENCY MESSAGES (INTERMEDIATED) */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {role === 'ADMIN' && (
              <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl text-xs font-medium w-fit">
                <button
                  type="button"
                  onClick={() => setMessageAudience('ADMIN_CLIENT')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    messageAudience === 'ADMIN_CLIENT'
                      ? 'bg-card text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Client Discussion
                </button>
                <button
                  type="button"
                  onClick={() => setMessageAudience('ADMIN_EDITOR')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    messageAudience === 'ADMIN_EDITOR'
                      ? 'bg-card text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Editor Discussion
                </button>
              </div>
            )}

            {/* Message thread */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-3 rounded-xl border border-border bg-secondary/20">
              {project.messages
                ?.filter((m) => (role === 'ADMIN' ? m.audience === messageAudience : true))
                .length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No messages yet. Send an update below.
                </p>
              ) : (
                project.messages
                  ?.filter((m) => (role === 'ADMIN' ? m.audience === messageAudience : true))
                  .map((m) => {
                    const isMe = m.senderRole === role;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground">
                          <span className="font-semibold">{m.senderName || m.sender?.name}</span>
                          <span>•</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-xs'
                              : 'bg-card border border-border text-card-foreground rounded-bl-xs'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Send message form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                required
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  role === 'ADMIN'
                    ? `Message ${messageAudience === 'ADMIN_CLIENT' ? 'Client' : 'Editor'}...`
                    : 'Send message to Agency Management...'
                }
                className="flex-1 px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={sendingMessage}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: FINANCIALS (Admin only) */}
        {role === 'ADMIN' && activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Payment Records
              </span>
              <button
                onClick={() => onOpenPayment && onOpenPayment(project)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm"
              >
                + Record Payment
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-card">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Client Total Price ({project.currency || 'USD'})
                </span>
                <span className="text-lg font-bold text-card-foreground">
                  {formatCurrency(project.clientPrice, project.currency)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                  Editor Agreed Payout ({project.currency || 'USD'})
                </span>
                <span className="text-lg font-bold text-card-foreground">
                  {formatCurrency(project.editorPayment, project.currency)}
                </span>
              </div>
            </div>

            {/* Payments List */}
            <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
              {project.payments?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No payment transactions logged for this project yet.
                </p>
              ) : (
                project.payments?.map((pay) => (
                  <div key={pay.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-card-foreground block">
                        {pay.type === 'CLIENT_PAYMENT' ? 'Client Payment' : 'Editor Payout'}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {pay.paymentMethod} • {new Date(pay.paymentDate).toLocaleDateString()}
                        {pay.referenceId ? ` • Ref: ${pay.referenceId}` : ''}
                      </span>
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        pay.type === 'CLIENT_PAYMENT' ? 'text-emerald-500' : 'text-blue-500'
                      }`}
                    >
                      {pay.type === 'CLIENT_PAYMENT' ? '+' : '-'}${pay.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: INTERNAL NOTES (Admin only) */}
        {role === 'ADMIN' && activeTab === 'notes' && (
          <div className="space-y-4">
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add confidential internal note (only visible to admins)..."
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-50"
                >
                  Save Note
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {project.internalNotes?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No internal notes recorded yet.
                </p>
              ) : (
                project.internalNotes?.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl border border-border bg-card text-xs space-y-1">
                    <p className="text-card-foreground leading-relaxed">{note.content}</p>
                    <span className="text-[10px] text-muted-foreground block">
                      By {note.author?.name} • {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
