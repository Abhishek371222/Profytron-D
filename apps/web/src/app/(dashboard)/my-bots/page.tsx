'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Server, TrendingUp, TrendingDown, Pause, Play, X, BarChart2,
  ShoppingBag, CalendarClock, DollarSign, Zap, AlertCircle,
  RefreshCw, ChevronRight, Plus, Sparkles, ShieldCheck, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { marketplaceApi } from '@/lib/api/marketplace';
import { formatBotName } from '@/lib/bot-labels';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  hydrateDashboardCache,
  persistDashboardQuery,
} from '@/lib/queries/dashboard-cache';

type BotStatus = 'ACTIVE' | 'PROVISIONING' | 'FAILED' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'INACTIVE';

interface UserBot {
  id: string;
  name: string;
  category?: string;
  status: BotStatus;
  monthlyPrice?: number;
  planType?: string;
  expiresAt?: string;
  subscribedAt?: string;
  riskLevel?: string;
  creator?: { fullName?: string; username?: string };
  brokerAccount?: { accountName?: string; broker?: string } | null;
  currentPnl?: number;
}

const STATUS_CFG: Record<BotStatus, { label: string; tone: 'primary' | 'destructive' | 'neutral' }> = {
  ACTIVE:       { label: 'Active',       tone: 'primary' },
  PROVISIONING: { label: 'Processing',   tone: 'neutral' },
  FAILED:       { label: 'Setup Failed', tone: 'destructive' },
  PAUSED:       { label: 'Paused',       tone: 'neutral' },
  EXPIRED:      { label: 'Expired',      tone: 'destructive' },
  CANCELLED:    { label: 'Cancelled',    tone: 'neutral' },
  INACTIVE:     { label: 'Inactive',     tone: 'neutral' },
};

