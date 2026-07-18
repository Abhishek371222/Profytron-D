'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient, unwrapApiResponse } from '@/lib/api/client';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Globe,
  Receipt,
  RefreshCcw,
  Smartphone,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';

type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

interface Payment {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  invoiceNumber?: string;
}

interface CurrentSubscription {
  plan?: { name: string; description?: string };
  planName?: string;
  status?: string;
  monthlyAmount?: number;
  renewsAt?: string;
  nextPaymentDate?: string;
  cancelledAt?: string | null;
}

interface MyBot {
  id: string;
  name: string;
  monthlyFee?: number;
  renewsAt?: string;
  nextBillingDate?: string;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-muted/40 text-muted-foreground border-[var(--card-border)]',
  STARTER: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  PRO: 'bg-primary/10 text-primary border-primary/20',
  BUSINESS: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
};

const STATUS_STYLE: Record<PaymentStatus, string> = {
  COMPLETED: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  PENDING: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_DOT: Record<PaymentStatus, string> = {
  COMPLETED: 'bg-chart-3',
  PENDING: 'bg-chart-4',
  FAILED: 'bg-destructive',
};

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group dashboard-card p-5 flex items-center gap-4 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105', iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground tabular-nums mt-0.5 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  const currentQuery = useQuery({
    queryKey: ['subscription-current'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/current');
      return unwrapApiResponse<CurrentSubscription>(res.data);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel(),
    onSuccess: () => {
      toast.success('Subscription cancelled. You’ll keep access until your current period ends.');
      setCancelDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ['billing-payments'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/payments');
      const data = unwrapApiResponse<{ payments: Payment[]; total: number }>(res.data);
      return data;
    },
  });

  const botsQuery = useQuery({
    queryKey: ['my-bots'],
    queryFn: async () => {
      const res = await apiClient.get('/strategies/my');
      return unwrapApiResponse<MyBot[]>(res.data);
    },
  });

  const current = currentQuery.data;
  const planName = current?.plan?.name ?? current?.planName ?? 'Free';
  const planKey = planName.toUpperCase();
  const payments = paymentsQuery.data?.payments ?? [];
  const bots = botsQuery.data ?? [];

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const spentThisMonth = payments
    .filter((p) => {
      const d = new Date(p.date);
      return p.status === 'COMPLETED' && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const spentThisYear = payments
    .filter((p) => {
      const d = new Date(p.date);
      return p.status === 'COMPLETED' && d.getFullYear() === thisYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const activeSubscriptions = payments.filter((p) => p.status === 'COMPLETED').length;

  const nextPayment = payments
    .filter((p) => p.status === 'PENDING')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const upcomingBots = bots.filter((b) => b.renewsAt ?? b.nextBillingDate);

  const invoiceDownloadUnavailable = true;

  return (
    <div className="space-y-6 pb-10">
      { }
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Billing & Payments</span>
      </div>

      { }
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Billing & Payments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your subscriptions, invoices and payment methods</p>
          </div>
        </div>
        <Link
          href="/team-plans"
          className="btn-premium inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide shrink-0"
        >
          <Zap className="h-4 w-4" />
          Upgrade Plan
        </Link>
      </motion.div>

      { }
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
        whileHover={{ y: -3 }}
        className="dashboard-card p-6 bg-gradient-to-br from-primary/[0.07] to-primary/[0.02] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Zap className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">Current Plan</h2>
              <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', PLAN_COLOR[planKey] ?? PLAN_COLOR.PRO)}>
                {currentQuery.isLoading ? '—' : planName}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {current?.monthlyAmount != null && (
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  {formatInr(current.monthlyAmount)} / month
                </span>
              )}
              {(current?.renewsAt ?? current?.nextPaymentDate) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {current?.cancelledAt ? 'Access until' : 'Renews'}{' '}
                  {new Date(current!.renewsAt ?? current!.nextPaymentDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {current?.cancelledAt && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelled — won&apos;t renew
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {planKey !== 'FREE' && !current?.cancelledAt && (
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive"
              >
                Cancel plan
              </button>
            )}
            <Link
              href="/team-plans"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              View all plans <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription>
              You&apos;ll keep full access to {planName} until your current billing period ends
              {current?.renewsAt || current?.nextPaymentDate
                ? ` on ${new Date(current!.renewsAt ?? current!.nextPaymentDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : ''}
              . After that, your account moves to the Free plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep plan
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Spent This Month"
          value={paymentsQuery.isLoading ? <span className="h-6 w-24 rounded bg-muted animate-pulse inline-block" /> : formatInr(spentThisMonth)}
          icon={Wallet}
          iconClass="bg-primary/10 text-primary"
          delay={0}
        />
        <StatCard
          label="Total Spent This Year"
          value={paymentsQuery.isLoading ? <span className="h-6 w-24 rounded bg-muted animate-pulse inline-block" /> : formatInr(spentThisYear)}
          icon={Receipt}
          iconClass="bg-chart-5/10 text-chart-5"
          delay={0.05}
        />
        <StatCard
          label="Active Subscriptions"
          value={paymentsQuery.isLoading ? '—' : String(activeSubscriptions)}
          icon={CheckCircle2}
          iconClass="bg-chart-3/10 text-chart-3"
          delay={0.1}
        />
        <StatCard
          label="Next Payment Due"
          value={
            paymentsQuery.isLoading
              ? '—'
              : nextPayment
              ? new Date(nextPayment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : 'None'
          }
          icon={Calendar}
          iconClass="bg-chart-4/10 text-chart-4"
          delay={0.15}
        />
      </div>

      { }
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="dashboard-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Payment History</h2>
        </div>

        <div className="responsive-table-shell">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-muted/20">
                {['Date', 'Description', 'Amount', 'Status', 'Invoice'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                      i >= 2 ? 'text-right' : 'text-left',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {paymentsQuery.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${50 + j * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : payments.length === 0
                ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted border border-[var(--card-border)]">
                            <Receipt className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">No payments yet</p>
                          <p className="text-xs text-muted-foreground">Your payment history will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )
                : payments.map((p, idx) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-foreground">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-foreground">{p.description}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold tabular-nums text-foreground">{formatInr(p.amount)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border', STATUS_STYLE[p.status])}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[p.status])} />
                          {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={invoiceDownloadUnavailable}
                          title={invoiceDownloadUnavailable ? 'Invoice downloads are coming soon' : undefined}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-muted-foreground disabled:hover:border-[var(--card-border)]"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      { }
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="dashboard-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <RefreshCcw className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Upcoming Bot Renewals</h2>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {botsQuery.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse ml-auto" />
                </div>
              ))
            : upcomingBots.length === 0
            ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-muted-foreground">No upcoming bot renewals</p>
                </div>
              )
            : upcomingBots.map((bot, idx) => {
                const renewDate = bot.renewsAt ?? bot.nextBillingDate;
                return (
                  <motion.div
                    key={bot.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{bot.name}</p>
                      {renewDate && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Renews {new Date(renewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    {bot.monthlyFee != null && (
                      <span className="text-sm font-bold tabular-nums text-foreground shrink-0">
                        {formatInr(bot.monthlyFee)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
        </div>
      </motion.div>

      { }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        { }
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dashboard-card p-5 lg:col-span-1"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Razorpay</p>
              <p className="text-xs text-muted-foreground mt-0.5">Indian payments</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pay via UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and EMI. All major Indian banks supported.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['UPI', 'Cards', 'Net Banking', 'EMI'].map((m) => (
              <span key={m} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground border border-[var(--card-border)]">
                {m}
              </span>
            ))}
          </div>
        </motion.div>

        { }
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="dashboard-card p-5 lg:col-span-1"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Stripe</p>
              <p className="text-xs text-muted-foreground mt-0.5">International payments</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pay using international credit/debit cards (Visa, MasterCard, Amex). Supports USD, EUR and other global currencies.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Visa', 'MasterCard', 'Amex', 'USD', 'EUR'].map((m) => (
              <span key={m} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground border border-[var(--card-border)]">
                {m}
              </span>
            ))}
          </div>
        </motion.div>

        { }
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="dashboard-card p-5 lg:col-span-1"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Tax & Invoices</p>
              <p className="text-xs text-muted-foreground mt-0.5">GST information</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            GST at 18% is applicable for all Indian users. Downloadable tax-compliant invoices are coming soon — until then, contact support for a copy of any payment record.
          </p>
          <p className="text-[10px] text-muted-foreground mt-3 border-t border-[var(--card-border)] pt-3">
            GSTIN required for business accounts. Contact support to update.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
