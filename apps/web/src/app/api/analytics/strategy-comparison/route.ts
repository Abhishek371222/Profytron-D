import { NextRequest } from 'next/server';
import {
  error,
  isMetaApiUnauthorized,
  json,
  loadLiveBroker,
  userIdFromRequest,
  clientHost,
  metaHeaders,
  withResolvedRegion,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

function rangeDays(range: string | null): number {
  switch ((range || '3m').toLowerCase()) {
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
      return 90;
  }
}

function dealType(deal: any): string {
  return String(deal?.type || deal?.dealType || '').toUpperCase();
}

function isNonTradingDeal(deal: any): boolean {
  const type = dealType(deal);
  return (
    type.includes('BALANCE') ||
    type.includes('CREDIT') ||
    type.includes('CHARGE') ||
    type.includes('CORRECTION') ||
    type.includes('BONUS') ||
    (type.includes('COMMISSION') && !type.includes('DEAL'))
  );
}

function dealPnl(deal: any): number {
  return (
    Number(deal.profit || 0) +
    Number(deal.commission || 0) +
    Number(deal.swap || 0)
  );
}

function computeSharpe(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  const std = Math.sqrt(variance);
  if (std < 1e-12) return 0;
  return mean / std;
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const range = (req.nextUrl.searchParams.get('range') || '3m').toLowerCase();
  const days = rangeDays(range);

  try {
    const live = await loadLiveBroker(userId);
    if (!live) {
      return json({ range, strategies: [], correlation: [], source: 'empty' });
    }

    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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
    const byPosition = new Map<string, any[]>();
    for (const d of tradingDeals) {
      const pid = String(d.positionId || '');
      if (!pid) continue;
      if (!byPosition.has(pid)) byPosition.set(pid, []);
      byPosition.get(pid)!.push(d);
    }

    const closed: { profit: number; symbol: string }[] = [];
    for (const [, group] of byPosition) {
      const hasOut = group.some((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
      if (!hasOut) continue;
      const profit = group.reduce((sum, d) => sum + dealPnl(d), 0);
      const symbol = String(
        group.find((d) => d.symbol)?.symbol || 'Account',
      ).replace(/\.|#/g, '');
      closed.push({ profit, symbol });
    }

    const bySymbol = new Map<string, number[]>();
    for (const t of closed) {
      if (!bySymbol.has(t.symbol)) bySymbol.set(t.symbol, []);
      bySymbol.get(t.symbol)!.push(t.profit);
    }

    const strategies = [...bySymbol.entries()]
      .map(([name, pnls]) => {
        const trades = pnls.length;
        const wins = pnls.filter((p) => p > 0).length;
        const netPnl = pnls.reduce((s, p) => s + p, 0);
        const avgPnl = trades ? netPnl / trades : 0;
        const winRate = trades ? (wins / trades) * 100 : 0;
        const returns = pnls.map((p) => p / Math.max(1, Math.abs(avgPnl) || 1));
        let peak = 0;
        let equity = 0;
        let maxDrawdown = 0;
        for (const p of pnls) {
          equity += p;
          peak = Math.max(peak, equity);
          const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
          maxDrawdown = Math.max(maxDrawdown, dd);
        }
        return {
          id: name,
          name,
          trades,
          winRate: Number(winRate.toFixed(2)),
          netPnl: Number(netPnl.toFixed(2)),
          avgPnl: Number(avgPnl.toFixed(2)),
          sharpeRatio: Number(computeSharpe(returns).toFixed(2)),
          maxDrawdown: Number(maxDrawdown.toFixed(2)),
        };
      })
      .sort((a, b) => b.netPnl - a.netPnl);

    // If no symbol breakdown, expose a single Account row from all closed trades.
    if (strategies.length === 0 && closed.length > 0) {
      const pnls = closed.map((c) => c.profit);
      const netPnl = pnls.reduce((s, p) => s + p, 0);
      const wins = pnls.filter((p) => p > 0).length;
      strategies.push({
        id: 'account',
        name: 'Account',
        trades: pnls.length,
        winRate: Number(((wins / pnls.length) * 100).toFixed(2)),
        netPnl: Number(netPnl.toFixed(2)),
        avgPnl: Number((netPnl / pnls.length).toFixed(2)),
        sharpeRatio: 0,
        maxDrawdown: 0,
      });
    }

    const n = strategies.length;
    const correlation =
      n === 0
        ? []
        : Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
          );

    return json({
      range,
      strategies,
      correlation,
      source: 'metaapi',
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load bot comparison';
    console.error('[analytics/strategy-comparison]', message);
    return json({
      range,
      strategies: [],
      correlation: [],
      source: 'error',
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message,
    });
  }
}
