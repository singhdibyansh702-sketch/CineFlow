import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminEditorsPage } from './pages/admin/AdminEditorsPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Editor Pages
import { EditorDashboardPage } from './pages/editor/EditorDashboardPage';
import { EditorProjectsPage } from './pages/editor/EditorProjectsPage';

// Client Pages
import { ClientDashboardPage } from './pages/client/ClientDashboardPage';
import { ClientProjectsPage } from './pages/client/ClientProjectsPage';
import { ClientNewRequestPage } from './pages/client/ClientNewRequestPage';

// Chat Page
import { ChatPage } from './pages/chat/ChatPage';

// Common & Admin Modals
import { ProjectDetailsModal } from './components/common/ProjectDetailsModal';
import { CreateClientModal } from './components/admin/CreateClientModal';
import { CreateEditorModal } from './components/admin/CreateEditorModal';
import { CreateProjectModal } from './components/admin/CreateProjectModal';
import { AssignEditorModal } from './components/admin/AssignEditorModal';
import { ApproveRequestModal } from './components/admin/ApproveRequestModal';
import { ReviewSubmissionModal } from './components/admin/ReviewSubmissionModal';
import { CompleteProjectModal } from './components/admin/CompleteProjectModal';
import { RecordPaymentModal } from './components/admin/RecordPaymentModal';
import { SubmitWorkModal } from './components/editor/SubmitWorkModal';
import { Project, ProjectSubmission } from './types';

