'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { snapshotApi } from '@/lib/api/snapshot';
import { tradingApi, type TradeHistoryRow } from '@/lib/api/trading';
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

const LIVE_POLL_MS = 10_000;

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
  const defaultAccountId = defaultAccount?.id;

  const snapshotQuery = useQuery({
    queryKey: ['account-snapshot-latest', defaultAccountId],
    queryFn: () => snapshotApi.getLatest(defaultAccountId!),
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled && Boolean(defaultAccountId) && !isPaper,
  });

  const snapshotPositionsQuery = useQuery({
    queryKey: ['account-snapshot-positions', defaultAccountId],
    queryFn: () => snapshotApi.getPositions(defaultAccountId!),
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled && Boolean(defaultAccountId) && !isPaper,
  });

  const snapshotDealsQuery = useQuery({
    queryKey: ['account-snapshot-deals', defaultAccountId, 'overview'],
    queryFn: () => snapshotApi.getDeals(defaultAccountId!, 50),
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled && Boolean(defaultAccountId) && !isPaper,
  });

  const snapshotEquityHistoryQuery = useQuery({
    queryKey: ['account-snapshot-equity-history', defaultAccountId, 'overview'],
    queryFn: () => snapshotApi.getEquityHistory(defaultAccountId!, 500),
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled && Boolean(defaultAccountId) && !isPaper,
  });

  const snapshotPerformanceQuery = useQuery({
    queryKey: ['account-snapshot-performance', defaultAccountId],
    queryFn: () => snapshotApi.getPerformance(defaultAccountId!),
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled && Boolean(defaultAccountId) && !isPaper,
  });

  const snapshotRiskQuery = useQuery({
    queryKey: ['account-snapshot-risk', defaultAccountId],
    queryFn: () => snapshotApi.getRisk(defaultAccountId!),
    staleTime: LIVE_POLL_MS,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: accountQueriesEnabled && Boolean(defaultAccountId) && !isPaper,
  });

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', apiRange],
    queryFn: async () => {
      const data = await analyticsApi.getPortfolio(apiRange);
      if (data?.source === 'database' || data?.source === 'snapshot') {
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
      if (defaultAccountId && snapshotPositionsQuery.data?.positions) {
        const mappedFromSnapshot = snapshotPositionsQuery.data.positions.map((r) => ({
          id: String(r.id ?? r.positionId ?? r.ticket ?? `${r.symbol}-${r.openTime ?? ''}`),
          asset: r.symbol,
          type:
            String(r.side ?? r.type ?? '').toUpperCase().includes('SELL') ||
            String(r.side ?? r.type ?? '').toUpperCase().includes('SHORT')
              ? ('Short' as const)
              : ('Long' as const),
          amount: Number(r.volume ?? 0),
          entry: Number(r.openPrice ?? 0),
          pnl: Number(r.profit ?? 0),
          timestamp: String(r.openTime ?? r.time ?? new Date().toISOString()),
          strategyId: '',
          isPaper: false,
        }));
        persistDashboardQuery(['open-trades'], mappedFromSnapshot);
        return mappedFromSnapshot;
      }
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

  const snapshotTradeHistory = React.useMemo<TradeHistoryRow[]>(() => {
    const deals = Array.isArray(snapshotDealsQuery.data?.deals)
      ? snapshotDealsQuery.data.deals
      : [];
    const seen = new Set<string>();
    return deals
      .filter((deal: any) => deal?.symbol)
      .filter((deal: any) => {
        const key = String(
          deal.dealId ??
            deal.orderId ??
            deal.positionId ??
            `${deal.symbol}-${deal.time}-${deal.price}-${deal.volume}-${deal.profit}`,
        );
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((deal: any) => {
        const rawType = String(deal.executionType ?? deal.type ?? '').toUpperCase();
        const isSell = rawType.includes('SELL') || rawType.includes('SHORT');
        const time = deal.time ?? deal.capturedAt ?? new Date().toISOString();
        return {
          id: String(
            deal.dealId ??
              deal.id ??
              deal.positionId ??
              `${deal.symbol}-${time}`,
          ),
          symbol: String(deal.symbol),
          direction: isSell ? ('SHORT' as const) : ('LONG' as const),
          volume: Number(deal.volume ?? 0),
          openPrice: Number(deal.price ?? 0),
          closePrice: deal.price != null ? Number(deal.price) : null,
          profit: Number(deal.profit ?? 0),
          status: 'CLOSED',
          openedAt: String(time),
          closedAt: String(time),
          strategyId: null,
          isPaper: false,
        };
      });
  }, [snapshotDealsQuery.data]);

  const snapshotEquityCurve = React.useMemo(() => {
    const points = Array.isArray(snapshotEquityHistoryQuery.data?.points)
      ? snapshotEquityHistoryQuery.data.points
      : [];
    return points
      .filter((point: any) => Number(point?.equity) > 0)
      .map((point: any) => ({
        date: String(point.capturedAt),
        equity: Number(point.equity),
        drawdownPct: 0,
      }));
  }, [snapshotEquityHistoryQuery.data]);

  const snapshotPerformance =
    (snapshotPerformanceQuery.data?.performance as any) ??
    (snapshotQuery.data?.snapshot?.performanceJson as any) ??
    null;
  const snapshotRisk =
    (snapshotRiskQuery.data?.risk as any) ??
    (snapshotQuery.data?.snapshot?.riskJson as any) ??
    null;

  const [stickyAccount, setStickyAccount] =
    React.useState<LiveAccountInfo | null>(null);

  React.useEffect(() => {
    if (!hasBrokerAccount) return;
    const cached = toLiveAccountInfo(
      readOverviewAccountCache(useAuthStore.getState().user?.id),
    );
    if (cached) setStickyAccount(cached);
  }, [hasBrokerAccount]);

  const accountsSettled =
    brokerAccountsQuery.isFetched && !brokerAccountsQuery.isPending;

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

  const databaseSnapshotAccount = React.useMemo((): LiveAccountInfo | null => {
    if (!hasBrokerAccount) return null;
    const snapshot = snapshotQuery.data?.snapshot;
    if (!snapshot) return null;
    const equity = Number(snapshot.equity ?? snapshot.balance ?? 0);
    const balance = Number(snapshot.balance ?? snapshot.equity ?? 0);
    if (!(equity > 0 && balance > 0)) return null;
    const margin = Number(snapshot.margin ?? 0);
    const freeMargin = Number(
      snapshot.freeMargin ?? Math.max(0, equity - margin),
    );
    return {
      balance,
      equity,
      margin: Number.isFinite(margin) ? margin : 0,
      freeMargin: Number.isFinite(freeMargin) ? freeMargin : equity,
      currency: String(snapshot.currency ?? 'USD'),
      leverage: snapshot.leverage ?? null,
      connected: true,
      liveSynced: true,
    };
  }, [hasBrokerAccount, snapshotQuery.data]);

  const portfolioLiveSnapshot = React.useMemo((): LiveAccountInfo | null => {
    if (!hasBrokerAccount) return null;
    const p = portfolioQuery.data;
    if (!p || (p.source !== 'database' && p.source !== 'snapshot')) return null;
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
    const next =
      databaseSnapshotAccount ?? liveAccountSnapshot ?? portfolioLiveSnapshot;
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
    databaseSnapshotAccount,
    liveAccountSnapshot,
    portfolioLiveSnapshot,
    accountDisconnected,
    defaultAccount?.id,
  ]);

  const accountInfo = !hasBrokerAccount
    ? null
    : databaseSnapshotAccount ??
      liveAccountSnapshot ??
      portfolioLiveSnapshot ??
      stickyAccount;

  const portfolioSource = String(portfolioQuery.data?.source ?? '');
  const portfolio = !hasBrokerAccount
    ? undefined
    : portfolioQuery.data &&
        (portfolioSource === 'database' ||
          portfolioSource === 'snapshot' ||
          portfolioSource === 'metaapi' ||
          portfolioSource === 'empty')
      ? {
          ...portfolioQuery.data,
          source:
            portfolioSource === 'empty' && snapshotQuery.data?.snapshot
              ? 'snapshot'
              : portfolioQuery.data.source,
          equityCurve:
            portfolioQuery.data.equityCurve?.length > 1
              ? portfolioQuery.data.equityCurve
              : snapshotEquityCurve.length > 1
                ? snapshotEquityCurve
                : portfolioQuery.data.equityCurve ?? [],
          totalTrades: Math.max(
            Number(portfolioQuery.data.totalTrades ?? 0),
            snapshotTradeHistory.length,
          ),
          profitFactor:
            Number(portfolioQuery.data.profitFactor ?? 0) ||
            Number(snapshotPerformance?.profitFactor ?? 0),
          sharpeRatio:
            Number(portfolioQuery.data.sharpeRatio ?? 0) ||
            Number(snapshotPerformance?.sharpeRatio ?? 0),
          sortinoRatio:
            Number(portfolioQuery.data.sortinoRatio ?? 0) ||
            Number(snapshotPerformance?.sortinoRatio ?? 0),
          winRate:
            Number(portfolioQuery.data.winRate ?? 0) ||
            Number(snapshotPerformance?.winRate ?? 0),
          maxDrawdown:
            Number(portfolioQuery.data.maxDrawdown ?? 0) ||
            Number(
              snapshotPerformance?.maxDrawdown ??
                snapshotPerformance?.currentDrawdown ??
                0,
            ),
          totalReturnPct:
            portfolioQuery.data.totalReturnPct ??
            snapshotPerformance?.totalReturn ??
            snapshotPerformance?.roi,
        }
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
    if (defaultAccountId) {
      void queryClient.invalidateQueries({
        queryKey: ['account-snapshot-latest', defaultAccountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['account-snapshot-positions', defaultAccountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['account-snapshot-deals', defaultAccountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['account-snapshot-equity-history', defaultAccountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['account-snapshot-performance', defaultAccountId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['account-snapshot-risk', defaultAccountId],
      });
    }
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
    hasBrokerAccount &&
    sessionReady &&
    portfolioQuery.isPending &&
    !portfolio &&
    snapshotEquityCurve.length === 0 &&
    !snapshotPerformance;
  const openTradesInitialLoading =
    hasBrokerAccount &&
    openTradesQuery.isPending &&
    openTradesQuery.data === undefined &&
    !snapshotPositionsQuery.data;
  const tradeHistoryInitialLoading =
    hasBrokerAccount &&
    tradeHistoryQuery.isPending &&
    tradeHistoryQuery.data === undefined &&
    snapshotTradeHistory.length === 0;
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
    openTrades: hasBrokerAccount
      ? snapshotPositionsQuery.data?.positions?.length
        ? snapshotPositionsQuery.data.positions.map((r) => ({
            id: String(
              r.id ?? r.positionId ?? r.ticket ?? `${r.symbol}-${r.openTime ?? ''}`,
            ),
            asset: r.symbol,
            type:
              String(r.side ?? r.type ?? '').toUpperCase().includes('SELL') ||
              String(r.side ?? r.type ?? '').toUpperCase().includes('SHORT')
                ? ('Short' as const)
                : ('Long' as const),
            amount: Number(r.volume ?? 0),
            entry: Number(r.openPrice ?? 0),
            pnl: Number(r.profit ?? 0),
            timestamp: String(r.openTime ?? r.time ?? new Date().toISOString()),
            strategyId: '',
            isPaper: false,
          }))
        : openTradesQuery.data ?? []
      : [],
    tradeHistory: hasBrokerAccount
      ? tradeHistoryQuery.data?.rows?.length
        ? tradeHistoryQuery.data.rows
        : snapshotTradeHistory
      : [],
    tradeHistoryQuery,
    accountInfo,
    brokerAccountInfoQuery,
    activeStrategies,
    performanceBars,
    risk: hasBrokerAccount
      ? {
          ...(riskQuery.data ?? {}),
          ...(snapshotRisk ?? {}),
          drawdownPct:
            (riskQuery.data as any)?.drawdownPct ??
            snapshotPerformance?.currentDrawdown ??
            snapshotPerformance?.maxDrawdown ??
            0,
        }
      : undefined,
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
