import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { Menu, LogOut, Video } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function Navbar({ onToggleSidebar, onNavigate, currentView }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand logo in navbar for mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
            <Video className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-card-foreground">
            CineFlow
          </span>
        </div>

        {/* Current page title breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{user?.role?.toLowerCase()} Portal</span>
          <span>/</span>
          <span className="font-semibold text-foreground capitalize">
            {currentView.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationDropdown onNavigate={(link) => onNavigate(link.replace('/', ''))} />
        <ThemeToggle />

        {/* User profile info & logout */}
        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-card-foreground leading-tight">
              {user?.name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

