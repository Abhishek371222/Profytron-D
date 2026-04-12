'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api/analytics';

export default function GlobalAnalyticsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Global Intelligence</h1>
        <p className="text-sm text-white/60">Macro signals, sector rotation, and top traders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Market Regime</p>
          <p className="text-xl font-semibold text-white mt-1">{globalQuery.data?.marketRegime.label ?? 'N/A'}</p>
        </Card>
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Regime Confidence</p>
          <p className="text-xl font-semibold text-white mt-1">{globalQuery.data?.marketRegime.confidence ?? 0}%</p>
        </Card>
        <Card className="p-4 bg-black/40 border-white/10">
          <p className="text-xs text-white/60">Macro Events</p>
          <p className="text-xl font-semibold text-white mt-1">{globalQuery.data?.macroEvents.length ?? 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-black/40 border-white/10">
          <h3 className="text-sm text-white/70 mb-3">Macro Event Feed</h3>
          <div className="space-y-2">
            {(globalQuery.data?.macroEvents ?? []).map((event) => (
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
            {(globalQuery.data?.sectorRotation ?? []).map((row) => (
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
          {(leaderboardQuery.data?.rows ?? []).map((row) => (
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
