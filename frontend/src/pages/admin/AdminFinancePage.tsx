import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { PaymentStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight, Plus, Receipt } from 'lucide-react';
import { Project } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface AdminFinancePageProps {
  onOpenRecordPayment: (p?: Project) => void;
  onOpenProject: (p: any) => void;
}

export function AdminFinancePage({ onOpenRecordPayment, onOpenProject }: AdminFinancePageProps) {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinance = async () => {
    try {
      const res = await api.get('/payments/overview');
      setFinanceData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  if (loading) return <LoadingSpinner text="Reconciling financial ledgers..." />;
  if (!financeData) return null;

  const { metrics, projectBreakdown, recentPayments } = financeData;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Financial Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor client billing, editor disbursements, automated margin calculations, and profit.
          </p>
        </div>

        <button
          onClick={() => onOpenRecordPayment()}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Core Agency Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Total Client Collections
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block">
            ${metrics.totalClientPaymentsReceived.toLocaleString()}
          </span>
          <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t border-emerald-500/10">
            <span>Total Invoiced: ${metrics.totalClientAmount.toLocaleString()}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Due: ${metrics.outstandingClientPayments.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Editor Payouts
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-300 block">
            ${metrics.totalEditorPaymentsMade.toLocaleString()}
          </span>
          <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t border-blue-500/10">
            <span>Total Agreed: ${metrics.totalEditorAmount.toLocaleString()}</span>
            <span className="font-semibold text-card-foreground">
              Remaining: ${metrics.outstandingEditorPayments.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Agency Realized Profit
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-primary block">
            ${metrics.agencyProfit.toLocaleString()}
          </span>
          <p className="text-xs text-muted-foreground pt-2 border-t border-primary/10">
            Formula: Client Payments Received - Editor Payments Made
          </p>
        </div>
      </div>

      {/* Projects Ledger Table */}
      <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Project Finance Breakdown</h2>
            <p className="text-xs text-muted-foreground">
              Individual tracking of client receivables and editor payables per project.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Client Billing</th>
                <th className="py-3 px-4">Client Status</th>
                <th className="py-3 px-4">Editor Payout</th>
                <th className="py-3 px-4">Editor Status</th>
                <th className="py-3 px-4">Net Margin</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectBreakdown.map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-muted-foreground text-[10px]">
                      {p.projectCode}
                    </span>
                    <span className="font-semibold text-card-foreground block truncate max-w-[200px]">
                      {p.title}
                    </span>
                  </td>

                  {/* Client Financials */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-card-foreground">
                      {formatCurrency(p.clientPrice, p.currency)}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Paid: {formatCurrency(p.clientPaid, p.currency)} • Rem: {formatCurrency(p.clientBalance, p.currency)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <PaymentStatusBadge status={p.clientPaymentStatus} />
                  </td>

                  {/* Editor Financials */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-card-foreground">
                      {formatCurrency(p.editorPayment, p.currency)}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Paid: {formatCurrency(p.editorPaid, p.currency)} • Rem: {formatCurrency(p.editorBalance, p.currency)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <PaymentStatusBadge status={p.editorPaymentStatus} />
                  </td>

                  {/* Margin */}
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(p.netMargin, p.currency)}
                  </td>

                  {/* Record payment shortcut */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenRecordPayment(p)}
                      className="px-2.5 py-1 rounded-lg border border-border bg-card text-[11px] font-semibold hover:bg-secondary transition-colors"
                    >
                      + Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions Stream */}
      <div className="border border-border rounded-2xl bg-card shadow-sm p-5 space-y-4">
        <h2 className="text-base font-bold text-card-foreground flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" /> Recorded Transaction History
        </h2>

        <div className="divide-y divide-border">
          {recentPayments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No transactions recorded yet.
            </p>
          ) : (
            recentPayments.map((pay: any) => (
              <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      pay.type === 'CLIENT_PAYMENT'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}
                  >
                    {pay.type === 'CLIENT_PAYMENT' ? '↓' : '↑'}
                  </div>
                  <div>
                    <span className="font-bold text-card-foreground block">
                      {pay.type === 'CLIENT_PAYMENT' ? 'Client Payment' : 'Editor Disbursement'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {pay.project?.projectCode} — {pay.paymentMethod}
                      {pay.referenceId ? ` • Ref: ${pay.referenceId}` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-sm ${
                      pay.type === 'CLIENT_PAYMENT'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {pay.type === 'CLIENT_PAYMENT' ? '+' : '-'}{formatCurrency(pay.amount, pay.project?.currency)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {new Date(pay.paymentDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

