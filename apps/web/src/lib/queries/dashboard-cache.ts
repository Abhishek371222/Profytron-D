import type { QueryClient } from '@tanstack/react-query';
import { hydrateBrokerCacheFromStorage } from '@/lib/queries/account-queries';
import { readOverviewAccountCache } from '@/lib/overview-account-cache';

const DASHBOARD_CACHE_KEY = 'profytron.dashboard-cache.v1';
/** Keep last-good UI data for a week — cloud APIs remain source of truth. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry = {
  updatedAt: number;
  data: unknown;
};

type DashboardCacheBlob = {
  version: 1;
  entries: Record<string, CacheEntry>;
};

function storageKey(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey);
}

function readBlob(): DashboardCacheBlob {
  if (typeof window === 'undefined') return { version: 1, entries: {} };
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return { version: 1, entries: {} };
    const parsed = JSON.parse(raw) as DashboardCacheBlob;
    if (parsed?.version !== 1 || !parsed.entries) return { version: 1, entries: {} };
    return parsed;
  } catch {
    return { version: 1, entries: {} };
  }
}

function writeBlob(blob: DashboardCacheBlob) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(blob));
  } catch {
    /* quota / private mode */
  }
}

/** Save any successful dashboard query so the next reload paints instantly. */
export function persistDashboardQuery(
  queryKey: readonly unknown[],
  data: unknown,
) {
  if (data === undefined || data === null) return;

  // Never persist a failed/empty trade snapshot over a previously good list.
  const key = storageKey(queryKey);
  if (
    key.includes('trade-history') ||
    key.includes('open-trades') ||
    key.includes('history-export')
  ) {
    const rows = Array.isArray((data as any)?.rows)
      ? (data as any).rows
      : Array.isArray(data)
        ? data
        : null;
    if (rows && rows.length === 0) {
      const prev = readBlob().entries[key]?.data;
      const prevRows = Array.isArray((prev as any)?.rows)
        ? (prev as any).rows
        : Array.isArray(prev)
          ? prev
          : null;
      if (prevRows && prevRows.length > 0) {
        // Keep last-good trades; empty mid-sync is not truth.
        return;
      }
    }
    if ((data as any)?.syncError) return;
  }

  // Don't persist empty MetaAPI portfolio failures as "truth".
  if (
    key.includes('portfolio') &&
    (data as any)?.source === 'empty' &&
    (data as any)?.syncError
  ) {
    return;
  }

  const blob = readBlob();
  blob.entries[key] = {
    updatedAt: Date.now(),
    data,
  };
  writeBlob(blob);
}

function readEntry(queryKey: readonly unknown[]): unknown | undefined {
  const entry = readBlob().entries[storageKey(queryKey)];
  if (!entry) return undefined;
  if (Date.now() - entry.updatedAt > MAX_AGE_MS) return undefined;
  return entry.data;
}

/**
 * Hydrate React Query + broker snapshot from localStorage.
 * Safe on localhost and production — cloud APIs still refresh in the background.
 */
export function hydrateDashboardCache(qc: QueryClient) {
  if (typeof window === 'undefined') return;

  hydrateBrokerCacheFromStorage(qc);

  const keys: readonly (readonly unknown[])[] = [
    ['my-bots'],
    ['open-trades'],
    ['trade-history', 'overview'],
    ['portfolio', '1m'],
    ['portfolio', '1d'],
    ['portfolio', '1w'],
    ['portfolio', '3m'],
    ['portfolio', '1y'],
    ['portfolio', 'all'],
    ['my-strategies'],
    ['dashboard-risk'],
    ['live-market-quotes-v3'],
    ['broker-accounts'],
  ];

  for (const key of keys) {
    if (qc.getQueryData(key) !== undefined) continue;
    let data = readEntry(key);
    if (data !== undefined) {
      if (key[0] === 'broker-accounts') {
        data = reconcileBrokerAccountsWithSessionCache(data);
      }
      qc.setQueryData(key, data);
    }
  }
}

/**
 * The dashboard-cache blob's `broker-accounts` entry only updates whenever
 * that query actually re-fetches (every ~60s at best) — the sessionStorage
 * `overview-account-cache` updates on every render from live data instead,
 * so it's almost always fresher. Patch the matching account's numbers from
 * that fresher source before painting, so a reload never briefly regresses
 * to an older balance/equity while the real network fetch is in flight.
 */
function reconcileBrokerAccountsWithSessionCache(data: unknown): unknown {
  const fresher = readOverviewAccountCache();
  if (!fresher || !(fresher.balance > 0)) return data;

  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : null;
  if (!list) return data;

  const targetId =
    fresher.accountId ?? list.find((a: any) => a?.isDefault)?.id ?? list[0]?.id;

  const patched = list.map((account: any) => {
    if (account?.id !== targetId) return account;
    return {
      ...account,
      balance: fresher.balance,
      equity: fresher.equity,
      margin: fresher.margin,
      freeMargin: fresher.freeMargin,
      currency: fresher.currency || account.currency,
    };
  });

  return Array.isArray(data) ? patched : { ...(data as any), data: patched };
}

/** Persist helper that also writes into React Query (optional). */
export function rememberDashboardQuery(
  qc: QueryClient,
  queryKey: readonly unknown[],
  data: unknown,
) {
  if (data === undefined || data === null) return;
  qc.setQueryData(queryKey, data);
  persistDashboardQuery(queryKey, data);
}
