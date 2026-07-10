import { createDecipheriv } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * List connected broker accounts from Neon (store-only aware).
 * Avoids Render's MetaApi "CONNECTING forever" status for user MT5 links.
 */

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

function decryptAesGcm(storedData: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const parsed = JSON.parse(storedData);
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function userIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const backend = (
    process.env.BACKEND_API_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://profytron-api.onrender.com'
  ).replace(/\/$/, '');

  if (bearer) {
    try {
      const meRes = await fetch(`${backend}/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${bearer}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const body = (await meRes.json()) as any;
        const data = body?.data ?? body;
        const id = data?.id ?? data?.userId;
        if (typeof id === 'string' && id.length > 0) return id;
      }
    } catch {
      /* fall through */
    }
  }

  if (!bearer) return null;
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      bearer,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] },
    );
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const databaseUrl = process.env.DATABASE_URL;
  const aesKey = process.env.AES_MASTER_KEY;
  if (!databaseUrl) {
    return error('DATABASE_URL not configured', 503);
  }

  const userId = await userIdFromRequest(req);
  if (!userId) {
    return error('Session expired. Please refresh and log in again.', 401);
  }

  const sql = neon(databaseUrl);
  const rows = (await sql`
    SELECT
      id, "userId", "brokerName", "accountNumberLast4", "credentialsEncrypted",
      "serverName", "isPaperTrading", "isDefault", "isActive",
      "isMasterSource", "initialEquity", "lastConnectedAt", "connectedAt", "createdAt"
    FROM "BrokerAccount"
    WHERE "userId" = ${userId} AND "isActive" = true
    ORDER BY "connectedAt" DESC
  `) as Array<Record<string, any>>;

  // Optional column — may be missing until migration runs on Neon.
  let bridgeHashes: Record<string, string | null> = {};
  try {
    const hashRows = (await sql`
      SELECT id, "bridgeTokenHash" FROM "BrokerAccount"
      WHERE "userId" = ${userId} AND "isActive" = true
    `) as Array<{ id: string; bridgeTokenHash: string | null }>;
    bridgeHashes = Object.fromEntries(
      hashRows.map((r) => [r.id, r.bridgeTokenHash]),
    );
  } catch {
    bridgeHashes = {};
  }

  const accounts = rows.map((account) => {
    let creds: Record<string, any> = {};
    if (aesKey && account.credentialsEncrypted) {
      try {
        creds = JSON.parse(
          decryptAesGcm(String(account.credentialsEncrypted), aesKey),
        );
      } catch {
        creds = {};
      }
    }

    const { credentialsEncrypted: _, ...safe } = account;
    if (account.isPaperTrading) {
      return {
        ...safe,
        balance: account.initialEquity ?? 100000,
        equity: account.initialEquity ?? 100000,
        currency: 'USD',
        connectionStatus: 'CONNECTED',
        fillMode: 'paper',
        storeOnly: false,
      };
    }

    const metaApiId = creds.metaApiAccountId as string | undefined;
    const storeOnly =
      !metaApiId ||
      String(metaApiId).startsWith('mock-') ||
      creds.executionMode === 'master_only' ||
      Boolean(bridgeHashes[account.id]);

    return {
      ...safe,
      balance: account.initialEquity ?? null,
      equity: account.initialEquity ?? null,
      currency: 'USD',
      leverage: null,
      connectionStatus: 'CONNECTED',
      fillMode: storeOnly ? 'bridge' : 'metaapi',
      storeOnly,
      login: creds.login ?? null,
      platform: creds.platform ?? 'mt5',
      serverName: account.serverName ?? creds.serverName ?? null,
      balanceNote: storeOnly
        ? 'Live broker balance appears after ProfytronCopyBridge EA reports it (no MetaApi seat).'
        : null,
    };
  });

  return json(accounts);
}
