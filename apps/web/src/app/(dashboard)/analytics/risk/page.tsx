'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { demoRisk } from '../_lib/demoData';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const RANGE_OPTIONS: AnalyticsRange[] = ['1d', '1w', '1m', '3m', '1y', 'all'];

export default function RiskAnalyticsPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = React.useState<AnalyticsRange>('3m');

  const riskQuery = useQuery({
    queryKey: ['analytics', 'risk', range],
    queryFn: () => analyticsApi.getRisk(range),
    staleTime: 120_000,
  });

  const risk = riskQuery.data ?? demoRisk(range);

  React.useEffect(() => {
    if (riskQuery.isError) {
      toast.error('Risk analytics unavailable', {
        description: 'Showing fallback risk data until API recovers.',
      });
    }
  }, [riskQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'risk'] });
    toast.success('Risk refresh queued');
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a1116] via-[#1b1022] to-[#0d1a2c] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Risk Radar</h1>
            <p className="mt-2 text-sm text-white/70">Scenario-aware drawdown tracking, exposure pressure, and capital protection intelligence.</p>
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
                  ? 'border-rose-300/50 bg-rose-300/20 text-white'
                  : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border-white/10 bg-black/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Drawdown Curve</h3>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={risk.drawdownCurve}>
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="val" stroke="#fb7185" fill="url(#riskFill)" strokeWidth={2.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-white/10 bg-black/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Core Risk Stats</h3>
          <div className="space-y-2">
            <RiskRow label="VaR 95%" value={`$${risk.var95.toLocaleString()}`} />
            <RiskRow label="Max Consec Losses" value={`${risk.maxConsecutiveLosses}`} />
            <RiskRow label="Largest Loss" value={`$${risk.largestLoss.toLocaleString()}`} />
            <RiskRow label="Best Single Win" value={`$${risk.bestSingleWin.toLocaleString()}`} />
            <RiskRow label="Avg Risk/Reward" value={`${risk.avgRiskReward}`} />
            <RiskRow label="Calmar Ratio" value={`${risk.calmarRatio}`} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function RiskRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-xs text-white/70">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
