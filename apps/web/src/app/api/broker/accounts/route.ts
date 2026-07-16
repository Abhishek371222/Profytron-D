import { createDecipheriv } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql as pgSql } from '@/lib/server/pg-sql';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
  const auth = req.headers.get('authorization') || '';
  const backend = (
    process.env.BACKEND_API_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://profytron-api.onrender.com'
  ).replace(/\/$/, '');

  // Prefer Nest (API .env always has DB + MetaAPI). Avoids Overview "No account"
  // when the Next process is missing DATABASE_URL / AES / METAAPI_TOKEN.
  if (auth.startsWith('Bearer ')) {
    try {
      const nestRes = await fetch(`${backend}/v1/broker/accounts`, {
        headers: {
          Authorization: auth,
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(25_000),
      });
      if (nestRes.ok) {
        const body = await nestRes.json();
        // Nest already wraps as { success, data, timestamp }.
        return NextResponse.json(body, { status: nestRes.status });
      }
    } catch {
      /* fall through to direct Neon path */
    }
  }

  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const dbUrl = process.env.DATABASE_URL?.trim();
  const aesKey = process.env.AES_MASTER_KEY?.trim();
  const metaToken = process.env.METAAPI_TOKEN?.trim();
  if (!dbUrl || !aesKey) return error('Database not configured', 503);

  const sql = pgSql(dbUrl);
  const rows = await sql`
    SELECT id, "brokerName", "accountNumberLast4", "serverName",
           "isPaperTrading", "isDefault", "isActive", "connectedAt",
           "initialEquity", "lastKnownEquity", "lastKnownBalance",
           "credentialsEncrypted", "lastConnectedAt"
    FROM "BrokerAccount"
    WHERE "userId" = ${userId} AND "isActive" = true
    ORDER BY "connectedAt" DESC
  `;

  // Parallel MetaAPI balance fetches. Always return a usable number when we have
  // a stored baseline so Overview never flashes ₹0 after login.
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

      const baseline = Number(row.initialEquity ?? 0);
      const hasBaseline = Number.isFinite(baseline) && baseline > 0;
      const cachedEquity = Number(row.lastKnownEquity ?? 0);
      const cachedBalance = Number(row.lastKnownBalance ?? 0);
      const hasCache =
        (Number.isFinite(cachedEquity) && cachedEquity > 0) ||
        (Number.isFinite(cachedBalance) && cachedBalance > 0);

      let balance: number | null = null;
      let equity: number | null = null;
      let margin = 0;
      let freeMargin: number | null = null;
      let currency = 'USD';
      let liveSynced = false;
      let connectionStatus = storeOnly ? 'CONNECTED' : 'SYNCING';

      if (row.isPaperTrading) {
        balance = hasBaseline ? baseline : 100_000;
        equity = balance;
        freeMargin = balance;
        liveSynced = true;
        connectionStatus = 'CONNECTED';
      } else if (!storeOnly && metaToken && metaId) {
        const live = await fetchBalance(metaId, region, metaToken);
        if (live && live.equity > 0) {
          balance = live.balance;
          equity = live.equity;
          margin = live.margin;
          freeMargin = live.freeMargin;
          currency = live.currency;
          liveSynced = true;
          connectionStatus = 'CONNECTED';
          // Persist live cache every sync; seed initialEquity only once.
          if (!hasBaseline) {
            void sql`
              UPDATE "BrokerAccount"
              SET "initialEquity" = ${live.equity},
                  "lastKnownEquity" = ${live.equity},
                  "lastKnownBalance" = ${live.balance},
                  "lastConnectedAt" = NOW()
              WHERE id = ${row.id}
                AND ("initialEquity" IS NULL OR "initialEquity" <= 0)
            `.catch(() => undefined);
          } else {
            void sql`
              UPDATE "BrokerAccount"
              SET "lastKnownEquity" = ${live.equity},
                  "lastKnownBalance" = ${live.balance},
                  "lastConnectedAt" = NOW()
              WHERE id = ${row.id}
            `.catch(() => undefined);
          }
        } else if (hasCache || hasBaseline) {
          balance = hasCache
            ? cachedBalance || cachedEquity
            : baseline;
          equity = hasCache
            ? cachedEquity || cachedBalance
            : baseline;
          freeMargin = equity;
          liveSynced = false;
          connectionStatus = 'SYNCING';
        } else {
          connectionStatus = 'SYNCING';
        }
      } else if (storeOnly) {
        // Bridge / store-only: show stored baseline until EA reports live.
        if (hasBaseline) {
          balance = baseline;
          equity = baseline;
          freeMargin = baseline;
        }
        liveSynced = hasBaseline;
        connectionStatus = 'CONNECTED';
      }

      const { credentialsEncrypted: _, ...safe } = row as any;
      return {
        ...safe,
        accountNumber: row.accountNumberLast4,
        login: creds.login || null,
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
          ? 'Linked via bridge — live fills update after EA heartbeat'
          : liveSynced
            ? 'Live balance via MetaApi'
            : hasBaseline
              ? 'Showing last known balance while MetaAPI syncs'
              : 'Waiting for live MetaAPI sync',
      };
    }),
  );

  return json(accounts);
}
