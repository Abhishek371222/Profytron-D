'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { RefreshCcw, Activity, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-[#080d18]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color ?? '#22d3ee' }}>
          {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-[#080d18]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">{payload[0]?.name}</p>
      <p className="text-sm font-bold text-cyan-400">{payload[0]?.value}</p>
    </div>
  );
}

export default function TradeAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const tradeQuery = useQuery({
    queryKey: ['analytics', 'trades', range],
    queryFn: () => analyticsApi.getTrades(range),
    staleTime: 120_000,
    refetchInterval: 30_000,
  });

  const trade = tradeQuery.data;
  const hasData = Boolean(trade?.distribution?.length || trade?.winLoss?.length || trade?.symbolPerformance?.length);

  const wins = trade?.winLoss?.find((w) => w.name === 'Win')?.value ?? 0;
  const losses = trade?.winLoss?.find((w) => w.name === 'Loss')?.value ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : null;

  React.useEffect(() => {
    if (tradeQuery.isError) {
      toast.error('Trade analytics unavailable', {
        description: 'Trade data appears after real closed trades are recorded.',
      });
    }
  }, [tradeQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'trades'] });
    toast.success('Trade analytics refreshed');
  };

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.05] to-transparent p-5 md:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Trade Forensics</h1>
              <p className="text-sm text-white/40 mt-0.5">
                Distribution analytics, win-loss geometry, and symbol-level trade quality.
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
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] border transition-all duration-300',
                range === option
                  ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                  : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/60 hover:border-white/15',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Wins',
            value: wins > 0 ? wins : '—',
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/8',
            border: 'border-emerald-400/15',
          },
          {
            label: 'Losses',
            value: losses > 0 ? losses : '—',
            icon: TrendingDown,
            color: 'text-rose-400',
            bg: 'bg-rose-400/8',
            border: 'border-rose-400/15',
          },
          {
            label: 'Win Rate',
            value: winRate ? `${winRate}%` : '—',
            icon: Target,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/8',
            border: 'border-cyan-400/15',
          },
          {
            label: 'Symbols',
            value: trade?.symbolPerformance?.length ?? '—',
            icon: Activity,
            color: 'text-violet-400',
            bg: 'bg-violet-400/8',
            border: 'border-violet-400/15',
          },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-[18px] border p-4 flex items-center gap-3',
              border,
              bg,
            )}
          >
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', bg, 'border', border)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">{label}</p>
              <p className={cn('text-lg font-bold', color)}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Distribution</p>
          <p className="text-base font-bold text-white mb-4">Earnings Distribution</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trade?.distribution ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {(trade?.distribution ?? []).map((entry: any, i: number) => (
                    <Cell key={i} fill="#22d3ee" fillOpacity={0.75 - i * 0.04} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!tradeQuery.isLoading && !trade?.distribution?.length && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-white/15 uppercase tracking-[0.4em]">No distribution data</p>
            </div>
          )}
        </motion.div>

        {/* Win / Loss */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Win vs Loss</p>
          <p className="text-base font-bold text-white mb-4">Trade Outcome Split</p>
          <div className="h-[280px] flex items-center justify-center">
            {(trade?.winLoss ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trade!.winLoss}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {trade!.winLoss.map((entry, idx) => (
                      <Cell key={`${entry.name}-${idx}`} fill={idx === 0 ? '#34d399' : '#fb7185'} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-white/15 uppercase tracking-[0.4em]">No outcome data</p>
            )}
          </div>
          {(trade?.winLoss ?? []).length > 0 && (
            <div className="flex items-center justify-center gap-5 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">Win</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">Loss</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Symbol Performance ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Symbol Performance</p>
        <p className="text-base font-bold text-white mb-4">Per-Symbol Breakdown</p>
        {(trade?.symbolPerformance ?? []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trade!.symbolPerformance.map((item) => {
              const isPos = item.pnl >= 0;
              return (
                <div
                  key={item.symbol}
                  className={cn(
                    'rounded-[16px] border p-4 transition-all',
                    isPos
                      ? 'border-emerald-400/15 bg-emerald-400/[0.04] hover:border-emerald-400/30'
                      : 'border-rose-400/15 bg-rose-400/[0.04] hover:border-rose-400/30',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white tracking-wider">{item.symbol}</p>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg',
                        isPos ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400',
                      )}
                    >
                      {isPos ? 'Profit' : 'Loss'}
                    </span>
                  </div>
                  <p className={cn('text-lg font-bold', isPos ? 'text-emerald-400' : 'text-rose-400')}>
                    {isPos ? '+' : ''}${item.pnl.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">{item.trades} trades</p>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.abs(item.pnl / 100))}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        isPos ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 to-rose-600',
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !tradeQuery.isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-400/15 bg-amber-400/5 w-fit">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-300/70">No symbol data yet. Values appear after closed trades are recorded.</p>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}
