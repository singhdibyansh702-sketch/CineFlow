import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    positive?: boolean;
    text: string;
  };
  onClick?: () => void;
}

export function StatCard({ label, value, subtext, icon, trend, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <div className="p-2 rounded-xl bg-secondary text-primary">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-card-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.positive ? 'text-emerald-500' : 'text-muted-foreground'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}

