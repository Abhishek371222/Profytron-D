const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '../../../render.env');
const env = fs.readFileSync(envPath, 'utf8');
const get = (k) =>
  env
    .split(/\r?\n/)
    .find((l) => l.startsWith(k + '='))
    ?.slice(k.length + 1);

const dbUrl = get('DATABASE_URL');
const aesKey = get('AES_MASTER_KEY');
const META_ID = 'ac010ea8-d527-4984-bba9-d7e148ee2892';
const REGION = 'london';

function decrypt(payload, keyHex) {
  const parsed = JSON.parse(payload);
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let out = decipher.update(parsed.encrypted, 'hex', 'utf8');
  out += decipher.final('utf8');
  return out;
}

function encrypt(plaintext, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag,
  });
}

const sql = neon(dbUrl);

(async () => {
  const rows = await sql`
    SELECT id, "credentialsEncrypted", "initialEquity"
    FROM "BrokerAccount"
    WHERE "accountNumberLast4" = '1334'
      AND "isActive" = true
      AND "serverName" = 'BitrageCapitalMarkets-Server'
  `;

  if (!rows.length) {
    console.error('No active 961334 row found');
    process.exit(1);
  }

  for (const row of rows) {
    const creds = JSON.parse(decrypt(row.credentialsEncrypted, aesKey));
    const next = {
      login: creds.login || '961334',
      password: creds.password,
      platform: creds.platform || 'mt5',
      serverName: creds.serverName || 'BitrageCapitalMarkets-Server',
      metaApiAccountId: META_ID,
      metaApiRegion: REGION,
      executionMode: 'metaapi_rpc',
    };
    delete next.bridgeToken;
    const encrypted = encrypt(JSON.stringify(next), aesKey);
    await sql`
      UPDATE "BrokerAccount"
      SET "credentialsEncrypted" = ${encrypted}
      WHERE id = ${row.id}
    `;
    console.log(
      JSON.stringify({
        updatedId: row.id,
        login: next.login,
        metaApiAccountId: META_ID,
        region: REGION,
      }),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
