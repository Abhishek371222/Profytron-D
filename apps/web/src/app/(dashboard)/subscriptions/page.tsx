'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import {
  CreditCard,
  ChevronRight,
  Bot,
  Calendar,
  TrendingUp,
  IndianRupee,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'INACTIVE' | 'BLOCKED';
type ProfitShareState = 'PROFIT_SHARE_OK' | 'PROFIT_SHARE_DUE' | 'PROFIT_SHARE_PAUSED' | 'PROFIT_SHARE_SETTLING';

interface SubscribedBot {
  id: string;
  name: string;
  category: string;
  monthlyPrice: number;
  isVerified: boolean;
  copiesCount: number;
  latestPerformance?: {
    winRate?: number;
    totalReturn?: number;
  };
  subscription?: {
    id: string;
    status: SubscriptionStatus;
    brokerAccount?: string;
    renewalDate?: string;
    startedAt?: string;
    planType?: 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
    billingModel?: 'FIXED' | 'PROFIT_SHARE';
    profitShareState?: ProfitShareState | null;
    profitShareAccruedUnsettled?: number | null;
    autoRenew?: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_FILTER_TABS: Array<{ label: string; value: SubscriptionStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const STATUS_BADGE: Record<SubscriptionStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-primary/10 text-primary border-primary/20' },
  PAUSED: { label: 'Paused', cls: 'bg-muted/60 text-muted-foreground border-[var(--card-border)]' },
  BLOCKED: { label: 'Blocked', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  EXPIRED: { label: 'Expired', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-muted/60 text-muted-foreground border-[var(--card-border)]' },
  INACTIVE: { label: 'Inactive', cls: 'bg-muted/60 text-muted-foreground border-[var(--card-border)]' },
};

function getStatusFromBot(bot: SubscribedBot): SubscriptionStatus {
  const s = bot.subscription?.status;
  if (!s || s === 'INACTIVE') return 'INACTIVE';
  return s;
}

function profitShareBadge(bot: SubscribedBot) {
  if (bot.subscription?.billingModel !== 'PROFIT_SHARE') return null;
  if (bot.subscription.profitShareState === 'PROFIT_SHARE_PAUSED') return 'Paused — top up required';
  if (bot.subscription.profitShareState === 'PROFIT_SHARE_SETTLING') return 'Profit share settlement due';
  if (bot.subscription.profitShareState === 'PROFIT_SHARE_DUE') return 'Profit share due';
  return 'Profit sharing';
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-colors',
        active
          ? 'bg-primary/10 text-primary border border-primary/25'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent',
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold',
            active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconCls,
  valueClass,
  isLoading,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconCls: string;
  valueClass?: string;
  isLoading?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group dashboard-card p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105', iconCls)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      {isLoading ? (
        <div className="h-7 w-24 rounded-lg bg-muted animate-pulse" />
      ) : (
        <p className={cn('text-2xl font-bold tabular-nums text-foreground', valueClass)}>{value}</p>
      )}
    </motion.div>
  );
}

// ─── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-[var(--card-border)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${40 + j * 8}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = React.useState<SubscriptionStatus | 'ALL'>('ALL');

