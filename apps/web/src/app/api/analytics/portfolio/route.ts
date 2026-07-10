import { NextRequest, NextResponse } from 'next/server';
import {
  error,
  json,
  loadLiveBroker,
  metaGetAccountInfo,
  userIdFromRequest,
  clientHost,
  metaHeaders,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

function rangeDays(range: string | null): number {
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

  const range = (req.nextUrl.searchParams.get('range') || '1m').toLowerCase();
  const days = rangeDays(range);

  try {
    const live = await loadLiveBroker(userId);
    if (!live) {
      return json({
        range,
        totalProfit: 0,
        winRate: 0,
        totalTrades: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        allTimeHigh: 0,
        bestMonth: 0,
        equityBase: 0,
        equityCurve: [],
        source: 'empty',
      });
    }

    const info = await metaGetAccountInfo(live);
    const equityBase = Number(info.balance || info.equity || 0);

    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const url = `${clientHost(live.region)}/users/current/accounts/${live.metaApiAccountId}/history-deals/time/${encodeURIComponent(start.toISOString())}/${encodeURIComponent(end.toISOString())}`;
    const res = await fetch(url, {
      headers: metaHeaders(live.metaToken),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text();
      return error(`MetaApi history failed: ${body || res.status}`, 502);
    }

    const deals = (await res.json()) as any[];
    const list = Array.isArray(deals) ? deals : [];

    const byPosition = new Map<string, any[]>();
    for (const d of list) {
      const pid = String(d.positionId || d.id || '');
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
      const profit = group.reduce(
        (sum, d) =>
          sum +
          Number(d.profit || 0) +
          Number(d.commission || 0) +
          Number(d.swap || 0),
        0,
      );
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

    const wins = closed.filter((t) => t.profit > 0);
    const losses = closed.filter((t) => t.profit < 0);
    const totalProfit = closed.reduce((s, t) => s + t.profit, 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;

    let equity = equityBase - totalProfit;
    let peak = equity;
    let maxDrawdown = 0;
    const equityCurve: Array<{ date: string; equity: number; drawdownPct: number }> = [];
    const dailyReturns: number[] = [];
    let prevEquity = equity;

    for (const t of closed) {
      equity += t.profit;
      peak = Math.max(peak, equity);
      const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);
      if (prevEquity > 0) {
        dailyReturns.push((equity - prevEquity) / prevEquity);
      }
      prevEquity = equity;
      equityCurve.push({
        date: t.closedAt,
        equity: Number(equity.toFixed(2)),
        drawdownPct: Number(dd.toFixed(2)),
      });
    }

    // Best calendar month return %
    const byMonth = new Map<string, number>();
    for (const t of closed) {
      const d = new Date(t.closedAt);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      byMonth.set(key, (byMonth.get(key) || 0) + t.profit);
    }
    let bestMonth = 0;
    for (const pnl of byMonth.values()) {
      const pct = equityBase > 0 ? (pnl / equityBase) * 100 : pnl;
      bestMonth = Math.max(bestMonth, pct);
    }

    return json({
      range,
      totalProfit: Number(totalProfit.toFixed(2)),
      winRate: Number(winRate.toFixed(2)),
      totalTrades: closed.length,
      sharpeRatio: Number(computeSharpe(dailyReturns).toFixed(2)),
      sortinoRatio: 0,
      profitFactor: Number(profitFactor.toFixed(2)),
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      allTimeHigh: Number(peak.toFixed(2)),
      bestMonth: Number(bestMonth.toFixed(2)),
      equityBase: Number(equityBase.toFixed(2)),
      equityCurve,
      source: 'metaapi',
    });
  } catch (e: any) {
    return error(e?.message || 'Failed to load portfolio analytics', 500);
  }
}
