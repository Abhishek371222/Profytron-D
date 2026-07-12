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

function dealType(deal: any): string {
  return String(deal?.type || deal?.dealType || '').toUpperCase();
}

/** Cash movements: deposits, withdrawals, credits, bonuses — not trading P/L. */
function isBalanceDeal(deal: any): boolean {
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
  // MT deal type ints: 2=balance … 6=bonus
  const n = Number(deal?.type ?? deal?.dealType);
  return Number.isFinite(n) && n >= 2 && n <= 6;
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

function dealTime(deal: any): string {
  return String(deal.time || deal.brokerTime || new Date().toISOString());
}

function emptyPortfolio(range: string, extra?: Record<string, unknown>) {
  return json({
    range,
    totalProfit: 0,
    totalReturnPct: 0,
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
    depositBase: 0,
    equityCurve: [],
    source: 'empty',
    ...extra,
  });
}

async function fetchDeals(
  live: NonNullable<Awaited<ReturnType<typeof loadLiveBroker>>>,
  from: Date,
  to: Date,
): Promise<any[]> {
  return withResolvedRegion(live, async (resolved) => {
    const url = `${clientHost(resolved.region)}/users/current/accounts/${resolved.metaApiAccountId}/history-deals/time/${encodeURIComponent(from.toISOString())}/${encodeURIComponent(to.toISOString())}`;
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
}

function closedTradesFromDeals(tradingDeals: any[]) {
  const byPosition = new Map<string, any[]>();
  for (const d of tradingDeals) {
    const pid = String(d.positionId || '');
    if (!pid) continue;
    if (!byPosition.has(pid)) byPosition.set(pid, []);
    byPosition.get(pid)!.push(d);
  }

  const closed: { profit: number; closedAt: string; symbol: string }[] = [];
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
    closed.push({
      profit,
      closedAt: closedAt || new Date().toISOString(),
      symbol: String(group.find((d) => d.symbol)?.symbol || 'UNKNOWN'),
    });
  }
  closed.sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
  );
  return closed;
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const range = (req.nextUrl.searchParams.get('range') || '1m').toLowerCase();
  const days = rangeDays(range);

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return emptyPortfolio(range);

    let dbInitialEquity = 0;
    try {
      const rows = await live.sql`
        SELECT "initialEquity"
        FROM "BrokerAccount"
        WHERE id = ${live.brokerAccountId}
        LIMIT 1
      `;
      dbInitialEquity = Number(rows[0]?.initialEquity ?? 0) || 0;
    } catch {
      dbInitialEquity = 0;
    }

    const info = await withResolvedRegion(live, metaGetAccountInfo);
    const liveEquity = Number(info.equity ?? info.balance ?? 0);
    const liveBalance = Number(info.balance ?? liveEquity);

    const end = new Date();
    const rangeStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    // 1y lookback is enough for deposits; shorter = much faster MetaAPI history.
    const historyStart = new Date(
      Date.now() - Math.max(days, 365) * 24 * 60 * 60 * 1000,
    );

    const allDeals = await fetchDeals(live, historyStart, end);
    const balanceDeals = allDeals.filter((d) => isBalanceDeal(d));
    const tradingDealsAll = allDeals.filter((d) => !isNonTradingDeal(d));

    // What the user funded: deposits − withdrawals. $100 in → base 100.
    const netDeposits = balanceDeals.reduce((sum, d) => sum + dealPnl(d), 0);

    const closedAll = closedTradesFromDeals(tradingDealsAll);
    const closed = closedAll.filter(
      (t) => new Date(t.closedAt).getTime() >= rangeStart.getTime(),
    );

    const tradingPnLAll = closedAll.reduce((s, t) => s + t.profit, 0);
    const totalProfit = closed.reduce((s, t) => s + t.profit, 0);

    let depositBase = 0;
    if (netDeposits > 1) {
      depositBase = netDeposits;
    } else if (dbInitialEquity > 1) {
      depositBase = dbInitialEquity;
    } else {
      // Reconstruct funding when MetaAPI history has no balance deals.
      depositBase = Math.max(1, liveEquity - tradingPnLAll);
    }

    // $100 → $120 ⇒ +20%
    const totalReturnPct =
      depositBase > 0 ? ((liveEquity - depositBase) / depositBase) * 100 : 0;

    const wins = closed.filter((t) => t.profit > 0);
    const losses = closed.filter((t) => t.profit < 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const grossWin = wins.reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const profitFactor =
      grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const avgWin = wins.length ? grossWin / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;

    // Curve from deposits + trades (no cliff from $20 → $120).
    type Ev = { at: number; date: string; delta: number; kind: 'cash' | 'trade' };
    const events: Ev[] = [];
    for (const d of balanceDeals) {
      const date = dealTime(d);
      events.push({
        at: new Date(date).getTime(),
        date,
        delta: dealPnl(d),
        kind: 'cash',
      });
    }
    for (const t of closedAll) {
      events.push({
        at: new Date(t.closedAt).getTime(),
        date: t.closedAt,
        delta: t.profit,
        kind: 'trade',
      });
    }
    events.sort((a, b) => a.at - b.at);

    let running = 0;
    let peak = 0;
    let maxDrawdown = 0;
    const fullCurve: Array<{ date: string; equity: number; drawdownPct: number }> =
      [];
    const dailyReturns: number[] = [];
    let prevForSharpe = 0;

    // If no cash events, seed with reconstructed deposit base.
    if (balanceDeals.length === 0 && depositBase > 0) {
      running = depositBase;
      peak = depositBase;
      fullCurve.push({
        date: historyStart.toISOString(),
        equity: Number(depositBase.toFixed(2)),
        drawdownPct: 0,
      });
      prevForSharpe = depositBase;
    }

    for (const ev of events) {
      running = Math.max(0, running + ev.delta);
      peak = Math.max(peak, running);
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);
      if (prevForSharpe > 0 && ev.kind === 'trade') {
        dailyReturns.push((running - prevForSharpe) / prevForSharpe);
      }
      prevForSharpe = running;
      fullCurve.push({
        date: ev.date,
        equity: Number(running.toFixed(2)),
        drawdownPct: Number(dd.toFixed(2)),
      });
    }

    const rangeStartMs = rangeStart.getTime();
    const before = [...fullCurve]
      .reverse()
      .find((p) => new Date(p.date).getTime() < rangeStartMs);
    const seedEquity = Number(
      (before?.equity ?? (depositBase > 0 ? depositBase : liveEquity)).toFixed(2),
    );

    let equityCurve = fullCurve.filter(
      (p) => new Date(p.date).getTime() >= rangeStartMs,
    );

    equityCurve = [
      {
        date: rangeStart.toISOString(),
        equity: seedEquity,
        drawdownPct: 0,
      },
      ...equityCurve,
    ];

    // Final point = live equity (floating P/L). Keep it only if jump is modest;
    // otherwise rebuild as deposit → cumulative trades → live.
    const lastEq = equityCurve[equityCurve.length - 1]?.equity ?? seedEquity;
    const jumpPct = lastEq > 0 ? Math.abs(liveEquity - lastEq) / lastEq : 1;
    if (jumpPct > 0.35 && depositBase > 0) {
      let eq = depositBase;
      equityCurve = [
        {
          date: rangeStart.toISOString(),
          equity: Number(depositBase.toFixed(2)),
          drawdownPct: 0,
        },
      ];
      peak = depositBase;
      maxDrawdown = 0;
      for (const t of closed) {
        eq += t.profit;
        peak = Math.max(peak, eq);
        const dd = peak > 0 ? ((peak - eq) / peak) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, dd);
        equityCurve.push({
          date: t.closedAt,
          equity: Number(eq.toFixed(2)),
          drawdownPct: Number(dd.toFixed(2)),
        });
      }
      peak = Math.max(peak, liveEquity);
      const dd = peak > 0 ? ((peak - liveEquity) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);
      equityCurve.push({
        date: end.toISOString(),
        equity: Number(liveEquity.toFixed(2)),
        drawdownPct: Number(dd.toFixed(2)),
      });
    } else if (Math.abs(liveEquity - lastEq) > 0.01) {
      peak = Math.max(peak, liveEquity);
      const dd = peak > 0 ? ((peak - liveEquity) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);
      equityCurve.push({
        date: end.toISOString(),
        equity: Number(liveEquity.toFixed(2)),
        drawdownPct: Number(dd.toFixed(2)),
      });
    }

    const byMonth = new Map<string, number>();
    for (const t of closed) {
      const d = new Date(t.closedAt);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      byMonth.set(key, (byMonth.get(key) || 0) + t.profit);
    }
    let bestMonth = 0;
    for (const pnl of byMonth.values()) {
      const pct = depositBase > 0 ? (pnl / depositBase) * 100 : 0;
      bestMonth = Math.max(bestMonth, pct);
    }

    return json({
      range,
      totalProfit: Number(totalProfit.toFixed(2)),
      totalReturnPct: Number(totalReturnPct.toFixed(2)),
      winRate: Number(winRate.toFixed(2)),
      totalTrades: closed.length,
      sharpeRatio: Number(computeSharpe(dailyReturns).toFixed(2)),
      sortinoRatio: 0,
      profitFactor: Number(profitFactor.toFixed(2)),
      avgWin: Number(avgWin.toFixed(2)),
      avgLoss: Number(avgLoss.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      allTimeHigh: Number(Math.max(peak, liveEquity).toFixed(2)),
      bestMonth: Number(bestMonth.toFixed(2)),
      equityBase: Number(depositBase.toFixed(2)),
      depositBase: Number(depositBase.toFixed(2)),
      netDeposits: Number(netDeposits.toFixed(2)),
      equityCurve,
      source: 'metaapi',
      liveBalance: Number(liveBalance.toFixed(2)),
      liveEquity: Number(liveEquity.toFixed(2)),
      liveMargin: Number(info.margin ?? 0),
      liveFreeMargin: Number(
        info.freeMargin ??
          info.free_margin ??
          Math.max(0, liveEquity - Number(info.margin ?? 0)),
      ),
      liveCurrency: String(info.currency || 'USD'),
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load portfolio analytics';
    console.error('[analytics/portfolio]', message);
    return emptyPortfolio(range, {
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message: isMetaApiUnauthorized(message)
        ? 'Broker sync authorization failed. Reconnect your account or refresh broker access.'
        : message,
    });
  }
}
