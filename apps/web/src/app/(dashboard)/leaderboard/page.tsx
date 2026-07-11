'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, type LeaderboardEntry, type TopStrategy } from '@/lib/api/leaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardTabs,
  DashErrorState,
} from '@/components/dashboard/DashboardPrimitives';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Trophy, Users, Star, Crown, Medal, Award, BarChart3 } from 'lucide-react';

const TABS = ['Monthly', 'All Time', 'Top Strategies'] as const;
type Tab = (typeof TABS)[number];

function formatProfitRate(value: number): string {
  if (!Number.isFinite(value)) return '0.00%';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function profitRateClassName(value: number): string {
  if (!Number.isFinite(value) || value === 0) return 'text-muted-foreground';
  return value > 0 ? 'text-chart-3' : 'text-destructive';
}

/* ── Podium config for rank 1-3 ── */
const PODIUM = [
  {
    rank: 1,
    Icon: Crown,
    gradient: 'from-yellow-400/25 to-amber-600/5',
    border: 'border-yellow-400/30',
    glow: 'shadow-[0_0_40px_rgba(234,179,8,0.15)]',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-400/10 border-yellow-400/25',
    badge: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
    ring: 'ring-yellow-400/30',
    barColor: 'bg-gradient-to-t from-yellow-600 to-yellow-400',
    height: 'h-20',
  },
  {
    rank: 2,
    Icon: Medal,
    gradient: 'from-slate-300/15 to-slate-500/0',
    border: 'border-slate-400/20',
    glow: 'shadow-[0_0_30px_rgba(148,163,184,0.1)]',
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-slate-300/10 border-slate-300/20',
    badge: 'bg-slate-300/10 text-muted-foreground border-slate-300/20',
    ring: 'ring-slate-300/20',
    barColor: 'bg-gradient-to-t from-slate-500 to-slate-300',
    height: 'h-14',
  },
  {
    rank: 3,
    Icon: Award,
    gradient: 'from-amber-600/20 to-amber-800/0',
    border: 'border-amber-600/25',
    glow: 'shadow-[0_0_25px_rgba(217,119,6,0.12)]',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-600/10 border-amber-600/20',
    badge: 'bg-amber-600/10 text-chart-4 border-amber-600/20',
    ring: 'ring-amber-600/25',
    barColor: 'bg-gradient-to-t from-amber-700 to-chart-4',
    height: 'h-10',
  },
];

function Avatar({ user }: { user: LeaderboardEntry['user'] }) {
  return <UserAvatar name={user.fullName ?? 'Trader'} src={user.avatarUrl} size="lg" className="w-full h-full" />;
}

function PodiumCard({ entry, config, myUserId }: { entry: LeaderboardEntry; config: typeof PODIUM[0]; myUserId?: string | null }) {
  const isMe = entry.userId === myUserId;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: config.rank * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-[26px] border bg-gradient-to-b p-5 transition-all duration-300',
        config.gradient, config.border, config.glow,
        isMe ? 'ring-2 ' + config.ring : '',
      )}
    >
      {/* Rank icon */}
      <div className={cn('w-10 h-10 rounded-2xl border flex items-center justify-center', config.iconBg)}>
        <config.Icon className={cn('w-5 h-5', config.iconColor)} />
      </div>

      {/* Avatar */}
      <div className={cn('w-14 h-14 rounded-full border-2 overflow-hidden', config.border)}>
        <Avatar user={entry.user} />
      </div>

      {/* Name */}
      <div className="text-center space-y-0.5">
        <p className="text-sm font-bold text-foreground truncate max-w-[120px]">{entry.user.fullName}</p>
        {entry.user.username && (
          <p className="text-micro text-foreground/30 uppercase tracking-widest">@{entry.user.username}</p>
        )}
        {isMe && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-primary/20 text-primary text-micro font-bold uppercase tracking-widest">
            You
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-center">
        <div>
          <p className={cn('text-base font-bold', entry.totalPnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
            {entry.totalPnl >= 0 ? '+' : ''}${Math.abs(entry.totalPnl).toFixed(0)}
          </p>
          <p className="text-micro text-foreground/25 uppercase tracking-widest">Earnings</p>
        </div>
        <div className="w-px h-6 bg-foreground/10" />
        <div>
          <p className="text-base font-bold text-chart-5">{entry.winRate.toFixed(1)}%</p>
          <p className="text-micro text-foreground/25 uppercase tracking-widest">Win rate</p>
        </div>
      </div>

      {/* Podium bar */}
      <div className={cn('w-full rounded-full overflow-hidden bg-foreground/5', config.height)}>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.5 + config.rank * 0.05, duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: 'bottom' }}
          className={cn('w-full h-full rounded-full', config.barColor)}
        />
      </div>
    </motion.div>
  );
}

