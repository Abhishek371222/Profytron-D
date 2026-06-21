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
  Pause,
  Play,
  X,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'INACTIVE';

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
  ACTIVE: { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  PAUSED: { label: 'Paused', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  EXPIRED: { label: 'Expired', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  INACTIVE: { label: 'Inactive', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

function getStatusFromBot(bot: SubscribedBot): SubscriptionStatus {
  const s = bot.subscription?.status;
  if (!s || s === 'INACTIVE') return 'INACTIVE';
  return s;
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
      transition={{ delay: delay ?? 0 }}
      className="dashboard-card p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconCls)}>
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

// Row-level action dropdown
function ActionMenu({
  bot,
  onPause,
  onResume,
  onCancel,
  isPending,
}: {
  bot: SubscribedBot;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string, name: string) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const status = getStatusFromBot(bot);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const canPause = status === 'ACTIVE';
  const canResume = status === 'PAUSED' || status === 'INACTIVE';
  const canCancel = status === 'ACTIVE' || status === 'PAUSED';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[var(--card-border)] bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-40"
      >
        Actions
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-[var(--card-border)] bg-card shadow-xl overflow-hidden">
          {canPause && (
            <button
              type="button"
              onClick={() => { onPause(bot.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/10 transition-colors"
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </button>
          )}
          {canResume && (
            <button
              type="button"
              onClick={() => { onResume(bot.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              Resume
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => { onCancel(bot.id, bot.name); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          )}
          <Link
            href={`/marketplace/${bot.id}`}
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors border-t border-[var(--card-border)]"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Cancel Confirm Dialog ─────────────────────────────────────────────────────

function CancelDialog({
  botName,
  onConfirm,
  onClose,
  isPending,
}: {
  botName: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative dashboard-card p-6 max-w-sm w-full space-y-4 z-10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Cancel Subscription?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel your subscription to{' '}
          <span className="font-semibold text-foreground">{botName}</span>? You will lose access at the end of your current billing period.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-[var(--card-border)] bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Keep Subscription
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-9 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </motion.div>
    </div>
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
  const [cancelTarget, setCancelTarget] = React.useState<{ id: string; name: string } | null>(null);

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

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/strategies/${id}/pause`),
    onSuccess: () => {
      toast.success('Bot paused successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: () => toast.error('Failed to pause bot'),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/strategies/${id}/resume`),
    onSuccess: () => {
      toast.success('Bot resumed successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: () => toast.error('Failed to resume bot'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/strategies/${id}/deactivate`),
    onSuccess: () => {
      toast.success('Subscription cancelled');
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: () => toast.error('Failed to cancel subscription'),
  });

  const isPending = pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending;

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
    'Actions',
  ];

  return (
    <div className="space-y-5 pb-8">
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors shadow-sm"
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
          iconCls="bg-blue-500/10 text-blue-400"
          isLoading={isLoading}
          delay={0.06}
        />
        <SummaryCard
          label="Annual Spend"
          value={formatINR(annualSpend)}
          icon={TrendingUp}
          iconCls="bg-orange-500/10 text-orange-400"
          isLoading={isLoading}
          delay={0.12}
        />
        <SummaryCard
          label="Next Renewal"
          value={formatDate(nextRenewal)}
          icon={Calendar}
          iconCls="bg-emerald-500/10 text-emerald-400"
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
        <div className="overflow-x-auto">
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
                        {autoRenew ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                            <ToggleRight className="h-4 w-4" />
                            On
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                            <ToggleLeft className="h-4 w-4" />
                            Off
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <ActionMenu
                          bot={bot}
                          isPending={isPending}
                          onPause={(id) => pauseMutation.mutate(id)}
                          onResume={(id) => resumeMutation.mutate(id)}
                          onCancel={(id, name) => setCancelTarget({ id, name })}
                        />
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

      {/* Cancel dialog */}
      {cancelTarget && (
        <CancelDialog
          botName={cancelTarget.name}
          isPending={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
