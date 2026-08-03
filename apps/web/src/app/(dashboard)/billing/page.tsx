'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { subscriptionsApi, type SubscriptionPlan } from '@/lib/api/subscriptions';
import { formatInr, formatMoney } from '@/lib/currency';
import { RazorpaySubscriptionButton } from '@/components/payments/RazorpaySubscriptionButton';
import { StartTrialButton } from '@/components/payments/StartTrialButton';
import { TrialStatusBanner } from '@/components/dashboard/TrialStatusBanner';
import { ANNUAL_SAVE_LABEL } from '@/lib/pricing/plans';
import { trackEvent, ACTIVATION_EVENTS } from '@/lib/analytics/track';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { refreshAfterPayment } from '@/lib/payments/refresh';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { DashErrorState } from '@/components/dashboard/DashboardPrimitives';
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
  History,
  Receipt,
  RefreshCcw,
  Smartphone,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';

type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';

interface MyBot {
  id: string;
  name: string;
  monthlyFee?: number;
  renewsAt?: string;
  nextBillingDate?: string;
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
  REFUNDED: 'bg-muted text-muted-foreground border-[var(--card-border)]',
};

const STATUS_DOT: Record<PaymentStatus, string> = {
  COMPLETED: 'bg-chart-3',
  PENDING: 'bg-chart-4',
  FAILED: 'bg-destructive',
  REFUNDED: 'bg-muted-foreground',
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  COMPLETED: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

function parseFeatures(features: SubscriptionPlan['features']): string[] {
  if (Array.isArray(features)) return features.map(String);
  return [];
}

function PlanCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border bg-muted/20 animate-pulse space-y-4" aria-hidden>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="h-8 w-28 rounded bg-muted" />
      <div className="h-11 w-full rounded-xl bg-muted mt-4" />
    </div>
  );
}

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
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="group dashboard-card p-5 flex items-center gap-4 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconClass)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-foreground tabular-nums mt-0.5 truncate">{value}</p>
      </div>
    </motion.div>
  );
}

async function triggerInvoiceDownload(invoiceRef: string, label: string) {
  try {
    const blob = await subscriptionsApi.downloadInvoicePdf(invoiceRef);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  } catch {
    toast.error('Could not download invoice', {
      description: 'Try again or contact support@profytron.com',
    });
  }
}

