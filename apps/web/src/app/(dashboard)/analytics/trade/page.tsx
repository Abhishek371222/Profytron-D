'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

export default function TradeAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const tradeQuery = useQuery({
    queryKey: ['analytics', 'trades', range],
    queryFn: () => analyticsApi.getTrades(range),
    staleTime: 120_000,
  });

  const trade = tradeQuery.data;
  const hasTradeData = Boolean(
    trade?.distribution?.length || trade?.winLoss?.length || trade?.symbolPerformance?.length,
  );

  React.useEffect(() => {
    if (tradeQuery.isError) {
      toast.error('Trade analytics unavailable', {
        description: 'Trade analytics are unavailable until the API recovers.',
      });
    }
  }, [tradeQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'trades'] });
    toast.success('Trade analytics refresh queued');
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e1607] via-[#132038] to-[#0f1d1b] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Trade Forensics</h1>
            <p className="mt-2 text-sm text-white/70">Distribution analytics, win-loss geometry, and symbol-level trade quality checks.</p>
          </div>
          <Button onClick={refreshData} variant="outline" className="inline-flex items-center gap-2 border-white/20 bg-white/5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 hover:bg-white/10">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${
                range === option
                  ? 'border-amber-300/50 bg-amber-300/20 text-white'
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
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Earnings Distribution</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trade?.distribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-white/10 bg-black/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Win vs Loss</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trade?.winLoss ?? []} dataKey="value" nameKey="name" outerRadius={110} label>
                  {(trade?.winLoss ?? []).map((entry, idx) => (
                    <Cell key={`${entry.name}-${idx}`} fill={idx === 0 ? '#34d399' : '#fb7185'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-white/10 bg-black/40 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Symbol Performance</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(trade?.symbolPerformance ?? []).map((item) => (
            <div key={item.symbol} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{item.symbol}</p>
              <p className={`mt-1 text-sm font-semibold ${item.pnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                ${item.pnl.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-white/60">Trades: {item.trades}</p>
            </div>
          ))}
        </div>
        {!tradeQuery.isLoading && !hasTradeData ? (
          <p className="mt-3 text-xs text-white/60">No trade analytics available yet. Values appear after closed trades are recorded.</p>
        ) : null}
      </Card>
    </div>
  );
}
