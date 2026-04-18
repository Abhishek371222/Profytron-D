'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { demoMonthlyReturnsByRange, demoStrategy } from '../_lib/demoData';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

const MONTHS_BY_RANGE: Record<AnalyticsRange, number> = {
  '1d': 1,
  '1w': 1,
  '1m': 2,
  '3m': 3,
  '1y': 6,
  all: Number.POSITIVE_INFINITY,
};

export default function PerformanceAnalyticsPage() {
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const strategyQuery = useQuery({
    queryKey: ['analytics', 'strategy-comparison', range],
    queryFn: () => analyticsApi.getStrategyComparison(range),
    staleTime: 120_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly-returns'],
    queryFn: () => analyticsApi.getMonthlyReturns(),
    staleTime: 300_000,
  });

  const strategy = strategyQuery.data ?? demoStrategy(range);
  const monthly = React.useMemo(() => {
    if (!monthlyQuery.data) {
      return demoMonthlyReturnsByRange(range);
    }

    const monthLimit = MONTHS_BY_RANGE[range];
    const months = Number.isFinite(monthLimit)
      ? monthlyQuery.data.months.slice(-monthLimit)
      : monthlyQuery.data.months;

    return {
      ...monthlyQuery.data,
      months,
    };
  }, [monthlyQuery.data, range]);

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1233] via-[#07122d] to-[#081726] p-6">
        <h1 className="text-2xl font-semibold text-white">Performance Lab</h1>
        <p className="mt-2 text-sm text-white/70">Deep comparison across strategies, monthly return rhythm, and production-readiness indicators.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${
                range === option
                  ? 'border-cyan-300/50 bg-cyan-300/20 text-white'
                  : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-black/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Strategy Net PnL</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategy.strategies}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="netPnl" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-white/10 bg-black/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Monthly Returns</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="returnPct" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/40 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Strategy Scorecard</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {strategy.strategies.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{s.name}</p>
              <p className="mt-1 text-xs text-white/65">Trades: {s.trades}</p>
              <p className="mt-1 text-xs text-emerald-300">Win Rate: {s.winRate}%</p>
              <p className="mt-1 text-xs text-cyan-300">Sharpe: {s.sharpeRatio}</p>
              <p className="mt-1 text-xs text-rose-300">Drawdown: {s.maxDrawdown}%</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
