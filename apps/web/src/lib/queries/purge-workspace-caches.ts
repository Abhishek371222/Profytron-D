import { clearOverviewAccountCache } from '@/lib/overview-account-cache';
import { getRegisteredQueryClient } from '@/lib/queries/query-client-registry';

const WORKSPACE_STORAGE_KEYS = [
  'profytron.dashboard-cache.v1',
  'profytron.broker-live-snapshot.v1',
  'profytron.broker-live-snapshot.v2',
  'profytron.broker-accounts-lite.v1',
  'profytron.broker-accounts-lite.v2',
] as const;

const WORKSPACE_OWNER_KEY = 'profytron.workspace-cache-owner';

export function purgeWorkspaceCaches() {
  if (typeof window !== 'undefined') {
    try {
      for (const key of WORKSPACE_STORAGE_KEYS) {
        window.localStorage.removeItem(key);
      }
      window.localStorage.removeItem(WORKSPACE_OWNER_KEY);
    } catch {
    }
    clearOverviewAccountCache();
  }

  const qc = getRegisteredQueryClient();
  if (qc) {
    qc.clear();
  }
}

export function readWorkspaceCacheOwner(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(WORKSPACE_OWNER_KEY);
  } catch {
    return null;
  }
}

export function writeWorkspaceCacheOwner(userId: string) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.localStorage.setItem(WORKSPACE_OWNER_KEY, userId);
  } catch {
  }
}

export function ensureWorkspaceCacheOwner(userId: string | null | undefined) {
  if (!userId || typeof window === 'undefined') return;
  const owner = readWorkspaceCacheOwner();
  if (owner && owner !== userId) {
    purgeWorkspaceCaches();
  }
  writeWorkspaceCacheOwner(userId);
}
