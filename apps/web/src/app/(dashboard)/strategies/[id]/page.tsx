'use client';

import React from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Activity,
  Zap,
  TrendingUp,
  BarChart3,
  History,
  Info,
  ChevronRight,
  Share2,
  AlertTriangle,
  Globe,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { strategiesApi } from '@/lib/api/strategies';
import { analyticsApi } from '@/lib/api/analytics';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DashboardPage,
  DashboardBreadcrumbs,
  DashboardPageHeader,
  DashboardCard,
  DashStatCard,
  DashFilterPill,
  DashButton,
  DashSectionTitle,
} from '@/components/dashboard/DashboardPrimitives';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StrategyActivationModal } from '@/components/strategies/StrategyActivationModal';
import { CATEGORY_COLORS } from '../_components/StrategiesShared';

const CHART_GRID = 'var(--card-border)';
const CHART_TICK = { fill: 'var(--muted-foreground)', fontSize: 10 };

export default function StrategyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'trades' | 'details'>('analytics');
  const [isActivationOpen, setIsActivationOpen] = React.useState(false);
  const [chartRange, setChartRange] = React.useState<'1M' | '3M' | '1Y' | 'ALL'>('1Y');

  const { data: strategy, isLoading } = useQuery({
    queryKey: ['strategy', id],
    queryFn: () => strategiesApi.getStrategy(id as string),
    enabled: !!id,
  });

  const { data: tradeExport } = useQuery({
    queryKey: ['strategy-trade-export', id],
    queryFn: () => analyticsApi.getTradeExport('all'),
    enabled: !!id,
  });

  const equityCurve = strategy?.equityCurve ?? [];
  const chartData = React.useMemo(() => {
    const points = chartRange === '1M' ? 30 : chartRange === '3M' ? 90 : chartRange === '1Y' ? 365 : equityCurve.length;
    const slice = chartRange === 'ALL' ? equityCurve : equityCurve.slice(-points);
    return slice.map((p: { date?: string; value?: number; equity?: number }) => ({
      date: p.date,
      value: p.value ?? p.equity ?? 0,
    }));
  }, [chartRange, equityCurve]);

  const mockTrades = React.useMemo(() => {
    const liveTrades = (tradeExport?.rows ?? [])
      .filter((t) => (t.strategyName ?? '') === strategy?.name)
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        pair: t.symbol,
        side: t.direction,
        pnl: Number(t.profit ?? 0),
        at: new Date(t.closedAt ?? t.openedAt).toLocaleString(),
      }));
    return liveTrades.length > 0 ? liveTrades : [];
  }, [strategy?.name, tradeExport?.rows]);

  if (isLoading) {
    return (
      <DashboardPage>
        <div className="space-y-5 animate-pulse">
          <div className="h-3 w-48 rounded bg-muted" />
          <div className="h-24 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dashboard-card h-28" />
            ))}
          </div>
          <div className="dashboard-card h-[400px]" />
        </div>
      </DashboardPage>
    );
  }

  if (!strategy) return null;

  const perf = strategy.latestPerformance ?? {};
  const catStyle = CATEGORY_COLORS[strategy.category] ?? 'bg-primary/10 text-primary border-primary/20';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/strategies/${strategy.id}`);
      toast.success('Strategy link copied');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  return (
    <DashboardPage>
      <DashboardBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Strategies', href: '/strategies' },
          { label: strategy.name },
        ]}
      />

      <DashboardPageHeader
        icon={BarChart3}
        title={strategy.name}
        description={`By ${strategy.creator?.fullName ?? 'Unknown Creator'}`}
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push('/strategies')}
              className="dash-btn-ghost flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <DashButton variant="icon" onClick={handleShare} aria-label="Share strategy">
              <Share2 className="h-4 w-4" />
            </DashButton>
            <DashButton onClick={() => setIsActivationOpen(true)}>
              Activate
              <ChevronRight className="ml-1 h-4 w-4" />
            </DashButton>
          </>
        }
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {strategy.isVerified && (
          <span className="dash-badge dash-badge-verified">Verified</span>
        )}
        <span className={cn('dash-badge dash-badge-category border', catStyle)}>{strategy.category}</span>
      </div>

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <DashStatCard label="30D Return" value={`+${perf.winRate ?? 0}%`} icon={TrendingUp} className="[&_p:last-child]:text-chart-3" />
        <DashStatCard label="Sharpe Ratio" value={perf.sharpeRatio ?? 0} icon={Zap} />
        <DashStatCard label="Max Drawdown" value={`-${perf.maxDrawdown ?? 0}%`} icon={AlertTriangle} className="[&_p:last-child]:text-destructive" />
        <DashStatCard label="Subscribers" value={strategy.copiesCount ?? 0} icon={Globe} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          {/* Equity chart */}
          <DashboardCard className="p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="dash-eyebrow text-[11px]">Performance</p>
                <DashSectionTitle className="text-base">Equity Curve</DashSectionTitle>
              </div>
              <div className="flex gap-1.5">
                {(['1M', '3M', '1Y', 'ALL'] as const).map((range) => (
                  <DashFilterPill
                    key={range}
                    active={chartRange === range}
                    onClick={() => setChartRange(range)}
                  >
                    {range}
                  </DashFilterPill>
                ))}
              </div>
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strategyEq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={CHART_TICK}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short' })}
                  />
                  <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-[var(--card-border)] bg-card px-3 py-2 shadow-lg">
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className="text-sm font-bold">${Number(payload[0]?.value ?? 0).toLocaleString()}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" fill="url(#strategyEq)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Tabs */}
          <DashboardCard className="overflow-hidden p-0">
            <div className="flex gap-1 border-b border-[var(--card-border)] px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                { id: 'analytics' as const, label: 'History Metrics', icon: BarChart3 },
                { id: 'trades' as const, label: 'Execution Log', icon: History },
                { id: 'details' as const, label: 'Architecture', icon: Info },
              ].map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors',
                    activeTab === tabId ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {activeTab === tabId && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-5 min-h-[240px]">
              {activeTab === 'analytics' && (
                <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Monthly Pulse</h4>
                    {Object.entries(strategy.monthlyReturns ?? {}).slice(0, 6).map(([month, val]) => (
                      <div key={month} className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-muted/20">
                        <span className="text-xs text-muted-foreground uppercase">{month}</span>
                        <span className={cn('text-sm font-bold tabular-nums', Number(val) >= 0 ? 'text-chart-3' : 'text-destructive')}>
                          {Number(val) >= 0 ? '+' : ''}{Number(val).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                    {!Object.keys(strategy.monthlyReturns ?? {}).length && (
                      <p className="text-sm text-muted-foreground">No monthly data yet.</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Stability Metrics</h4>
                    <div className="p-4 rounded-xl border border-[var(--card-border)] bg-muted/20 space-y-3">
                      <MetricRow label="Access Tier" value={strategy.monthlyPrice > 0 ? `₹${Number(strategy.monthlyPrice).toLocaleString('en-IN')}/mo` : 'Open'} />
                      <MetricRow label="Risk Level" value={strategy.riskLevel} />
                      <MetricRow label="Subscribers" value={String(strategy.copiesCount ?? 0)} />
                      <MetricRow label="Verified" value={strategy.isVerified ? 'Yes' : 'No'} />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'trades' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {mockTrades.length > 0 ? (
                    mockTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-muted/20">
                        <div>
                          <p className="text-xs text-muted-foreground">{trade.id}</p>
                          <p className="text-sm font-semibold">{trade.pair} <span className="text-muted-foreground">({trade.side})</span></p>
                        </div>
                        <div className="text-right">
                          <p className={cn('text-sm font-bold tabular-nums', trade.pnl >= 0 ? 'text-chart-3' : 'text-destructive')}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{trade.at}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">No execution log entries yet.</p>
                  )}
                  <DashButton variant="ghost" onClick={() => router.push('/history')} className="text-xs uppercase tracking-wide">
                    Open Full History
                  </DashButton>
                </div>
              )}
              {activeTab === 'details' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <p className="text-sm text-muted-foreground leading-relaxed">{strategy.description}</p>
                  <div className="flex items-center gap-2 text-chart-3 text-sm">
                    <Lock className="h-4 w-4" />
                    End-to-end encrypted strategy deployment
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-5 xl:col-span-4">
          <DashboardCard className="p-5">
            <p className="dash-eyebrow mb-4 text-[11px]">Creator</p>
            <div className="flex items-center gap-4 mb-4">
              <UserAvatar name={strategy.creator?.fullName ?? 'Creator'} src={strategy.creator?.avatarUrl} size="lg" />
              <div>
                <h5 className="font-bold text-foreground">{strategy.creator?.fullName}</h5>
                {strategy.isVerified && (
                  <p className="text-xs text-chart-3 font-semibold">Verified Creator</p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {strategy.creator?.bio ?? 'Professional quantitative strategy creator.'}
            </p>
            <DashButton
              variant="outline"
              onClick={() => router.push(`/alpha-coach?topic=${encodeURIComponent(strategy.name)}`)}
              className="w-full text-xs uppercase tracking-wide"
            >
              Contact Creator
            </DashButton>
          </DashboardCard>

          <DashboardCard className="border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-wide">Risk: {strategy.riskLevel}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Review drawdown history and ensure your risk profile matches this strategy before deploying.
            </p>
          </DashboardCard>

          <DashboardCard className="space-y-4 p-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Activity className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h5 className="font-bold text-foreground">Deploy Strategy</h5>
              <p className="text-xs text-muted-foreground mt-1">Connect and start copying signals</p>
            </div>
            <DashButton onClick={() => setIsActivationOpen(true)} className="w-full">
              Configure & Activate
            </DashButton>
          </DashboardCard>
        </div>
      </div>

      <StrategyActivationModal isOpen={isActivationOpen} onClose={() => setIsActivationOpen(false)} strategy={strategy} />
    </DashboardPage>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
