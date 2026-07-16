import { createDecipheriv } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql as pgSql } from '@/lib/server/pg-sql';
import { closedTradesFromMetaDeals } from '@/lib/server/metaapi-closed-trades';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Creds = {
  metaApiAccountId?: string;
  metaApiRegion?: string;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(
    { success: status < 400, data, timestamp: new Date().toISOString() },
    { status },
  );
}

function error(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      statusCode: status,
      error: message,
      message,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function decryptAesGcm(payload: string, keyHex: string): string {
  const parsed = JSON.parse(payload);
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let out = decipher.update(parsed.encrypted, 'hex', 'utf8');
  out += decipher.final('utf8');
  return out;
}

async function userIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const backend = (
    process.env.BACKEND_API_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://profytron-api.onrender.com'
  ).replace(/\/$/, '');
  if (!bearer) return null;
  try {
    const meRes = await fetch(`${backend}/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
    });
    if (!meRes.ok) return null;
    const body = await meRes.json();
    const user = body?.data ?? body;
    return typeof user?.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

function rangeDays(range: string | null): number {
  switch ((range || '1m').toLowerCase()) {
    case '1d':
    case '24h':
      return 1;
    case '7d':
    case '1w':
      return 7;
    case '1m':
      return 30;
    case '3m':
      return 90;
    case 'all':
      return 365;
    default:
      return 30;
  }
}

function mapDirection(type: string): 'BUY' | 'SELL' {
  const t = String(type || '').toUpperCase();
  if (t.includes('SELL') || t.includes('SHORT')) return 'SELL';
  return 'BUY';
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const range = req.nextUrl.searchParams.get('range') || '1m';
  const days = rangeDays(range);

  try {
    const dbUrl = process.env.DATABASE_URL?.trim();
    const aesKey = process.env.AES_MASTER_KEY?.trim();
    const metaToken = process.env.METAAPI_TOKEN?.trim();
    if (!dbUrl || !aesKey || !metaToken) {
      return error('Trading sync is not configured', 503);
    }

    const sql = pgSql(dbUrl);

    // Resolve the bot name the user actually subscribed to (never show "CopyFactory").
    const botRows = await sql`
      SELECT st.name
      FROM "UserStrategySubscription" s
      JOIN "Strategy" st ON st.id = s."strategyId"
      WHERE s."userId" = ${userId}
        AND s.status IN ('ACTIVE', 'PROVISIONING', 'PAUSED')
      ORDER BY
        CASE WHEN st."masterBrokerAccountId" IS NOT NULL THEN 0 ELSE 1 END,
        s."subscribedAt" DESC NULLS LAST
      LIMIT 1
    `;
    const subscribedBotName =
      String(botRows[0]?.name || '').trim() || 'Your bot';

    const rows = await sql`
      SELECT id, "credentialsEncrypted"
      FROM "BrokerAccount"
      WHERE "userId" = ${userId} AND "isActive" = true AND "isPaperTrading" = false
      ORDER BY "isDefault" DESC, "connectedAt" DESC
      LIMIT 1
    `;
    if (!rows[0]) return json({ range, rows: [] });

    let creds: Creds = {};
    try {
      creds = JSON.parse(
        decryptAesGcm(rows[0].credentialsEncrypted as string, aesKey),
      );
    } catch {
      return json({ range, rows: [] });
    }
    if (!creds.metaApiAccountId) return json({ range, rows: [] });

    const region = creds.metaApiRegion || 'london';
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const host = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const url = `${host}/users/current/accounts/${creds.metaApiAccountId}/history-deals/time/${encodeURIComponent(start.toISOString())}/${encodeURIComponent(end.toISOString())}`;
    const res = await fetch(url, {
      headers: { 'auth-token': metaToken, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = await res.text();
      return error(`MetaApi history failed: ${body || res.status}`, 502);
    }

    const deals = (await res.json()) as any[];
    const list = Array.isArray(deals) ? deals : [];

    const closed = closedTradesFromMetaDeals(list, { idPrefix: 'meta' });
    const exportRows = closed.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      direction: mapDirection(row.direction),
      volume: row.volume,
      openPrice: row.openPrice,
      closePrice: row.closePrice,
      requestedPrice: null,
      fillPrice: row.openPrice,
      slippageBps: 0,
      executionLatencyMs: null,
      executionMode: 'LIVE',
      profit: row.profit,
      commission: 0,
      swap: 0,
      status: 'CLOSED',
      strategyName: String(subscribedBotName),
      openedAt: row.openedAt,
      closedAt: row.closedAt,
    }));

    return json({ range, rows: exportRows });
  } catch (e: any) {
    return error(e?.message || 'Failed to export trades', 500);
  }
}
