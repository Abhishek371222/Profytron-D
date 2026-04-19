'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api/analytics';
import { demoGlobal, demoLeaderboard } from '../_lib/demoData';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalAnalyticsPage() {
  const queryClient = useQueryClient();

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: () => analyticsApi.getLeaderboard(10),
    staleTime: 60_000,
  });

  const global = globalQuery.data ?? demoGlobal;
  const leaderboard = leaderboardQuery.data ?? demoLeaderboard;

  React.useEffect(() => {
    if (globalQuery.isError || leaderboardQuery.isError) {
      toast.error('Global intelligence feed unavailable', {
        description: 'Showing resilient fallback data while API recovers.',
      });
    }
  }, [globalQuery.isError, leaderboardQuery.isError]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'global'] });
    queryClient.invalidateQueries({ queryKey: ['analytics', 'leaderboard'] });
    toast.success('Global feed refresh queued');
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1f30] via-[#0b1a2e] to-[#16112a] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Global Intelligence</h1>
              <p className="mt-2 text-sm text-white/70">Macro signals, sector rotation, and leaderboard dynamics with resilient demo data when feeds are sparse.</p>
            </div>
            <Button onClick={refreshData} variant="outline" className="inline-flex items-center gap-2 border-white/20 bg-white/5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 hover:bg-white/10">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border-cyan-300/25">
          <p className="text-xs text-white/60">Market Regime</p>
          <p className="text-xl font-semibold text-white mt-1">{global.marketRegime.label}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 border-indigo-300/25">
          <p className="text-xs text-white/60">Regime Confidence</p>
          <p className="text-xl font-semibold text-white mt-1">{global.marketRegime.confidence}%</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-300/25">
          <p className="text-xs text-white/60">Macro Events</p>
          <p className="text-xl font-semibold text-white mt-1">{global.macroEvents.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-black/40 border-white/10">
          <h3 className="text-sm text-white/70 mb-3">Macro Event Feed</h3>
          <div className="space-y-2">
            {global.macroEvents.map((event) => (
              <div key={`${event.event}-${event.timestamp}`} className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white">{event.event}</p>
                <p className="text-xs text-white/60 mt-1">Impact: {event.impact}</p>
                <p className="text-xs text-white/50 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-black/40 border-white/10">
          <h3 className="text-sm text-white/70 mb-3">Sector Rotation Snapshot</h3>
          <div className="space-y-2">
            {global.sectorRotation.map((row) => (
              <div key={row.strategyId} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">{row.strategyId.slice(0, 8)}</span>
                  <span className={row.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${row.netPnl.toLocaleString()}</span>
                </div>
                <div className="mt-1 text-xs text-white/50">Sharpe {row.sharpeRatio} | DD {row.drawdown}% | WR {row.winRate}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-black/40 border-white/10">
        <h3 className="text-sm text-white/70 mb-3">Leaderboard</h3>
        <div className="space-y-2">
          {leaderboard.rows.map((row) => (
            <div key={row.userId} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex items-center gap-2 text-white/80">
                <span className="w-5 text-white/50">#{row.rank}</span>
                <span>{row.username}</span>
              </div>
              <div className="text-right">
                <p className={row.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>${row.totalPnl.toLocaleString()}</p>
                <p className="text-xs text-white/50">{row.totalTrades} trades</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