export default function BillingCenterPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const [billingCycle, setBillingCycle] = React.useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [trialBannerDismissed, setTrialBannerDismissed] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const billingQuery = useQuery({
    queryKey: ['billing-center'],
    queryFn: () => subscriptionsApi.getBillingCenter(),
  });

  // Lightweight bot strip — not on aggregate (different domain)
  const botsQuery = useQuery({
    queryKey: ['my-bots'],
    queryFn: async () => {
      const { apiClient, unwrapApiResponse } = await import('@/lib/api/client');
      const res = await apiClient.get('/strategies/my');
      return unwrapApiResponse<MyBot[]>(res.data);
    },
    staleTime: 60_000,
  });

  const current = billingQuery.data?.current;
  const plans = (billingQuery.data?.plans ?? []).filter((p) => p.monthlyPrice >= 0);
  const payments = billingQuery.data?.payments ?? [];
  const invoices = billingQuery.data?.invoices ?? [];
  const refunds = billingQuery.data?.refunds?.refundedPayments ?? [];
  const summary = billingQuery.data?.summary;
  const bots = botsQuery.data ?? [];
  const upcomingBots = bots.filter((b) => b.renewsAt ?? b.nextBillingDate);

  const planName = current?.plan?.name ?? current?.planName ?? 'Free';
  const planKey = String(planName).toUpperCase();
  const activePlanId = current?.planId ?? current?.plan?.id;
  const activePlanName = current?.plan?.name;
  const isCancelled = Boolean(current?.cancelledAt);
  const isTrialing =
    Boolean(current?.isTrial) && !current?.trialConvertedAt && current?.status === 'ACTIVE';

  const cancelMutation = useMutation({
    mutationFn: () => subscriptionsApi.cancel(),
    onSuccess: () => {
      toast.success('Subscription cancelled. You’ll keep access until your current period ends.');
      setCancelDialogOpen(false);
      void refreshAfterPayment(queryClient);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  const refreshBilling = () => void refreshAfterPayment(queryClient);

  const onDownload = async (ref: string, label: string) => {
    setDownloadingId(ref);
    try {
      await triggerInvoiceDownload(ref, label);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden />
        <span className="text-foreground">Billing</span>
      </nav>

      {billingQuery.isError && (
        <DashErrorState
          message="Couldn't load billing data."
          onRetry={() => void billingQuery.refetch()}
        />
      )}

      {isTrialing && !trialBannerDismissed && current?.trialEndsAt && (
        <TrialStatusBanner
          planName={activePlanName ?? 'Trial'}
          trialEndsAt={current.trialEndsAt}
          onUpgrade={() => {
            document.getElementById('billing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onDismiss={() => setTrialBannerDismissed(true)}
        />
      )}

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Billing Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Plans, invoices, payments, and refunds in one place
            </p>
          </div>
        </div>
        <Link
          href="/wallet"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 px-4 rounded-[var(--radius-button)] border border-[var(--card-border)] text-xs font-bold uppercase tracking-wide"
        >
          <Wallet className="h-4 w-4" aria-hidden />
          Wallet
        </Link>
      </motion.div>

      {/* Current plan */}
      <section
        aria-labelledby="current-plan-heading"
        className="dashboard-card p-6 bg-gradient-to-br from-primary/[0.07] to-primary/[0.02]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Zap className="h-7 w-7" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 id="current-plan-heading" className="text-lg font-bold text-foreground">
                Current plan
              </h2>
              {billingQuery.isLoading ? (
                <span className="inline-block h-5 w-16 rounded-full bg-muted animate-pulse" aria-hidden />
              ) : (
                <span
                  className={cn(
                    'inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    PLAN_COLOR[planKey] ?? PLAN_COLOR.PRO,
                  )}
                >
                  {planName}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {current?.monthlyAmount != null && (
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" aria-hidden />
                  {formatMoney(current.monthlyAmount, 'INR')}/month
                </span>
              )}
              {(current?.renewsAt ?? current?.nextPaymentDate) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  {current?.cancelledAt ? 'Access until' : 'Period ends'}{' '}
                  {new Date(current!.renewsAt ?? current!.nextPaymentDate!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
              {isCancelled && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-3.5 w-3.5" aria-hidden />
                  Cancelled — won&apos;t renew
                </span>
              )}
              {planKey === 'FREE' && !current?.monthlyAmount && (
                <span>Paper trading included · upgrade for live copy execution</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-xl">
              Plan changes replace your previous platform plan (history is preserved). Remaining time
              on a paid plan is carried forward; charges are prepaid full periods (no mid-cycle cash refund).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {planKey !== 'FREE' && !isCancelled && (
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="min-h-[44px] px-2 text-xs font-semibold text-muted-foreground hover:text-destructive rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              >
                Cancel plan
              </button>
            )}
            <a
              href="#billing-plans"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1"
            >
              Change plan <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Spent this month"
          value={
            billingQuery.isLoading ? (
              <span className="h-6 w-24 rounded bg-muted animate-pulse inline-block" />
            ) : (
              formatMoney(summary?.spentThisMonth ?? 0, 'INR')
            )
          }
          icon={Wallet}
          iconClass="bg-primary/10 text-primary"
        />
        <StatCard
          label="Spent this year"
          value={
            billingQuery.isLoading ? (
              <span className="h-6 w-24 rounded bg-muted animate-pulse inline-block" />
            ) : (
              formatMoney(summary?.spentThisYear ?? 0, 'INR')
            )
          }
          icon={Receipt}
          iconClass="bg-chart-5/10 text-chart-5"
          delay={0.05}
        />
        <StatCard
          label="Completed payments"
          value={billingQuery.isLoading ? '—' : String(summary?.completedCount ?? 0)}
          icon={CheckCircle2}
          iconClass="bg-chart-3/10 text-chart-3"
          delay={0.1}
        />
        <StatCard
          label="Refunds recorded"
          value={billingQuery.isLoading ? '—' : String(refunds.length)}
          icon={RefreshCcw}
          iconClass="bg-chart-4/10 text-chart-4"
          delay={0.15}
        />
      </div>

      {/* Plans */}
      <section
        id="billing-plans"
        aria-labelledby="plans-heading"
        className="space-y-6 rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="plans-heading" className="text-xl font-bold text-foreground tracking-tight">
              Plans
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade or downgrade anytime. One active platform plan per account.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Billing cycle"
            className="inline-flex max-w-full flex-wrap rounded-full border border-border bg-foreground/5 p-1"
          >
            {(['MONTHLY', 'ANNUAL'] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                role="radio"
                aria-checked={billingCycle === cycle}
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  'min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  billingCycle === cycle
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/50 hover:text-foreground',
                )}
              >
                {cycle === 'MONTHLY' ? (
                  'Monthly'
                ) : (
                  <>
                    Annual
                    <span className="ml-1.5 text-[10px] font-bold normal-case tracking-normal opacity-90">
                      {ANNUAL_SAVE_LABEL}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {billingQuery.isLoading && (
            <>
              <PlanCardSkeleton />
              <PlanCardSkeleton />
              <PlanCardSkeleton />
            </>
          )}
          {!billingQuery.isLoading && plans.length === 0 && (
            <div className="col-span-full rounded-2xl border border-border bg-muted/20 p-8 text-center">
              <p className="text-sm font-semibold text-foreground">Plans unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We couldn&apos;t load plan cards. Retry or view public pricing.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => refreshBilling()}
                  className="min-h-[44px] rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Retry
                </button>
                <Link
                  href="/pricing"
                  className="min-h-[44px] inline-flex items-center rounded-lg border border-border px-4 text-sm font-semibold"
                >
                  Open pricing
                </Link>
              </div>
            </div>
          )}
          {plans.map((plan) => {
            const isActive = activePlanId === plan.id || activePlanName === plan.name;
            const price =
              billingCycle === 'ANNUAL'
                ? plan.annualPrice ?? plan.monthlyPrice * 12
                : plan.monthlyPrice;
            const monthlyEquivalent =
              billingCycle === 'ANNUAL' && plan.monthlyPrice > 0
                ? Math.round((plan.annualPrice ?? plan.monthlyPrice * 12) / 12)
                : null;
            const features = parseFeatures(plan.features);

            return (
              <div
                key={plan.id}
                className={cn(
                  'p-5 sm:p-6 rounded-2xl border flex flex-col',
                  isActive ? 'border-primary/40 bg-primary/10' : 'border-border bg-muted/2',
                )}
              >
                {isActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                    <CheckCircle2 className="w-3 h-3" aria-hidden /> Current plan
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                  {plan.monthlyPrice === 0 ? 'Free' : formatInr(price)}
                  {plan.monthlyPrice > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingCycle === 'ANNUAL' ? 'yr' : 'mo'}
                    </span>
                  )}
                </p>
                {monthlyEquivalent != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ {formatInr(monthlyEquivalent)}/mo billed annually
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2 flex-1 leading-relaxed">{plan.description}</p>
                <ul className="mt-4 space-y-1.5 mb-6">
                  {features.map((f) => (
                    <li key={f} className="text-xs text-foreground/60 flex gap-1.5">
                      <span className="text-primary" aria-hidden>
                        ·
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.monthlyPrice === 0 ? (
                  isActive ? (
                    <Button variant="outline" disabled className="w-full min-h-[44px]">
                      Current plan
                    </Button>
                  ) : (
                    <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }), 'w-full min-h-[44px]')}>
                      Continue on Free
                    </Link>
                  )
                ) : plan.trialEligible &&
                  !isActive &&
                  !user?.hasUsedPlatformTrial &&
                  !current ? (
                  <StartTrialButton
                    planId={plan.id}
                    planName={plan.name}
                    className="w-full"
                    onSuccess={() => {
                      trackEvent(ACTIVATION_EVENTS.PLAN_SELECTED, {
                        planId: plan.id,
                        planName: plan.name,
                        trial: true,
                      });
                      refreshBilling();
                    }}
                  />
                ) : (
                  <RazorpaySubscriptionButton
                    planId={plan.id}
                    planName={plan.name}
                    billingCycle={billingCycle}
                    disabled={isActive}
                    className="w-full min-h-[44px]"
                    onSuccess={() => {
                      trackEvent(ACTIVATION_EVENTS.PLAN_SELECTED, {
                        planId: plan.id,
                        planName: plan.name,
                      });
                      refreshBilling();
                      router.push(
                        `/billing/result?status=success&plan=${encodeURIComponent(plan.name)}`,
                      );
                    }}
                    onFailed={(msg) => {
                      router.push(
                        `/billing/result?status=failed&reason=${encodeURIComponent(msg || 'Payment failed')}`,
                      );
                    }}
                    onDismiss={() => {
                      router.push('/billing/result?status=pending');
                    }}
                  >
                    {isActive
                      ? 'Current plan'
                      : isCancelled
                        ? `Resubscribe to ${plan.name}`
                        : activePlanName
                          ? `Switch to ${plan.name}`
                          : `Upgrade to ${plan.name}`}
                  </RazorpaySubscriptionButton>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment history */}
      <section aria-labelledby="payments-heading" className="dashboard-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <FileText className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="payments-heading" className="text-sm font-bold text-foreground uppercase tracking-wide">
            Payment history
          </h2>
        </div>
        <div className="responsive-table-shell">
          <div className="responsive-table-inner">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-muted/20">
                  {['Date', 'Description', 'Amount', 'Status', 'Invoice'].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={cn(
                        'px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                        i >= 2 ? 'text-right' : 'text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {billingQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center text-sm text-muted-foreground">
                      No payments yet. Choose a plan above to get started.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const status = (p.status as PaymentStatus) || 'PENDING';
                    const invoiceRef = p.invoiceId ?? p.invoiceNumber;
                    return (
                      <tr key={p.id} className="hover:bg-muted/10">
                        <td className="px-4 sm:px-5 py-4">
                          <p className="text-sm font-medium text-foreground">
                            {new Date(p.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="px-4 sm:px-5 py-4">
                          <p className="text-sm text-foreground truncate max-w-[14rem]">{p.description}</p>
                          {status === 'FAILED' && (
                            <a
                              href="#billing-plans"
                              className="mt-1 inline-flex text-[11px] font-semibold text-primary hover:underline min-h-[44px] items-center"
                            >
                              Retry checkout
                            </a>
                          )}
                        </td>
                        <td className="px-4 sm:px-5 py-4 text-right text-sm font-bold tabular-nums">
                          {formatMoney(p.amount, p.currency || 'INR')}
                        </td>
                        <td className="px-4 sm:px-5 py-4 text-right">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border',
                              STATUS_STYLE[status] ?? STATUS_STYLE.PENDING,
                            )}
                          >
                            <span
                              className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status] ?? STATUS_DOT.PENDING)}
                              aria-hidden
                            />
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-4 text-right">
                          {p.canDownloadInvoice && invoiceRef ? (
                            <button
                              type="button"
                              onClick={() => onDownload(String(invoiceRef), p.invoiceNumber ?? p.id)}
                              disabled={downloadingId === invoiceRef}
                              aria-label={`Download invoice ${p.invoiceNumber ?? p.id}`}
                              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-semibold text-foreground hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                            >
                              <Download className="h-3 w-3" aria-hidden />
                              {downloadingId === invoiceRef ? '…' : 'Download'}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Invoices */}
      <section aria-labelledby="invoices-heading" className="dashboard-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <History className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="invoices-heading" className="text-sm font-bold text-foreground uppercase tracking-wide">
            Invoice history
          </h2>
        </div>
        {billingQuery.isLoading ? (
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading invoices">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No invoices yet.{' '}
            <a href="#billing-plans" className="text-primary underline-offset-2 hover:underline">
              Choose a plan
            </a>{' '}
            to get started.
          </p>
        ) : (
          <div className="responsive-table-shell">
            <div className="responsive-table-inner">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-widest">
                  <tr>
                    <th scope="col" className="text-left p-4 font-semibold">
                      Invoice
                    </th>
                    <th scope="col" className="text-left p-4 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="text-right p-4 font-semibold">
                      Total
                    </th>
                    <th scope="col" className="text-right p-4 font-semibold">
                      PDF
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4 font-mono text-foreground/80">
                        {inv.invoiceNumber ?? inv.id.slice(0, 8)}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="p-4 text-right tabular-nums font-medium">
                        {formatMoney(inv.total ?? 0, inv.currency || 'INR')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDownload(inv.id, inv.invoiceNumber ?? inv.id)}
                          disabled={downloadingId === inv.id}
                          aria-label={`Download PDF for ${inv.invoiceNumber ?? inv.id}`}
                          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
                        >
                          <Download className="h-3 w-3" aria-hidden />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Refunds */}
      {refunds.length > 0 && (
        <section aria-labelledby="refunds-heading" className="dashboard-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
            <RefreshCcw className="h-4 w-4 text-primary" aria-hidden />
            <h2 id="refunds-heading" className="text-sm font-bold text-foreground uppercase tracking-wide">
              Refund history
            </h2>
          </div>
          <ul className="divide-y divide-[var(--card-border)]">
            {refunds.map((r: { id: string; amount: number; currency?: string; description?: string; updatedAt?: string }) => (
              <li key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.description ?? 'Refund'}</p>
                  {r.updatedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(r.updatedAt).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {formatMoney(r.amount, r.currency || 'INR')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bot renewals */}
      <section aria-labelledby="bots-heading" className="dashboard-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center gap-3">
          <Bot className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="bots-heading" className="text-sm font-bold text-foreground uppercase tracking-wide">
            Upcoming bot renewals
          </h2>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {botsQuery.isLoading ? (
            <div className="px-5 py-4" aria-busy="true">
              Loading bots…
            </div>
          ) : upcomingBots.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No upcoming bot renewals.</p>
          ) : (
            upcomingBots.map((bot) => {
              const renewDate = bot.renewsAt ?? bot.nextBillingDate;
              return (
                <div key={bot.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{bot.name}</p>
                    {renewDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Renews{' '}
                        {new Date(renewDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  {bot.monthlyFee != null && (
                    <span className="text-sm font-bold tabular-nums shrink-0">
                      {formatMoney(bot.monthlyFee, 'INR')}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <div>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">How payments work</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="dashboard-card p-5">
            <div className="flex items-start gap-3 mb-3">
              <Smartphone className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-bold">Razorpay</p>
                <p className="text-xs text-muted-foreground">India checkout</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              UPI, cards, net banking at checkout. Details stay with Razorpay.
            </p>
          </div>
          <div className="dashboard-card p-5">
            <div className="flex items-start gap-3 mb-3">
              <Globe className="h-5 w-5 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-bold">Stripe</p>
                <p className="text-xs text-muted-foreground">International</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Card checkout for marketplace subscriptions where Stripe is enabled.
            </p>
          </div>
          <div className="dashboard-card p-5">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-5 w-5 text-chart-4" aria-hidden />
              <div>
                <p className="text-sm font-bold">Tax &amp; invoices</p>
                <p className="text-xs text-muted-foreground">GST line items</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Taxable amount plus GST are shown on downloadable PDF invoices. Business GSTIN updates:
              support@profytron.com
            </p>
          </div>
        </div>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent aria-describedby="cancel-plan-desc">
          <DialogHeader>
            <DialogTitle>Cancel your subscription?</DialogTitle>
            <DialogDescription id="cancel-plan-desc">
              You&apos;ll keep full access to {planName} until your current billing period ends
              {current?.renewsAt || current?.nextPaymentDate
                ? ` on ${new Date(current!.renewsAt ?? current!.nextPaymentDate!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`
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
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