  const { data: rawBots = [], isLoading } = useQuery<SubscribedBot[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await apiClient.get('/strategies/my');
      const payload = res.data;
      if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
      return payload;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const autoRenewMutation = useMutation({
    mutationFn: ({ id, autoRenew }: { id: string; autoRenew: boolean }) =>
      apiClient.patch(`/strategies/${id}/auto-renew`, { autoRenew }),
    // Optimistic — a slider should flip instantly, not wait on a round trip.
    onMutate: async ({ id, autoRenew }) => {
      await queryClient.cancelQueries({ queryKey: ['subscriptions'] });
      const previous = queryClient.getQueryData<SubscribedBot[]>(['subscriptions']);
      queryClient.setQueryData<SubscribedBot[]>(['subscriptions'], (prev) =>
        prev?.map((b) =>
          b.id === id
            ? { ...b, subscription: b.subscription ? { ...b.subscription, autoRenew } : b.subscription }
            : b,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['subscriptions'], context.previous);
      toast.error('Failed to update auto-renewal');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  // Computed stats
  const activeBots = React.useMemo(
    () => rawBots.filter((b) => getStatusFromBot(b) === 'ACTIVE'),
    [rawBots],
  );
  const monthlySpend = activeBots.reduce((s, b) => s + (b.monthlyPrice ?? 0), 0);
  const annualSpend = monthlySpend * 12;
  const nextRenewal = activeBots
    .map((b) => b.subscription?.renewalDate)
    .filter(Boolean)
    .sort()[0];

  const counts = React.useMemo(() => {
    const acc: Record<string, number> = { ALL: rawBots.length };
    rawBots.forEach((b) => {
      const s = getStatusFromBot(b);
      acc[s] = (acc[s] ?? 0) + 1;
    });
    return acc;
  }, [rawBots]);

  const filtered = React.useMemo(() => {
    if (activeFilter === 'ALL') return rawBots;
    return rawBots.filter((b) => getStatusFromBot(b) === activeFilter);
  }, [rawBots, activeFilter]);

  const TABLE_HEADERS = [
    'Bot',
    'Plan',
    'Status',
    'Price/mo',
    'Next Billing',
    'Broker',
    'Auto-Renewal',
    'Upgrade',
  ];

  return (
    <div className="space-y-5 pb-8" data-tour="subscriptions-overview">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-foreground">Subscriptions</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Subscriptions</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your bot subscriptions and billing</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}
            className="btn-premium-ghost inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/marketplace"
            className="btn-premium inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide"
          >
            <Bot className="h-4 w-4" />
            Browse Bots
          </Link>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Active Subscriptions"
          value={String(activeBots.length)}
          icon={Bot}
          iconCls="bg-primary/10 text-primary"
          isLoading={isLoading}
          delay={0}
        />
        <SummaryCard
          label="Monthly Spend"
          value={formatINR(monthlySpend)}
          icon={IndianRupee}
          iconCls="bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent-foreground)]"
          isLoading={isLoading}
          delay={0.06}
        />
        <SummaryCard
          label="Annual Spend"
          value={formatINR(annualSpend)}
          icon={TrendingUp}
          iconCls="bg-primary/10 text-primary"
          isLoading={isLoading}
          delay={0.12}
        />
        <SummaryCard
          label="Next Renewal"
          value={formatDate(nextRenewal)}
          icon={Calendar}
          iconCls="bg-muted/60 text-muted-foreground"
          isLoading={isLoading}
          delay={0.18}
        />
      </div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="dashboard-card overflow-hidden"
      >
        {/* Filter bar */}
        <div className="px-5 py-3.5 border-b border-[var(--card-border)] flex flex-wrap items-center gap-2">
          {STATUS_FILTER_TABS.map(({ label, value }) => (
            <FilterPill
              key={value}
              active={activeFilter === value}
              onClick={() => setActiveFilter(value)}
              count={counts[value] ?? 0}
            >
              {label}
            </FilterPill>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtered.length} subscription{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="responsive-table-shell">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-[var(--card-border)] bg-muted/20">
                {TABLE_HEADERS.map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap',
                      i === TABLE_HEADERS.length - 1 ? 'text-right' : 'text-left',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? null : (
              <tbody className="divide-y divide-[var(--card-border)]">
                {filtered.map((bot, idx) => {
                  const status = getStatusFromBot(bot);
                  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.INACTIVE;
                  const plan = bot.subscription?.planType ?? 'MONTHLY';
                  const autoRenew = bot.subscription?.autoRenew ?? true;
                  const psBadge = profitShareBadge(bot);

                  return (
                    <motion.tr
                      key={bot.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group hover:bg-muted/10 transition-colors"
                    >
                      {/* Bot */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">{bot.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{bot.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {plan.charAt(0) + plan.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border',
                            badge.cls,
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {badge.label}
                        </span>
                        {psBadge ? (
                          <span className="mt-1 inline-flex rounded-lg border border-chart-4/30 bg-chart-4/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-chart-4">
                            {psBadge}
                          </span>
                        ) : null}
                      </td>

                      {/* Price/mo */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {formatINR(bot.monthlyPrice)}
                        </span>
                      </td>

                      {/* Next Billing */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(bot.subscription?.renewalDate)}
                        </span>
                      </td>

                      {/* Broker */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-muted-foreground max-w-[120px] truncate block">
                          {bot.subscription?.brokerAccount ?? (
                            <span className="italic text-muted-foreground/60">None linked</span>
                          )}
                        </span>
                      </td>

                      {/* Auto-Renewal */}
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={autoRenew}
                          aria-label={autoRenew ? 'Turn off auto-renewal' : 'Turn on auto-renewal'}
                          disabled={autoRenewMutation.isPending}
                          onClick={() => autoRenewMutation.mutate({ id: bot.id, autoRenew: !autoRenew })}
                          className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
                            autoRenew ? 'bg-primary' : 'bg-[color-mix(in_srgb,var(--muted)_80%,transparent)]',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200',
                              autoRenew ? 'translate-x-4' : 'translate-x-0.5',
                            )}
                          />
                        </button>
                      </td>

                      {/* Upgrade */}
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/marketplace/${bot.id}`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[color-mix(in_srgb,var(--primary)_28%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-[11px] font-semibold text-primary hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] transition-colors"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Upgrade
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-[var(--card-border)]">
              <CreditCard className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {activeFilter === 'ALL' ? 'No subscriptions found' : `No ${activeFilter.toLowerCase()} subscriptions`}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeFilter === 'ALL'
                  ? 'Head to the marketplace to subscribe to your first bot.'
                  : 'Try a different filter to see more subscriptions.'}
              </p>
            </div>
            {activeFilter === 'ALL' && (
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
              >
                Browse Marketplace
              </Link>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
