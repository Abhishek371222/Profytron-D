'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { brokerApi } from '@/lib/api/broker';
import { riskApi } from '@/lib/api/risk';
import { strategiesApi } from '@/lib/api/strategies';
import { tradingApi } from '@/lib/api/trading';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceBootstrapStore } from '@/lib/stores/useWorkspaceBootstrapStore';
import { WorkspaceBootstrapScreen } from '@/components/auth/WorkspaceBootstrapScreen';
import {
  hydrateDashboardCache,
  persistDashboardQuery,
} from '@/lib/queries/dashboard-cache';
import { ensureWorkspaceCacheOwner } from '@/lib/queries/purge-workspace-caches';

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function mapOpenTrades(rows: Awaited<ReturnType<typeof tradingApi.getOpenTrades>>) {
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
}

function accountsLiveReady(accounts: any[] | null | undefined): boolean {
  if (!accounts || accounts.length === 0) return true;
  return accounts.some((a) => {
    if (a?.isPaperTrading === true || a?.isPaperTrading === 1) return true;
    if (a?.liveSynced === true) return true;
    if (a?.storeOnly === true) return true;
    const equity = Number(a?.equity ?? a?.balance ?? a?.initialEquity ?? 0);
    if (Number.isFinite(equity) && equity > 0) return true;
    const status = String(a?.connectionStatus || '').toUpperCase();
    return status === 'CONNECTED';
  });
}

export function WorkspaceBootstrapController() {
  const active = useWorkspaceBootstrapStore((s) => s.active);
  const exiting = useWorkspaceBootstrapStore((s) => s.exiting);
  const completeStep = useWorkspaceBootstrapStore((s) => s.completeStep);
  const beginExit = useWorkspaceBootstrapStore((s) => s.beginExit);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const runIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!active || exiting) return;
    if (!sessionReady) return;

    const runId = ++runIdRef.current;
    let cancelled = false;

    const still = () => !cancelled && runId === runIdRef.current;

    const hold = async (ms: number) => {
      const end = Date.now() + ms;
      while (Date.now() < end && still()) {
        await sleep(120);
      }
    };

    const run = async () => {
      const started = Date.now();
      const hardCapMs = 12_000;
      completeStep('session');
      ensureWorkspaceCacheOwner(userId);
      hydrateDashboardCache(queryClient, userId);
      await hold(150);
      if (!still()) return;

      completeStep('profile');
      await hold(120);
      if (!still()) return;

      completeStep('preferences');

      const accountsP = queryClient.fetchQuery({
        queryKey: ['broker-accounts'],
        queryFn: async () => {
          const rows = await brokerApi.getBrokerAccounts();
          persistDashboardQuery(['broker-accounts'], rows);
          return rows;
        },
        staleTime: 60_000,
      });

      const portfolioP = queryClient.fetchQuery({
        queryKey: ['portfolio', '1m'],
        queryFn: async () => {
          const data = await analyticsApi.getPortfolio('1m');
          if (data?.source === 'database' || data?.source === 'snapshot') {
            persistDashboardQuery(['portfolio', '1m'], data);
          }
          return data;
        },
        staleTime: 60_000,
      });

      const openTradesP = queryClient.fetchQuery({
        queryKey: ['open-trades'],
        queryFn: async () => {
          const mapped = mapOpenTrades(await tradingApi.getOpenTrades());
          persistDashboardQuery(['open-trades'], mapped);
          return mapped;
        },
        staleTime: 60_000,
      });

      const historyP = queryClient.fetchQuery({
        queryKey: ['trade-history', 'overview'],
        queryFn: async () => {
          const result = await tradingApi.getTradeHistory({ limit: 12, days: 30 });
          persistDashboardQuery(['trade-history', 'overview'], result);
          return result;
        },
        staleTime: 60_000,
      });

      const strategiesP = queryClient.fetchQuery({
        queryKey: ['my-strategies'],
        queryFn: async () => {
          const data = await strategiesApi.getMyStrategies();
          persistDashboardQuery(['my-strategies'], data);
          return data;
        },
        staleTime: 60_000,
      });

      const riskP = queryClient.fetchQuery({
        queryKey: ['dashboard-risk'],
        queryFn: async () => {
          const data = await riskApi.getDashboard();
          persistDashboardQuery(['dashboard-risk'], data);
          return data;
        },
        staleTime: 60_000,
      });

      const quotesP = settle(
        fetch(`/api/market/quotes?_=${Date.now()}`, { cache: 'no-store' }).then(async (res) => {
          if (!res.ok) return null;
          const body = await res.json();
          const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
          const next: Record<string, unknown> = {};
          for (const row of rows) {
            const symbol = String(row?.symbol || '').toUpperCase();
            if (!symbol) continue;
            next[symbol] = {
              symbol,
              price: Number(row?.price),
              change24hPct: Number(row?.change24hPct ?? 0) || 0,
              timestamp: String(row?.timestamp || new Date().toISOString()),
              source: String(row?.source || 'rest'),
            };
          }
          queryClient.setQueryData(['live-market-quotes-v3'], next);
          return next;
        }),
      );

      const accounts = await settle(accountsP);
      if (!still()) return;
      completeStep('accounts');
      await hold(120);

      const liveDeadline = Math.min(Date.now() + 3_000, started + hardCapMs);
      let liveAccounts = accounts;
      while (still() && Date.now() < liveDeadline && !accountsLiveReady(liveAccounts as any[])) {
        liveAccounts = await settle(
          queryClient.fetchQuery({
            queryKey: ['broker-accounts'],
            queryFn: () => brokerApi.getBrokerAccounts(),
            staleTime: 0,
          }),
        );
        await sleep(350);
      }

      if (!still()) return;
      completeStep('workspace');

      await Promise.all([
        settle(portfolioP),
        settle(openTradesP),
        settle(historyP),
        settle(strategiesP),
        settle(riskP),
        quotesP,
      ]);

      if (!still()) return;

      const hardDeadline = started + hardCapMs;
      while (still() && Date.now() < hardDeadline) {
        const cachedAccounts = queryClient.getQueryData<any[]>(['broker-accounts']);
        const portfolio = queryClient.getQueryData<any>(['portfolio', '1m']);
        const portfolioOk =
          portfolio != null &&
          (portfolio.source === 'database' ||
            portfolio.source === 'snapshot' ||
            portfolio.source === 'empty' ||
            portfolio.source === 'error' ||
            typeof portfolio.totalTrades === 'number');
        const openTradesCached = queryClient.getQueryData(['open-trades']);
        const historyCached = queryClient.getQueryData(['trade-history', 'overview']);

        if (
          accountsLiveReady(cachedAccounts) &&
          portfolioOk &&
          openTradesCached !== undefined &&
          historyCached !== undefined
        ) {
          break;
        }

        await settle(
          queryClient.fetchQuery({
            queryKey: ['broker-accounts'],
            queryFn: () => brokerApi.getBrokerAccounts(),
            staleTime: 0,
          }),
        );
        await settle(
          queryClient.fetchQuery({
            queryKey: ['portfolio', '1m'],
            queryFn: () => analyticsApi.getPortfolio('1m'),
            staleTime: 0,
          }),
        );
        await sleep(350);
      }

      if (!still()) return;

      completeStep('ready');
      await hold(200);
      if (!still()) return;
      beginExit();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    active,
    exiting,
    sessionReady,
    userId,
    queryClient,
    completeStep,
    beginExit,
  ]);

  return <WorkspaceBootstrapScreen />;
}
