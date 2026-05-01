'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, type LeaderboardEntry, type TopStrategy } from '@/lib/api/leaderboard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, Users, Star, Crown, Medal, Award, BarChart3, Loader2 } from 'lucide-react';

const TABS = ['Monthly', 'All Time', 'Top Strategies'] as const;
type Tab = (typeof TABS)[number];

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  2: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
  3: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
};

const RANK_ICONS: Record<number, React.ElementType> = {
  1: Crown,
  2: Medal,
  3: Award,
};

function RankBadge({ rank }: { rank: number }) {
  const color = RANK_COLORS[rank] ?? 'text-white/30 bg-white/5 border-white/10';
  const Icon = RANK_ICONS[rank];
  return (
    <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', color)}>
      {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-bold">#{rank}</span>}
    </div>
  );
}

function Avatar({ user }: { user: LeaderboardEntry['user'] }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full object-cover border border-white/10" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-p/20 border border-p/30 flex items-center justify-center">
      <span className="text-p font-bold text-sm">{user.fullName?.charAt(0) || '?'}</span>
    </div>
  );
}

function TraderRow({ entry, myRank }: { entry: LeaderboardEntry; myRank?: string | null }) {
  const isMe = entry.userId === myRank;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl border transition-all',
        isMe
          ? 'bg-p/5 border-p/20'
          : entry.rank <= 3
          ? 'bg-white/3 border-white/8 hover:border-white/15'
          : 'bg-white/2 border-white/5 hover:border-white/10',
      )}
    >
      <RankBadge rank={entry.rank} />
      <Avatar user={entry.user} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{entry.user.fullName}</p>
          {isMe && (
            <span className="px-1.5 py-0.5 rounded-full bg-p/20 text-p text-[9px] font-bold uppercase tracking-widest">You</span>
          )}
        </div>
        {entry.user.username && (
          <p className="text-[10px] text-white/30 uppercase tracking-widest">@{entry.user.username}</p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Win Rate</p>
          <p className="text-sm font-bold text-emerald-400">{entry.winRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">P&L</p>
          <p className={cn('text-sm font-bold', entry.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {entry.totalPnl >= 0 ? '+' : ''}${entry.totalPnl.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Trades</p>
          <p className="text-sm font-bold text-white">{entry.totalTrades}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StrategyRow({ strategy }: { strategy: TopStrategy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-p/15 border border-p/20 flex items-center justify-center shrink-0">
        <BarChart3 className="w-5 h-5 text-p" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{strategy.name}</p>
        <p className="text-[10px] text-white/30 uppercase tracking-widest">{strategy.category}</p>
      </div>
      <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Subscribers</p>
          <p className="text-sm font-bold text-white flex items-center gap-1">
            <Users className="w-3 h-3 text-white/30" />{strategy.subscribers}
          </p>
        </div>
        {strategy.latestPerformance && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Win Rate</p>
            <p className="text-sm font-bold text-emerald-400">{strategy.latestPerformance.winRate?.toFixed(1) ?? '—'}%</p>
          </div>
        )}
        {strategy.monthlyPrice !== null && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Price</p>
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
  const isLoading = activeData?.isLoading || strategiesQ.isLoading;
  const entries: LeaderboardEntry[] = activeData?.data?.entries ?? [];
  const strategies: TopStrategy[] = strategiesQ.data ?? [];

  const myRank = myRankQ.data;
  const myMonthlyRank = myRank?.monthly?.rank;
  const myAllTimeRank = myRank?.allTime?.rank;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">Leaderboard</h2>
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Top performers · Rankings · Elite strategies</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      {/* My Rank Cards */}
      {myRank && (myRank.monthly || myRank.allTime) && (
        <div className="grid grid-cols-2 gap-4">
          {myRank.monthly && (
            <div className="p-4 rounded-2xl bg-p/5 border border-p/15 space-y-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Your Monthly Rank</p>
              <p className="text-2xl font-bold text-white">#{myMonthlyRank}</p>
              <p className="text-xs text-p">{myRank.monthly.winRate.toFixed(1)}% win rate</p>
            </div>
          )}
          {myRank.allTime && (
            <div className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-1">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Your All-Time Rank</p>
              <p className="text-2xl font-bold text-white">#{myAllTimeRank}</p>
              <p className="text-xs text-white/40">{myRank.allTime.totalTrades} trades</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
              tab === t ? 'bg-p text-white shadow-lg' : 'text-white/30 hover:text-white/60',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : tab === 'Top Strategies' ? (
        <div className="space-y-3">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{strategies.length} strategies</p>
          {strategies.length === 0 ? (
            <div className="py-16 text-center">
              <Star className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/20 uppercase tracking-widest">No strategies ranked yet</p>
            </div>
          ) : (
            strategies.map((s) => <StrategyRow key={s.id} strategy={s} />)
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">{entries.length} traders</p>
          {entries.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/20 uppercase tracking-widest">No rankings yet — start trading!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <TraderRow key={entry.id} entry={entry} myRank={myRankQ.data?.monthly?.userId} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
