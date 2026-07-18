/**
 * Mint a short-lived access token and verify wallet/broker endpoints.
 * Does not read or print password hashes.
 *
 * Usage: node scripts/verify-wallet-session.cjs [email]
 */
const fs = require('fs');
const path = require('path');
const { createHmac, randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signAccessToken(payload, secret, expiresInSec = 900) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const sig = createHmac('sha256', secret)
    .update(`${h}.${p}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${h}.${p}.${sig}`;
}

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  let val = m[2].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const EMAIL = process.argv[2] || 'abhiaj371@gmail.com';
const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const prisma = new PrismaClient();

async function probe(label, url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  console.log(
    JSON.stringify({
      label,
      status: res.status,
      ok: res.ok,
      preview:
        typeof body === 'object'
          ? {
              success: body.success,
              keys: body.data ? Object.keys(body.data) : undefined,
              total: body.data?.total,
              currency: body.data?.currency,
              accountCount: Array.isArray(body.data)
                ? body.data.length
                : body.data?.accounts?.length,
            }
          : body,
    }),
  );
  return res.ok;
}

async function main() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET missing');

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true, role: true, isSuspended: true },
  });
  if (!user) throw new Error(`User not found: ${EMAIL}`);
  if (user.isSuspended) throw new Error('User is suspended');

  const token = signAccessToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'USER',
      jti: randomUUID(),
    },
    secret,
    900,
  );

  console.log(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      api: API,
    }),
  );

  const health = await fetch(`${API}/v1/health`);
  console.log(JSON.stringify({ label: 'health', status: health.status }));

  const walletOk = await probe(
    'wallet-balance',
    `${API}/v1/wallet/balance`,
    token,
  );
  const txOk = await probe(
    'wallet-transactions',
    `${API}/v1/wallet/transactions?limit=5`,
    token,
  );
  const meOk = await probe('users-me', `${API}/v1/users/me`, token);
  const brokerOk = await probe(
    'broker-accounts',
    `${API}/v1/broker/accounts`,
    token,
  );

  const snapTables = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS n
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'AccountSnapshot%'
  `);
  console.log(JSON.stringify({ snapshotTables: snapTables?.[0]?.n ?? snapTables }));

  const allOk = walletOk && txOk && meOk && brokerOk;
  if (!allOk) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(String(e?.message || e));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
