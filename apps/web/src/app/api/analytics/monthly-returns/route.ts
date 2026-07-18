import { NextRequest } from 'next/server';
import {
  error,
  isMetaApiUnauthorized,
  json,
  loadLiveBroker,
  metaGetAccountInfo,
  userIdFromRequest,
  clientHost,
  metaHeaders,
  withResolvedRegion,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

function dealType(deal: any): string {
  return String(deal?.type || deal?.dealType || '').toUpperCase();
}

function isBalanceDeal(deal: any): boolean {
  const type = dealType(deal);
  return (
    type.includes('BALANCE') ||
    type.includes('CREDIT') ||
    type.includes('CHARGE') ||
    type.includes('CORRECTION') ||
    type.includes('BONUS')
  );
}

function isNonTradingDeal(deal: any): boolean {
  if (isBalanceDeal(deal)) return true;
  const type = dealType(deal);
  return type.includes('COMMISSION') && !type.includes('DEAL');
}

function dealPnl(deal: any): number {
  return (
    Number(deal.profit || 0) +
    Number(deal.commission || 0) +
    Number(deal.swap || 0)
  );
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  try {
    const live = await loadLiveBroker(userId);
    if (!live) {
      return json({ months: [], heatmap: [], source: 'empty' });
    }

    const info = await withResolvedRegion(live, metaGetAccountInfo);
    const liveEquity = Number(info.equity ?? info.balance ?? 0);

    const end = new Date();
    const start = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    const deals = await withResolvedRegion(live, async (resolved) => {
      const url = `${clientHost(resolved.region)}/users/current/accounts/${resolved.metaApiAccountId}/history-deals/time/${encodeURIComponent(start.toISOString())}/${encodeURIComponent(end.toISOString())}`;
      const res = await fetch(url, {
        headers: metaHeaders(resolved.metaToken),
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`MetaApi history failed: ${body || res.status}`);
      }
      const payload = await res.json();
      return Array.isArray(payload) ? payload : [];
    });

    const tradingDeals = deals.filter((d) => !isNonTradingDeal(d));
    const balanceDeals = deals.filter((d) => isBalanceDeal(d));
    const netDeposits = balanceDeals.reduce((sum, d) => sum + dealPnl(d), 0);

    const byPosition = new Map<string, any[]>();
    for (const d of tradingDeals) {
      const pid = String(d.positionId || '');
      if (!pid) continue;
      if (!byPosition.has(pid)) byPosition.set(pid, []);
      byPosition.get(pid)!.push(d);
    }

    const closed: { profit: number; closedAt: string }[] = [];
    for (const [, group] of byPosition) {
      const hasOut = group.some((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
      if (!hasOut) continue;
      const profit = group.reduce((sum, d) => sum + dealPnl(d), 0);
      const closedAt =
        [...group]
          .reverse()
          .find((d) =>
            String(d.entryType || '')
              .toUpperCase()
              .includes('OUT'),
          )?.time || group[group.length - 1]?.time;
      closed.push({ profit, closedAt: closedAt || new Date().toISOString() });
    }

    closed.sort(
      (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
    );

    const totalProfit = closed.reduce((s, t) => s + t.profit, 0);
    const depositBase =
      netDeposits > 1 ? netDeposits : Math.max(1, liveEquity - totalProfit);
    let rollingEquity = depositBase;

    const monthly = new Map<string, number>();
    for (const t of closed) {
      const key = t.closedAt.slice(0, 7);
      monthly.set(key, (monthly.get(key) || 0) + t.profit);
    }

    const sortedMonths = [...monthly.keys()].sort();
    const months = sortedMonths.map((month) => {
      const pnl = monthly.get(month) ?? 0;
      const base = rollingEquity > 0 ? rollingEquity : depositBase;
      const returnPct = (pnl / base) * 100;
      rollingEquity += pnl;
      const [year, mon] = month.split('-');
      const date = new Date(`${month}-01T00:00:00.000Z`);
      return {
        month,
        year: Number(year),
        monthIndex: Number(mon),
        name: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        pnl: Number(pnl.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2)),
      };
    });

    const byYear = new Map<
      number,
      Array<{ name: string; val: number; pnl: number }>
    >();
    for (const item of months) {
      if (!byYear.has(item.year)) {
        byYear.set(
          item.year,
          Array.from({ length: 12 }, (_, i) => ({
            name: new Date(Date.UTC(2024, i, 1)).toLocaleString('en-US', {
              month: 'short',
              timeZone: 'UTC',
            }),
            val: 0,
            pnl: 0,
          })),
        );
      }
      const list = byYear.get(item.year)!;
      list[item.monthIndex - 1] = {
        name: item.name,
        val: item.returnPct,
        pnl: item.pnl,
      };
    }

    const heatmap = [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, monthsRow]) => ({ year, months: monthsRow }));

    return json({
      months,
      heatmap,
      source: 'metaapi',
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load monthly returns';
    console.error('[analytics/monthly-returns]', message);
    return json({
      months: [],
      heatmap: [],
      source: 'error',
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message,
    });
  }
}
