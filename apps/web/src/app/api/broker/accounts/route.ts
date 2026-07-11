import { createDecipheriv } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

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
    const ctrl = AbortSignal.timeout(5000);
    const meRes = await fetch(`${backend}/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      cache: 'no-store',
      signal: ctrl,
    });
    if (!meRes.ok) return null;
    const body = await meRes.json();
    const user = body?.data ?? body;
    return typeof user?.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

async function fetchBalance(
  metaApiAccountId: string,
  region: string,
  token: string,
): Promise<{
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
} | null> {
  try {
    const host = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const res = await fetch(
      `${host}/users/current/accounts/${metaApiAccountId}/account-information`,
      {
        headers: {
          'auth-token': token,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return null;
    const d = await res.json();
    const balance = Number(d.balance ?? 0);
    const equity = Number(d.equity ?? d.balance ?? 0);
    const margin = Number(d.margin ?? 0);
    const freeMargin = Number(
      d.freeMargin ?? d.free_margin ?? Math.max(0, equity - margin),
    );
    if (!Number.isFinite(balance) || !Number.isFinite(equity)) return null;
    return {
      balance,
      equity,
      margin,
      freeMargin,
      currency: d.currency || 'USD',
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const dbUrl = process.env.DATABASE_URL?.trim();
  const aesKey = process.env.AES_MASTER_KEY?.trim();
  const metaToken = process.env.METAAPI_TOKEN?.trim();
  if (!dbUrl || !aesKey) return error('Database not configured', 503);

  const sql = neon(dbUrl);
  const rows = await sql`
    SELECT id, "brokerName", "accountNumberLast4", "serverName",
           "isPaperTrading", "isDefault", "isActive", "connectedAt",
           "initialEquity", "credentialsEncrypted", "lastConnectedAt"
    FROM "BrokerAccount"
    WHERE "userId" = ${userId} AND "isActive" = true
    ORDER BY "connectedAt" DESC
  `;

  // Parallel MetaAPI balance fetches — never expose initialEquity as live balance.
  const accounts = await Promise.all(
    rows.map(async (row) => {
      let creds: Record<string, any> = {};
      try {
        creds = JSON.parse(
          decryptAesGcm(row.credentialsEncrypted as string, aesKey),
        );
      } catch {
        creds = {};
      }

      const metaId = creds.metaApiAccountId as string | undefined;
      const region = (creds.metaApiRegion as string) || 'london';
      const storeOnly =
        !metaId ||
        creds.executionMode === 'master_only' ||
        String(metaId).startsWith('mock-');

      let balance: number | null = null;
      let equity: number | null = null;
      let margin = 0;
      let freeMargin: number | null = null;
      let currency = 'USD';
      let liveSynced = false;
      let connectionStatus = storeOnly ? 'CONNECTED' : 'SYNCING';

      if (row.isPaperTrading) {
        const seed = Number(row.initialEquity ?? 0);
        balance = seed;
        equity = seed;
        freeMargin = seed;
        liveSynced = seed > 0;
        connectionStatus = 'CONNECTED';
      } else if (!storeOnly && metaToken && metaId) {
        const live = await fetchBalance(metaId, region, metaToken);
        if (live) {
          balance = live.balance;
          equity = live.equity;
          margin = live.margin;
          freeMargin = live.freeMargin;
          currency = live.currency;
          liveSynced = true;
          connectionStatus = 'CONNECTED';
        } else {
          connectionStatus = 'SYNCING';
        }
      }

      const { credentialsEncrypted: _, ...safe } = row as any;
      return {
        ...safe,
        accountNumber: row.accountNumberLast4,
        login: creds.login || null,
        // Keep initialEquity for deposit-base fallback only — not as displayed balance.
        balance,
        equity,
        margin,
        freeMargin,
        currency,
        liveSynced,
        connectionStatus,
        storeOnly,
        fillMode: storeOnly
          ? 'bridge'
          : row.isPaperTrading
            ? 'paper'
            : 'metaapi',
        balanceNote: storeOnly
          ? undefined
          : liveSynced
            ? 'Live balance via MetaApi G2'
            : 'Waiting for live MetaAPI sync',
      };
    }),
  );

  return json(accounts);
}
