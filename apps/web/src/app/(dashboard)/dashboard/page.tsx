'use client';

import React from 'react';
import dynamic from 'next/dynamic';
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
import {
  OverviewMarketWatch,
  type WatchTab,
} from '@/components/dashboard/overview/OverviewMarketWatch';
import { OverviewRecentTrades } from '@/components/dashboard/overview/OverviewRecentTrades';
import { OverviewEconomicCalendar } from '@/components/dashboard/overview/OverviewEconomicCalendar';
import { OverviewMarketNews } from '@/components/dashboard/overview/OverviewMarketNews';
import { OverviewQuickActions } from '@/components/dashboard/overview/OverviewQuickActions';
import { OverviewAccountHealth } from '@/components/dashboard/overview/OverviewAccountHealth';
import { LiveClock } from '@/components/dashboard/overview/LiveClock';
import {
  readOverviewAccountCache,
  writeOverviewAccountCache,
} from '@/lib/overview-account-cache';

const OverviewPerformance = dynamic(
  () =>
    import('@/components/dashboard/overview/OverviewPerformance').then(
      (m) => ({ default: m.OverviewPerformance }),
    ),
  {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-xl bg-muted/40 animate-pulse" />,
  },
);

export default function DashboardPage() {
  const router = useRouter();
  const [manualOrderOpen, setManualOrderOpen] = React.useState(false);
  const [watchTab, setWatchTab] = React.useState<WatchTab>('forex');
  const [newsCategory, setNewsCategory] =
    React.useState<MarketNewsCategory>('forex');

  const { data: currentUser } = useCurrentUser();
  const currency = 'USD';
  const userId = currentUser?.id;

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
    accountsRefreshing,
    portfolioInitialLoading,
    openTradesInitialLoading,
    tradeHistoryInitialLoading,
    quotesInitialLoading,
  } = useDashboardData('1M');

  const accountsStillLoading =
    !hasBrokerAccount && accountsInitialLoading;

  const newsQuery = useQuery({
    queryKey: ['market-news', 'overview', newsCategory],
    queryFn: () => marketApi.getNews({ category: newsCategory }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const calendarQuery = useQuery({
    queryKey: ['economic-calendar', 'overview'],
    queryFn: () => {
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

  const liveFromAccounts = Boolean(accountInfo?.balance && accountInfo.balance > 0);
  const liveReady = liveFromAccounts;

  const balance = accountInfo?.balance ?? 0;
  const equity = accountInfo?.equity ?? accountInfo?.balance ?? 0;
  const margin = accountInfo?.margin ?? 0;
  const freeMargin =
    accountInfo?.freeMargin ?? Math.max(0, equity - margin);

  const [mountedForCache, setMountedForCache] = React.useState(false);
  React.useEffect(() => setMountedForCache(true), []);

  const unrealizedPnl = React.useMemo(() => {
    if (!hasBrokerAccount) return 0;
    if (openTrades.length > 0) {
      return openTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
    }
    if (!mountedForCache) return 0;
    const cached = readOverviewAccountCache(userId);
    if (openTradesInitialLoading && cached?.unrealizedPnl != null) {
      return Number(cached.unrealizedPnl);
    }
    return 0;
  }, [hasBrokerAccount, openTrades, openTradesInitialLoading, mountedForCache, userId]);
  const [nowMs] = React.useState(() => Date.now());
  const realizedPnl24h = React.useMemo(() => {
    if (!hasBrokerAccount) return 0;
    const cutoff = nowMs - 24 * 60 * 60 * 1000;
    const fromHistory = tradeHistory
      .filter((t) => {
        const closed = t.closedAt ? new Date(t.closedAt).getTime() : 0;
        return closed >= cutoff;
      })
      .reduce((s, t) => s + Number(t.profit ?? 0), 0);
    if (tradeHistory.length > 0) return fromHistory;
    if (mountedForCache) {
      const cached = readOverviewAccountCache(userId);
      if (
        (tradeHistoryInitialLoading || tradeHistoryQuery.isFetching) &&
        cached?.realizedPnl24h != null
      ) {
        return Number(cached.realizedPnl24h);
      }
    }
    return Number(portfolio?.totalProfit ?? 0);
  }, [
    hasBrokerAccount,
    tradeHistory,
    portfolio?.totalProfit,
    nowMs,
    mountedForCache,
    tradeHistoryInitialLoading,
    tradeHistoryQuery.isFetching,
    userId,
  ]);

  const equityCurve = hasBrokerAccount ? portfolio?.equityCurve ?? [] : [];
  const sparkline =
    !hasBrokerAccount || equityCurve.length < 2
      ? hasBrokerAccount && balance > 0
        ? [balance, balance]
        : [0, 0]
      : equityCurve.slice(-24).map((p) => p.equity);

  const cachedReturnPct =
    hasBrokerAccount && mountedForCache
      ? Number(readOverviewAccountCache(userId)?.change24hPct)
      : NaN;

  // Total return is ALWAYS vs deposited capital (net deposits / initialEquity),
  // never vs a rolling 30d window. Formula: (equity − depositBase) / depositBase.
  const depositBase = Number(
    portfolio?.depositBase ??
      portfolio?.equityBase ??
      defaultBrokerAccount?.initialEquity ??
      0,
  );
  const currentEquity = hasBrokerAccount
    ? equity > 0
      ? equity
      : balance
    : 0;
  const totalReturnPct = !hasBrokerAccount
    ? 0
    : portfolio?.totalReturnPct != null &&
        Number.isFinite(portfolio.totalReturnPct) &&
        (portfolio.source === 'database' ||
          portfolio.source === 'snapshot' ||
          portfolio.source === 'metaapi')
      ? portfolio.totalReturnPct
      : (() => {
          const base = Number(
            portfolio?.depositBase ??
              portfolio?.equityBase ??
              defaultBrokerAccount?.initialEquity ??
              0,
          );
          const current = equity > 0 ? equity : balance;
          if (base > 0 && current > 0) {
            return ((current - base) / base) * 100;
          }
          return Number.isFinite(cachedReturnPct) ? cachedReturnPct : 0;
        })();


  const change24hPct = totalReturnPct;

  React.useEffect(() => {
    if (!hasBrokerAccount || !accountInfo || accountInfo.balance <= 0) return;
    writeOverviewAccountCache({
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      margin: accountInfo.margin,
      freeMargin: accountInfo.freeMargin,
      currency: accountInfo.currency,
      unrealizedPnl: openTrades.reduce((s, t) => s + Number(t.pnl || 0), 0),
      realizedPnl24h:
        tradeHistory.length > 0
          ? tradeHistory
              .filter((t) => {
                const closed = t.closedAt ? new Date(t.closedAt).getTime() : 0;
                return closed >= Date.now() - 24 * 60 * 60 * 1000;
              })
              .reduce((s, t) => s + Number(t.profit ?? 0), 0)
          : Number(portfolio?.totalProfit ?? 0),
      change24hPct: Number.isFinite(change24hPct)
        ? change24hPct
        : readOverviewAccountCache(userId)?.change24hPct,
      accountId: defaultBrokerAccount?.id,
      userId,
      savedAt: Date.now(),
    });
  }, [
    hasBrokerAccount,
    accountInfo,
    openTrades,
    tradeHistory,
    portfolio?.totalProfit,
    defaultBrokerAccount?.id,
    change24hPct,
    userId,
  ]);

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

  const metricsLoading =
    (hasBrokerAccount && accountsInitialLoading && !liveReady) ||
    (!hasBrokerAccount && accountsStillLoading);

  const drawdownPct = Number(portfolio?.maxDrawdown ?? risk?.drawdownPct ?? 0);
  const profitFactor = Number(portfolio?.profitFactor ?? 0);
  const sharpeRatio = Number(portfolio?.sharpeRatio ?? 0);
  const hasClosedTrades = (portfolio?.totalTrades ?? 0) > 0;
  const healthPct = Math.max(8, Math.min(92, 8 + drawdownPct * 3.2));
  const riskScoreLabel = !hasClosedTrades
    ? 'No Data'
    : drawdownPct >= 12 || profitFactor < 1 || sharpeRatio < 0
      ? 'Elevated'
      : drawdownPct >= 5 || profitFactor < 1.2 || sharpeRatio < 0.5
        ? 'Moderate'
        : 'Low Risk';

  const accountLabel = defaultBrokerAccount
    ? `${isPaper ? 'Paper' : 'Real'} Account ····${defaultBrokerAccount.accountNumberLast4 || ''}`
    : 'No account';

  return (
    <div
      className="space-y-2.5 pb-5 sm:space-y-3"
      suppressHydrationWarning
      data-tour="dashboard-overview"
    >
      { }
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
            <LiveClock />
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

      {!hasBrokerAccount && !accountsStillLoading && (
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

      {(hasBrokerAccount || accountsStillLoading) && (
        <OverviewMetricCards
          metrics={{
            balance: hasBrokerAccount ? balance : 0,
            equity: hasBrokerAccount ? equity : 0,
            margin: hasBrokerAccount ? margin : 0,
            freeMargin: hasBrokerAccount ? freeMargin : 0,
            currency,
            unrealizedPnl: hasBrokerAccount ? unrealizedPnl : 0,
            realizedPnl24h: hasBrokerAccount ? realizedPnl24h : 0,
            change24hPct: hasBrokerAccount ? change24hPct : 0,
            sparkline: hasBrokerAccount ? sparkline : [0, 0],
            isPaper,
            loading: metricsLoading,
            refreshing: accountsRefreshing && liveReady,
          }}
        />
      )}

      { }
      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-12">
        {(hasBrokerAccount || accountsStillLoading) && (
          <>
            <div className="xl:col-span-5">
              <OverviewOpenPositions
                positions={hasBrokerAccount ? openTrades : []}
                quotes={quoteMap}
                currency={currency}
                loading={accountsStillLoading || openTradesInitialLoading}
                onNewOrder={() => setManualOrderOpen(true)}
              />
            </div>
            <div className="xl:col-span-4">
              <OverviewPerformance
                equityCurve={hasBrokerAccount ? equityCurve : []}
                totalReturnPct={hasBrokerAccount ? totalReturnPct : 0}
                winRate={hasBrokerAccount ? portfolio?.winRate ?? 0 : 0}
                totalTrades={hasBrokerAccount ? portfolio?.totalTrades ?? 0 : 0}
                loading={accountsStillLoading || portfolioInitialLoading}
              />
            </div>
          </>
        )}
        <div
          className={
            hasBrokerAccount || accountsStillLoading
              ? 'xl:col-span-3'
              : 'xl:col-span-12'
          }
        >
          <OverviewMarketWatch
            quotes={quoteMap}
            activeTab={watchTab}
            onTabChange={setWatchTab}
            loading={quotesInitialLoading}
          />
        </div>
      </div>

      { }
      <div
        className={
          hasBrokerAccount || accountsStillLoading
            ? 'grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3'
            : 'grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2'
        }
      >
        {(hasBrokerAccount || accountsStillLoading) && (
          <OverviewRecentTrades
            trades={hasBrokerAccount ? tradeHistory : []}
            currency={currency}
            loading={accountsStillLoading || tradeHistoryInitialLoading}
            syncError={
              hasBrokerAccount
                ? tradeHistoryQuery.data?.syncError ?? null
                : null
            }
            syncMessage={
              hasBrokerAccount
                ? tradeHistoryQuery.data?.message ?? null
                : null
            }
          />
        )}
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

      { }
      <div
        className={
          hasBrokerAccount || accountsStillLoading
            ? 'grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2'
            : 'grid grid-cols-1 items-stretch gap-3'
        }
      >
        <OverviewQuickActions onNewOrder={() => setManualOrderOpen(true)} />
        {(hasBrokerAccount || accountsStillLoading) && (
          <OverviewAccountHealth
            riskScoreLabel={hasBrokerAccount ? riskScoreLabel : 'No Data'}
            drawdownPct={hasBrokerAccount ? drawdownPct : 0}
            profitFactor={hasBrokerAccount ? profitFactor : 0}
            sharpeRatio={hasBrokerAccount ? sharpeRatio : 0}
            healthPct={hasBrokerAccount ? healthPct : 8}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Live account data and market insights for your workspace.
      </p>

      <ManualOrderModal open={manualOrderOpen} onOpenChange={setManualOrderOpen} />
    </div>
  );
}
