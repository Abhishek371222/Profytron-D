import type { QueryClient } from '@tanstack/react-query';
import { brokerApi } from '@/lib/api/broker';

export const BROKER_ACCOUNTS_KEY = ['broker-accounts'] as const;
export const BROKER_LIVE_SNAPSHOT_KEY = ['broker-live-snapshot'] as const;

// v2: drop any locale-FX-corrupted snapshots (e.g. USD equity shown as INR × 83.5).
const SNAPSHOT_STORAGE_KEY = 'profytron.broker-live-snapshot.v2';
const ACCOUNTS_STORAGE_KEY = 'profytron.broker-accounts-lite.v2';

export const ACCOUNT_QUERY_KEYS = [
  'portfolio',
  'wallet-balance',
  'open-trades',
  'trade-history',
  'dashboard-risk',
  'broker-accounts',
  'broker-equity',
  'broker-account-info',
  'broker-live-snapshot',
  'my-strategies',
  'activation-progress',
] as const;

/** Canonical broker account row from GET /broker/accounts (Next or Nest). */
export type BrokerAccountRow = {
  id: string;
  brokerName: string;
  accountNumberLast4?: string | null;
  accountNumber?: string | null;
  isPaperTrading?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  initialEquity?: number | null;
  balance?: number | null;
  equity?: number | null;
  margin?: number | null;
  freeMargin?: number | null;
  currency?: string | null;
  connectionStatus?: string | null;
  liveSynced?: boolean;
  serverName?: string | null;
  storeOnly?: boolean;
  balanceNote?: string | null;
  login?: string | null;
  fillMode?: string | null;
  isMasterSource?: boolean;
  lastConnectedAt?: string | null;
  connectedAt?: string | null;
};

export type LiveAccountSnapshot = {
  accountId: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  updatedAt: number;
};

export async function fetchBrokerAccounts(): Promise<BrokerAccountRow[]> {
  const raw = await brokerApi.getBrokerAccounts();
  return Array.isArray(raw) ? (raw as BrokerAccountRow[]) : [];
}

function positiveNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Broker balances are always in the MT account currency — never locale display FX. */
function normalizeBrokerCurrency(value: unknown): string {
  const code = String(value || 'USD').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : 'USD';
}

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

/** Paint Overview instantly on reload from last successful session. */
export function hydrateBrokerCacheFromStorage(qc: QueryClient) {
  // Drop legacy locale-FX snapshots so Overview cannot revive INR-scaled balances.
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('profytron.broker-live-snapshot.v1');
      window.localStorage.removeItem('profytron.broker-accounts-lite.v1');
    } catch {
      /* ignore */
    }
  }

  const snapshot = readStorage<LiveAccountSnapshot>(SNAPSHOT_STORAGE_KEY);
  if (snapshot?.accountId && snapshot.equity > 0) {
    const existing = qc.getQueryData<LiveAccountSnapshot>(BROKER_LIVE_SNAPSHOT_KEY);
    if (!existing || existing.updatedAt < snapshot.updatedAt) {
      qc.setQueryData(BROKER_LIVE_SNAPSHOT_KEY, {
        ...snapshot,
        currency: normalizeBrokerCurrency(snapshot.currency),
      });
    }
  }

  const cachedAccounts = readStorage<BrokerAccountRow[]>(ACCOUNTS_STORAGE_KEY);
  if (cachedAccounts?.length && !qc.getQueryData(BROKER_ACCOUNTS_KEY)) {
    const merged = mergeBrokerAccountsWithSnapshot(cachedAccounts, snapshot);
    qc.setQueryData(BROKER_ACCOUNTS_KEY, merged);
  }
}

