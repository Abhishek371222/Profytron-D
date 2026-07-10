import { createHash, createCipheriv, randomBytes, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Store-only MT5 connect — runs on Vercel so www never depends on Render's
 * MetaApi/CopyFactory path for end-user account linking.
 */

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

  // Prefer validating against the live API so we don't depend on JWT secret
  // sync between Vercel and Render (that mismatch caused "Unauthorized").
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
      /* fall through to local JWT verify */
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

function validateLiveInput(login: string, password: string, serverName: string) {
  if (!/^\d{3,12}$/.test(login)) {
    return 'MT5 login must be your numeric account number (3–12 digits).';
  }
  if (!password || password.length < 4) {
    return 'MT5 trading password is required.';
  }
  if (!serverName || serverName.length < 3) {
    return 'MT5 server name is required.';
  }
  if (/bitage/i.test(serverName) && !/bitrage/i.test(serverName)) {
    return 'Server looks mistyped. Did you mean BitrageCapitalMarkets-Server?';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const databaseUrl = process.env.DATABASE_URL;
  const aesKey = process.env.AES_MASTER_KEY;
  if (!databaseUrl || !aesKey) {
    return error(
      'Store-only connect is not configured (missing DATABASE_URL / AES_MASTER_KEY).',
      503,
    );
  }

  const userId = await userIdFromRequest(req);
  if (!userId) {
    return error('Session expired. Please refresh the page and log in again.', 401);
  }

  let body: ConnectBody;
  try {
    body = (await req.json()) as ConnectBody;
  } catch {
    return error('Invalid JSON body');
  }

  // Never allow PROVIDER/master MetaApi provisioning from this edge path.
  if (body.copyFactoryRole === 'PROVIDER') {
    return error(
      'Master/provider connect must use the API service, not the store-only path.',
      400,
    );
  }

  const isPaper = (body.brokerName || '').toUpperCase() === 'PAPER';
  const login = String(body.login || '').trim();
  const password = String(body.password || '');
  const serverName = String(body.serverName || '').trim();
  const platform = body.platform === 'mt4' ? 'mt4' : 'mt5';

  if (!isPaper) {
    const invalid = validateLiveInput(login, password, serverName);
    if (invalid) return error(invalid);
  }

  const sql = neon(databaseUrl);
  const maxBrokerAccounts = 5;

  const activeRows = (await sql`
    SELECT id FROM "BrokerAccount"
    WHERE "userId" = ${userId} AND "isActive" = true
  `) as Array<{ id: string }>;

  const last4 = isPaper
    ? 'APER'
    : login.slice(-4).padStart(4, '0');
  const resolvedBrokerName = isPaper ? 'PAPER' : platform === 'mt4' ? 'MT4' : 'MT5';
  const resolvedServer = isPaper ? 'PAPER' : serverName;

  const existing = (await sql`
    SELECT id, "initialEquity" FROM "BrokerAccount"
    WHERE "userId" = ${userId}
      AND "accountNumberLast4" = ${last4}
      AND "serverName" = ${resolvedServer}
      AND "brokerName" = ${resolvedBrokerName}::"BrokerName"
      AND "isActive" = true
    LIMIT 1
  `) as Array<{ id: string; initialEquity: number | null }>;

  if (!existing[0] && activeRows.length >= maxBrokerAccounts) {
    return error(
      `Your plan allows ${maxBrokerAccounts} connected account(s). Upgrade to connect more.`,
    );
  }

  const bridgeToken = isPaper ? null : randomBytes(32).toString('hex');
  const bridgeTokenHash = bridgeToken
    ? createHash('sha256').update(bridgeToken).digest('hex')
    : null;

  const credsPayload = isPaper
    ? { login: 'PAPER', password: 'paper', platform: 'mt5', serverName: 'PAPER' }
    : {
        login,
        password,
        platform,
        serverName: resolvedServer,
        executionMode: 'master_only',
        metaApiAccountId: null,
        bridgeToken,
      };

  const credentialsEncrypted = encryptAesGcm(
    JSON.stringify(credsPayload),
    aesKey,
  );
  const isDefault = activeRows.length === 0;
  const accountId = existing[0]?.id ?? randomUUID();

  if (existing[0]) {
    try {
      await sql`
        UPDATE "BrokerAccount"
        SET
          "credentialsEncrypted" = ${credentialsEncrypted},
          "bridgeTokenHash" = ${bridgeTokenHash}
        WHERE id = ${existing[0].id}
      `;
    } catch {
      await sql`
        UPDATE "BrokerAccount"
        SET "credentialsEncrypted" = ${credentialsEncrypted}
        WHERE id = ${existing[0].id}
      `;
    }
  } else {
    try {
      await sql`
        INSERT INTO "BrokerAccount" (
          id, "userId", "brokerName", "accountNumberLast4", "credentialsEncrypted",
          "bridgeTokenHash", "serverName", "isPaperTrading", "isDefault", "isActive",
          "isMasterSource", "connectedAt", "createdAt"
        ) VALUES (
          ${accountId},
          ${userId},
          ${resolvedBrokerName}::"BrokerName",
          ${last4},
          ${credentialsEncrypted},
          ${bridgeTokenHash},
          ${resolvedServer},
          ${isPaper},
          ${isDefault},
          true,
          false,
          NOW(),
          NOW()
        )
      `;
    } catch {
      await sql`
        INSERT INTO "BrokerAccount" (
          id, "userId", "brokerName", "accountNumberLast4", "credentialsEncrypted",
          "serverName", "isPaperTrading", "isDefault", "isActive",
          "isMasterSource", "connectedAt", "createdAt"
        ) VALUES (
          ${accountId},
          ${userId},
          ${resolvedBrokerName}::"BrokerName",
          ${last4},
          ${credentialsEncrypted},
          ${resolvedServer},
          ${isPaper},
          ${isDefault},
          true,
          false,
          NOW(),
          NOW()
        )
      `;
    }
  }

  const id = existing[0]?.id ?? accountId;

  return json({
    id,
    userId,
    brokerName: resolvedBrokerName,
    accountNumberLast4: last4,
    serverName: resolvedServer,
    isPaperTrading: isPaper,
    isActive: true,
    isDefault,
    pending: false,
    masterOnly: !isPaper,
    executionPath: 'store_only',
    ...(bridgeToken ? { bridgeToken } : {}),
    accountInfo: {
      balance: isPaper ? 100000 : 0,
      equity: isPaper ? 100000 : 0,
      currency: 'USD',
    },
  });
}
