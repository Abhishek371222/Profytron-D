import type { QueryClient } from '@tanstack/react-query';
import { hydrateBrokerCacheFromStorage } from '@/lib/queries/account-queries';
import { readOverviewAccountCache } from '@/lib/overview-account-cache';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  readWorkspaceCacheOwner,
  writeWorkspaceCacheOwner,
} from '@/lib/queries/purge-workspace-caches';

const DASHBOARD_CACHE_KEY = 'profytron.dashboard-cache.v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry = {
  updatedAt: number;
  data: unknown;
};

type DashboardCacheBlob = {
  version: 1;
  ownerUserId?: string;
  entries: Record<string, CacheEntry>;
};

function storageKey(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey);
}

function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? readWorkspaceCacheOwner();
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
    const owner = currentUserId();
    if (owner) blob.ownerUserId = owner;
    window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(blob));
  } catch {
  }
}

export function persistDashboardQuery(
  queryKey: readonly unknown[],
  data: unknown,
) {
  if (data === undefined || data === null) return;

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
        return;
      }
    }
    if ((data as any)?.syncError) return;
  }

  if (
    key.includes('portfolio') &&
    (data as any)?.source === 'empty' &&
    (data as any)?.syncError
  ) {
    return;
  }

  const blob = readBlob();
  const owner = currentUserId();
  if (blob.ownerUserId && owner && blob.ownerUserId !== owner) {
    blob.entries = {};
  }
  blob.entries[key] = {
    updatedAt: Date.now(),
    data,
  };
  writeBlob(blob);
  if (owner) writeWorkspaceCacheOwner(owner);
}

function readEntry(queryKey: readonly unknown[]): unknown | undefined {
  const entry = readBlob().entries[storageKey(queryKey)];
  if (!entry) return undefined;
  if (Date.now() - entry.updatedAt > MAX_AGE_MS) return undefined;
  return entry.data;
}

export function hydrateDashboardCache(
  qc: QueryClient,
  expectedUserId?: string | null,
) {
  if (typeof window === 'undefined') return;

  const userId = expectedUserId ?? currentUserId();
  const blob = readBlob();

  if (!userId) return;

  if (blob.ownerUserId && blob.ownerUserId !== userId) {
    try {
      window.localStorage.removeItem(DASHBOARD_CACHE_KEY);
    } catch {
    }
    return;
  }
  if (!blob.ownerUserId && Object.keys(blob.entries).length > 0) {
    try {
      window.localStorage.removeItem(DASHBOARD_CACHE_KEY);
    } catch {
    }
    return;
  }

  hydrateBrokerCacheFromStorage(qc, userId);

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
        data = reconcileBrokerAccountsWithSessionCache(data, userId);
      }
      qc.setQueryData(key, data);
    }
  }
}

function reconcileBrokerAccountsWithSessionCache(
  data: unknown,
  expectedUserId?: string | null,
): unknown {
  const fresher = readOverviewAccountCache(expectedUserId);
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

export function rememberDashboardQuery(
  qc: QueryClient,
  queryKey: readonly unknown[],
  data: unknown,
) {
  if (data === undefined || data === null) return;
  qc.setQueryData(queryKey, data);
  persistDashboardQuery(queryKey, data);
}

const ACCOUNT_BOUND_KEYS: readonly (readonly unknown[])[] = [
  ['open-trades'],
  ['trade-history', 'overview'],
  ['portfolio', '1m'],
  ['portfolio', '1d'],
  ['portfolio', '1w'],
  ['portfolio', '3m'],
  ['portfolio', '1y'],
  ['portfolio', 'all'],
  ['dashboard-risk'],
];

export function clearAccountBoundDashboardCache(qc: QueryClient) {
  if (typeof window === 'undefined') return;

  for (const key of ACCOUNT_BOUND_KEYS) {
    qc.removeQueries({ queryKey: key, exact: true });
  }

  const blob = readBlob();
  let changed = false;
  for (const key of ACCOUNT_BOUND_KEYS) {
    const sk = storageKey(key);
    if (blob.entries[sk]) {
      delete blob.entries[sk];
      changed = true;
    }
  }
  if (changed) writeBlob(blob);
}