/** Prefer fresh live numbers; keep last-good when MetaAPI returns null/0. */
export function mergeBrokerAccountsWithSnapshot(
  accounts: BrokerAccountRow[],
  snapshot: LiveAccountSnapshot | null | undefined,
): BrokerAccountRow[] {
  if (!accounts.length) return accounts;

  return accounts.map((account) => {
    const liveBalance = positiveNumber(account.balance);
    const liveEquity = positiveNumber(account.equity);
    if (liveBalance != null && liveEquity != null) {
      return account;
    }

    const seed = positiveNumber(account.initialEquity);
    const snap =
      snapshot && snapshot.accountId === account.id ? snapshot : null;

    const balance = liveBalance ?? snap?.balance ?? seed;
    const equity = liveEquity ?? snap?.equity ?? seed ?? balance;
    if (balance == null || equity == null) return account;

    const margin = Number(account.margin ?? snap?.margin ?? 0);
    const freeMargin = Number(
      account.freeMargin ??
        snap?.freeMargin ??
        Math.max(0, equity - (Number.isFinite(margin) ? margin : 0)),
    );

    return {
      ...account,
      balance,
      equity,
      margin: Number.isFinite(margin) ? margin : 0,
      freeMargin: Number.isFinite(freeMargin) ? freeMargin : equity,
      currency: normalizeBrokerCurrency(
        account.currency ?? snap?.currency,
      ),
      liveSynced: account.liveSynced === true,
      connectionStatus:
        account.liveSynced === true
          ? account.connectionStatus || 'CONNECTED'
          : account.connectionStatus || 'SYNCING',
    };
  });
}

export function rememberLiveSnapshot(
  qc: QueryClient,
  account: BrokerAccountRow | null | undefined,
) {
  if (!account?.id) return;
  const balance = positiveNumber(account.balance);
  const equity = positiveNumber(account.equity ?? account.balance);
  if (balance == null || equity == null) return;

  const margin = Number(account.margin ?? 0);
  const freeMargin = Number(
    account.freeMargin ?? Math.max(0, equity - (Number.isFinite(margin) ? margin : 0)),
  );

  const snapshot: LiveAccountSnapshot = {
    accountId: account.id,
    balance,
    equity,
    margin: Number.isFinite(margin) ? margin : 0,
    freeMargin: Number.isFinite(freeMargin) ? freeMargin : equity,
    currency: normalizeBrokerCurrency(account.currency),
    updatedAt: Date.now(),
  };

  qc.setQueryData<LiveAccountSnapshot>(BROKER_LIVE_SNAPSHOT_KEY, snapshot);
  writeStorage(SNAPSHOT_STORAGE_KEY, snapshot);
}

export function rememberAccountsLite(
  accounts: BrokerAccountRow[] | null | undefined,
) {
  if (!accounts?.length) return;
  const lite = accounts.map((a) => ({
    id: a.id,
    brokerName: a.brokerName,
    accountNumberLast4: a.accountNumberLast4 ?? a.accountNumber ?? null,
    isPaperTrading: a.isPaperTrading,
    isDefault: a.isDefault,
    initialEquity: a.initialEquity,
    balance: a.balance,
    equity: a.equity,
    margin: a.margin,
    freeMargin: a.freeMargin,
    currency: a.currency,
    connectionStatus: a.connectionStatus,
    liveSynced: a.liveSynced,
  }));
  writeStorage(ACCOUNTS_STORAGE_KEY, lite);
}

/** Shared queryFn so bootstrap and hooks write the same merged cache. */
export async function loadBrokerAccountsQuery(
  qc: QueryClient,
): Promise<BrokerAccountRow[]> {
  const accounts = await fetchBrokerAccounts();
  const snapshot = qc.getQueryData<LiveAccountSnapshot>(BROKER_LIVE_SNAPSHOT_KEY);
  const merged = mergeBrokerAccountsWithSnapshot(accounts, snapshot);
  const preferred = merged.find((a) => a.isDefault) ?? merged[0] ?? null;
  rememberLiveSnapshot(qc, preferred);
  rememberAccountsLite(merged);
  return merged;
}

export function invalidateAccountQueries(qc: QueryClient) {
  for (const key of ACCOUNT_QUERY_KEYS) {
    qc.invalidateQueries({ queryKey: [key] });
  }
}
