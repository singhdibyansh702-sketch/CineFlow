import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ShieldCheck, Calendar, User } from 'lucide-react';
import { AuditLogItem } from '../../types';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then((res) => setLogs(res.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
          System Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Immutable trail of administrative operations, project status changes, payments, and assignments.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Reading security audit logs..." />
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground border border-dashed rounded-2xl bg-card">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase bg-secondary text-card-foreground border border-border">
                      {log.action}
                    </span>
                    <span className="font-semibold text-card-foreground">{log.details}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{log.user?.name || 'System'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  ID: {log.id.slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

