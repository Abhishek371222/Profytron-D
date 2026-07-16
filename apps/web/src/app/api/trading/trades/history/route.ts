import { NextRequest, NextResponse } from 'next/server';
import {
  clientHost,
  error,
  isMetaApiUnauthorized,
  loadLiveBroker,
  metaHeaders,
  userIdFromRequest,
  withResolvedRegion,
  type LiveBroker,
} from '@/lib/server/metaapi-trading';
import { closedTradesFromMetaDeals } from '@/lib/server/metaapi-closed-trades';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

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

async function fetchHistoryDeals(live: LiveBroker, start: Date, end: Date) {
  const startIso = encodeURIComponent(start.toISOString());
  const endIso = encodeURIComponent(end.toISOString());
  const host = clientHost(live.region);
  const res = await fetch(
    `${host}/users/current/accounts/${live.metaApiAccountId}/history-deals/time/${startIso}/${endIso}`,
    { headers: metaHeaders(live.metaToken), cache: 'no-store' },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MetaApi history failed: ${body || res.status}`);
  }
  const deals = await res.json();
  return Array.isArray(deals) ? deals : [];
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const limit = Math.min(
    Number(req.nextUrl.searchParams.get('limit') || 20) || 20,
    100,
  );
  const symbolFilter = (req.nextUrl.searchParams.get('symbol') || '')
    .trim()
    .toUpperCase();
  // Default 365d so Overview / History show real closed trades, not an empty 30d window.
  const days = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get('days') || 365) || 365, 1),
    730,
  );

  try {
    const live = await loadLiveBroker(userId);
    if (!live) {
      return json(
        { rows: [], nextCursor: null },
        { syncError: 'NO_LIVE_BROKER', message: 'No live MetaAPI broker linked.' },
      );
    }

    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = await withResolvedRegion(live, (resolved) =>
      fetchHistoryDeals(resolved, start, end),
    );

    const closedRows = closedTradesFromMetaDeals(list, { symbolFilter });
    const page = closedRows.slice(0, limit);
    return json({
      rows: page,
      nextCursor:
        closedRows.length > limit ? page[page.length - 1]?.closedAt : null,
      source: 'metaapi',
      dealCount: list.length,
      closedCount: closedRows.length,
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load trade history';
    console.error('[trades/history]', message);
    // HTTP 503 so React Query keeps previous data instead of treating empty as success.
    return json(
      { rows: [], nextCursor: null },
      {
        syncError: isMetaApiUnauthorized(message)
          ? 'METAAPI_UNAUTHORIZED'
          : 'METAAPI_UNAVAILABLE',
        message: isMetaApiUnauthorized(message)
          ? 'Broker sync authorization failed. Reconnect your account or refresh broker access.'
          : message,
      },
      503,
    );
  }
}
