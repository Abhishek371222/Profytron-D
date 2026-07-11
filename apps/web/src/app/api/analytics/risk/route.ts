import { NextRequest } from 'next/server';
import {
  error,
  isMetaApiUnauthorized,
  json,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';
import { loadClosedTradesForRange } from '@/lib/server/metaapi-deals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const range = (req.nextUrl.searchParams.get('range') || '1m').toLowerCase();

  try {
    const packed = await loadClosedTradesForRange(userId, range);
    if (!packed || packed.closed.length === 0) {
      return json({
        range,
        var95: 0,
        maxConsecutiveLosses: 0,
        largestLoss: 0,
        bestSingleWin: 0,
        avgRiskReward: 0,
        calmarRatio: 0,
        drawdownCurve: [],
        heatmap: [],
        source: packed ? 'metaapi' : 'empty',
      });
    }

    const { closed, depositBase, liveEquity } = packed;
    const pnls = closed.map((t) => t.profit);
    const losses = pnls.filter((p) => p < 0).map((p) => Math.abs(p));
    const wins = pnls.filter((p) => p > 0);

    // Historical VaR 95%: 95th percentile of loss magnitude (absolute).
    const sortedLosses = [...losses].sort((a, b) => a - b);
    const var95 =
      sortedLosses.length === 0
        ? 0
        : sortedLosses[Math.min(sortedLosses.length - 1, Math.floor(sortedLosses.length * 0.95))];

    let maxConsecutiveLosses = 0;
    let streak = 0;
    for (const p of pnls) {
      if (p < 0) {
        streak += 1;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, streak);
      } else {
        streak = 0;
      }
    }

    const largestLoss = losses.length ? Math.max(...losses) : 0;
    const bestSingleWin = wins.length ? Math.max(...wins) : 0;
    const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const avgRiskReward = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

    // Equity + drawdown curve from deposit base + chronological trades.
    let equity = depositBase;
    let peak = depositBase;
    const drawdownCurve: Array<{ time: number; val: number }> = [
      { time: Date.now() - 30 * 24 * 60 * 60 * 1000, val: 0 },
    ];
    let maxDd = 0;

    for (const t of closed) {
      equity += t.profit;
      peak = Math.max(peak, equity);
      const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      maxDd = Math.max(maxDd, dd);
      drawdownCurve.push({
        time: new Date(t.closedAt).getTime(),
        val: Number(dd.toFixed(2)),
      });
    }
    // Snap end to live floating.
    peak = Math.max(peak, liveEquity);
    const endDd = peak > 0 ? ((peak - liveEquity) / peak) * 100 : 0;
    maxDd = Math.max(maxDd, endDd);
    drawdownCurve.push({ time: Date.now(), val: Number(endDd.toFixed(2)) });

    const annualizedReturn =
      depositBase > 0 ? ((liveEquity - depositBase) / depositBase) * 100 : 0;
    const calmarRatio = maxDd > 0 ? annualizedReturn / maxDd : 0;

    // Hour × weekday heatmap from trade outcomes (intensity = |pnl|).
    const heatMap = new Map<string, number>();
    for (const t of closed) {
      const d = new Date(t.closedAt);
      const day = d.getUTCDay();
      const hour = d.getUTCHours();
      const key = `${day}-${hour}`;
      heatMap.set(key, (heatMap.get(key) || 0) + Math.abs(t.profit));
    }
    const heatmap = [...heatMap.entries()].map(([key, value]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, value: Number(value.toFixed(2)) };
    });

    return json({
      range,
      var95: Number(var95.toFixed(2)),
      maxConsecutiveLosses,
      largestLoss: Number(largestLoss.toFixed(2)),
      bestSingleWin: Number(bestSingleWin.toFixed(2)),
      avgRiskReward: Number(avgRiskReward.toFixed(2)),
      calmarRatio: Number(calmarRatio.toFixed(2)),
      maxDrawdown: Number(maxDd.toFixed(2)),
      drawdownCurve,
      heatmap,
      source: 'metaapi',
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load risk analytics';
    console.error('[analytics/risk]', message);
    return json({
      range,
      var95: 0,
      maxConsecutiveLosses: 0,
      largestLoss: 0,
      bestSingleWin: 0,
      avgRiskReward: 0,
      calmarRatio: 0,
      drawdownCurve: [],
      heatmap: [],
      source: 'error',
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message,
    });
  }
}
