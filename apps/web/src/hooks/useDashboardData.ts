'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import { strategiesApi } from '@/lib/api/strategies';
import { riskApi } from '@/lib/api/risk';
import { useLiveMarketFeed, isFakeNestQuote } from '@/hooks/useLiveMarketFeed';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { invalidateAccountQueries } from '@/lib/queries/account-queries';
import {
  clearOverviewAccountCache,
  readOverviewAccountCache,
  writeOverviewAccountCache,
  type CachedOverviewAccount,
} from '@/lib/overview-account-cache';

export type AnalyticsRange = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const RANGE_MAP: Record<string, AnalyticsRange> = {
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  '3M': '3m',
  '1Y': '1y',
  ALL: 'all',
};

type LiveAccountInfo = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  leverage: number | null;
  connected: true;
  liveSynced: true;
};

function toLiveAccountInfo(
  cached: CachedOverviewAccount | null,
): LiveAccountInfo | null {
  if (!cached) return null;
  return {
    balance: cached.balance,
    equity: cached.equity,
    margin: cached.margin,
    freeMargin: cached.freeMargin,
    currency: cached.currency || 'USD',
    leverage: null,
    connected: true,
    liveSynced: true,
  };
}

export function useDashboardData(chartRange: keyof typeof RANGE_MAP = '1M') {
  const queryClient = useQueryClient();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const {
    hasBrokerAccount,
    defaultAccount,
    isPaper,
    brokerAccountsQuery,
    accountsLoading,
  } = useAccountContext();
  const apiRange = RANGE_MAP[chartRange] ?? '1m';

  useDashboardRealtime(sessionReady);

  const { quotes, priceHistory, wsConnected, refresh: refreshQuotes, isLoading: quotesLoading } =
    useLiveMarketFeed(['BTCUSDT', 'EURUSD', 'XAUUSD'], {
      enabled: sessionReady,
      allowFallback: false,
    });

  // Analytics is secondary — balance comes from fast /broker/accounts.
  const portfolioQuery = useQuery({
    queryKey: ['portfolio', apiRange],
    queryFn: () => analyticsApi.getPortfolio(apiRange),
    staleTime: 30_000,
    refetchInterval: 45_000,
    refetchOnWindowFocus: false,
    // Warm cache from bootstrap — don't flash empty then refill.
    refetchOnMount: false,
    placeholderData: (previous) => previous,
    enabled: sessionReady,
  });

  const openTradesQuery = useQuery({
    queryKey: ['open-trades'],
    queryFn: async () => {
      const rows = await tradingApi.getOpenTrades();
      return rows.map((r) => ({
        id: r.id,
        asset: r.symbol,
        type: r.direction === 'LONG' ? ('Long' as const) : ('Short' as const),
        amount: r.volume,
        entry: r.fillPrice ?? r.openPrice,
        pnl: r.unrealizedPnl ?? r.profit ?? 0,
        timestamp: r.openedAt,
        strategyId: r.strategyId ?? '',
        isPaper: r.isPaper,
      }));
    },
    staleTime: 8_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  const strategiesQuery = useQuery({
    queryKey: ['my-strategies'],
    queryFn: () => strategiesApi.getMyStrategies(),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  const riskQuery = useQuery({
    queryKey: ['dashboard-risk'],
    queryFn: () => riskApi.getDashboard(),
    staleTime: 60_000,
    refetchInterval: 90_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  const tradeHistoryQuery = useQuery({
    queryKey: ['trade-history', 'overview'],
    queryFn: () => tradingApi.getTradeHistory({ limit: 12 }),
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  // Sticky last-good snapshot — hydrate from sessionStorage so reload never flashes 0.
  const [stickyAccount, setStickyAccount] = React.useState<LiveAccountInfo | null>(
    () => toLiveAccountInfo(readOverviewAccountCache()),
  );

  const liveAccountSnapshot = React.useMemo((): LiveAccountInfo | null => {
    if (brokerAccountsQuery.isError || !defaultAccount) return null;

    const status = String(defaultAccount.connectionStatus || '').toUpperCase();
    if (status === 'DISCONNECTED' || status === 'ERROR' || status === 'FAILED') {
      return null;
    }

    const balance = Number(
      defaultAccount.balance ?? defaultAccount.initialEquity ?? 0,
    );
    const equity = Number(
      defaultAccount.equity ??
        defaultAccount.balance ??
        defaultAccount.initialEquity ??
        0,
    );
    // Accept any finite positive snapshot (MetaAPI / bridge / paper baseline).
    const looksLive =
      Number.isFinite(equity) &&
      equity > 0 &&
      Number.isFinite(balance) &&
      balance > 0;
    if (!looksLive) return null;

    const margin = Number(defaultAccount.margin ?? 0);
    const freeMargin = Number(
      defaultAccount.freeMargin ?? Math.max(0, equity - margin),
    );
    return {
      balance,
      equity,
      margin: Number.isFinite(margin) ? margin : 0,
      freeMargin: Number.isFinite(freeMargin) ? freeMargin : equity,
      currency: String(defaultAccount.currency ?? 'USD'),
      leverage: null,
      connected: true,
      liveSynced: true,
    };
  }, [defaultAccount, brokerAccountsQuery.isError]);

  // Portfolio MetaAPI path often has live equity even when broker list is still syncing.
  const portfolioLiveSnapshot = React.useMemo((): LiveAccountInfo | null => {
    const p = portfolioQuery.data;
    if (!p || p.source !== 'metaapi') return null;
    const equity = Number(p.liveEquity ?? p.liveBalance ?? 0);
    const balance = Number(p.liveBalance ?? p.liveEquity ?? 0);
    if (!(equity > 0 && balance > 0)) return null;
    const margin = Number(p.liveMargin ?? 0);
    const freeMargin = Number(
      p.liveFreeMargin ?? Math.max(0, equity - margin),
    );
    return {
      balance,
      equity,
      margin: Number.isFinite(margin) ? margin : 0,
      freeMargin: Number.isFinite(freeMargin) ? freeMargin : equity,
      currency: String(p.liveCurrency ?? 'USD'),
      leverage: null,
      connected: true,
      liveSynced: true,
    };
  }, [portfolioQuery.data]);

  const accountDisconnected =
    brokerAccountsQuery.isError ||
    (!defaultAccount &&
      brokerAccountsQuery.isFetched &&
      !brokerAccountsQuery.isPending &&
      !brokerAccountsQuery.isFetching) ||
    (() => {
      const status = String(defaultAccount?.connectionStatus || '').toUpperCase();
      return status === 'DISCONNECTED' || status === 'ERROR' || status === 'FAILED';
    })();

  React.useEffect(() => {
    const next = liveAccountSnapshot ?? portfolioLiveSnapshot;
    if (next) {
      setStickyAccount(next);
      writeOverviewAccountCache({
        balance: next.balance,
        equity: next.equity,
        margin: next.margin,
        freeMargin: next.freeMargin,
        currency: next.currency,
        accountId: defaultAccount?.id,
        savedAt: Date.now(),
      });
      return;
    }
    if (accountDisconnected) {
      setStickyAccount(null);
      clearOverviewAccountCache();
    }
  }, [
    liveAccountSnapshot,
    portfolioLiveSnapshot,
    accountDisconnected,
    defaultAccount?.id,
  ]);

  const accountInfo =
    liveAccountSnapshot ?? portfolioLiveSnapshot ?? stickyAccount;

  // Ignore non-MetaAPI portfolio payloads (stale Nest cache) until live data arrives.
  const portfolio =
    portfolioQuery.data?.source === 'metaapi' || portfolioQuery.data?.source === 'empty'
      ? portfolioQuery.data
      : undefined;

  const portfolioValue = accountInfo?.equity ?? 0;
  const equityBase = Number(portfolio?.equityBase ?? defaultAccount?.initialEquity ?? 0);
  const winRate = portfolio?.winRate ?? 0;
  const bestMonth = portfolio?.bestMonth ?? 0;

  const activeStrategies = (strategiesQuery.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: 'active' as const,
    winRate: Math.min(100, Math.max(0, Number(s.winRate ?? portfolio?.winRate ?? 0))),
    confidence: Math.min(100, Math.max(40, 50 + Number(s.latestPnl ?? 0) / 10)),
    latestPnl: Number(s.latestPnl ?? 0),
  }));

  const performanceBars = [
    {
      label: 'Sharpe',
      score: Math.min(((portfolio?.sharpeRatio ?? 0) / 3) * 100, 100),
      color: '#348398',
    },
    {
      label: 'Win Rate',
      score: Math.min(winRate, 100),
      color: '#9FE1F3',
    },
    {
      label: 'Best Mo.',
      score: equityBase > 0 ? Math.min((bestMonth / equityBase) * 100, 100) : 0,
      color: '#348398',
    },
    {
      label: 'Drawdown',
      score: Math.min((portfolio?.maxDrawdown ?? 0) * 8, 100),
      color: '#973336',
    },
  ];

  const liveQuotes = React.useMemo(() => {
    const next: typeof quotes = {};
    for (const [key, q] of Object.entries(quotes)) {
      if (!q) continue;
      if (isFakeNestQuote(key, q.price, (q as { source?: string }).source)) continue;
      next[key as keyof typeof quotes] = q;
    }
    return next;
  }, [quotes]);

  const [stickyQuotes, setStickyQuotes] = React.useState<typeof quotes>({});
  React.useEffect(() => {
    if (Object.keys(liveQuotes).length > 0) {
      setStickyQuotes(liveQuotes);
    }
  }, [liveQuotes]);

  const stableQuotes =
    Object.keys(liveQuotes).length > 0 ? liveQuotes : stickyQuotes;

  const marketQuotesWithSpark = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(stableQuotes).map(([key, q]) => {
        const hist = priceHistory[key as keyof typeof priceHistory];
        return [
          key,
          q ? { ...q, sparkline: hist && hist.length > 0 ? hist : undefined } : undefined,
        ];
      }),
    );
  }, [stableQuotes, priceHistory]);

  const refreshAll = () => {
    invalidateAccountQueries(queryClient);
    refreshQuotes();
  };

  // Stub kept for callers that still read these keys — no extra MetaAPI round-trips.
  const brokerAccountInfoQuery = {
    isPending: brokerAccountsQuery.isPending,
    data: accountInfo,
  };
  const brokerEquityQuery = { data: portfolioValue };

  // Initial load only — never treat a background poll as "no data".
  // If we already have sticky/cached numbers, do not block the UI on MetaAPI.
  const accountsInitialLoading =
    (hasBrokerAccount &&
      !accountInfo &&
      !brokerAccountsQuery.isError &&
      (brokerAccountsQuery.isPending || brokerAccountsQuery.isLoading)) ||
    accountsLoading;
  const portfolioInitialLoading =
    sessionReady && portfolioQuery.isPending && !portfolio;
  const openTradesInitialLoading =
    openTradesQuery.isPending && openTradesQuery.data === undefined;
  const tradeHistoryInitialLoading =
    tradeHistoryQuery.isPending && tradeHistoryQuery.data === undefined;
  const quotesInitialLoading =
    quotesLoading && Object.keys(stableQuotes).length === 0;
  const accountsRefreshing =
    Boolean(accountInfo) &&
    (brokerAccountsQuery.isFetching || brokerAccountsQuery.isPending);

  return {
    quotes: stableQuotes,
    wsConnected,
    marketQuotesWithSpark,
    portfolioQuery,
    portfolio,
    portfolioValue,
    equityBase,
    winRate,
    bestMonth,
    openTrades: openTradesQuery.data ?? [],
    tradeHistory: tradeHistoryQuery.data?.rows ?? [],
    tradeHistoryQuery,
    accountInfo,
    brokerAccountInfoQuery,
    activeStrategies,
    performanceBars,
    risk: riskQuery.data,
    riskQuery,
    hasBrokerAccount,
    defaultBrokerAccount: defaultAccount,
    isPaper,
    brokerAccountsQuery,
    brokerEquityQuery,
    quotesLoading: quotesInitialLoading,
    accountsInitialLoading,
    accountsRefreshing,
    portfolioInitialLoading,
    openTradesInitialLoading,
    tradeHistoryInitialLoading,
    quotesInitialLoading,
    isLoading: accountsInitialLoading || portfolioInitialLoading,
    refreshAll,
  };
}
