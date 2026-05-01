'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import Link from 'next/link';
import { ChevronRight, RefreshCcw, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('1m');

  const portfolioQuery = useQuery({
    queryKey: ['analytics', 'portfolio', range],
    queryFn: () => analyticsApi.getPortfolio(range),
    staleTime: 30_000,
    refetchInterval: 15_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly-returns'],
    queryFn: () => analyticsApi.getMonthlyReturns(),
    staleTime: 300_000,
    refetchInterval: 60_000,
  });

  const strategyQuery = useQuery({
    queryKey: ['analytics', 'strategy-comparison', range],
    queryFn: () => analyticsApi.getStrategyComparison(range),
    staleTime: 120_000,
    refetchInterval: 20_000,
  });

  const riskQuery = useQuery({
    queryKey: ['analytics', 'risk', range],
    queryFn: () => analyticsApi.getRisk(range),
    staleTime: 120_000,
    refetchInterval: 20_000,
  });

  const tradeQuery = useQuery({
    queryKey: ['analytics', 'trades', range],
    queryFn: () => analyticsApi.getTrades(range),
    staleTime: 120_000,
    refetchInterval: 20_000,
  });

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
    refetchInterval: 60_000,
  });

  const portfolio = portfolioQuery.data;
  const global = globalQuery.data;

  React.useEffect(() => {
    if (portfolioQuery.isError) {
      toast.error('Portfolio analytics unavailable', {
        description: 'No synthetic fallback is used. Showing only real persisted trade analytics.',
      });
    }
  }, [portfolioQuery.isError]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    toast.success('Analytics refresh queued');
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#09112b] via-[#0a1338] to-[#071327] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Live Analytics Command Center
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Portfolio intelligence with dedicated section pages for performance, risk, trade quality, and macro context.
            </p>
          </div>
          <Link href="/analytics/global" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 hover:bg-white/10">
            Global Terminal
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Button onClick={handleRefresh} variant="outline" className="inline-flex items-center gap-2 border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 hover:bg-white/10">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wide border transition ${
                range === option
                  ? 'bg-gradient-to-r from-cyan-400/25 to-indigo-400/25 text-white border-cyan-300/50'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Profit" value={portfolio ? `$${portfolio.totalProfit.toLocaleString()}` : 'No data'} tone="profit" />
        <MetricCard label="Win Rate" value={portfolio ? `${portfolio.winRate}%` : 'No data'} tone="neutral" />
        <MetricCard label="Sharpe" value={portfolio ? `${portfolio.sharpeRatio}` : 'No data'} tone="neutral" />
        <MetricCard label="Max Drawdown" value={portfolio ? `${portfolio.maxDrawdown}%` : 'No data'} tone="risk" />
      </div>

      {!portfolioQuery.isLoading && (!portfolio || portfolio.totalTrades === 0) ? (
        <Card className="border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-100">
          Analytics are empty until closed trades exist in your account history. Connecting MT5 alone does not create these values.
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border-white/10 bg-black/40 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Equity Curve</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[11px] text-emerald-200">
              <TrendingUp className="h-3.5 w-3.5" />
              {portfolio ? `+${portfolio.bestMonth}% Best Month` : 'Awaiting closed trades'}
            </span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolio?.equityCurve ?? []}>
                <defs>
                  <linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="equity" stroke="#22d3ee" fill="url(#overviewFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-white/10 bg-black/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Quick Links</h3>
          <div className="mt-4 space-y-2">
            {[
              { href: '/analytics/performance', title: 'Performance Lab', desc: 'Compare strategy quality and monthly edge.' },
              { href: '/analytics/risk', title: 'Risk Radar', desc: 'Monitor drawdown and stress indicators.' },
              { href: '/analytics/trade', title: 'Trade Forensics', desc: 'Inspect distributions and symbol outcomes.' },
              { href: '/analytics/global', title: 'Global Intelligence', desc: 'Track macro events and leaderboard flow.' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cyan-200/30 hover:bg-cyan-200/5">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/65">{item.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            <p>Regime: <span className="text-white">{global?.marketRegime.label ?? 'Unavailable'}</span></p>
            <p className="mt-1">Confidence: <span className="text-white">{global?.marketRegime.confidence ?? 0}%</span></p>
            <p className="mt-1">Data mode: <span className="text-cyan-200">{portfolioQuery.data ? 'Live' : 'No fallback'}</span></p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'profit' | 'risk' | 'neutral' }) {
  const toneClass =
    tone === 'profit'
      ? 'from-emerald-500/15 to-emerald-500/5 border-emerald-300/30'
      : tone === 'risk'
        ? 'from-rose-500/15 to-rose-500/5 border-rose-300/30'
        : 'from-cyan-500/10 to-indigo-500/10 border-cyan-300/20';

  return (
    <Card className={`border bg-gradient-to-br p-4 ${toneClass}`}>
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </Card>
  );
}
