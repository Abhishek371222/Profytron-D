import type { QueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/platform/data/query-keys';
import { createCacheApi } from '@/platform/cache';
import { createSchedulerApi } from '@/platform/scheduler';
import { metricsApi } from '@/platform/metrics';
import { animationApi } from '@/platform/animation';
import {
  markVersionApplied,
  shouldApplyVersion,
  transitionMt5Sync,
} from './state-machine';

export type EquityDelta = {
  balance?: number;
  equity?: number;
  margin?: number;
  freeMargin?: number;
  currency?: string;
  accountId?: string;
  brokerAccountId?: string;
  version?: number;
  syncedAt?: number;
};

export type PositionsDelta = {
  entity?: string;
  brokerAccountId?: string;
  accountId?: string;
  version?: number;
  syncedAt?: number;
  upserts?: Array<{
    id: string;
    symbol: string;
    volume: number;
    openPrice: number;
    profit?: number;
    type?: string;
  }>;
  removes?: string[];
};

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
  brokerTicket?: string;
};

function ticketOf(row: OpenTradeRow): string {
  return row.brokerTicket || row.id;
}

/** Patch equity into L2 + broker-accounts query without invalidation. */
export function applyEquityDelta(qc: QueryClient, patch: EquityDelta) {
  if (!shouldApplyVersion(patch.version)) {
    metricsApi.mark('mt5.delta.skip_stale', { entity: 'equity', version: patch.version });
    return;
  }

  const sched = createSchedulerApi();
  sched.schedule('mt5:equity-delta', 'high', () => {
    const t0 = performance.now();
    transitionMt5Sync('synchronizing', { source: 'socket' });

    const equity = Number(patch.equity);
    const balance = Number(patch.balance ?? patch.equity);
    if (Number.isFinite(equity) && equity > 0) {
      const prev = createCacheApi().readOverviewAccount();
      createCacheApi().writeOverviewAccount({
        balance: Number.isFinite(balance) ? balance : equity,
        equity,
        margin: Number(patch.margin ?? prev?.margin ?? 0),
        freeMargin: Number(
          patch.freeMargin ??
            Math.max(0, equity - Number(patch.margin ?? prev?.margin ?? 0)),
        ),
        currency: String(patch.currency ?? prev?.currency ?? 'USD'),
        accountId: patch.accountId ?? patch.brokerAccountId ?? prev?.accountId,
        userId: undefined,
        savedAt: Date.now(),
      });

      if (prev && prev.equity !== equity) {
        animationApi.markChanged('overview.equity');
      }
      if (
        prev &&
        Number.isFinite(balance) &&
        prev.balance !== balance
      ) {
        animationApi.markChanged('overview.balance');
      }
      if (prev) {
        animationApi.markChanged('overview.pnl');
      }

      // Patch broker-accounts list in place when present
      qc.setQueryData(QueryKeys.brokerAccounts(), (old: unknown) => {
        if (!Array.isArray(old)) return old;
        const id = patch.accountId ?? patch.brokerAccountId;
        return old.map((row: Record<string, unknown>) => {
          if (id && row.id !== id && row.accountId !== id) return row;
          return {
            ...row,
            lastKnownEquity: equity,
            lastKnownBalance: Number.isFinite(balance) ? balance : equity,
            equity,
            balance: Number.isFinite(balance) ? balance : equity,
          };
        });
      });

      // Soft portfolio numbers when shape is known
      qc.setQueriesData({ queryKey: ['portfolio'] }, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as Record<string, unknown>;
        if (typeof o.equity === 'number' || typeof o.totalEquity === 'number') {
          return {
            ...o,
            equity: equity,
            totalEquity: equity,
            balance: Number.isFinite(balance) ? balance : o.balance,
          };
        }
        return old;
      });
    }

    if (patch.version != null) markVersionApplied(patch.version);
    transitionMt5Sync('fresh', {
      source: 'socket',
      lastSyncedAt: patch.syncedAt ?? Date.now(),
    });
    metricsApi.mark('mt5.delta.equity', {
      ms: performance.now() - t0,
      version: patch.version,
    });
  });
}

/** Apply positions_delta into open-trades query via setQueryData. */
export function applyPositionsDelta(qc: QueryClient, delta: PositionsDelta) {
  if (!shouldApplyVersion(delta.version)) {
    metricsApi.mark('mt5.delta.skip_stale', {
      entity: 'positions',
      version: delta.version,
    });
    return;
  }

  const sched = createSchedulerApi();
  sched.schedule('mt5:positions-delta', 'high', () => {
    const t0 = performance.now();
    transitionMt5Sync('synchronizing', { source: 'socket' });

    qc.setQueryData(QueryKeys.openTrades(), (old: unknown) => {
      const list = Array.isArray(old) ? ([...old] as OpenTradeRow[]) : [];
      const byTicket = new Map(list.map((r) => [ticketOf(r), r]));

      for (const id of delta.removes ?? []) {
        byTicket.delete(id);
      }

      for (const u of delta.upserts ?? []) {
        const prev = byTicket.get(u.id);
        const isSell = String(u.type || '')
          .toUpperCase()
          .includes('SELL');
        const next: OpenTradeRow = {
          id: prev?.id ?? u.id,
          brokerTicket: u.id,
          asset: u.symbol,
          type: isSell ? 'Short' : 'Long',
          amount: u.volume,
          entry: u.openPrice,
          pnl: Number(u.profit ?? prev?.pnl ?? 0),
          timestamp: prev?.timestamp ?? new Date().toISOString(),
          strategyId: prev?.strategyId ?? '',
          isPaper: prev?.isPaper,
        };
        if (prev && prev.pnl !== next.pnl) {
          animationApi.markChanged(`trade.${u.id}.pnl`);
        }
        byTicket.set(u.id, next);
      }

      return Array.from(byTicket.values());
    });

    if (delta.version != null) markVersionApplied(delta.version);
    transitionMt5Sync('fresh', {
      source: 'socket',
      lastSyncedAt: delta.syncedAt ?? Date.now(),
    });
    metricsApi.mark('mt5.delta.positions', {
      ms: performance.now() - t0,
      upserts: delta.upserts?.length ?? 0,
      removes: delta.removes?.length ?? 0,
      version: delta.version,
    });
  });
}
