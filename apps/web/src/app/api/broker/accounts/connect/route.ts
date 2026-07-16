import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql as pgSql } from '@/lib/server/pg-sql';

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

/**
 * One real MT5 login ↔ one Profytron user. Teammate "sharing" is a separate
 * Business+ invite flow — not dual ownership of the same credentials.
 */
async function assertMt5NotLinkedToAnotherUser(
  sql: ReturnType<typeof pgSql>,
  userId: string,
  login: string,
  serverName: string,
  last4: string,
  aesKey: string,
) {
  const candidates = await sql`
    SELECT "credentialsEncrypted" FROM "BrokerAccount"
    WHERE "userId" <> ${userId}
      AND "accountNumberLast4" = ${last4}
      AND "serverName" = ${serverName}
      AND "isActive" = true
      AND "isPaperTrading" = false
  `;

  for (const candidate of candidates) {
    try {
      const creds = JSON.parse(
        decryptAesGcm(candidate.credentialsEncrypted as string, aesKey),
      );
      if (String(creds.login ?? '').trim() === login.trim()) {
        throw new Error(
          'This MT5 account is already connected to another Profytron account. Each MT5 account can only be linked to one Profytron account at a time. Use Business+ sharing to invite teammates to view your account.',
        );
      }
    } catch (e: any) {
      if (
        typeof e?.message === 'string' &&
        e.message.includes('already connected to another Profytron account')
      ) {
        throw e;
      }
      // Undecryptable row — ignore.
    }
  }
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
    return error('Broker connection service is unavailable. Please try again later.', 503);
  }
  if (!dbUrl || !aesKey) {
    return error('Account security setup is incomplete. Please try again later.', 503);
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

  const sql = pgSql(dbUrl);
  const last4 = login.slice(-4).padStart(4, '0');
  const resolvedBrokerName = platform === 'mt4' ? 'MT4' : 'MT5';

  try {
    // One MT5 login cannot be owned by two Profytron users.
    await assertMt5NotLinkedToAnotherUser(
      sql,
      userId,
      login,
      serverName,
      last4,
      aesKey,
    );

    // Quota: FREE plan allows 5 (match API pricing.constants)
    const existing = await sql`
      SELECT id, "initialEquity" FROM "BrokerAccount"
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

      // MetaAPI reuses one cloud seat for the same login+server. If another
      // Profytron user already stored that seat id, refuse to link it again.
      const seatHolders = await sql`
        SELECT "credentialsEncrypted" FROM "BrokerAccount"
        WHERE "userId" <> ${userId}
          AND "isActive" = true
          AND "isPaperTrading" = false
      `;
      for (const row of seatHolders) {
        try {
          const creds = JSON.parse(
            decryptAesGcm(row.credentialsEncrypted as string, aesKey),
          );
          if (String(creds.metaApiAccountId ?? '') === String(accountId)) {
            return error(
              'This MT5 account is already connected to another Profytron account. Each MT5 account can only be linked to one Profytron account at a time. Use Business+ sharing to invite teammates to view your account.',
              400,
            );
          }
        } catch {
          /* undecryptable — ignore */
        }
      }

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
      const existingBaseline = Number(existing[0].initialEquity ?? 0);
      const keepBaseline =
        Number.isFinite(existingBaseline) && existingBaseline > 0;
      const liveVal = equity || balance || null;
      const updated = keepBaseline
        ? await sql`
        UPDATE "BrokerAccount"
        SET "credentialsEncrypted" = ${credentialsEncrypted},
            "lastKnownEquity" = ${liveVal},
            "lastKnownBalance" = ${balance || equity || null},
            "lastConnectedAt" = ${now}::timestamp
        WHERE id = ${existing[0].id}
        RETURNING id, "brokerName", "accountNumberLast4", "serverName",
                  "isPaperTrading", "isDefault", "isActive", "connectedAt",
                  "initialEquity"
      `
        : await sql`
        UPDATE "BrokerAccount"
        SET "credentialsEncrypted" = ${credentialsEncrypted},
            "initialEquity" = ${liveVal},
            "lastKnownEquity" = ${liveVal},
            "lastKnownBalance" = ${balance || equity || null},
            "lastConnectedAt" = ${now}::timestamp
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
          "isDefault", "isActive", "connectedAt", "createdAt",
          "lastConnectedAt", "initialEquity", "lastKnownEquity", "lastKnownBalance"
        ) VALUES (
          ${id}, ${userId}, ${resolvedBrokerName}::"BrokerName", ${last4},
          ${credentialsEncrypted}, ${serverName}, false,
          ${isDefault}, true, ${now}::timestamp, ${now}::timestamp,
          ${now}::timestamp, ${equity || balance || null},
          ${equity || balance || null}, ${balance || equity || null}
        )
        RETURNING id, "brokerName", "accountNumberLast4", "serverName",
                  "isPaperTrading", "isDefault", "isActive", "connectedAt",
                  "initialEquity"
      `;
      accountRow = created[0];
    }

    // Link ALL orphan bot subscriptions (not only copy bots) to this MT5 account.
    try {
      await sql`
        UPDATE "UserStrategySubscription"
        SET "brokerAccountId" = ${accountRow.id as string}
        WHERE "userId" = ${userId}
          AND "brokerAccountId" IS NULL
          AND status IN ('ACTIVE', 'PROVISIONING', 'PAUSED')
      `;
    } catch (orphanErr: any) {
      console.warn(
        '[broker/connect] orphan bot link:',
        orphanErr?.message || orphanErr,
      );
    }

    // Checklist + auto-link any pending copy subscriptions for this user.
    let copyLink: unknown = null;
    try {
      const { trackActivation, linkUserCopySubscriptions } = await import(
        '@/lib/server/copy-link'
      );
      await trackActivation(sql as any, userId, 'BROKER_CONNECTED', {
        brokerAccountId: accountRow.id,
        metaApiAccountId: accountId,
      });
      copyLink = await linkUserCopySubscriptions({
        sql: sql as any,
        userId,
        metaToken,
        aesKey,
        // link all pending/active copy bots now that MT5 is live
      });
    } catch (linkErr: any) {
      console.warn('[broker/connect] copy link:', linkErr?.message || linkErr);
    }

    return json({
      ...accountRow,
      pending,
      masterOnly: false,
      executionPath: 'metaapi_rpc',
      copyLink,
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
    console.error('[broker/connect]', msg);
    return error(msg, 400);
  }
}
