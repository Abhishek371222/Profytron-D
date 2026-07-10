import { createDecipheriv, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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

function mapDirection(type: string): 'LONG' | 'SHORT' {
  const t = String(type || '').toUpperCase();
  if (t.includes('SELL') || t.includes('SHORT')) return 'SHORT';
  return 'LONG';
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
    const dbUrl = process.env.DATABASE_URL?.trim();
    const aesKey = process.env.AES_MASTER_KEY?.trim();
    const metaToken = process.env.METAAPI_TOKEN?.trim();
    if (!dbUrl || !aesKey || !metaToken) {
      return error('Trading sync is not configured', 503);
    }

    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT id, "credentialsEncrypted"
      FROM "BrokerAccount"
      WHERE "userId" = ${userId} AND "isActive" = true AND "isPaperTrading" = false
      ORDER BY "isDefault" DESC, "connectedAt" DESC
      LIMIT 1
    `;
    if (!rows[0]) return json({ rows: [], nextCursor: null });

    let creds: Creds = {};
    try {
      creds = JSON.parse(
        decryptAesGcm(rows[0].credentialsEncrypted as string, aesKey),
      );
    } catch {
      return json({ rows: [], nextCursor: null });
    }
    if (!creds.metaApiAccountId) {
      return json({ rows: [], nextCursor: null });
    }

    const region = creds.metaApiRegion || 'london';
    const end = new Date();
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startIso = encodeURIComponent(start.toISOString());
    const endIso = encodeURIComponent(end.toISOString());
    const host = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const res = await fetch(
      `${host}/users/current/accounts/${creds.metaApiAccountId}/history-deals/time/${startIso}/${endIso}`,
      {
        headers: { 'auth-token': metaToken, Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      const body = await res.text();
      return error(`MetaApi history failed: ${body || res.status}`, 502);
    }

    const deals = (await res.json()) as any[];
    const list = Array.isArray(deals) ? deals : [];

    // Pair entry/exit by positionId when possible; otherwise show closed deals with profit.
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
      const entry = sorted.find((d) =>
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
        (sum, d) => sum + Number(d.profit || 0) + Number(d.commission || 0) + Number(d.swap || 0),
        0,
      );
      const symbol = String(entry?.symbol || exit?.symbol || '');
      if (symbolFilter && symbol.toUpperCase() !== symbolFilter) continue;

      // Only include groups that look closed (have OUT or non-zero closed profit chain)
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
    return error(e?.message || 'Failed to load trade history', 500);
  }
}