const TONE_CLASSES: Record<'primary' | 'destructive' | 'neutral', { badge: string; dot: string; text: string }> = {
  primary: {
    badge: 'border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary',
    dot: 'bg-primary',
    text: 'text-primary',
  },
  destructive: {
    badge: 'border-[color-mix(in_srgb,var(--destructive)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] text-destructive',
    dot: 'bg-destructive',
    text: 'text-destructive',
  },
  neutral: {
    badge: 'border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_60%,transparent)] text-muted-foreground',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
};

const TABS: Array<{ key: BotStatus | 'ALL'; label: string }> = [
  { key: 'ALL',       label: 'All'       },
  { key: 'ACTIVE',    label: 'Active'    },
  { key: 'PAUSED',    label: 'Paused'    },
  { key: 'EXPIRED',   label: 'Expired'   },
  { key: 'CANCELLED', label: 'Cancelled' },
];

async function fetchMyBots(): Promise<UserBot[]> {
  const res = await apiClient.get('/strategies/my');
  const raw = res.data?.data ?? res.data ?? [];
  if (!Array.isArray(raw)) {
    throw new Error('Unexpected bots response');
  }
  persistDashboardQuery(['my-bots'], raw);
  return raw;
}

export default function MyBotsPage() {
  const qc = useQueryClient();
  const { formatPrice } = useCurrency();
  const [tab, setTab] = React.useState<BotStatus | 'ALL'>('ALL');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = isAuthenticated && !isHydrating && Boolean(accessToken);

  React.useEffect(() => {
    if (!sessionReady) return;
    hydrateDashboardCache(qc);
  }, [sessionReady, qc]);

  const {
    data: bots = [],
    isLoading,
    isError,
    isFetching,
    refetch,
    error,
  } = useQuery<UserBot[]>({
    queryKey: ['my-bots'],
    queryFn: fetchMyBots,
    enabled: sessionReady,
    staleTime: 15_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });

  // Never flash hard error while auth is warming or a retry is in flight.
  const showHardError =
    sessionReady && isError && !isFetching && bots.length === 0;

  // Self-heal: pull MetaAPI positions → attribute to bots → refresh PnL in DB.
  React.useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    (async () => {
      try {
        await apiClient.post('/trading/sync-bots');
        if (!cancelled) {
          qc.invalidateQueries({ queryKey: ['my-bots'] });
          qc.invalidateQueries({ queryKey: ['open-trades'] });
          qc.invalidateQueries({ queryKey: ['broker-accounts'] });
        }
      } catch {
        /* sync is best-effort; list still loads from DB */
      }
    })();
    const id = window.setInterval(() => {
      void apiClient.post('/trading/sync-bots').then(() => {
        qc.invalidateQueries({ queryKey: ['my-bots'] });
        qc.invalidateQueries({ queryKey: ['open-trades'] });
      }).catch(() => undefined);
    }, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionReady, qc]);

  // Self-heal: PROVISIONING copy bots get MetaApi CF wiring (Render queue is stuck).
  React.useEffect(() => {
    const needsWire = bots.some((b) => b.status === 'PROVISIONING');
    if (!needsWire) return;
    let cancelled = false;
    (async () => {
      try {
        const link = await marketplaceApi.ensureCopyLink();
        if (!cancelled && (link?.linked > 0 || link?.ready)) {
          qc.invalidateQueries({ queryKey: ['my-bots'] });
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bots, qc]);

  const recommendedQuery = useQuery({
    queryKey: ['marketplace-recommended'],
    queryFn: () => marketplaceApi.getMarketplace({ limit: 9, sort: 'trending' }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const pauseMut  = useMutation({ mutationFn: (id: string) => apiClient.post(`/strategies/${id}/pause`),      onSuccess: () => { toast.success('Bot paused');    qc.invalidateQueries({ queryKey: ['my-bots'] }); }, onError: () => toast.error('Could not pause bot') });
  const resumeMut = useMutation({ mutationFn: (id: string) => apiClient.post(`/strategies/${id}/resume`),     onSuccess: () => { toast.success('Bot resumed');   qc.invalidateQueries({ queryKey: ['my-bots'] }); }, onError: () => toast.error('Could not resume bot') });
  const cancelMut = useMutation({ mutationFn: (id: string) => apiClient.post(`/strategies/${id}/deactivate`), onSuccess: () => { toast.success('Subscription cancelled'); qc.invalidateQueries({ queryKey: ['my-bots'] }); }, onError: () => toast.error('Could not cancel') });

  const filtered   = tab === 'ALL' ? bots : bots.filter(b => b.status === tab);
  const activeBots = bots.filter(b => b.status === 'ACTIVE');
  const monthlyCost = activeBots.reduce((s, b) => s + (b.monthlyPrice ?? 0), 0);
  const totalPnl    = bots.reduce((s, b) => s + (b.currentPnl ?? 0), 0);
  const nextRenewal = activeBots.filter(b => b.expiresAt).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0];

  const counts: Record<string, number> = { ALL: bots.length };
  for (const b of bots) counts[b.status] = (counts[b.status] ?? 0) + 1;

  const formatPnlMoney = (n: number) =>
    `${n >= 0 ? '+' : '-'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    { label: 'Active Bots',  value: String(activeBots.length), Icon: Zap, positive: true },
    { label: 'Monthly Cost', value: monthlyCost > 0 ? formatPrice(monthlyCost) : '—', Icon: DollarSign, positive: true },
    { label: 'Total P&L',    value: formatPnlMoney(totalPnl), Icon: totalPnl >= 0 ? TrendingUp : TrendingDown, positive: totalPnl >= 0 },
    { label: 'Next Renewal', value: nextRenewal?.expiresAt ? new Date(nextRenewal.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', Icon: CalendarClock, positive: true },
  ];

  const ownedIds = new Set(bots.map((b) => b.id));
  const recommended = ((recommendedQuery.data?.items ?? []) as Array<Record<string, unknown>>)
    .filter((item) => !ownedIds.has(String(item.strategyId)))
    .slice(0, 3)
    .map((item) => {
      const strategy = item.strategy as Record<string, unknown>;
      const perf = (strategy.performance as Record<string, unknown>[])?.[0] ?? {};
      return {
        id: String(item.strategyId),
        name: formatBotName(String(strategy.name)),
        category: String(strategy.category ?? ''),
        creator: (strategy.creator as { fullName?: string })?.fullName || 'Unknown',
        verified: Boolean(strategy.isVerified),
        winRate: Number(perf.winRate || 0),
        subscribers: Number(strategy.copiesCount || 0),
        monthlyPrice: Number(item.monthlyPrice || 0),
      };
    });

  // Show a couple of dashed "browse more" tiles so the grid never looks like a single orphan card.
  const addTileCount = filtered.length > 0 && filtered.length < 3 ? 3 - filtered.length : filtered.length === 0 ? 0 : 1;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary shadow-[0_4px_16px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">My Bots</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage your active trading bots and subscriptions</p>
          </div>
        </div>
        <Link
          href="/marketplace"
          className="btn-premium-ghost inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_srgb,var(--primary)_28%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-4 py-2 text-sm font-semibold text-primary transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
        >
          <Plus className="h-4 w-4" /> Browse Marketplace
        </Link>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.05, ease: 'easeOut' }}
            whileHover={{ y: -2 }}
            className="group relative overflow-hidden rounded-[16px] border border-[color-mix(in_srgb,var(--primary)_12%,var(--card-border))] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-4 backdrop-blur-md transition-shadow duration-[250ms] hover:shadow-[0_8px_28px_color-mix(in_srgb,var(--primary)_10%,transparent)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-200 group-hover:scale-105',
                  s.positive
                    ? 'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary'
                    : 'bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-destructive',
                )}
              >
                <s.Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
                <p
                  className={cn(
                    'truncate text-base font-bold tabular-nums',
                    s.positive ? 'text-foreground' : 'text-destructive',
                  )}
                >
                  {s.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2"
      >
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
              tab === t.key
                ? 'border-[color-mix(in_srgb,var(--primary)_30%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary'
                : 'border-transparent bg-[color-mix(in_srgb,var(--muted)_45%,transparent)] text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {counts[t.key] ? <span className="ml-1 opacity-60">({counts[t.key]})</span> : null}
          </button>
        ))}
      </motion.div>

      {/* Cards */}
      {!sessionReady || isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="marketplace-skeleton h-52 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : showHardError ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-10 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <p className="font-semibold text-foreground">Failed to load bots</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {(error as Error)?.message || 'Check your connection and try again'}
          </p>
          <DashButton
            variant="ghost"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-4 border border-[var(--card-border)]"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Retry
          </DashButton>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-14 text-center shadow-[var(--shadow-card)]"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[18px] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary">
            <Server className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-foreground">No bots here</h3>
          <p className="mb-5 text-sm text-muted-foreground">Browse the marketplace to subscribe to trading bots</p>
          <Link
            href="/marketplace"
            className="btn-premium inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-gradient-to-r from-primary to-[var(--primary-active)] px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all"
          >
            <ShoppingBag className="h-4 w-4" /> Go to Marketplace
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((bot, i) => {
            const st   = STATUS_CFG[bot.status] ?? STATUS_CFG.INACTIVE;
            const tone = TONE_CLASSES[st.tone];
            const pnl  = bot.currentPnl ?? 0;
            return (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className="group flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-5 shadow-[var(--shadow-card)] transition-shadow duration-[250ms] hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] hover:shadow-[var(--shadow-card-hover)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-[color-mix(in_srgb,var(--primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary transition-transform duration-200 group-hover:scale-105">
                      <Server className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{bot.category ?? 'BOT'}</p>
                      <h3 className="truncate text-sm font-bold text-foreground">{bot.name}</h3>
                    </div>
                  </div>
                  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', tone.badge)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                    {st.label}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 rounded-[12px] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] p-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">P&L</p>
                    <p className={cn('text-sm font-bold tabular-nums', pnl >= 0 ? 'text-primary' : 'text-destructive')}>
                      {formatPnlMoney(pnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Cost/mo</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{bot.monthlyPrice ? formatPrice(bot.monthlyPrice) : 'FREE'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Renewal</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {bot.expiresAt ? new Date(bot.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </p>
                  </div>
                </div>

                {/* Broker */}
                <div className="flex items-center gap-2 border-t border-[var(--card-border)] pt-3 text-xs text-muted-foreground">
                  <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {bot.brokerAccount?.accountName ??
                      (bot.brokerAccount?.broker
                        ? bot.brokerAccount.broker
                        : 'No broker linked')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {bot.status === 'ACTIVE' && (
                    <DashButton
                      variant="ghost"
                      onClick={() => pauseMut.mutate(bot.id)}
                      disabled={pauseMut.isPending}
                      className="flex-1 border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--muted)_45%,transparent)] text-muted-foreground hover:text-foreground"
                    >
                      <Pause className="h-3 w-3" /> Pause
                    </DashButton>
                  )}
                  {(bot.status === 'PAUSED' || bot.status === 'INACTIVE') && (
                    <DashButton
                      variant="ghost"
                      onClick={() => resumeMut.mutate(bot.id)}
                      disabled={resumeMut.isPending}
                      className="flex-1 border border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary hover:bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] hover:text-primary"
                    >
                      <Play className="h-3 w-3" /> Resume
                    </DashButton>
                  )}
                  {bot.status === 'EXPIRED' && (
                    <Link
                      href="/marketplace"
                      className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-xs font-semibold text-primary transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--primary)_16%,transparent)]"
                    >
                      <RefreshCw className="h-3 w-3" /> Renew
                    </Link>
                  )}
                  {(bot.status === 'ACTIVE' || bot.status === 'PAUSED') && (
                    <DashButton
                      variant="ghost"
                      onClick={() => { if (confirm('Cancel this bot subscription?')) cancelMut.mutate(bot.id); }}
                      disabled={cancelMut.isPending}
                      className="flex-1 border border-[color-mix(in_srgb,var(--destructive)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] text-destructive hover:bg-[color-mix(in_srgb,var(--destructive)_16%,transparent)] hover:text-destructive"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </DashButton>
                  )}
                  <Link
                    href={`/marketplace/${bot.id}`}
                    className="flex h-8 items-center gap-1 rounded-[10px] border border-[var(--card-border)] bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    Details <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            );
          })}

          {Array.from({ length: addTileCount }).map((_, i) => (
            <motion.div
              key={`add-tile-${i}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (filtered.length + i) * 0.04, ease: 'easeOut' }}
            >
              <Link
                href="/marketplace"
                className="group flex h-full min-h-[13rem] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[color-mix(in_srgb,var(--primary)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_4%,transparent)] p-5 text-center transition-all duration-200 hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--card-border))] hover:bg-[color-mix(in_srgb,var(--primary)_7%,transparent)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary transition-transform duration-200 group-hover:scale-110">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-foreground">Add another bot</p>
                <p className="max-w-[14rem] text-xs text-muted-foreground">Browse verified strategies in the marketplace</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recommended for you — fills the page meaningfully instead of leaving dead space */}
      {!isLoading && recommended.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Recommended for you</h2>
            </div>
            <Link href="/marketplace" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-5 shadow-[var(--shadow-card)] transition-shadow duration-[250ms] hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{rec.category || 'STRATEGY'}</p>
                    <h3 className="truncate text-sm font-bold text-foreground">{rec.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">by {rec.creator}</p>
                  </div>
                  {rec.verified && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-[12px] bg-[color-mix(in_srgb,var(--muted)_35%,transparent)] p-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Win Rate</p>
                    <p className="text-sm font-bold tabular-nums text-primary">{rec.winRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Subs</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{rec.subscribers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Price</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{rec.monthlyPrice > 0 ? formatPrice(rec.monthlyPrice) : 'FREE'}</p>
                  </div>
                </div>
                <Link
                  href={`/marketplace/${rec.id}`}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[color-mix(in_srgb,var(--primary)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] text-xs font-bold text-primary transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
                >
                  <Star className="h-3.5 w-3.5" /> View Strategy
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
