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
  if (!accounts || accounts.length === 0) return true; // no broker — dashboard can open
  return accounts.some(
    (a) => a?.liveSynced === true || a?.isPaperTrading === true || a?.isPaperTrading === 1,
  );
}

/**
 * Keeps the premium prep screen up until dashboard-critical data is fully warm
 * in the React Query cache — then shows "Welcome" and reveals the app.
 */
export function WorkspaceBootstrapController() {
  const active = useWorkspaceBootstrapStore((s) => s.active);
  const exiting = useWorkspaceBootstrapStore((s) => s.exiting);
  const completeStep = useWorkspaceBootstrapStore((s) => s.completeStep);
  const beginExit = useWorkspaceBootstrapStore((s) => s.beginExit);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const queryClient = useQueryClient();
  const runIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!active || exiting) return;
    if (isHydrating) return;
    if (!accessToken) return;

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
      await hold(350);
      if (!still()) return;

      completeStep('profile');
      await hold(250);
      if (!still()) return;

      completeStep('preferences');

      // Kick all dashboard-critical fetches in parallel.
      const accountsP = queryClient.fetchQuery({
        queryKey: ['broker-accounts'],
        queryFn: () => brokerApi.getBrokerAccounts(),
        staleTime: 8_000,
      });

      const portfolioP = queryClient.fetchQuery({
        queryKey: ['portfolio', '1m'],
        queryFn: () => analyticsApi.getPortfolio('1m'),
        staleTime: 30_000,
      });

      const openTradesP = queryClient.fetchQuery({
        queryKey: ['open-trades'],
        queryFn: async () => mapOpenTrades(await tradingApi.getOpenTrades()),
        staleTime: 8_000,
      });

      const historyP = queryClient.fetchQuery({
        queryKey: ['trade-history', 'overview'],
        queryFn: () => tradingApi.getTradeHistory({ limit: 12 }),
        staleTime: 20_000,
      });

      const strategiesP = queryClient.fetchQuery({
        queryKey: ['my-strategies'],
        queryFn: () => strategiesApi.getMyStrategies(),
        staleTime: 120_000,
      });

      const riskP = queryClient.fetchQuery({
        queryKey: ['dashboard-risk'],
        queryFn: () => riskApi.getDashboard(),
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
      await hold(200);

      // Brief live sync wait — never block login forever.
      const liveDeadline = Math.min(Date.now() + 6_000, started + hardCapMs);
      let liveAccounts = accounts;
      while (still() && Date.now() < liveDeadline && !accountsLiveReady(liveAccounts as any[])) {
        liveAccounts = await settle(
          queryClient.fetchQuery({
            queryKey: ['broker-accounts'],
            queryFn: () => brokerApi.getBrokerAccounts(),
            staleTime: 0,
          }),
        );
        await sleep(500);
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

      // Open as soon as we have something useful, or hit the hard cap.
      const hardDeadline = started + hardCapMs;
      while (still() && Date.now() < hardDeadline) {
        const cachedAccounts = queryClient.getQueryData<any[]>(['broker-accounts']);
        const portfolio = queryClient.getQueryData<any>(['portfolio', '1m']);
        const portfolioOk =
          portfolio != null &&
          (portfolio.source === 'metaapi' ||
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
        await sleep(500);
      }

      if (!still()) return;

      completeStep('ready');
      await hold(450);
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
    accessToken,
    isHydrating,
    queryClient,
    completeStep,
    beginExit,
  ]);

  return <WorkspaceBootstrapScreen />;
}
