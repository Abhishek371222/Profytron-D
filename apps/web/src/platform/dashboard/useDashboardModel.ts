'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import type { TradeHistoryRow } from '@/lib/api/trading';
import { strategiesApi } from '@/lib/api/strategies';
import { riskApi } from '@/lib/api/risk';
import { brokerApi } from '@/lib/api/broker';
import { useDashboardRealtime } from '@/platform/dashboard/useDashboardRealtime';
import { useWorkspace, useAppSession, useAppUserId } from '@/app-core';
import { createCacheApi } from '@/platform/cache';
import { dataApi } from '@/platform/data';
import { createSchedulerApi } from '@/platform/scheduler';
import type { CachedOverviewAccount } from '@/lib/overview-account-cache';
import { QueryKeys } from '@/platform/data/query-keys';
import { scheduleEntityRefresh, transitionMt5Sync } from '@/platform/mt5-sync';
import { metricsApi } from '@/platform/metrics';

export type AnalyticsRange = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const RANGE_MAP: Record<string, AnalyticsRange> = {
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  '3M': '3m',
  '1Y': '1y',
  ALL: 'all',
};

/** Broker-backed widgets: WS + scheduler own freshness (Phase 3). */
const BROKER_STALE_MS = 10 * 60_000;

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

type OpenTradeRow = {
  id: string;
  asset: string;
  type: 'Long' | 'Short';
  amount: number;
  entry: number;
  pnl: number;
  timestamp: string;
  strategyId: string;
  isPaper?: boolean;
};

