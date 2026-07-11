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

function bucketLabel(profit: number): string {
  if (profit < -50) return '<-$50';
  if (profit < -20) return '-$50 to -$20';
  if (profit < 0) return '-$20 to $0';
  if (profit < 20) return '$0 to $20';
  if (profit < 50) return '$20 to $50';
  return '>$50';
}

const BUCKET_ORDER = [
  '<-$50',
  '-$50 to -$20',
  '-$20 to $0',
  '$0 to $20',
  '$20 to $50',
  '>$50',
];

function durationBucket(openedAt?: string, closedAt?: string): string {
  if (!openedAt || !closedAt) return 'Unknown';
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  const mins = ms / 60000;
  if (mins < 15) return '<15m';
  if (mins < 60) return '15–60m';
  if (mins < 240) return '1–4h';
  if (mins < 1440) return '4–24h';
  return '>1d';
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const range = (req.nextUrl.searchParams.get('range') || '1m').toLowerCase();

  try {
    const packed = await loadClosedTradesForRange(userId, range);
    if (!packed || packed.closed.length === 0) {
      return json({
        range,
        distribution: [],
        duration: [],
        symbolPerformance: [],
        winLoss: [],
        source: packed ? 'metaapi' : 'empty',
      });
    }

    const { closed } = packed;
    const distMap = new Map<string, number>();
    for (const label of BUCKET_ORDER) distMap.set(label, 0);
    for (const t of closed) {
      const label = bucketLabel(t.profit);
      distMap.set(label, (distMap.get(label) || 0) + 1);
    }
    const distribution = BUCKET_ORDER.map((rangeLabel) => ({
      range: rangeLabel,
      count: distMap.get(rangeLabel) || 0,
    }));

    const durMap = new Map<string, number>();
    for (const t of closed) {
      const b = durationBucket(t.openedAt, t.closedAt);
      durMap.set(b, (durMap.get(b) || 0) + 1);
    }
    const duration = [...durMap.entries()].map(([rangeLabel, count]) => ({
      range: rangeLabel,
      count,
    }));

    const bySymbol = new Map<string, { pnl: number; trades: number }>();
    for (const t of closed) {
      const cur = bySymbol.get(t.symbol) || { pnl: 0, trades: 0 };
      cur.pnl += t.profit;
      cur.trades += 1;
      bySymbol.set(t.symbol, cur);
    }
    const symbolPerformance = [...bySymbol.entries()]
      .map(([symbol, v]) => ({
        symbol,
        pnl: Number(v.pnl.toFixed(2)),
        trades: v.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    const winCount = closed.filter((t) => t.profit > 0).length;
    const lossCount = closed.filter((t) => t.profit < 0).length;
    const winLoss = [
      { name: 'Win', value: winCount },
      { name: 'Loss', value: lossCount },
    ];

    return json({
      range,
      distribution,
      duration,
      symbolPerformance,
      winLoss,
      source: 'metaapi',
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load trade analytics';
    console.error('[analytics/trades]', message);
    return json({
      range,
      distribution: [],
      duration: [],
      symbolPerformance: [],
      winLoss: [],
      source: 'error',
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message,
    });
  }
}
