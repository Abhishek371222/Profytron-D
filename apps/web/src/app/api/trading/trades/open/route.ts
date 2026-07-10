import { createDecipheriv, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type Creds = {
  login?: string;
  metaApiAccountId?: string;
  metaApiRegion?: string;
  executionMode?: string;
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

async function loadLiveBroker(userId: string) {
  const dbUrl = process.env.DATABASE_URL?.trim();
  const aesKey = process.env.AES_MASTER_KEY?.trim();
  const metaToken = process.env.METAAPI_TOKEN?.trim();
  if (!dbUrl || !aesKey || !metaToken) {
    throw new Error('Trading sync is not configured');
  }
  const sql = neon(dbUrl);
  const rows = await sql`
    SELECT id, "credentialsEncrypted", "isPaperTrading"
    FROM "BrokerAccount"
    WHERE "userId" = ${userId} AND "isActive" = true AND "isPaperTrading" = false
    ORDER BY "isDefault" DESC, "connectedAt" DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  let creds: Creds = {};
  try {
    creds = JSON.parse(
      decryptAesGcm(rows[0].credentialsEncrypted as string, aesKey),
    );
  } catch {
    return null;
  }
  if (!creds.metaApiAccountId) return null;
  return {
    brokerAccountId: rows[0].id as string,
    metaApiAccountId: creds.metaApiAccountId,
    region: creds.metaApiRegion || 'london',
    metaToken,
    sql,
  };
}

function clientHost(region: string) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

function metaHeaders(token: string) {
  return { 'auth-token': token, Accept: 'application/json' };
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

    const res = await fetch(
      `${clientHost(live.region)}/users/current/accounts/${live.metaApiAccountId}/positions`,
      { headers: metaHeaders(live.metaToken), cache: 'no-store' },
    );
    if (!res.ok) {
      const body = await res.text();
      return error(`MetaApi positions failed: ${body || res.status}`, 502);
    }
    const positions = (await res.json()) as any[];
    const list = Array.isArray(positions) ? positions : [];

    const open = list.map((p) => ({
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
    return error(e?.message || 'Failed to load open trades', 500);
  }
}
