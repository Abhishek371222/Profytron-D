'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import { walletApi } from '@/lib/api/wallet';
import { strategiesApi } from '@/lib/api/strategies';
import { brokerApi } from '@/lib/api/broker';
import { riskApi } from '@/lib/api/risk';
import { useLiveMarketFeed } from '@/hooks/useLiveMarketFeed';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { invalidateAccountQueries } from '@/lib/queries/account-queries';
import { useQueryClient } from '@tanstack/react-query';

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
  const { hasBrokerAccount, defaultAccount, isPaper, brokerAccountsQuery } = useAccountContext();
  const apiRange = RANGE_MAP[chartRange] ?? '1m';
  const [skeletonCapReached, setSkeletonCapReached] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSkeletonCapReached(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useDashboardRealtime(isAuthenticated);

  const { quotes, priceHistory, wsConnected, refresh: refreshQuotes } = useLiveMarketFeed(
    ['BTCUSDT', 'EURUSD', 'XAUUSD'],
    { enabled: isAuthenticated, allowFallback: !hasBrokerAccount },
  );

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', apiRange],
    queryFn: () => analyticsApi.getPortfolio(apiRange),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
    placeholderData: (prev) => prev,
  });

  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.getBalance(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
    placeholderData: (prev) => prev,
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
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const strategiesQuery = useQuery({
    queryKey: ['my-strategies'],
    queryFn: () => strategiesApi.getMyStrategies(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const riskQuery = useQuery({
    queryKey: ['dashboard-risk'],
    queryFn: () => riskApi.getDashboard(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const brokerAccountsQueryLocal = brokerAccountsQuery;

  const brokerEquityQuery = useQuery({
    queryKey: ['broker-equity'],
    queryFn: async () => {
      const accounts = brokerAccountsQueryLocal.data ?? [];
      const results = await Promise.all(
        accounts.map((a: { id: string }) =>
          brokerApi.testConnection(a.id).catch(() => null),
        ),
      );
      return results.reduce(
        (sum: number, r: { connected?: boolean; accountInfo?: { equity?: number } } | null) =>
          sum + (r?.connected ? Number(r.accountInfo?.equity ?? 0) : 0),
        0,
      );
    },
    enabled: isAuthenticated && (brokerAccountsQueryLocal.data?.length ?? 0) > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const portfolio = portfolioQuery.data;
  const walletTotal = walletQuery.data?.total ?? 0;
  const brokerEquity = brokerEquityQuery.data ?? 0;
  const equityBase = Number(portfolio?.equityBase ?? defaultAccount?.initialEquity ?? 0);
  const portfolioValue = walletTotal + brokerEquity;
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
      color: '#47a7aa',
    },
    {
      label: 'Win Rate',
      score: Math.min(winRate, 100),
      color: '#16A34A',
    },
    {
      label: 'Best Mo.',
      score: equityBase > 0 ? Math.min((bestMonth / equityBase) * 100, 100) : 0,
      color: '#F59E0B',
    },
    {
      label: 'Drawdown',
      score: Math.min((portfolio?.maxDrawdown ?? 0) * 8, 100),
      color: '#DC2626',
    },
  ];

  const marketQuotesWithSpark = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(quotes).map(([key, q]) => {
        const hist = priceHistory[key as keyof typeof priceHistory];
        return [key, q ? { ...q, sparkline: hist && hist.length > 0 ? hist : undefined } : undefined];
      }),
    );
  }, [quotes, priceHistory]);

  const refreshAll = () => {
    invalidateAccountQueries(queryClient);
    refreshQuotes();
  };

  return {
    quotes,
    wsConnected,
    marketQuotesWithSpark,
    portfolioQuery,
    portfolio,
    portfolioValue,
    equityBase,
    winRate,
    bestMonth,
    openTrades: openTradesQuery.data ?? [],
    activeStrategies,
    performanceBars,
    risk: riskQuery.data,
    riskQuery,
    hasBrokerAccount,
    defaultBrokerAccount: defaultAccount,
    isPaper,
    brokerAccountsQuery: brokerAccountsQueryLocal,
    brokerEquityQuery,
    quotesLoading: hasBrokerAccount && Object.keys(quotes).length === 0,
    isLoading:
      !skeletonCapReached &&
      (portfolioQuery.isPending || openTradesQuery.isPending || riskQuery.isPending) &&
      !portfolioQuery.data &&
      !openTradesQuery.data &&
      !riskQuery.data,
    refreshAll,
  };
}
