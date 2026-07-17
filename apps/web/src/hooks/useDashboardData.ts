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
import {
  clearAccountBoundDashboardCache,
  hydrateDashboardCache,
  persistDashboardQuery,
} from '@/lib/queries/dashboard-cache';
import { ensureWorkspaceCacheOwner } from '@/lib/queries/purge-workspace-caches';

export type AnalyticsRange = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const RANGE_MAP: Record<string, AnalyticsRange> = {
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  '3M': '3m',
  '1Y': '1y',
  ALL: 'all',
};

/** Poll live MetaAPI-backed widgets once per minute. */
const LIVE_POLL_MS = 60_000;

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

  // Paint last-good localStorage values before any network round-trip.
  const userId = useAuthStore((s) => s.user?.id);
  React.useEffect(() => {
    if (!sessionReady) return;
    ensureWorkspaceCacheOwner(userId);
    hydrateDashboardCache(queryClient, userId);
  }, [sessionReady, queryClient, userId]);

  useDashboardRealtime(sessionReady);

  const {
    quotes,
    priceHistory,
    wsConnected,
    refresh: refreshQuotes,
    isLoading: quotesLoading,
  } = useLiveMarketFeed(['BTCUSDT', 'EURUSD', 'XAUUSD'], {
    enabled: sessionReady,
    allowFallback: false,
  });

  const accountQueriesEnabled = sessionReady && hasBrokerAccount;

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', apiRange],
    queryFn: async () => {
      const data = await analyticsApi.getPortfolio(apiRange);
      if (data?.source === 'metaapi') {
        persistDashboardQuery(['portfolio', apiRange], data);
      }
      return data;
    },
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled,
  });

  const openTradesQuery = useQuery({
    queryKey: ['open-trades'],
    queryFn: async () => {
      const rows = await tradingApi.getOpenTrades();
      const mapped = rows.map((r) => ({
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
      persistDashboardQuery(['open-trades'], mapped);
      return mapped;
    },
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    enabled: accountQueriesEnabled,
  });

  const strategiesQuery = useQuery({
    queryKey: ['my-strategies'],
    queryFn: async () => {
      const data = await strategiesApi.getMyStrategies();
      persistDashboardQuery(['my-strategies'], data);
      return data;
    },
    staleTime: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  const riskQuery = useQuery({
    queryKey: ['dashboard-risk'],
    queryFn: async () => {
      const data = await riskApi.getDashboard();
      persistDashboardQuery(['dashboard-risk'], data);
      return data;
    },
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled,
  });

  const tradeHistoryQuery = useQuery({
    queryKey: ['trade-history', 'overview'],
    queryFn: async () => {
      // 30d lookback is enough for Overview's 12-row widget and keeps MetaAPI
      // history pulls small. DB-first server path paints cached rows in <2s.
      const result = await tradingApi.getTradeHistory({ limit: 12, days: 30 });
      // Keep syncError on the payload so Overview can soft-warn; do not throw
      // or React Query will wipe previous trades and show a hard failure.
      persistDashboardQuery(['trade-history', 'overview'], result);
      return result;
    },
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnMount: false,
    // Window-focus refetch was forcing a MetaAPI round-trip on every tab
    // switch — the slow refresh the user felt. Interval + manual Refresh
    // cover freshness; keep previous rows painted while a background sync runs.
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous,
    enabled: accountQueriesEnabled,
  });

  const [stickyAccount, setStickyAccount] =
    React.useState<LiveAccountInfo | null>(null);

  React.useEffect(() => {
    // Only restore sticky metrics once we know a broker account exists.
    if (!hasBrokerAccount) return;
    const cached = toLiveAccountInfo(
      readOverviewAccountCache(useAuthStore.getState().user?.id),
    );
    if (cached) setStickyAccount(cached);
  }, [hasBrokerAccount]);

  const accountsSettled =
    brokerAccountsQuery.isFetched && !brokerAccountsQuery.isPending;

  // No linked broker → drop sticky + hydrated portfolio/trades so Overview
  // cannot paint orphan MetaAPI figures from a previous session.
  React.useEffect(() => {
    if (!sessionReady || !accountsSettled || hasBrokerAccount) return;
    setStickyAccount(null);
    clearOverviewAccountCache();
    clearAccountBoundDashboardCache(queryClient);
  }, [
    sessionReady,
    accountsSettled,
    hasBrokerAccount,
    queryClient,
  ]);

  const liveAccountSnapshot = React.useMemo((): LiveAccountInfo | null => {
    if (!hasBrokerAccount || brokerAccountsQuery.isError || !defaultAccount)
      return null;

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
  }, [hasBrokerAccount, defaultAccount, brokerAccountsQuery.isError]);

  const portfolioLiveSnapshot = React.useMemo((): LiveAccountInfo | null => {
    if (!hasBrokerAccount) return null;
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
  }, [hasBrokerAccount, portfolioQuery.data]);

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
    if (!hasBrokerAccount) return;
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
        userId: useAuthStore.getState().user?.id,
        savedAt: Date.now(),
      });
      return;
    }
    if (accountDisconnected) {
      setStickyAccount(null);
      clearOverviewAccountCache();
    }
  }, [
    hasBrokerAccount,
    liveAccountSnapshot,
    portfolioLiveSnapshot,
    accountDisconnected,
    defaultAccount?.id,
  ]);

  const accountInfo = !hasBrokerAccount
    ? null
    : liveAccountSnapshot ?? portfolioLiveSnapshot ?? stickyAccount;

  const portfolio = !hasBrokerAccount
    ? undefined
    : portfolioQuery.data?.source === 'metaapi' ||
        portfolioQuery.data?.source === 'empty'
      ? portfolioQuery.data
      : undefined;

  const portfolioValue = accountInfo?.equity ?? 0;
  const equityBase = Number(
    portfolio?.equityBase ?? defaultAccount?.initialEquity ?? 0,
  );
  const winRate = portfolio?.winRate ?? 0;
  const bestMonth = portfolio?.bestMonth ?? 0;

  const activeStrategies = (strategiesQuery.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: 'active' as const,
    winRate: Math.min(
      100,
      Math.max(0, Number(s.winRate ?? portfolio?.winRate ?? 0)),
    ),
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
      if (isFakeNestQuote(key, q.price, (q as { source?: string }).source)) {
        continue;
      }
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
          q
            ? { ...q, sparkline: hist && hist.length > 0 ? hist : undefined }
            : undefined,
        ];
      }),
    );
  }, [stableQuotes, priceHistory]);

  const refreshAll = () => {
    invalidateAccountQueries(queryClient);
    void queryClient.invalidateQueries({ queryKey: ['trade-history'] });
    void queryClient.invalidateQueries({ queryKey: ['open-trades'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    refreshQuotes();
  };

  const brokerAccountInfoQuery = {
    isPending: brokerAccountsQuery.isPending,
    data: accountInfo,
  };
  const brokerEquityQuery = { data: portfolioValue };

  const accountsInitialLoading =
    (hasBrokerAccount &&
      !accountInfo &&
      !brokerAccountsQuery.isError &&
      (brokerAccountsQuery.isPending || brokerAccountsQuery.isLoading)) ||
    accountsLoading;
  const portfolioInitialLoading =
    hasBrokerAccount && sessionReady && portfolioQuery.isPending && !portfolio;
  const openTradesInitialLoading =
    hasBrokerAccount &&
    openTradesQuery.isPending &&
    openTradesQuery.data === undefined;
  const tradeHistoryInitialLoading =
    hasBrokerAccount &&
    tradeHistoryQuery.isPending &&
    tradeHistoryQuery.data === undefined;
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
    openTrades: hasBrokerAccount ? openTradesQuery.data ?? [] : [],
    tradeHistory: hasBrokerAccount ? tradeHistoryQuery.data?.rows ?? [] : [],
    tradeHistoryQuery,
    accountInfo,
    brokerAccountInfoQuery,
    activeStrategies,
    performanceBars,
    risk: hasBrokerAccount ? riskQuery.data : undefined,
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
