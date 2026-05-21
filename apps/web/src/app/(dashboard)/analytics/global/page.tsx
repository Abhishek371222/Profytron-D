'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { RefreshCcw, Globe, Crown, Medal, Award, TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const IMPACT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  HIGH: { label: 'High', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  LOW: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
  if (rank === 3) return <Award className="w-4 h-4 text-amber-500" />;
  return <span className="text-[11px] font-bold text-white/30">#{rank}</span>;
}

export default function GlobalAnalyticsPage() {
  const queryClient = useQueryClient();

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
    refetchInterval: 60_000,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: () => analyticsApi.getLeaderboard(10),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  const global = globalQuery.data;
  const leaderboard = leaderboardQuery.data;

  React.useEffect(() => {
    if (globalQuery.isError || leaderboardQuery.isError) {
      toast.error('Smart Analysis unavailable', {
        description: 'Global analytics populate after market data is ingested.',
      });
    }
  }, [globalQuery.isError, leaderboardQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'global'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'leaderboard'] });
    toast.success('Global feed refreshed');
  };

  const regimeLabel = global?.marketRegime?.label ?? null;
  const regimeConfidence = global?.marketRegime?.confidence ?? null;
  const macroEvents = global?.macroEvents ?? [];
  const sectorRotation = global?.sectorRotation ?? [];
  const leaderRows = leaderboard?.rows ?? [];

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] to-transparent p-5 md:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Smart Analysis</h1>
              <p className="text-sm text-white/40 mt-0.5">
                Macro signals, sector rotation, and leaderboard dynamics powered by real analytics.
              </p>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Market Regime Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[18px] border border-violet-400/15 bg-violet-400/[0.04] p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Market Regime</p>
          <p className="text-xl font-bold text-white">{regimeLabel ?? '—'}</p>
          {regimeLabel && (
            <div className="flex items-center gap-1.5 mt-2">
              <Zap className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-widest">Active signal</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[18px] border border-cyan-400/15 bg-cyan-400/[0.04] p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Regime Confidence</p>
          <p className="text-xl font-bold text-cyan-400">{regimeConfidence !== null ? `${regimeConfidence}%` : '—'}</p>
          {regimeConfidence !== null && (
            <div className="h-1 rounded-full bg-white/5 overflow-hidden mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${regimeConfidence}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"
              />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[18px] border border-amber-400/15 bg-amber-400/[0.04] p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Macro Events</p>
          <p className="text-xl font-bold text-amber-400">{macroEvents.length > 0 ? macroEvents.length : '—'}</p>
          {macroEvents.length > 0 && (
            <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">{macroEvents.length} active signals</p>
          )}
        </motion.div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Macro Event Feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Macro</p>
          <p className="text-base font-bold text-white mb-4">Event Feed</p>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto no-scrollbar">
            {macroEvents.length > 0 ? (
              macroEvents.map((event, i) => {
                const impact = IMPACT_CONFIG[event.impact?.toUpperCase?.()] ?? IMPACT_CONFIG.MEDIUM;
                return (
                  <motion.div
                    key={`${event.event}-${event.timestamp}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    className={cn(
                      'rounded-[14px] border p-3 transition-all',
                      impact.border,
                      impact.bg,
                      'hover:border-opacity-50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white leading-snug">{event.event}</p>
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg shrink-0', impact.bg, impact.color, 'border', impact.border)}>
                        {impact.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1.5 uppercase tracking-widest">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              !globalQuery.isLoading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <AlertTriangle className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <p className="text-[10px] text-white/20 uppercase tracking-widest">No macro events yet</p>
                </div>
              )
            )}
          </div>
        </motion.div>

        {/* Sector Rotation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Sectors</p>
          <p className="text-base font-bold text-white mb-4">Rotation Snapshot</p>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto no-scrollbar">
            {sectorRotation.length > 0 ? (
              sectorRotation.map((row) => {
                const isPos = row.netPnl >= 0;
                return (
                  <div
                    key={row.strategyId}
                    className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] p-3 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white/70 font-mono">{row.strategyId.slice(0, 10)}…</span>
                      <span className={cn('text-sm font-bold', isPos ? 'text-emerald-400' : 'text-rose-400')}>
                        {isPos ? '+' : ''}${row.netPnl.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-white/25 uppercase tracking-widest">
                      <span>Sharpe {row.sharpeRatio}</span>
                      <span>DD {row.drawdown}%</span>
                      <span>WR {row.winRate}%</span>
                    </div>
                    <div className="h-0.5 rounded-full bg-white/5 overflow-hidden mt-2.5">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isPos ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600',
                        )}
                        style={{ width: `${Math.min(100, Math.abs(row.winRate))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              !globalQuery.isLoading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <AlertTriangle className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  <p className="text-[10px] text-white/20 uppercase tracking-widest">No sector data yet</p>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Leaderboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Rankings</p>
        <p className="text-base font-bold text-white mb-4">Global Leaderboard</p>
        {leaderRows.length > 0 ? (
          <div className="space-y-2">
            {leaderRows.map((row, i) => {
              const isPos = row.totalPnl >= 0;
              const isTop3 = row.rank <= 3;
              return (
                <motion.div
                  key={row.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className={cn(
                    'flex items-center gap-3 rounded-[14px] border p-3 transition-all',
                    isTop3
                      ? 'border-yellow-400/10 bg-yellow-400/[0.025] hover:border-yellow-400/20'
                      : 'border-white/[0.05] bg-white/[0.02] hover:border-white/10',
                  )}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{row.username}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">{row.totalTrades} trades</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-bold', isPos ? 'text-emerald-400' : 'text-rose-400')}>
                      {isPos ? '+' : ''}${row.totalPnl.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {isPos ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400/50" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-400/50" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          !leaderboardQuery.isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-400/15 bg-amber-400/5 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-300/70">No leaderboard entries yet.</p>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}