export function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('overview');

  // Shared modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Admin modals
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isCreateEditorOpen, setIsCreateEditorOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAssignEditorOpen, setIsAssignEditorOpen] = useState(false);
  const [isApproveRequestOpen, setIsApproveRequestOpen] = useState(false);
  const [isReviewSubmissionOpen, setIsReviewSubmissionOpen] = useState(false);
  const [reviewSubmissionTarget, setReviewSubmissionTarget] = useState<ProjectSubmission | null>(null);
  const [isCompleteProjectOpen, setIsCompleteProjectOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Editor modal
  const [isSubmitWorkOpen, setIsSubmitWorkOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Initializing CineFlow Agency OS..." />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Handlers
  const handleOpenProjectDetails = (p: Project) => {
    setSelectedProject(p);
    setIsDetailsOpen(true);
  };

  const handleOpenAssign = (p: Project) => {
    setSelectedProject(p);
    setIsAssignEditorOpen(true);
  };

  const handleOpenApprove = (p: Project) => {
    setSelectedProject(p);
    setIsApproveRequestOpen(true);
  };

  const handleOpenReview = (p: Project) => {
    setSelectedProject(p);
    const pendingSub = p.submissions?.find((s) => s.status === 'PENDING_REVIEW') || p.submissions?.[0] || null;
    setReviewSubmissionTarget(pendingSub);
    setIsReviewSubmissionOpen(true);
  };

  const handleOpenComplete = (p: Project) => {
    setSelectedProject(p);
    setIsCompleteProjectOpen(true);
  };

  const handleOpenPayment = (p?: Project) => {
    setSelectedProject(p || selectedProject);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenSubmitWork = (p: Project) => {
    setSelectedProject(p);
    setIsSubmitWorkOpen(true);
  };

  const handleProjectUpdated = () => {
    // Closes details modal to let parent views re-fetch freshly
    setIsDetailsOpen(false);
  };

  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {/* ADMIN PORTAL */}
      {user.role === 'ADMIN' && (
        <>
          {currentView === 'overview' && (
            <AdminDashboardPage
              onNavigate={setCurrentView}
              onOpenProject={handleOpenProjectDetails}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            />
          )}
          {currentView === 'projects' && (
            <AdminProjectsPage
              onOpenProject={handleOpenProjectDetails}
              onOpenCreateProject={() => setIsCreateProjectOpen(true)}
              onOpenAssign={handleOpenAssign}
              onOpenApprove={handleOpenApprove}
              onOpenReview={handleOpenReview}
              onOpenComplete={handleOpenComplete}
              onOpenPayment={handleOpenPayment}
            />
          )}
          {currentView === 'clients' && (
            <AdminClientsPage
              onOpenCreateClient={() => setIsCreateClientOpen(true)}
            />
          )}
          {currentView === 'editors' && (
            <AdminEditorsPage
              onOpenCreateEditor={() => setIsCreateEditorOpen(true)}
            />
          )}
          {currentView === 'finance' && (
            <AdminFinancePage
              onOpenRecordPayment={handleOpenPayment}
              onOpenProject={handleOpenProjectDetails}
            />
          )}
          {currentView === 'chat' && <ChatPage />}
          {currentView === 'audit-logs' && <AdminAuditLogsPage />}
        </>
      )}

      {/* EDITOR PORTAL */}
      {user.role === 'EDITOR' && (
        <>
          {currentView === 'overview' && (
            <EditorDashboardPage
              onNavigate={setCurrentView}
              onOpenProject={handleOpenProjectDetails}
              onOpenSubmitWork={handleOpenSubmitWork}
            />
          )}
          {currentView === 'projects' && (
            <EditorProjectsPage
              onOpenProject={handleOpenProjectDetails}
              onOpenSubmitWork={handleOpenSubmitWork}
            />
          )}
          {currentView === 'chat' && <ChatPage />}
        </>
      )}

      {/* CLIENT PORTAL */}
      {user.role === 'CLIENT' && (
        <>
          {currentView === 'overview' && (
            <ClientDashboardPage
              onNavigate={setCurrentView}
              onOpenProject={handleOpenProjectDetails}
              onOpenNewRequest={() => setCurrentView('new-request')}
            />
          )}
          {currentView === 'projects' && (
            <ClientProjectsPage
              onOpenProject={handleOpenProjectDetails}
              onOpenNewRequest={() => setCurrentView('new-request')}
            />
          )}
          {currentView === 'chat' && <ChatPage />}
          {currentView === 'new-request' && (
            <ClientNewRequestPage
              onBack={() => setCurrentView('projects')}
              onSuccess={() => setCurrentView('projects')}
            />
          )}
        </>
      )}

      {/* MODALS */}
      <ProjectDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        project={selectedProject}
        onProjectUpdated={handleProjectUpdated}
        onOpenAssign={handleOpenAssign}
        onOpenReview={handleOpenReview}
        onOpenComplete={handleOpenComplete}
        onOpenPayment={handleOpenPayment}
        onOpenSubmitWork={handleOpenSubmitWork}
      />

      <CreateClientModal
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        onClientCreated={() => {}}
      />

      <CreateEditorModal
        isOpen={isCreateEditorOpen}
        onClose={() => setIsCreateEditorOpen(false)}
        onEditorCreated={() => {}}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={() => {}}
      />

      <AssignEditorModal
        isOpen={isAssignEditorOpen}
        onClose={() => setIsAssignEditorOpen(false)}
        project={selectedProject}
        onAssigned={() => {}}
      />

      <ApproveRequestModal
        isOpen={isApproveRequestOpen}
        onClose={() => setIsApproveRequestOpen(false)}
        project={selectedProject}
        onApproved={() => {}}
      />

      <ReviewSubmissionModal
        isOpen={isReviewSubmissionOpen}
        onClose={() => setIsReviewSubmissionOpen(false)}
        project={selectedProject}
        submission={reviewSubmissionTarget}
        onReviewed={() => {}}
      />

      <CompleteProjectModal
        isOpen={isCompleteProjectOpen}
        onClose={() => setIsCompleteProjectOpen(false)}
        project={selectedProject}
        onCompleted={() => {}}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        project={selectedProject}
        onPaymentRecorded={() => {}}
      />

      <SubmitWorkModal
        isOpen={isSubmitWorkOpen}
        onClose={() => setIsSubmitWorkOpen(false)}
        project={selectedProject}
        onSubmitted={() => {}}
      />
    </AppLayout>
  );
}
export default App;

