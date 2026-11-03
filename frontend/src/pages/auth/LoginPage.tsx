import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Video, Shield, Film, UserCircle, ArrowRight, Lock, Mail } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm shadow-primary/20">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-foreground">CineFlow</span>
            <span className="block text-[11px] font-semibold text-primary uppercase tracking-widest leading-none">
              Agency Management System
            </span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="p-8 rounded-3xl border border-border bg-card shadow-xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-card-foreground tracking-tight">
              Welcome to CineFlow
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access your agency dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-card-foreground uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-card-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">
              One-Click Demo Accounts
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@videoagency.com', 'AdminPassword123!')}
                className="p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground group-hover:text-primary">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <span className="block text-[11px] text-muted-foreground truncate">
                  Alex Mercer
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('editor1@videoagency.com', 'EditorPass123!')}
                className="p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground group-hover:text-primary">
                  <Film className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </div>
                <span className="block text-[11px] text-muted-foreground truncate">
                  Liam Vance
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('client1@techflow.io', 'ClientPass123!')}
                className="p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground group-hover:text-primary">
                  <UserCircle className="w-3.5 h-3.5" />
                  <span>Client</span>
                </div>
                <span className="block text-[11px] text-muted-foreground truncate">
                  Sarah Jenkins
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground max-w-md mx-auto">
        <p>Protected by session cookies, RBAC authorization, and strict client-editor privacy isolation.</p>
      </footer>
    </div>
  );
}

