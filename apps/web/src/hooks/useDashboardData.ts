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

export type AnalyticsRange = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const RANGE_MAP: Record<string, AnalyticsRange> = {
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  '3M': '3m',
  '1Y': '1y',
  ALL: 'all',
};

export function useDashboardData(chartRange: keyof typeof RANGE_MAP = '1M') {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionReady = isAuthenticated && !isHydrating && Boolean(accessToken);
  const { hasBrokerAccount, defaultAccount, isPaper, brokerAccountsQuery } =
    useAccountContext();
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

  // Only show live MetaAPI numbers — never DB initialEquity placeholders.
  const accountInfo = React.useMemo(() => {
    if (!defaultAccount) return null;
    if (defaultAccount.liveSynced === false) return null;
    const balance = Number(defaultAccount.balance ?? 0);
    const equity = Number(defaultAccount.equity ?? defaultAccount.balance ?? 0);
    if (!Number.isFinite(equity) || equity <= 0) return null;
    if (!Number.isFinite(balance) || balance <= 0) return null;
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
      leverage: null as number | null,
      connected: true as const,
      liveSynced: true as const,
    };
  }, [defaultAccount]);

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

  const marketQuotesWithSpark = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(liveQuotes).map(([key, q]) => {
        const hist = priceHistory[key as keyof typeof priceHistory];
        return [
          key,
          q ? { ...q, sparkline: hist && hist.length > 0 ? hist : undefined } : undefined,
        ];
      }),
    );
  }, [liveQuotes, priceHistory]);

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

  const waitingForLiveBalance =
    hasBrokerAccount && !accountInfo && !brokerAccountsQuery.isError;
  const waitingForPortfolio =
    isAuthenticated && portfolioQuery.isPending && !portfolio;

  return {
    quotes: liveQuotes,
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
    quotesLoading:
      quotesLoading || (hasBrokerAccount && Object.keys(liveQuotes).length === 0),
    isLoading: waitingForLiveBalance || waitingForPortfolio,
    refreshAll,
  };
}
