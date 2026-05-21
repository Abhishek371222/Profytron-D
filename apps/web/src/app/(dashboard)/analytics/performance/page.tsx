'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import { RefreshCcw, BarChart2, TrendingUp, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

const MONTHS_BY_RANGE: Record<AnalyticsRange, number> = {
  '1d': 1,
  '1w': 1,
  '1m': 2,
  '3m': 3,
  '1y': 6,
  all: Number.POSITIVE_INFINITY,
};

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-[#080d18]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {formatter ? formatter(entry.value, entry.name) : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function PerformanceAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const strategyQuery = useQuery({
    queryKey: ['analytics', 'strategy-comparison', range],
    queryFn: () => analyticsApi.getStrategyComparison(range),
    staleTime: 120_000,
    refetchInterval: 20_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly-returns'],
    queryFn: () => analyticsApi.getMonthlyReturns(),
    staleTime: 300_000,
    refetchInterval: 60_000,
  });

  const strategy = strategyQuery.data;
  const strategyChartData = React.useMemo(
    () => (strategy?.strategies ?? []).map((item) => ({ ...item, netPnlK: Number((item.netPnl / 1000).toFixed(2)) })),
    [strategy],
  );

  const monthly = React.useMemo(() => {
    if (!monthlyQuery.data) return { months: [] };
    const monthLimit = MONTHS_BY_RANGE[range];
    return {
      ...monthlyQuery.data,
      months: Number.isFinite(monthLimit) ? monthlyQuery.data.months.slice(-monthLimit) : monthlyQuery.data.months,
    };
  }, [monthlyQuery.data, range]);

  React.useEffect(() => {
    if (strategyQuery.isError || monthlyQuery.isError) {
      toast.error('Performance analytics unavailable', {
        description: 'Values populate after real closed trades are stored.',
      });
    }
  }, [monthlyQuery.isError, strategyQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'strategy-comparison'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'monthly-returns'] });
    toast.success('Performance refreshed');
  };

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] to-transparent p-5 md:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Performance Lab</h1>
              <p className="text-sm text-white/40 mt-0.5">
                Strategy comparisons, monthly return rhythm, and production-readiness scores.
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
                  ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                  : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/60 hover:border-white/15',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Strategy Performance Mix */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Strategy Performance</p>
          <p className="text-base font-bold text-white mb-1">Performance Mix</p>
          <p className="text-xs text-white/25 mb-4">Bars = net PnL (k) · Line = win rate %</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={strategyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}k`} width={35} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={35} />
                <Tooltip content={<CustomTooltip formatter={(v: number, n: string) => n === 'netPnlK' ? `$${v}k` : `${v.toFixed(1)}%`} />} />
                <Bar yAxisId="left" dataKey="netPnlK" fill="#10b981" radius={[6, 6, 0, 0]} opacity={0.8} />
                <Line yAxisId="right" dataKey="winRate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {strategyChartData.length === 0 && !strategyQuery.isLoading && (
            <p className="mt-3 text-xs text-white/20 uppercase tracking-widest">No strategy data yet</p>
          )}
        </motion.div>

        {/* Monthly Returns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-0.5">Monthly Returns</p>
          <p className="text-base font-bold text-white mb-1">Return Clarity</p>
          <p className="text-xs text-white/25 mb-4">Green = positive · Red = negative months</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly.months} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={35} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(2)}%`} />} />
                <Bar dataKey="returnPct" radius={[6, 6, 0, 0]}>
                  {monthly.months.map((item: any) => (
                    <Cell key={`${item.month}-${item.year}`} fill={item.returnPct >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {monthly.months.length === 0 && !monthlyQuery.isLoading && (
            <p className="mt-3 text-xs text-white/20 uppercase tracking-widest">No monthly data yet</p>
          )}
        </motion.div>
      </div>

      {/* ── Strategy Scorecard ── */}
      {(strategy?.strategies ?? []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Strategy Scorecard</p>
          <p className="text-base font-bold text-white mb-4">All Strategies Overview</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {strategy!.strategies.map((s) => (
              <div key={s.id} className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4 space-y-2 hover:border-emerald-400/20 transition-all">
                <p className="text-sm font-bold text-white truncate">{s.name}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/30 uppercase tracking-widest">Win Rate</span>
                    <span className="text-emerald-400 font-bold">{s.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/30 uppercase tracking-widest">Trades</span>
                    <span className="text-white font-bold">{s.trades}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/30 uppercase tracking-widest">Net PnL</span>
                    <span className={cn('font-bold', s.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {s.netPnl >= 0 ? '+' : ''}${s.netPnl.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    style={{ width: `${Math.min(100, s.winRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
