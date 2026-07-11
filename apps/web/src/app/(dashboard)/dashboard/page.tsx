'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Link2, RefreshCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { marketApi, type MarketNewsCategory } from '@/lib/api/market';
import { ManualOrderModal } from '@/components/trading/ManualOrderModal';
import { OverviewMetricCards } from '@/components/dashboard/overview/OverviewMetricCards';
import { OverviewOpenPositions } from '@/components/dashboard/overview/OverviewOpenPositions';
import { OverviewPerformance } from '@/components/dashboard/overview/OverviewPerformance';
import {
  OverviewMarketWatch,
  type WatchTab,
} from '@/components/dashboard/overview/OverviewMarketWatch';
import { OverviewRecentTrades } from '@/components/dashboard/overview/OverviewRecentTrades';
import { OverviewEconomicCalendar } from '@/components/dashboard/overview/OverviewEconomicCalendar';
import { OverviewMarketNews } from '@/components/dashboard/overview/OverviewMarketNews';
import { OverviewQuickActions } from '@/components/dashboard/overview/OverviewQuickActions';
import { OverviewAccountHealth } from '@/components/dashboard/overview/OverviewAccountHealth';

export default function DashboardPage() {
  const router = useRouter();
  const [manualOrderOpen, setManualOrderOpen] = React.useState(false);
  const [watchTab, setWatchTab] = React.useState<WatchTab>('forex');
  const [newsCategory, setNewsCategory] =
    React.useState<MarketNewsCategory>('forex');
  const [serverTime, setServerTime] = React.useState('');

  const { data: currentUser } = useCurrentUser();
  const {
    quotes,
    portfolio,
    openTrades,
    tradeHistory,
    tradeHistoryQuery,
    accountInfo,
    hasBrokerAccount,
    defaultBrokerAccount,
    isPaper,
    refreshAll,
    risk,
    accountsInitialLoading,
    portfolioInitialLoading,
    openTradesInitialLoading,
    tradeHistoryInitialLoading,
    quotesInitialLoading,
  } = useDashboardData('1M');

  const newsQuery = useQuery({
    queryKey: ['market-news', 'overview', newsCategory],
    queryFn: () => marketApi.getNews({ category: newsCategory }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const calendarQuery = useQuery({
    queryKey: ['economic-calendar', 'overview'],
    queryFn: () => {
      // Align with Forex Factory "this week" window (Mon–Sun UTC-ish).
      const now = new Date();
      const day = now.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      const from = monday.toISOString().slice(0, 10);
      const to = sunday.toISOString().slice(0, 10);
      return marketApi.getEconomicCalendar({ from, to });
    },
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
  });

  React.useEffect(() => {
    const tick = () => {
      setServerTime(
        new Intl.DateTimeFormat('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
          timeZoneName: 'short',
        }).format(new Date()),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const liveFromAccounts = Boolean(accountInfo?.balance && accountInfo.balance > 0);
  const liveReady = liveFromAccounts;

  const currency = accountInfo?.currency || portfolio?.liveCurrency || 'USD';

  // Fast path only: live /broker/accounts. Never flash initialEquity or wait on slow portfolio.
  const balance = accountInfo?.balance ?? 0;
  const equity = accountInfo?.equity ?? accountInfo?.balance ?? 0;
  const margin = accountInfo?.margin ?? 0;
  const freeMargin =
    accountInfo?.freeMargin ?? Math.max(0, equity - margin);

  const unrealizedPnl = openTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const [nowMs] = React.useState(() => Date.now());
  const realizedPnl24h = React.useMemo(() => {
    const cutoff = nowMs - 24 * 60 * 60 * 1000;
    const fromHistory = tradeHistory
      .filter((t) => {
        const closed = t.closedAt ? new Date(t.closedAt).getTime() : 0;
        return closed >= cutoff;
      })
      .reduce((s, t) => s + Number(t.profit ?? 0), 0);
    if (tradeHistory.length > 0) return fromHistory;
    return Number(portfolio?.totalProfit ?? 0);
  }, [tradeHistory, portfolio?.totalProfit, nowMs]);

  const equityCurve = portfolio?.equityCurve ?? [];
  // Sparkline from real curve — drop pathological end spikes for display.
  const sparkline = (() => {
    if (equityCurve.length < 2) {
      return balance > 0 ? [balance * 0.99, balance] : [0, 0];
    }
    const pts = equityCurve.slice(-24).map((p) => p.equity);
    // If last jump is >35%, flatten last segment toward live equity gradually.
    if (pts.length >= 2) {
      const a = pts[pts.length - 2];
      const b = pts[pts.length - 1];
      if (a > 0 && Math.abs(b - a) / a > 0.35) {
        pts[pts.length - 1] = equity > 0 ? equity : b;
        pts[pts.length - 2] = equity > 0 ? equity * 0.985 : a;
      }
    }
    return pts;
  })();

  // Prefer server deposit-based return once MetaAPI portfolio is ready.
  const totalReturnPct =
    portfolio?.source === 'metaapi' &&
    portfolio.totalReturnPct != null &&
    Number.isFinite(portfolio.totalReturnPct)
      ? portfolio.totalReturnPct
      : (() => {
          const base = Number(portfolio?.depositBase ?? portfolio?.equityBase ?? 0);
          return base > 0 && equity > 0 ? ((equity - base) / base) * 100 : 0;
        })();

  const change24hPct = totalReturnPct;

  const quoteMap = React.useMemo(() => {
    const next: Record<string, { price: number; change24hPct: number }> = {};
    for (const [key, q] of Object.entries(quotes)) {
      if (!q) continue;
      next[key] = { price: q.price, change24hPct: q.change24hPct };
    }
    return next;
  }, [quotes]);

  const syncError =
    portfolio?.syncError || tradeHistoryQuery.data?.syncError;
  const metaApiBroken = syncError === 'METAAPI_UNAUTHORIZED';

  // Skeleton only on true first load — never on background MetaAPI polls.
  const metricsLoading = hasBrokerAccount && accountsInitialLoading && !liveReady;

  const drawdownPct = Number(portfolio?.maxDrawdown ?? risk?.drawdownPct ?? 0);
  const profitFactor = Number(portfolio?.profitFactor ?? 0);
  const sharpeRatio = Number(portfolio?.sharpeRatio ?? 0);
  // Map drawdown to health needle: 0% DD → healthy (8%), 25%+ DD → elevated (92%).
  const healthPct = Math.max(8, Math.min(92, 8 + drawdownPct * 3.2));
  const riskScoreLabel =
    drawdownPct < 5
      ? 'Low Risk'
      : drawdownPct < 12
        ? 'Moderate'
        : 'Elevated';

  const accountLabel = defaultBrokerAccount
    ? `${isPaper ? 'Paper' : 'Real'} Account ····${defaultBrokerAccount.accountNumberLast4 || ''}`
    : 'No account';

  return (
    <div className="space-y-2.5 pb-5 sm:space-y-3" suppressHydrationWarning>
      {/* Page header — compact chips, not oversized cards */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Overview
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Real-time summary of your trading performance and market insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-card px-2.5 py-1 text-[11px] leading-tight">
            <span className="font-semibold text-foreground">{accountLabel}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--chart-bull)]" />
              {defaultBrokerAccount?.brokerName || 'Broker'} · {isPaper ? 'Demo' : 'Live'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-card px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span suppressHydrationWarning>{serverTime || '—'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              refreshAll();
              newsQuery.refetch();
              calendarQuery.refetch();
            }}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Refresh"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {metaApiBroken && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-foreground">Live account sync is offline</p>
            <p className="mt-0.5 text-muted-foreground">
              We couldn&apos;t refresh your broker connection. Try again in a moment, or reconnect
              your account from Connected Accounts.
            </p>
          </div>
        </div>
      )}

      {!hasBrokerAccount && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/15">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Connect your first account
                </p>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Link a paper or live broker once. Balance, margin, positions, and
                  performance all come from that account.
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/connected-accounts')} className="shrink-0 gap-2">
              <Zap className="h-4 w-4" />
              Connect Account
            </Button>
          </div>
        </div>
      )}

      <OverviewMetricCards
        metrics={{
          balance,
          equity,
          margin,
          freeMargin,
          currency,
          unrealizedPnl,
          realizedPnl24h,
          change24hPct,
          sparkline,
          isPaper,
          loading: metricsLoading,
        }}
      />

      {/* Row: Open Positions | Performance | Market Watch */}
      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <OverviewOpenPositions
            positions={openTrades}
            quotes={quoteMap}
            currency={currency}
            loading={openTradesInitialLoading}
            onNewOrder={() => setManualOrderOpen(true)}
          />
        </div>
        <div className="xl:col-span-4">
          <OverviewPerformance
            equityCurve={equityCurve}
            totalReturnPct={totalReturnPct}
            winRate={portfolio?.winRate ?? 0}
            totalTrades={portfolio?.totalTrades ?? 0}
            loading={portfolioInitialLoading}
          />
        </div>
        <div className="xl:col-span-3">
          <OverviewMarketWatch
            quotes={quoteMap}
            activeTab={watchTab}
            onTabChange={setWatchTab}
            loading={quotesInitialLoading}
          />
        </div>
      </div>

      {/* Row: Recent Trades | Economic Calendar | Market News */}
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
        <OverviewRecentTrades
          trades={tradeHistory}
          currency={currency}
          loading={tradeHistoryInitialLoading}
        />
        <OverviewEconomicCalendar
          events={calendarQuery.data?.events ?? []}
          loading={calendarQuery.isPending && !calendarQuery.data}
          error={calendarQuery.isError}
        />
        <OverviewMarketNews
          news={newsQuery.data?.items ?? []}
          category={newsCategory}
          onCategoryChange={setNewsCategory}
          loading={newsQuery.isPending && !newsQuery.data}
        />
      </div>

      {/* Footer: Quick Actions | Account Health */}
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
        <OverviewQuickActions onNewOrder={() => setManualOrderOpen(true)} />
        <OverviewAccountHealth
          riskScoreLabel={riskScoreLabel}
          drawdownPct={drawdownPct}
          profitFactor={profitFactor}
          sharpeRatio={sharpeRatio}
          healthPct={healthPct}
        />
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Live account data and market insights for your workspace.
      </p>

      <ManualOrderModal open={manualOrderOpen} onOpenChange={setManualOrderOpen} />
    </div>
  );
}
