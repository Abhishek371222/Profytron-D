/**
 * L0 in-memory + L2 persistent cache facade.
 * L1 remains TanStack Query (canonical runtime).
 * Internals wrap existing dashboard-cache / overview-account-cache.
 */
import type { QueryClient } from '@tanstack/react-query';
import {
  clearAccountBoundDashboardCache,
  hydrateDashboardCache,
  persistDashboardQuery,
} from '@/lib/queries/dashboard-cache';
import {
  clearOverviewAccountCache,
  readOverviewAccountCache,
  writeOverviewAccountCache,
  type CachedOverviewAccount,
} from '@/lib/overview-account-cache';

const L0 = new Map<string, { at: number; data: unknown }>();
const L0_TTL_MS = 5_000;

function l0Get<T>(key: string): T | undefined {
  const hit = L0.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > L0_TTL_MS) {
    L0.delete(key);
    return undefined;
  }
  return hit.data as T;
}

function l0Set(key: string, data: unknown) {
  L0.set(key, { at: Date.now(), data });
}

export const cacheApi = {
  /** Hydrate L1 TanStack Query from L2 persistent store. */
  hydrate(qc: QueryClient, userId?: string | null) {
    hydrateDashboardCache(qc, userId);
  },

  persist(queryKey: readonly unknown[], data: unknown) {
    const k = JSON.stringify(queryKey);
    l0Set(k, data);
    persistDashboardQuery(queryKey, data);
  },

  peekL0<T>(queryKey: readonly unknown[]): T | undefined {
    return l0Get<T>(JSON.stringify(queryKey));
  },

  readOverviewAccount(userId?: string | null): CachedOverviewAccount | null {
    return readOverviewAccountCache(userId);
  },

  writeOverviewAccount(account: CachedOverviewAccount) {
    writeOverviewAccountCache(account);
    l0Set(`overview-account:${account.userId ?? ''}`, account);
  },

  clearOverviewAccount() {
    clearOverviewAccountCache();
  },

  clearAccountBound(qc: QueryClient) {
    clearAccountBoundDashboardCache(qc);
  },
};

export type CacheApi = typeof cacheApi;
