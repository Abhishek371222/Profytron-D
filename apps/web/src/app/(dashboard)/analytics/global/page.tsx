'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';
import {
  Globe,
  Crown,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AnalyticsInfoBanner,
  AnalyticsPageHeader,
  ChartCard,
  StatCard,
} from '../_components/AnalyticsShared';

const IMPACT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  HIGH: { label: 'High', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  MEDIUM: { label: 'Medium', color: 'text-chart-4', bg: 'bg-chart-4/10', border: 'border-chart-4/20' },
  LOW: { label: 'Low', color: 'text-chart-3', bg: 'bg-chart-3/10', border: 'border-chart-3/20' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-muted-foreground" />;
  if (rank === 3) return <Award className="w-4 h-4 text-chart-4" />;
  return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
}

export default function GlobalAnalyticsPage() {
  const queryClient = useQueryClient();

  const globalQuery = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.getGlobal(),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['analytics', 'leaderboard'],
    queryFn: () => analyticsApi.getLeaderboard(10),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
  const hasData = Boolean(regimeLabel || macroEvents.length || sectorRotation.length || leaderRows.length);

  return (
    <div className="space-y-5 pb-8">
      <AnalyticsPageHeader
        title="Smart Analysis"
        description="Macro signals, sector rotation, and leaderboard dynamics powered by real analytics."
        icon={Globe}
        iconBg="bg-primary/10 text-primary"
        onRefresh={refreshData}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Market Regime"
          value={regimeLabel ?? '—'}
          icon={Zap}
          iconBg="bg-chart-3/10 text-chart-3"
          valueClass="text-foreground capitalize"
        />
        <StatCard
          label="Regime Confidence"
          value={regimeConfidence !== null ? `${regimeConfidence.toFixed(2)}%` : '—'}
          icon={Globe}
          iconBg="bg-primary/10 text-primary"
          valueClass="text-primary"
          delay={0.05}
        />
        <StatCard
          label="Macro Events"
          value={macroEvents.length > 0 ? macroEvents.length : '—'}
          icon={AlertTriangle}
          iconBg="bg-chart-4/10 text-chart-4"
          valueClass="text-chart-4"
          delay={0.1}
        />
      </div>

      {regimeConfidence !== null && (
        <div className="dashboard-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground uppercase tracking-wide font-medium">Confidence</span>
            <span className="font-semibold tabular-nums text-foreground">{regimeConfidence.toFixed(2)}%</span>
          </div>
          <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${regimeConfidence}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {!hasData && !globalQuery.isLoading && !leaderboardQuery.isLoading && (
        <AnalyticsInfoBanner message="Global analytics populate as market data and platform activity grow. Regime signals update in real time when available." />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard eyebrow="Macro" title="Event Feed" delay={0.1}>
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
                    className={cn('rounded-xl border p-3 transition-colors', impact.border, impact.bg)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground leading-snug">{event.event}</p>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0',
                          impact.bg,
                          impact.color,
                          'border',
                          impact.border,
                        )}
                      >
                        {impact.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              !globalQuery.isLoading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--card-border)] bg-muted0">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">No macro events yet</p>
                </div>
              )
            )}
          </div>
        </ChartCard>

        <ChartCard eyebrow="Sectors" title="Rotation Snapshot" delay={0.15}>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto no-scrollbar">
            {sectorRotation.length > 0 ? (
              sectorRotation.map((row) => {
                const isPos = row.netPnl >= 0;
                return (
                  <div
                    key={row.strategyId}
                    className="rounded-xl border border-[var(--card-border)] bg-muted/20 p-3 hover:border-primary/15 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground font-mono">
                        {row.strategyId.slice(0, 10)}…
                      </span>
                      <span className={cn('text-sm font-bold tabular-nums', isPos ? 'text-chart-3' : 'text-destructive')}>
                        {isPos ? '+' : ''}${row.netPnl.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Sharpe {row.sharpeRatio}</span>
                      <span>DD {row.drawdown}%</span>
                      <span>WR {row.winRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden mt-2.5">
                      <div
                        className={cn('h-full rounded-full', isPos ? 'bg-chart-3' : 'bg-destructive')}
                        style={{ width: `${Math.min(100, Math.abs(row.winRate))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              !globalQuery.isLoading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--card-border)] bg-muted0">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">No sector data yet</p>
                </div>
              )
            )}
          </div>
        </ChartCard>
      </div>

      <ChartCard eyebrow="Rankings" title="Global Leaderboard" delay={0.2}>
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
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                    isTop3
                      ? 'border-yellow-400/25 bg-yellow-50/50 hover:border-yellow-400/40'
                      : 'border-[var(--card-border)] bg-muted/20 hover:border-primary/15',
                  )}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-card border border-[var(--card-border)] shrink-0">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{row.username}</p>
                    <p className="text-xs text-muted-foreground">{row.totalTrades} trades</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-bold tabular-nums', isPos ? 'text-chart-3' : 'text-destructive')}>
                      {isPos ? '+' : ''}${row.totalPnl.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {isPos ? (
                        <TrendingUp className="w-3 h-3 text-chart-3/60" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive/60" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          !leaderboardQuery.isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200/80 bg-amber-50 w-fit">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-900/80">No leaderboard entries yet.</p>
            </div>
          )
        )}
      </ChartCard>
    </div>
  );
}
