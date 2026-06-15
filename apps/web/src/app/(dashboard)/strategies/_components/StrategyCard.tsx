'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowRight, BarChart3, CheckCircle2, Target, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { DashButton } from '@/components/dashboard/DashboardPrimitives';
import { CATEGORY_COLORS } from './StrategiesShared';
import type { Strategy } from '@/lib/api/strategies';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  TREND: BarChart3,
  RANGE: Target,
  SCALPING: Zap,
  VOLATILITY: Activity,
  ARBITRAGE: BarChart3,
  'MEAN REVERT': Target,
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildChartData(strategy: Strategy) {
  const curve = strategy.equityCurve;
  if (!curve?.length) {
    const base = toNumber(strategy.latestPerformance?.winRate, 50);
    return Array.from({ length: 12 }, (_, i) => ({ v: base + Math.sin(i * 0.8) * 4 + i * 0.8, i }));
  }
  return curve.map((point, i) => {
    if (typeof point === 'number') return { v: point, i };
    if (point && typeof point === 'object') {
      const p = point as Record<string, unknown>;
      return { v: toNumber(p.value, toNumber(p.v, toNumber(p.equity))), i };
    }
    return { v: 0, i };
  });
}

export function StrategyCard({
  strategy,
  index,
  viewMode,
  onActivate,
}: {
  strategy: Strategy & { returns?: number; sharpe?: number; drawdown?: number; subscribers?: number; price?: number };
  index: number;
  viewMode: 'grid' | 'list';
  onActivate: () => void;
}) {
  const router = useRouter();
  const perf = strategy.latestPerformance ?? {};
  const winRate = toNumber(strategy.returns, toNumber(perf.winRate));
  const sharpeRatio = toNumber(strategy.sharpe, toNumber(perf.sharpeRatio));
  const maxDrawdown = toNumber(strategy.drawdown, toNumber(perf.maxDrawdown));
  const subscribers = toNumber(strategy.subscribers, toNumber(strategy.copiesCount));
  const monthlyPrice = toNumber(strategy.price, toNumber(strategy.monthlyPrice));
  const chartData = React.useMemo(() => buildChartData(strategy), [strategy]);
  const chartColor = maxDrawdown > 15 ? '#DC2626' : '#3B5BFF';
  const CategoryIcon = CATEGORY_ICONS[strategy.category] ?? BarChart3;
  const creatorName = strategy.creator?.fullName ?? 'Unknown';
  const catStyle = CATEGORY_COLORS[strategy.category] ?? 'bg-muted text-muted-foreground border-[var(--card-border)]';

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => router.push(`/strategies/${strategy.id}`)}
        className="group dashboard-card p-4 flex flex-col lg:flex-row lg:items-center gap-4 cursor-pointer hover:border-primary/25 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <CategoryIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground text-sm truncate">{strategy.name}</h4>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border uppercase', catStyle)}>{strategy.category}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs flex-1">
          <div><span className="text-muted-foreground block">Return</span><span className="text-chart-3 font-bold">+{winRate.toFixed(1)}%</span></div>
          <div><span className="text-muted-foreground block">Sharpe</span><span className="font-bold">{sharpeRatio.toFixed(2)}</span></div>
          <div><span className="text-muted-foreground block">Subs</span><span className="font-bold">{subscribers.toLocaleString()}</span></div>
          <div><span className="text-muted-foreground block">Price</span><span className="font-bold">{monthlyPrice > 0 ? `$${monthlyPrice}/mo` : 'Free'}</span></div>
        </div>
        <DashButton onClick={(e) => { e.stopPropagation(); onActivate(); }} className="shrink-0 gap-1">
          Activate <ArrowRight className="h-3.5 w-3.5" />
        </DashButton>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/strategies/${strategy.id}`)}
      className="dashboard-card p-5 flex flex-col cursor-pointer hover:border-primary/25 transition-colors min-h-[380px]"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar name={creatorName} size="sm" rounded="xl" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{creatorName}</p>
            {strategy.isVerified && (
              <span className="text-[10px] font-semibold text-chart-3 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border uppercase shrink-0', catStyle)}>
          {strategy.category}
        </span>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1 truncate">{strategy.name}</h3>
      {strategy.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{strategy.description}</p>
      )}

      <div className="h-24 -mx-5 mb-4 border-y border-[var(--card-border)]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grid-${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={chartColor} fill={`url(#grid-${strategy.id})`} strokeWidth={2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-auto text-sm">
        <Metric label="30D return" value={`+${winRate.toFixed(1)}%`} valueClass="text-chart-3" />
        <Metric label="Sharpe" value={sharpeRatio.toFixed(2)} />
        <Metric label="Max DD" value={`-${maxDrawdown.toFixed(1)}%`} valueClass="text-destructive" />
        <Metric label="Subscribers" value={subscribers.toLocaleString()} />
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground">Price</span>
          <p className="text-sm font-bold text-foreground">
            {monthlyPrice > 0 ? `$${monthlyPrice.toLocaleString()}/mo` : 'Free'}
          </p>
        </div>
        <DashButton
          onClick={(e) => { e.stopPropagation(); onActivate(); }}
          className="gap-1"
        >
          Activate
        </DashButton>
      </div>
    </div>
  );
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className={cn('text-sm font-bold tabular-nums', valueClass ?? 'text-foreground')}>{value}</span>
    </div>
  );
}
