import { createDecipheriv } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

async function fetchBalance(
  metaApiAccountId: string,
  region: string,
  token: string,
): Promise<{ balance: number; equity: number; currency: string } | null> {
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
      },
    );
    if (!res.ok) return null;
    const d = await res.json();
    return {
      balance: Number(d.balance ?? 0),
      equity: Number(d.equity ?? d.balance ?? 0),
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

      let balance: number | null = row.initialEquity as number | null;
      let equity: number | null = row.initialEquity as number | null;
      let currency = 'USD';
      let connectionStatus = storeOnly ? 'CONNECTED' : 'SYNCING';

      if (row.isPaperTrading) {
        connectionStatus = 'CONNECTED';
      } else if (!storeOnly && metaToken && metaId) {
        const live = await fetchBalance(metaId, region, metaToken);
        if (live) {
          balance = live.balance;
          equity = live.equity;
          currency = live.currency;
          connectionStatus = 'CONNECTED';
        } else {
          connectionStatus = 'CONNECTED';
        }
      }

      const { credentialsEncrypted: _, ...safe } = row as any;
      return {
        ...safe,
        accountNumber: row.accountNumberLast4,
        login: creds.login || null,
        balance,
        equity,
        currency,
        connectionStatus,
        storeOnly,
        fillMode: storeOnly
          ? 'bridge'
          : row.isPaperTrading
            ? 'paper'
            : 'metaapi',
        balanceNote: storeOnly
          ? undefined
          : 'Live balance via MetaApi G2',
      };
    }),
  );

  return json(accounts);
}
