import type { QueryClient } from '@tanstack/react-query';
import { hydrateBrokerCacheFromStorage } from '@/lib/queries/account-queries';

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
  // Don't persist empty trade lists forever as "truth" if they flash empty mid-sync —
  // still OK to store empty so we don't show stale closed trades as open.
  const blob = readBlob();
  blob.entries[storageKey(queryKey)] = {
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
  ];

  for (const key of keys) {
    if (qc.getQueryData(key) !== undefined) continue;
    const data = readEntry(key);
    if (data !== undefined) {
      qc.setQueryData(key, data);
    }
  }
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
