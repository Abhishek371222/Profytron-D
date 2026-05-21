'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, type LeaderboardEntry, type TopStrategy } from '@/lib/api/leaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, Users, Star, Crown, Medal, Award, BarChart3, Loader2, Zap } from 'lucide-react';

const TABS = ['Monthly', 'All Time', 'Top Strategies'] as const;
type Tab = (typeof TABS)[number];

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
    iconColor: 'text-slate-300',
    iconBg: 'bg-slate-300/10 border-slate-300/20',
    badge: 'bg-slate-300/10 text-slate-300 border-slate-300/20',
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
    badge: 'bg-amber-600/10 text-amber-500 border-amber-600/20',
    ring: 'ring-amber-600/25',
    barColor: 'bg-gradient-to-t from-amber-700 to-amber-500',
    height: 'h-10',
  },
];

function Avatar({ user }: { user: LeaderboardEntry['user'] }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="w-full h-full rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full rounded-full bg-indigo-500/20 flex items-center justify-center">
      <span className="text-indigo-300 font-bold text-sm">{user.fullName?.charAt(0) ?? '?'}</span>
    </div>
  );
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
        <p className="text-sm font-bold text-white truncate max-w-[120px]">{entry.user.fullName}</p>
        {entry.user.username && (
          <p className="text-[10px] text-white/30 uppercase tracking-widest">@{entry.user.username}</p>
        )}
        {isMe && (
          <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-widest">
            You
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-center">
        <div>
          <p className={cn('text-base font-bold', entry.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {entry.totalPnl >= 0 ? '+' : ''}${Math.abs(entry.totalPnl).toFixed(0)}
          </p>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Earnings</p>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div>
          <p className="text-base font-bold text-cyan-400">{entry.winRate.toFixed(1)}%</p>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Win rate</p>
        </div>
      </div>

      {/* Podium bar */}
      <div className={cn('w-full rounded-full overflow-hidden bg-white/5', config.height)}>
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
        'flex items-center gap-4 p-4 rounded-[20px] border transition-all duration-300 hover:-translate-y-px',
        isMe
          ? 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-400/35'
          : isTop3
          ? 'bg-yellow-400/[0.02] border-yellow-400/10 hover:border-yellow-400/20'
          : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10',
      )}
    >
      {/* Rank number */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-xs font-bold',
          entry.rank === 1
            ? 'bg-yellow-400/10 border-yellow-400/25 text-yellow-400'
            : entry.rank === 2
            ? 'bg-slate-300/10 border-slate-300/20 text-slate-300'
            : entry.rank === 3
            ? 'bg-amber-600/10 border-amber-600/20 text-amber-500'
            : 'bg-white/[0.04] border-white/[0.08] text-white/30',
        )}
      >
        {entry.rank <= 3 ? (
          entry.rank === 1 ? <Crown className="w-4 h-4" /> : entry.rank === 2 ? <Medal className="w-4 h-4" /> : <Award className="w-4 h-4" />
        ) : (
          `#${entry.rank}`
        )}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
        <Avatar user={entry.user} />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white truncate">{entry.user.fullName}</p>
          {isMe && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-widest shrink-0">
              You
            </span>
          )}
        </div>
        {entry.user.username && (
          <p className="text-[10px] text-white/25 uppercase tracking-widest">@{entry.user.username}</p>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Win Rate</p>
          <p className="text-sm font-bold text-emerald-400">{entry.winRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Earnings</p>
          <p className={cn('text-sm font-bold', entry.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {entry.totalPnl >= 0 ? '+' : ''}${Math.abs(entry.totalPnl).toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Trades</p>
          <p className="text-sm font-bold text-white">{entry.totalTrades}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StrategyRow({ strategy, idx }: { strategy: TopStrategy; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-[20px] border border-white/[0.05] bg-white/[0.02] hover:border-indigo-400/20 hover:bg-indigo-500/[0.03] transition-all duration-300 hover:-translate-y-px"
    >
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <BarChart3 className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{strategy.name}</p>
        <p className="text-[10px] text-white/25 uppercase tracking-widest">{strategy.category}</p>
      </div>
      <div className="hidden sm:flex items-center gap-5 text-right shrink-0">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Subscribers</p>
          <p className="text-sm font-bold text-white flex items-center justify-end gap-1">
            <Users className="w-3 h-3 text-white/25" />
            {strategy.subscribers}
          </p>
        </div>
        {strategy.latestPerformance && (
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Win Rate</p>
            <p className="text-sm font-bold text-emerald-400">
              {strategy.latestPerformance.winRate?.toFixed(1) ?? '—'}%
            </p>
          </div>
        )}
        {strategy.monthlyPrice !== null && (
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Price</p>
            <p className="text-sm font-bold text-white">${strategy.monthlyPrice}/mo</p>
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

  const activeData = tab === 'Monthly' ? monthlyQ : tab === 'All Time' ? allTimeQ : null;
  const isLoading = activeData?.isLoading ?? strategiesQ.isLoading;
  const entries: LeaderboardEntry[] = activeData?.data?.entries ?? [];
  const strategies: TopStrategy[] = strategiesQ.data ?? [];
  const myRank = myRankQ.data;
  const myUserId = myRank?.monthly?.userId ?? myRank?.allTime?.userId ?? null;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6 pb-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-yellow-400/6 blur-[120px]" />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-yellow-400/15 bg-gradient-to-br from-yellow-400/[0.04] to-transparent p-6 md:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-yellow-400/70">
                Live Rankings
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
            <p className="text-sm text-white/40">Best traders · Rankings · Top strategies</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </motion.div>

      {/* ── My Rank Cards ── */}
      {myRank && (myRank.monthly || myRank.allTime) && (
        <div className="grid grid-cols-2 gap-4">
          {myRank.monthly && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-[22px] border border-indigo-500/20 bg-indigo-500/5 space-y-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Your Monthly Rank</p>
              <p className="text-3xl font-bold text-white">#{myRank.monthly.rank}</p>
              <p className="text-xs text-indigo-300 font-semibold">{myRank.monthly.winRate.toFixed(1)}% win rate</p>
            </motion.div>
          )}
          {myRank.allTime && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="p-5 rounded-[22px] border border-white/[0.08] bg-white/[0.03] space-y-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Your All‑Time Rank</p>
              <p className="text-3xl font-bold text-white">#{myRank.allTime.rank}</p>
              <p className="text-xs text-white/40 font-semibold">{myRank.allTime.totalTrades} trades</p>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300',
              tab === t
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-white/25 hover:text-white/50',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading leaderboard">
          {/* Podium skeleton */}
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-[26px] bg-white/[0.025] border border-white/[0.05] animate-pulse"
              />
            ))}
          </div>
          {/* Row skeletons */}
          <div className="space-y-2 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-[20px] bg-white/[0.02] border border-white/[0.04] animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>
      ) : tab === 'Top Strategies' ? (
        <AnimatePresence mode="wait">
          <div className="space-y-3">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{strategies.length} strategies</p>
            {strategies.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-[20px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                  <Star className="w-7 h-7 text-white/10" />
                </div>
                <p className="text-sm text-white/20 uppercase tracking-widest">No top strategies yet</p>
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
              <div className="grid grid-cols-3 gap-3">
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
                  <div className="w-16 h-16 rounded-[20px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                    <Trophy className="w-7 h-7 text-white/10" />
                  </div>
                  <p className="text-sm text-white/20 uppercase tracking-widest">No one ranked yet — make your first trade!</p>
                </div>
              ) : (
                <>
                  {rest.length > 0 && (
                    <p className="text-[10px] text-white/15 uppercase tracking-widest font-bold mb-3">
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
    </div>
  );
}
