import {
  loadLiveBroker,
  clientHost,
  metaHeaders,
  withResolvedRegion,
  type LiveBroker,
} from '@/lib/server/metaapi-trading';

export function rangeDays(range: string | null): number {
  switch ((range || '1m').toLowerCase()) {
    case '1d':
      return 1;
    case '1w':
      return 7;
    case '1m':
      return 30;
    case '3m':
      return 90;
    case '1y':
      return 365;
    case 'all':
      return 730;
    default:
      return 30;
  }
}

export function dealType(deal: any): string {
  return String(deal?.type || deal?.dealType || '').toUpperCase();
}

export function isBalanceDeal(deal: any): boolean {
  const type = dealType(deal);
  if (
    type.includes('BALANCE') ||
    type.includes('CREDIT') ||
    type.includes('CHARGE') ||
    type.includes('CORRECTION') ||
    type.includes('BONUS') ||
    type.includes('SO_COMPENSATION')
  ) {
    return true;
  }
  const n = Number(deal?.type ?? deal?.dealType);
  return Number.isFinite(n) && n >= 2 && n <= 6;
}

export function isNonTradingDeal(deal: any): boolean {
  if (isBalanceDeal(deal)) return true;
  const type = dealType(deal);
  return type.includes('COMMISSION') && !type.includes('DEAL');
}

export function dealPnl(deal: any): number {
  return (
    Number(deal.profit || 0) +
    Number(deal.commission || 0) +
    Number(deal.swap || 0)
  );
}

export type ClosedTrade = {
  profit: number;
  closedAt: string;
  symbol: string;
  openedAt?: string;
};

export function closedTradesFromDeals(tradingDeals: any[]): ClosedTrade[] {
  const byPosition = new Map<string, any[]>();
  for (const d of tradingDeals) {
    const pid = String(d.positionId || '');
    if (!pid) continue;
    if (!byPosition.has(pid)) byPosition.set(pid, []);
    byPosition.get(pid)!.push(d);
  }

  const closed: ClosedTrade[] = [];
  for (const [, group] of byPosition) {
    const hasOut = group.some((d) =>
      String(d.entryType || '')
        .toUpperCase()
        .includes('OUT'),
    );
    if (!hasOut) continue;
    const profit = group.reduce((sum, d) => sum + dealPnl(d), 0);
    const outDeal = [...group]
      .reverse()
      .find((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
    const inDeal = group.find((d) =>
      String(d.entryType || '')
        .toUpperCase()
        .includes('IN'),
    );
    closed.push({
      profit,
      closedAt: outDeal?.time || group[group.length - 1]?.time || new Date().toISOString(),
      openedAt: inDeal?.time,
      symbol: String(group.find((d) => d.symbol)?.symbol || 'UNKNOWN').replace(
        /\.|#/g,
        '',
      ),
    });
  }
  closed.sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
  );
  return closed;
}

export async function fetchDeals(
  live: LiveBroker,
  from: Date,
  to: Date,
): Promise<any[]> {
  return withResolvedRegion(live, async (resolved) => {
    const url = `${clientHost(resolved.region)}/users/current/accounts/${resolved.metaApiAccountId}/history-deals/time/${encodeURIComponent(from.toISOString())}/${encodeURIComponent(to.toISOString())}`;
    const res = await fetch(url, {
      headers: metaHeaders(resolved.metaToken),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`MetaApi history failed: ${body || res.status}`);
    }
    const payload = await res.json();
    return Array.isArray(payload) ? payload : [];
  });
}

export async function loadClosedTradesForRange(
  userId: string,
  range: string,
): Promise<{
  live: LiveBroker;
  closed: ClosedTrade[];
  depositBase: number;
  liveEquity: number;
} | null> {
  const live = await loadLiveBroker(userId);
  if (!live) return null;

  const days = rangeDays(range);
  const end = new Date();
  const historyStart = new Date(
    Date.now() - Math.max(days, 365) * 24 * 60 * 60 * 1000,
  );
  const rangeStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const allDeals = await fetchDeals(live, historyStart, end);
  const balanceDeals = allDeals.filter((d) => isBalanceDeal(d));
  const tradingDeals = allDeals.filter((d) => !isNonTradingDeal(d));
  const closedAll = closedTradesFromDeals(tradingDeals);
  const closed = closedAll.filter(
    (t) => new Date(t.closedAt).getTime() >= rangeStart.getTime(),
  );

  const { metaGetAccountInfo } = await import('@/lib/server/metaapi-trading');
  const info = await withResolvedRegion(live, metaGetAccountInfo);
  const liveEquity = Number(info.equity ?? info.balance ?? 0);
  const netDeposits = balanceDeals.reduce((s, d) => s + dealPnl(d), 0);
  const tradingPnLAll = closedAll.reduce((s, t) => s + t.profit, 0);
  const depositBase =
    netDeposits > 1
      ? netDeposits
      : Math.max(1, liveEquity - tradingPnLAll);

  return { live, closed, depositBase, liveEquity };
}
