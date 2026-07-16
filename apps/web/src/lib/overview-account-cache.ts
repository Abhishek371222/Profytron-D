/** Session-scoped last-good Overview account metrics (survives full reload). */

export type CachedOverviewAccount = {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  unrealizedPnl?: number;
  realizedPnl24h?: number;
  change24hPct?: number;
  accountId?: string;
  /** Owning Profytron user — refuse to paint if login switched. */
  userId?: string;
  savedAt: number;
};

const KEY = 'profytron_overview_account_v1';
/** Keep last-good metrics for a full day so reload never flashes zeros. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function readOverviewAccountCache(
  expectedUserId?: string | null,
): CachedOverviewAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedOverviewAccount;
    if (!parsed || typeof parsed.balance !== 'number') return null;
    if (Date.now() - Number(parsed.savedAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    if (
      expectedUserId &&
      parsed.userId &&
      parsed.userId !== expectedUserId
    ) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeOverviewAccountCache(snapshot: CachedOverviewAccount): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...snapshot, savedAt: Date.now() }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearOverviewAccountCache(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
