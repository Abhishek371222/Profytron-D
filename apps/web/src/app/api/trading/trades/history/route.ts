import { NextRequest, NextResponse } from 'next/server';
import {
  clientHost,
  error,
  isMetaApiRateLimited,
  isMetaApiUnauthorized,
  loadLiveBroker,
  metaHeaders,
  sleep,
  userIdFromRequest,
  withResolvedRegion,
  type LiveBroker,
} from '@/lib/server/metaapi-trading';
import { closedTradesFromMetaDeals } from '@/lib/server/metaapi-closed-trades';
import type { ClosedHistoryRow } from '@/lib/server/metaapi-closed-trades';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

/** Soft wait for MetaAPI when we already have DB rows — keep Overview instant. */
const META_SOFT_MS = 1_800;
/** Hard wait when DB is empty (first load / cold account). */
const META_HARD_MS = 10_000;
const HISTORY_FETCH_MS = 10_000;
const HISTORY_MAX_RETRIES = 2;

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
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= HISTORY_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `${host}/users/current/accounts/${live.metaApiAccountId}/history-deals/time/${startIso}/${endIso}`,
        {
          headers: metaHeaders(live.metaToken),
          cache: 'no-store',
          signal: AbortSignal.timeout(HISTORY_FETCH_MS),
        },
      );
      if (res.ok) {
        const deals = await res.json();
        return Array.isArray(deals) ? deals : [];
      }

      const body = await res.text();
      const err = new Error(`MetaApi history failed: ${body || res.status}`);
      lastError = err;

      if (res.status === 429 && attempt < HISTORY_MAX_RETRIES) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const delayMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(500 * 2 ** attempt, 3000);
        await sleep(delayMs);
        continue;
      }

      throw err;
    } catch (e: any) {
      lastError = e instanceof Error ? e : new Error(String(e?.message || e));
      if (
        isMetaApiRateLimited(lastError.message) &&
        attempt < HISTORY_MAX_RETRIES
      ) {
        await sleep(Math.min(500 * 2 ** attempt, 3000));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error('MetaApi history failed');
}

async function loadSavedClosedTrades(
  live: LiveBroker,
  userId: string,
  limit: number,
  symbolFilter: string,
): Promise<ClosedHistoryRow[]> {
  try {
    const rows = symbolFilter
      ? await live.sql`
          SELECT id, symbol, direction, volume, "openPrice", "closePrice",
                 profit, status, "openedAt", "closedAt", "strategyId", "isPaper"
          FROM "Trade"
          WHERE "userId" = ${userId}
            AND status IN ('CLOSED', 'CANCELLED')
            AND UPPER(symbol) = ${symbolFilter}
          ORDER BY "closedAt" DESC NULLS LAST
          LIMIT ${limit}
        `
      : await live.sql`
          SELECT id, symbol, direction, volume, "openPrice", "closePrice",
                 profit, status, "openedAt", "closedAt", "strategyId", "isPaper"
          FROM "Trade"
          WHERE "userId" = ${userId}
            AND status IN ('CLOSED', 'CANCELLED')
          ORDER BY "closedAt" DESC NULLS LAST
          LIMIT ${limit}
        `;

    return (rows as any[]).map((row) => ({
      id: String(row.id),
      symbol: String(row.symbol || ''),
      direction: row.direction === 'SHORT' ? ('SHORT' as const) : ('LONG' as const),
      volume: Number(row.volume || 0),
      openPrice: Number(row.openPrice || 0),
      closePrice: Number(row.closePrice || 0),
      profit: Number(row.profit || 0),
      status: 'CLOSED' as const,
      openedAt: row.openedAt
        ? new Date(row.openedAt).toISOString()
        : null,
      closedAt: row.closedAt
        ? new Date(row.closedAt).toISOString()
        : null,
      strategyId: null,
      // ClosedHistoryRow historically typed isPaper as literal false; coerce
      // DB boolean into that contract without widening the shared type.
      isPaper: false as const,
    }));
  } catch (e: any) {
    console.error('[trades/history] DB fallback failed', e?.message || e);
    return [];
  }
}

/**
 * Prefer MetaAPI when it returns within the soft/hard deadline; otherwise
 * return whatever DB already has so Overview never blocks on a slow broker.
 * Returns the in-flight MetaAPI promise so a cold (empty-DB) path can await
 * it instead of issuing a second MetaAPI request.
 */
function startMetaApiHistory(
  live: LiveBroker,
  start: Date,
  end: Date,
): Promise<{ deals: any[] | null; error: Error | null }> {
  return withResolvedRegion(live, (resolved) =>
    fetchHistoryDeals(resolved, start, end),
  )
    .then((deals) => ({ deals, error: null as Error | null }))
    .catch((e: any) => ({
      deals: null as any[] | null,
      error: e instanceof Error ? e : new Error(String(e?.message || e)),
    }));
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
  // Overview only needs recent closes — default 30d (was 365d) so MetaAPI is
  // much faster. History page can still pass days=365 explicitly.

  const days = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get('days') || 30) || 30, 1),
    730,
  );

  try {
    const live = await loadLiveBroker(userId);
    if (!live) {
      return json(
        { rows: [], nextCursor: null },
        {
          syncError: 'NO_LIVE_BROKER',
          message: 'No live MetaAPI broker linked.',
        },
      );
    }

    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // ── Fast path: DB first ───────────────────────────────────────────────
    // Overview used to await MetaAPI (up to ~12s × retries) on every refresh
    // before painting. Paint last-saved closes immediately, then try MetaAPI
    // with a soft deadline.
    const savedPromise = loadSavedClosedTrades(
      live,
      userId,
      limit,
      symbolFilter,
    );
    const metaPromise = startMetaApiHistory(live, start, end);
    const saved = await savedPromise;
    const softMs = saved.length > 0 ? META_SOFT_MS : META_HARD_MS;

    try {
      const raced = await Promise.race([
        metaPromise.then((result) => ({ kind: 'meta' as const, ...result })),
        sleep(softMs).then(() => ({
          kind: 'timeout' as const,
          deals: null as any[] | null,
          error: null as Error | null,
        })),
      ]);

      let deals = raced.kind === 'meta' ? raced.deals : null;
      let metaError = raced.kind === 'meta' ? raced.error : null;

      // Soft timeout with empty DB → finish awaiting the same in-flight call
      // (do NOT fire a second MetaAPI request).
      if (raced.kind === 'timeout' && saved.length === 0) {
        const late = await metaPromise;
        deals = late.deals;
        metaError = late.error;
      }

      if (deals) {
        const closedRows = closedTradesFromMetaDeals(deals, { symbolFilter });
        const page = closedRows.slice(0, limit);
        return json({
          rows: page,
          nextCursor:
            closedRows.length > limit ? page[page.length - 1]?.closedAt : null,
          source: 'metaapi',
          dealCount: deals.length,
          closedCount: closedRows.length,
        });
      }

      // Soft timeout with DB rows → return DB instantly.
      if (raced.kind === 'timeout' && saved.length > 0) {
        return json(
          {
            rows: saved,
            nextCursor: null,
            source: 'database',
          },
          {
            syncPending: true,
            message: 'Refreshing live broker history…',
          },
        );
      }

      if (metaError) throw metaError;

      return json({
        rows: saved,
        nextCursor: null,
        source: saved.length > 0 ? 'database' : 'empty',
      });
    } catch (metaErr: any) {
      const message = metaErr?.message || 'Failed to load trade history';
      console.error('[trades/history]', message);

      const unauthorized = isMetaApiUnauthorized(message);
      const rateLimited = isMetaApiRateLimited(message);

      // Always return 200 so the Overview keeps last-good data instead of
      // flashing a hard MetaAPI sync failure on transient 429s.
      return json(
        {
          rows: saved,
          nextCursor: null,
          source: saved.length > 0 ? 'database' : 'empty',
        },
        {
          syncError: unauthorized
            ? 'METAAPI_UNAUTHORIZED'
            : 'METAAPI_UNAVAILABLE',
          message: unauthorized
            ? 'Broker sync authorization failed. Reconnect your account or refresh broker access.'
            : rateLimited
              ? 'Broker sync is rate-limited right now. Showing last saved trades if available.'
              : 'Could not sync closed trades from MetaAPI. Showing last saved trades if available.',
        },
      );
    }
  } catch (e: any) {
    const message = e?.message || 'Failed to load trade history';
    console.error('[trades/history]', message);
    return json(
      { rows: [], nextCursor: null, source: 'empty' },
      {
        syncError: isMetaApiUnauthorized(message)
          ? 'METAAPI_UNAUTHORIZED'
          : 'METAAPI_UNAVAILABLE',
        message: isMetaApiUnauthorized(message)
          ? 'Broker sync authorization failed. Reconnect your account or refresh broker access.'
          : 'Could not sync closed trades from MetaAPI. Showing last saved trades if available.',
      },
    );
  }
}
