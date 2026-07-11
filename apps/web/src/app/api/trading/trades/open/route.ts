import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  error,
  isMetaApiUnauthorized,
  loadLiveBroker,
  metaGetPositions,
  userIdFromRequest,
  withResolvedRegion,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function json(data: unknown, extra?: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    {
      success: status < 400,
      data,
      ...extra,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function mapDirection(type: string): 'LONG' | 'SHORT' {
  const t = String(type || '').toUpperCase();
  if (t.includes('SELL') || t.includes('SHORT')) return 'SHORT';
  return 'LONG';
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return json([]);

    const positions = await withResolvedRegion(live, metaGetPositions);
    const open = positions.map((p) => ({
      id: `meta:${p.id || p.providerId || randomUUID()}`,
      symbol: String(p.symbol || ''),
      direction: mapDirection(p.type || p.side || ''),
      volume: Number(p.volume || 0),
      openPrice: Number(p.openPrice || p.priceOpen || 0),
      fillPrice: Number(p.openPrice || p.priceOpen || 0),
      profit: Number(p.profit ?? p.unrealizedProfit ?? 0),
      unrealizedPnl: Number(p.profit ?? p.unrealizedProfit ?? 0),
      status: 'OPEN',
      openedAt: p.time || p.openTime || new Date().toISOString(),
      strategyId: null,
      brokerTicket: String(p.id || ''),
      isPaper: false,
    }));

    return json(open);
  } catch (e: any) {
    const message = e?.message || 'Failed to load open trades';
    console.error('[trades/open]', message);
    return json([], {
      syncError: isMetaApiUnauthorized(message)
        ? 'METAAPI_UNAUTHORIZED'
        : 'METAAPI_UNAVAILABLE',
      message: isMetaApiUnauthorized(message)
        ? 'MetaAPI token is invalid or revoked. Update METAAPI_TOKEN and restart.'
        : message,
    });
  }
}
