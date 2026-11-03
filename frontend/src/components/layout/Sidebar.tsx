import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Film,
  DollarSign,
  ShieldCheck,
  PlusCircle,
  Video,
  X,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const { user } = useAuth();

  let navItems: { id: string; label: string; icon: React.ReactNode }[] = [];

  if (user?.role === 'ADMIN') {
    navItems = [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
      { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
      { id: 'editors', label: 'Editors', icon: <Film className="w-4 h-4" /> },
      { id: 'finance', label: 'Finance & Payments', icon: <DollarSign className="w-4 h-4" /> },
      { id: 'chat', label: 'Agency Chat', icon: <MessageSquare className="w-4 h-4" /> },
      { id: 'audit-logs', label: 'Audit Logs', icon: <ShieldCheck className="w-4 h-4" /> },
    ];
  } else if (user?.role === 'EDITOR') {
    navItems = [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'projects', label: 'My Projects', icon: <FolderKanban className="w-4 h-4" /> },
      { id: 'chat', label: 'Agency Chat', icon: <MessageSquare className="w-4 h-4" /> },
    ];
  } else if (user?.role === 'CLIENT') {
    navItems = [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'projects', label: 'My Projects', icon: <FolderKanban className="w-4 h-4" /> },
      { id: 'new-request', label: 'New Request', icon: <PlusCircle className="w-4 h-4" /> },
      { id: 'chat', label: 'Agency Chat', icon: <MessageSquare className="w-4 h-4" /> },
    ];
  }

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Brand Logo Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm shadow-primary/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-card-foreground">
              CineFlow
            </span>
            <span className="block text-[10px] uppercase font-semibold text-primary tracking-widest leading-none">
              Agency Hub
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill Card */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Logged in as:</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            {user?.role}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-card-foreground truncate">{user?.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-card-foreground hover:bg-secondary/60'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
        <span>CineFlow Agency OS v1.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