export function useDashboardModel(chartRange: keyof typeof RANGE_MAP = '1M') {
  const queryClient = useQueryClient();
  const cache = createCacheApi();
  const data = dataApi;
  const { sessionReady } = useAppSession();
  const userId = useAppUserId();
  const {
    hasBrokerAccount,
    selectedAccount: defaultAccount,
    isPaper,
    brokerAccountsQuery,
    accountsLoading,
    ensureOwner,
  } = useWorkspace();
  const apiRange = RANGE_MAP[chartRange] ?? '1m';

  // Paint last-good L2 cache before any network round-trip.
  React.useEffect(() => {
    if (!sessionReady) return;
    ensureOwner();
    cache.hydrate(queryClient, userId);
  }, [sessionReady, queryClient, userId, ensureOwner, cache]);

  useDashboardRealtime(sessionReady);

  const accountQueriesEnabled = sessionReady && hasBrokerAccount;

  const portfolioQuery = data.useWorkspaceQuery({
    queryKey: QueryKeys.portfolio(apiRange),
    persistKey: QueryKeys.portfolio(apiRange),
    queryFn: async () => {
      const result = await analyticsApi.getPortfolio(apiRange);
      return result;
    },
    staleTime: BROKER_STALE_MS,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled,
  });

  const openTradesQuery = data.useWorkspaceQuery({
    queryKey: QueryKeys.openTrades(),
    persistKey: QueryKeys.openTrades(),
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
        brokerTicket: r.brokerTicket ?? r.id,
      }));
    },
    staleTime: BROKER_STALE_MS,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled,
  });

  const strategiesQuery = data.useWorkspaceQuery({
    queryKey: QueryKeys.myStrategies(),
    persistKey: QueryKeys.myStrategies(),
    queryFn: () => strategiesApi.getMyStrategies(),
    staleTime: BROKER_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: sessionReady,
  });

  const riskQuery = data.useWorkspaceQuery({
    queryKey: QueryKeys.dashboardRisk(),
    persistKey: QueryKeys.dashboardRisk(),
    queryFn: () => riskApi.getDashboard(),
    staleTime: BROKER_STALE_MS,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled,
  });

  const tradeHistoryQuery = data.useWorkspaceQuery({
    queryKey: QueryKeys.tradeHistory('overview'),
    persistKey: QueryKeys.tradeHistory('overview'),
    queryFn: async () => {
      // Never throw on soft MetaAPI sync errors — empty + syncError paints
      // "No recent trades" instead of an infinite skeleton.
      return tradingApi.getTradeHistory({ limit: 12 });
    },
    staleTime: 30_000,
    refetchInterval: (query) => {
      if (!accountQueriesEnabled) return false;
      // While MetaAPI sync is still pending, poll quickly for closed trades.
      if (query.state.data?.syncPending) return 5_000;
      return 60_000;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: accountQueriesEnabled,
  });

  // On mount / account switch: force MetaAPI equity+history sync so new and
  // existing users do not sit on stale lastKnown* balances.
  React.useEffect(() => {
    if (!accountQueriesEnabled || !defaultAccount?.id || isPaper) return;
    let cancelled = false;
    void (async () => {
      try {
        await brokerApi.refreshBrokerAccount(defaultAccount.id);
        if (cancelled) return;
        await queryClient.invalidateQueries({ queryKey: ['broker-accounts'] });
        scheduleEntityRefresh(
          queryClient,
          ['trade-history', 'open-trades', 'portfolio'],
          'critical',
        );
      } catch {
        // Soft failure — background poller / Refresh still available.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accountQueriesEnabled,
    defaultAccount?.id,
    isPaper,
    queryClient,
  ]);

  // Medium-priority background reconcile when tab visible (scheduler-owned).
  React.useEffect(() => {
    if (!accountQueriesEnabled) return;
    const sched = createSchedulerApi();
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      sched.schedule('dashboard:bg-reconcile', 'medium', () => {
        metricsApi.mark('mt5.bg_reconcile');
        scheduleEntityRefresh(
          queryClient,
          ['open-trades', 'portfolio', 'trade-history', 'broker-accounts'],
          'medium',
        );
      });
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, [accountQueriesEnabled, queryClient]);

  const [stickyAccount, setStickyAccount] =
    React.useState<LiveAccountInfo | null>(null);

  React.useEffect(() => {
    // Only restore sticky metrics once we know a broker account exists.
    if (!hasBrokerAccount) return;
    const cached = toLiveAccountInfo(cache.readOverviewAccount(userId));
    if (!cached) return;
    const raw = cache.readOverviewAccount(userId);
    if (
      raw?.accountId &&
      defaultAccount?.id &&
      raw.accountId !== defaultAccount.id
    ) {
      cache.clearOverviewAccount();
      setStickyAccount(null);
      return;
    }
    setStickyAccount(cached);
  }, [hasBrokerAccount, cache, userId, defaultAccount?.id]);

  const accountsSettled =
    brokerAccountsQuery.isFetched && !brokerAccountsQuery.isPending;

  // No linked broker → drop sticky + hydrated portfolio/trades so Overview
  // cannot paint orphan MetaAPI figures from a previous session.
  React.useEffect(() => {
    if (!sessionReady || !accountsSettled || hasBrokerAccount) return;
    setStickyAccount(null);
    cache.clearOverviewAccount();
    cache.clearAccountBound(queryClient);
  }, [
    sessionReady,
    accountsSettled,
    hasBrokerAccount,
    queryClient,
    cache,
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
      cache.writeOverviewAccount({
        balance: next.balance,
        equity: next.equity,
        margin: next.margin,
        freeMargin: next.freeMargin,
        currency: next.currency,
        accountId: defaultAccount?.id,
        userId,
        savedAt: Date.now(),
      });
      return;
    }
    if (accountDisconnected) {
      setStickyAccount(null);
      cache.clearOverviewAccount();
    }
  }, [
    hasBrokerAccount,
    liveAccountSnapshot,
    portfolioLiveSnapshot,
    accountDisconnected,
    defaultAccount?.id,
    cache,
    userId,
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

  const refreshAll = () => {
    const t0 = performance.now();
    transitionMt5Sync('synchronizing', { source: 'api' });
    if (defaultAccount?.id && !isPaper) {
      void brokerApi
        .refreshBrokerAccount(defaultAccount.id)
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ['broker-accounts'] }),
        )
        .catch(() => undefined);
    }
    scheduleEntityRefresh(
      queryClient,
      [
        'trade-history',
        'open-trades',
        'portfolio',
        'dashboard-risk',
        'broker-accounts',
      ],
      'critical',
    );
    // Quotes live in module-local hooks — invalidate shared query key.
    void queryClient.invalidateQueries({ queryKey: ['live-market-quotes-v3'] });
    metricsApi.mark('dashboard.refresh_all', { ms: performance.now() - t0 });
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
    hasBrokerAccount && portfolioQuery.isInitialLoading;
  const openTradesInitialLoading =
    hasBrokerAccount && openTradesQuery.isInitialLoading;
  const tradeHistoryInitialLoading =
    hasBrokerAccount && tradeHistoryQuery.isInitialLoading;
  const accountsRefreshing =
    Boolean(accountInfo) &&
    (brokerAccountsQuery.isFetching || brokerAccountsQuery.isPending);

  return {
    quotes: {},
    wsConnected: false,
    marketQuotesWithSpark: {},
    portfolioQuery,
    portfolio,
    portfolioValue,
    equityBase,
    winRate,
    bestMonth,
    openTrades: (hasBrokerAccount
      ? openTradesQuery.data ?? []
      : []) as OpenTradeRow[],
    tradeHistory: (hasBrokerAccount
      ? tradeHistoryQuery.data?.rows ?? []
      : []) as TradeHistoryRow[],
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
    quotesLoading: false,
    accountsInitialLoading,
    accountsRefreshing,
    portfolioInitialLoading,
    openTradesInitialLoading,
    tradeHistoryInitialLoading,
    quotesInitialLoading: false,
    isLoading: accountsInitialLoading || portfolioInitialLoading,
    refreshAll,
  };
}
