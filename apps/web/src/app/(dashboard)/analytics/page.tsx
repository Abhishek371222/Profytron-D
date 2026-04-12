'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import Link from 'next/link';

const RANGE_OPTIONS = ['1m', '3m', '1y', 'all'] as const;

export default function AnalyticsPage() {
  const [range, setRange] = React.useState<AnalyticsRange>('1m');

  const portfolioQuery = useQuery({
    queryKey: ['analytics', 'portfolio', range],
    queryFn: () => analyticsApi.getPortfolio(range),
    staleTime: 30_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ['analytics', 'monthly-returns'],
    queryFn: () => analyticsApi.getMonthlyReturns(),
    staleTime: 300_000,
  });

  const strategyQuery = useQuery({
    queryKey: ['analytics', 'strategy-comparison', range],
    queryFn: () => analyticsApi.getStrategyComparison(range),
    staleTime: 120_000,
  });

  const riskQuery = useQuery({
    queryKey: ['analytics', 'risk', range],
    queryFn: () => analyticsApi.getRisk(range),
    staleTime: 120_000,
  });

  const tradeQuery = useQuery({
    queryKey: ['analytics', 'trades', range],
    queryFn: () => analyticsApi.getTrades(range),
    staleTime: 120_000,
  });

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-white/60">Portfolio, strategy, risk, and global intelligence.</p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wide border transition ${
                range === option
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
          <Link href="/analytics/global" className="px-3 py-1.5 rounded-md text-xs border border-white/20 text-white/80 hover:bg-white/10">
            Global Page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Profit" value={`$${(portfolioQuery.data?.totalProfit ?? 0).toLocaleString()}`} />
        <MetricCard label="Win Rate" value={`${portfolioQuery.data?.winRate ?? 0}%`} />
        <MetricCard label="Sharpe" value={`${portfolioQuery.data?.sharpeRatio ?? 0}`} />
        <MetricCard label="Max Drawdown" value={`${portfolioQuery.data?.maxDrawdown ?? 0}%`} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-4 bg-black/40 border-white/10">
            <h3 className="text-sm text-white/70 mb-3">Equity Curve</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioQuery.data?.equityCurve ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="equity" stroke="#6366f1" fill="#6366f133" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-black/40 border-white/10">
              <h3 className="text-sm text-white/70 mb-3">Strategy Comparison</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyQuery.data?.strategies ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="netPnl" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 bg-black/40 border-white/10">
              <h3 className="text-sm text-white/70 mb-3">Monthly Returns</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyQuery.data?.months ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="returnPct" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-black/40 border-white/10">
              <h3 className="text-sm text-white/70 mb-3">Drawdown Curve</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskQuery.data?.drawdownCurve ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="val" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 bg-black/40 border-white/10 space-y-2">
              <RiskRow label="VaR 95%" value={`$${(riskQuery.data?.var95 ?? 0).toLocaleString()}`} />
              <RiskRow label="Max Consec Losses" value={`${riskQuery.data?.maxConsecutiveLosses ?? 0}`} />
              <RiskRow label="Largest Loss" value={`$${(riskQuery.data?.largestLoss ?? 0).toLocaleString()}`} />
              <RiskRow label="Best Single Win" value={`$${(riskQuery.data?.bestSingleWin ?? 0).toLocaleString()}`} />
              <RiskRow label="Avg Risk/Reward" value={`${riskQuery.data?.avgRiskReward ?? 0}`} />
              <RiskRow label="Calmar" value={`${riskQuery.data?.calmarRatio ?? 0}`} />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trade">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-black/40 border-white/10">
              <h3 className="text-sm text-white/70 mb-3">P&L Distribution</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradeQuery.data?.distribution ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 bg-black/40 border-white/10">
              <h3 className="text-sm text-white/70 mb-3">Win vs Loss</h3>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tradeQuery.data?.winLoss ?? []}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {(tradeQuery.data?.winLoss ?? []).map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={idx === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="global">
          <Card className="p-4 bg-black/40 border-white/10 space-y-3">
            <div className="text-sm text-white/70">Market Regime: <span className="text-white">{globalQuery.data?.marketRegime.label ?? 'N/A'}</span></div>
            <div className="text-sm text-white/70">Confidence: <span className="text-white">{globalQuery.data?.marketRegime.confidence ?? 0}%</span></div>
            <div className="space-y-2 pt-2">
              <h3 className="text-sm text-white/70">Macro Events</h3>
              {(globalQuery.data?.macroEvents ?? []).map((event) => (
                <div key={`${event.event}-${event.timestamp}`} className="p-3 rounded-md bg-white/5 border border-white/10 text-sm text-white/80">
                  {event.event} - {event.impact}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 bg-black/40 border-white/10">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </Card>
  );
}

function RiskRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2 last:border-b-0">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