function TraderRow({
  entry,
  myUserId,
  index = 0,
}: {
  entry: LeaderboardEntry;
  myUserId?: string | null;
  index?: number;
}) {
  const isMe = entry.userId === myUserId;
  const isTop3 = entry.rank <= 3;
  // Only animate the first 20 rows to prevent layout thrash on large lists
  const shouldAnimate = index < 20;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, x: -12 } : false}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.4, ease: 'easeOut', delay: shouldAnimate ? index * 0.03 : 0 }}
      className={cn(
        'flex flex-col gap-3 rounded-[20px] border p-4 transition-all duration-300 hover:-translate-y-px',
        isMe
          ? 'bg-primary/5 border-primary/20 hover:border-primary/35'
          : isTop3
          ? 'bg-yellow-400/[0.02] border-yellow-400/10 hover:border-yellow-400/20'
          : 'bg-muted/2 border-white/[0.05] hover:border-border',
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
      {/* Rank number */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-xs font-bold',
          entry.rank === 1
            ? 'bg-yellow-400/10 border-yellow-400/25 text-yellow-400'
            : entry.rank === 2
            ? 'bg-slate-300/10 border-slate-300/20 text-muted-foreground'
            : entry.rank === 3
            ? 'bg-amber-600/10 border-amber-600/20 text-chart-4'
            : 'bg-muted/4 border-[var(--card-border)] text-foreground/30',
        )}
      >
        {entry.rank <= 3 ? (
          entry.rank === 1 ? <Crown className="w-4 h-4" /> : entry.rank === 2 ? <Medal className="w-4 h-4" /> : <Award className="w-4 h-4" />
        ) : (
          `#${entry.rank}`
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full border border-border overflow-hidden shrink-0">
        <Avatar user={entry.user} />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground truncate">{entry.user.fullName}</p>
          {isMe && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-micro font-bold uppercase tracking-widest shrink-0">
              You
            </span>
          )}
        </div>
        {entry.user.username && (
          <p className="text-micro text-foreground/25 uppercase tracking-widest">@{entry.user.username}</p>
        )}
      </div>

      {/* Stats — desktop */}
      <div className="hidden shrink-0 items-center gap-4 text-right sm:flex sm:gap-6">
        <div>
          <p className="mb-0.5 text-micro uppercase tracking-widest text-foreground/25">Win Rate</p>
          <p className="text-sm font-bold text-chart-3">{entry.winRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="mb-0.5 text-micro uppercase tracking-widest text-foreground/25">Earnings</p>
          <p className={cn('text-sm font-bold', entry.totalPnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
            {entry.totalPnl >= 0 ? '+' : ''}${Math.abs(entry.totalPnl).toFixed(0)}
          </p>
        </div>
        <div>
          <p className="mb-0.5 text-micro uppercase tracking-widest text-foreground/25">Trades</p>
          <p className="text-sm font-bold text-foreground">{entry.totalTrades}</p>
        </div>
      </div>
      </div>

      {/* Stats — mobile */}
      <div className="grid grid-cols-3 gap-2 border-t border-[var(--card-border)] pt-3 sm:hidden">
        <div className="min-w-0 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Win Rate</p>
          <p className="mt-0.5 text-xs font-bold text-chart-3">{entry.winRate.toFixed(1)}%</p>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Earnings</p>
          <p className={cn('mt-0.5 text-xs font-bold', entry.totalPnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
            {entry.totalPnl >= 0 ? '+' : ''}${Math.abs(entry.totalPnl).toFixed(0)}
          </p>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Trades</p>
          <p className="mt-0.5 text-xs font-bold text-foreground">{entry.totalTrades}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StrategyRow({ strategy, idx }: { strategy: TopStrategy; idx: number }) {
  const profitRate = strategy.profitRate;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="rounded-[20px] border border-white/[0.05] bg-muted/2 p-4 transition-all duration-300 hover:-translate-y-px hover:border-primary/20 hover:bg-primary/[0.03]"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 sm:h-10 sm:w-10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{strategy.name}</p>
          <p className="text-micro uppercase tracking-widest text-foreground/25">{strategy.category}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-5 text-right sm:flex">
          <div>
            <p className="mb-0.5 text-micro uppercase tracking-widest text-foreground/25">Subscribers</p>
            <p className="flex items-center justify-end gap-1 text-sm font-bold text-foreground">
              <Users className="h-3 w-3 text-foreground/25" />
              {strategy.subscribers}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-micro uppercase tracking-widest text-foreground/25">Profit Rate</p>
            <p className={cn('text-sm font-bold', profitRateClassName(profitRate))}>
              {formatProfitRate(profitRate)}
            </p>
          </div>
          {strategy.monthlyPrice !== null && (
            <div>
              <p className="mb-0.5 text-micro uppercase tracking-widest text-foreground/25">Price</p>
              <p className="text-sm font-bold text-foreground">₹{strategy.monthlyPrice}/mo</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--card-border)] pt-3 sm:hidden">
        <div className="rounded-lg bg-muted/30 px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Subscribers</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{strategy.subscribers.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-muted/30 px-2.5 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Profit Rate</p>
          <p className={cn('mt-0.5 text-sm font-bold', profitRateClassName(profitRate))}>
            {formatProfitRate(profitRate)}
          </p>
        </div>
        {strategy.monthlyPrice !== null && (
          <div className="col-span-2 rounded-lg bg-muted/30 px-2.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Price</p>
            <p className="mt-0.5 text-sm font-bold text-foreground">₹{strategy.monthlyPrice}/mo</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = React.useState<Tab>('Monthly');

  const monthlyQ = useQuery({
    queryKey: ['leaderboard', 'monthly'],
    queryFn: () => leaderboardApi.monthly(),
    enabled: tab === 'Monthly',
  });

  const allTimeQ = useQuery({
    queryKey: ['leaderboard', 'alltime'],
    queryFn: () => leaderboardApi.allTime(),
    enabled: tab === 'All Time',
  });

  const strategiesQ = useQuery({
    queryKey: ['leaderboard', 'strategies'],
    queryFn: () => leaderboardApi.topStrategies(),
    enabled: tab === 'Top Strategies',
  });

  const myRankQ = useQuery({
    queryKey: ['leaderboard', 'me'],
    queryFn: () => leaderboardApi.myRank(),
  });

  const activeTraderQuery = tab === 'Monthly' ? monthlyQ : tab === 'All Time' ? allTimeQ : null;
  const activeQuery =
    tab === 'Top Strategies' ? strategiesQ : activeTraderQuery ?? monthlyQ;

  const isLoading = activeQuery.isLoading || activeQuery.isPending;
  const isError = activeQuery.isError;
  const entries: LeaderboardEntry[] =
    activeTraderQuery?.isSuccess ? (activeTraderQuery.data?.entries ?? []) : [];
  const strategies: TopStrategy[] = strategiesQ.isSuccess
    ? (strategiesQ.data ?? [])
    : [];
  const myRank = myRankQ.data;
  const myUserId = myRank?.monthly?.userId ?? myRank?.allTime?.userId ?? null;

  const errorMessage =
    tab === 'Monthly'
      ? 'Could not load the monthly leaderboard.'
      : tab === 'All Time'
        ? 'Could not load the all-time leaderboard.'
        : 'Could not load top strategies.';

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <DashboardPage>
      <DashboardBreadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leaderboard' }]} />

      <DashboardPageHeader
        title="Leaderboard"
        description="Best traders, live rankings, and top-performing strategies."
        icon={Trophy}
        iconClassName="bg-amber-500/10 text-amber-600 border border-amber-500/20"
      />

      {/* ── My Rank Cards ── */}
      {myRank && (myRank.monthly || myRank.allTime) && (
        <div className="grid grid-cols-2 gap-4">
          {myRank.monthly && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="dashboard-card p-5 space-y-1 border-primary/20 bg-primary/5 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
            >
              <p className="dash-eyebrow">Your Monthly Rank</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">#{myRank.monthly.rank}</p>
              <p className="text-xs text-primary font-semibold">{myRank.monthly.winRate.toFixed(1)}% win rate</p>
            </motion.div>
          )}
          {myRank.allTime && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="dashboard-card p-5 space-y-1 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
            >
              <p className="dash-eyebrow">Your All-Time Rank</p>
              <p className="text-3xl font-bold text-foreground tabular-nums">#{myRank.allTime.rank}</p>
              <p className="text-xs text-muted-foreground font-semibold">{myRank.allTime.totalTrades} trades</p>
            </motion.div>
          )}
        </div>
      )}

      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading leaderboard">
          {/* Podium skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="hidden h-56 animate-pulse rounded-[26px] border border-white/[0.05] bg-muted/25 sm:block"
              />
            ))}
          </div>
          <div className="space-y-2 sm:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-[26px] border border-white/[0.05] bg-muted/25" />
            ))}
          </div>
          {/* Row skeletons */}
          <div className="space-y-2 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-[20px] bg-muted/2 border border-[var(--card-border)] animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>
      ) : isError ? (
        <DashErrorState message={errorMessage} onRetry={() => activeQuery.refetch()} />
      ) : tab === 'Top Strategies' ? (
        <AnimatePresence mode="wait">
          <div className="space-y-3">
            <p className="text-micro text-foreground/20 uppercase tracking-widest font-bold">{strategies.length} strategies</p>
            {strategies.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-[20px] bg-muted border border-[var(--card-border)] flex items-center justify-center mx-auto">
                  <Star className="w-7 h-7 text-foreground/10" />
                </div>
                <p className="text-sm text-foreground/20 uppercase tracking-widest">No top strategies yet</p>
              </div>
            ) : (
              strategies.map((s, i) => <StrategyRow key={s.id} strategy={s} idx={i} />)
            )}
          </div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <div className="space-y-5">
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {top3.map((entry) => {
                  const cfg = PODIUM.find((p) => p.rank === entry.rank)!;
                  return <PodiumCard key={entry.id} entry={entry} config={cfg} myUserId={myUserId} />;
                })}
              </div>
            )}

            {/* Rest of list */}
            <div className="space-y-2">
              {rest.length === 0 && entries.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-[20px] bg-muted border border-[var(--card-border)] flex items-center justify-center mx-auto">
                    <Trophy className="w-7 h-7 text-foreground/10" />
                  </div>
                  <p className="text-sm text-foreground/20 uppercase tracking-widest">No one ranked yet — make your first trade!</p>
                </div>
              ) : (
                <>
                  {rest.length > 0 && (
                    <p className="text-micro text-foreground/15 uppercase tracking-widest font-bold mb-3">
                      {entries.length} traders
                    </p>
                  )}
                  {rest.map((entry, idx) => (
                    <TraderRow key={entry.id} entry={entry} myUserId={myUserId} index={idx} />
                  ))}
                </>
              )}
            </div>
          </div>
        </AnimatePresence>
      )}
    </DashboardPage>
  );
}
