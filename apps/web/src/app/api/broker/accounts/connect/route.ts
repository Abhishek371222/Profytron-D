import { createCipheriv, randomBytes, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * MetaApi G2 connect on Vercel — bypasses stuck Render deploys.
 * Does NOT request CopyFactory roles (those need a separate MetaApi wallet top-up).
 */

const PROVISIONING =
  'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

type ConnectBody = {
  brokerName?: string;
  login?: string;
  password?: string;
  serverName?: string;
  platform?: string;
  copyFactoryRole?: string;
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

function encryptAesGcm(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES_MASTER_KEY must be 64 hex chars');
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag,
  });
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

function metaHeaders(token: string) {
  return {
    'auth-token': token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function findExistingMetaAccount(
  token: string,
  login: string,
  server: string,
): Promise<any | null> {
  const res = await fetch(`${PROVISIONING}/users/current/accounts`, {
    headers: metaHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const accounts = (await res.json()) as any[];
  return (
    (accounts || []).find(
      (a) => String(a.login) === String(login) && a.server === server,
    ) ?? null
  );
}

async function deployAccount(token: string, accountId: string) {
  await fetch(`${PROVISIONING}/users/current/accounts/${accountId}/deploy`, {
    method: 'POST',
    headers: metaHeaders(token),
  });
}

async function waitDeployed(
  token: string,
  accountId: string,
  ms = 25_000,
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const res = await fetch(
      `${PROVISIONING}/users/current/accounts/${accountId}`,
      { headers: metaHeaders(token), cache: 'no-store' },
    );
    if (res.ok) {
      const account = await res.json();
      if (
        account.state === 'DEPLOYED' &&
        (account.connectionStatus === 'CONNECTED' ||
          account.connectionStatus === 'DISCONNECTED')
      ) {
        return account;
      }
      if (account.state !== 'DEPLOYED') {
        await deployAccount(token, accountId);
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  const res = await fetch(
    `${PROVISIONING}/users/current/accounts/${accountId}`,
    { headers: metaHeaders(token), cache: 'no-store' },
  );
  return res.ok ? res.json() : null;
}

async function fetchAccountInfo(
  accountId: string,
  region: string,
  token: string,
): Promise<{ balance?: number; equity?: number; currency?: string } | null> {
  try {
    const host = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const res = await fetch(
      `${host}/users/current/accounts/${accountId}/account-information`,
      { headers: metaHeaders(token), cache: 'no-store' },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const metaToken = process.env.METAAPI_TOKEN?.trim();
  const dbUrl = process.env.DATABASE_URL?.trim();
  const aesKey = process.env.AES_MASTER_KEY?.trim();

  if (!metaToken) {
    return error('METAAPI_TOKEN is not configured on the web service', 503);
  }
  if (!dbUrl || !aesKey) {
    return error('Database encryption is not configured', 503);
  }

  let body: ConnectBody;
  try {
    body = await req.json();
  } catch {
    return error('Invalid JSON body');
  }

  if (body.copyFactoryRole === 'PROVIDER') {
    return error(
      'Master/provider connect must use the API service, not the web path.',
      400,
    );
  }

  const brokerName = (body.brokerName || 'MT5').toUpperCase();
  const login = String(body.login || '').trim();
  const password = String(body.password || '');
  const serverName = String(body.serverName || '').trim();
  const platform = body.platform === 'mt4' ? 'mt4' : 'mt5';

  if (brokerName === 'PAPER') {
    return error('Paper accounts must use the API service', 400);
  }

  if (!login || !password || !serverName) {
    return error('Login, password, and server are required');
  }

  const sql = neon(dbUrl);
  const last4 = login.slice(-4).padStart(4, '0');
  const resolvedBrokerName = platform === 'mt4' ? 'MT4' : 'MT5';

  try {
    // Quota: FREE plan allows 5 (match API pricing.constants)
    const existing = await sql`
      SELECT id FROM "BrokerAccount"
      WHERE "userId" = ${userId}
        AND "accountNumberLast4" = ${last4}
        AND "serverName" = ${serverName}
        AND "brokerName" = ${resolvedBrokerName}
        AND "isActive" = true
      LIMIT 1
    `;

    if (!existing[0]) {
      const countRows = await sql`
        SELECT COUNT(*)::int AS c FROM "BrokerAccount"
        WHERE "userId" = ${userId} AND "isActive" = true
      `;
      const activeCount = Number(countRows[0]?.c ?? 0);
      if (activeCount >= 5) {
        return error(
          'Your plan allows 5 connected account(s). Upgrade to connect more.',
        );
      }
    }

    let accountId: string;
    let region = process.env.METAAPI_REGION || 'new-york';
    let pending = true;
    let balance = 0;
    let equity = 0;
    let currency = 'USD';

    const existingMeta = await findExistingMetaAccount(
      metaToken,
      login,
      serverName,
    );
    if (existingMeta?._id || existingMeta?.id) {
      accountId = existingMeta._id || existingMeta.id;
      region = existingMeta.region || region;
      if (existingMeta.state !== 'DEPLOYED') {
        await deployAccount(metaToken, accountId);
      }
    } else {
      // Plain G2 — NO application/CopyFactory roles (avoids CF top-up error)
      const createRes = await fetch(`${PROVISIONING}/users/current/accounts`, {
        method: 'POST',
        headers: metaHeaders(metaToken),
        body: JSON.stringify({
          login,
          password,
          server: serverName,
          platform,
          type: 'cloud-g2',
          name: `${login}@${serverName}`,
          magic: 0,
          ...(process.env.METAAPI_REGION
            ? { region: process.env.METAAPI_REGION }
            : {}),
        }),
      });
      const createBody = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        const msg =
          createBody?.message ||
          createBody?.error ||
          `MetaApi provision failed (${createRes.status})`;
        return error(String(msg), createRes.status >= 400 ? createRes.status : 400);
      }
      accountId = createBody.id || createBody._id;
      if (!accountId) return error('MetaApi did not return an account id');
      await deployAccount(metaToken, accountId);
    }

    const deployed = await waitDeployed(metaToken, accountId);
    if (deployed?.region) region = deployed.region;

    const info = await fetchAccountInfo(accountId, region, metaToken);
    if (info) {
      balance = Number(info.balance ?? 0);
      equity = Number(info.equity ?? balance);
      currency = info.currency || 'USD';
      pending = false;
    }

    const credentialsEncrypted = encryptAesGcm(
      JSON.stringify({
        login,
        password,
        platform,
        serverName,
        metaApiAccountId: accountId,
        metaApiRegion: region,
        executionMode: 'metaapi_rpc',
      }),
      aesKey,
    );

    const now = new Date().toISOString();
    let accountRow: any;

    if (existing[0]?.id) {
      const updated = await sql`
        UPDATE "BrokerAccount"
        SET "credentialsEncrypted" = ${credentialsEncrypted},
            "initialEquity" = ${equity || balance || null},
            "updatedAt" = ${now}::timestamptz
        WHERE id = ${existing[0].id}
        RETURNING id, "brokerName", "accountNumberLast4", "serverName",
                  "isPaperTrading", "isDefault", "isActive", "connectedAt",
                  "initialEquity"
      `;
      accountRow = updated[0];
    } else {
      const countRows = await sql`
        SELECT COUNT(*)::int AS c FROM "BrokerAccount"
        WHERE "userId" = ${userId} AND "isActive" = true
      `;
      const isDefault = Number(countRows[0]?.c ?? 0) === 0;
      const id = randomUUID();
      const created = await sql`
        INSERT INTO "BrokerAccount" (
          id, "userId", "brokerName", "accountNumberLast4",
          "credentialsEncrypted", "serverName", "isPaperTrading",
          "isDefault", "isActive", "connectedAt", "updatedAt", "initialEquity"
        ) VALUES (
          ${id}, ${userId}, ${resolvedBrokerName}, ${last4},
          ${credentialsEncrypted}, ${serverName}, false,
          ${isDefault}, true, ${now}::timestamptz, ${now}::timestamptz,
          ${equity || balance || null}
        )
        RETURNING id, "brokerName", "accountNumberLast4", "serverName",
                  "isPaperTrading", "isDefault", "isActive", "connectedAt",
                  "initialEquity"
      `;
      accountRow = created[0];
    }

    return json({
      ...accountRow,
      pending,
      masterOnly: false,
      executionPath: 'metaapi_rpc',
      accountInfo: {
        balance,
        equity,
        currency,
        broker: 'MT5',
        accountType: pending ? 'PENDING' : 'LIVE',
      },
    });
  } catch (e: any) {
    const msg = e?.message || 'Broker connection failed';
    // Column missing fallback without bridgeTokenHash
    if (/bridgeTokenHash|column/i.test(msg)) {
      return error(
        'Database schema needs update. Contact support or retry shortly.',
        503,
      );
    }
    return error(msg, 400);
  }
}
