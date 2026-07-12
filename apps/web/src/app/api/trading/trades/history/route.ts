import { randomUUID } from 'crypto';
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

  try {
    const live = await loadLiveBroker(userId);
    if (!live) return json({ rows: [], nextCursor: null });

    const end = new Date();
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const list = await withResolvedRegion(live, (resolved) =>
      fetchHistoryDeals(resolved, start, end),
    );

    const byPosition = new Map<string, any[]>();
    for (const d of list) {
      const pid = String(d.positionId || d.entryType || d.id || randomUUID());
      if (!byPosition.has(pid)) byPosition.set(pid, []);
      byPosition.get(pid)!.push(d);
    }

    const closedRows: any[] = [];
    for (const [, group] of byPosition) {
      const sorted = [...group].sort(
        (a, b) =>
          new Date(a.time || 0).getTime() - new Date(b.time || 0).getTime(),
      );
      const entry =
        sorted.find((d) =>
          String(d.entryType || '')
            .toUpperCase()
            .includes('DEAL_ENTRY_IN'),
        ) || sorted[0];
      const exit =
        sorted.find((d) =>
          String(d.entryType || '')
            .toUpperCase()
            .includes('DEAL_ENTRY_OUT'),
        ) || sorted[sorted.length - 1];

      const profit = sorted.reduce(
        (sum, d) =>
          sum +
          Number(d.profit || 0) +
          Number(d.commission || 0) +
          Number(d.swap || 0),
        0,
      );
      const symbol = String(entry?.symbol || exit?.symbol || '');
      if (symbolFilter && symbol.toUpperCase() !== symbolFilter) continue;

      const hasOut = sorted.some((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
      if (!hasOut && sorted.length < 2) continue;

      closedRows.push({
        id: `meta-hist:${exit?.id || entry?.id || randomUUID()}`,
        symbol,
        direction: mapDirection(entry?.type || ''),
        volume: Number(entry?.volume || exit?.volume || 0),
        openPrice: Number(entry?.price || 0),
        closePrice: Number(exit?.price || 0),
        profit,
        status: 'CLOSED',
        openedAt: entry?.time || null,
        closedAt: exit?.time || entry?.time || null,
        strategyId: null,
        isPaper: false,
      });
    }

    closedRows.sort(
      (a, b) =>
        new Date(b.closedAt || 0).getTime() -
        new Date(a.closedAt || 0).getTime(),
    );

    const page = closedRows.slice(0, limit);
    return json({
      rows: page,
      nextCursor:
        closedRows.length > limit ? page[page.length - 1]?.closedAt : null,
    });
  } catch (e: any) {
    const message = e?.message || 'Failed to load trade history';
    console.error('[trades/history]', message);
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
    );
  }
}
