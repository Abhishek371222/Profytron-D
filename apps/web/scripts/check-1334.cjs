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
if (!dbUrl) throw new Error('DATABASE_URL missing');

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

const sql = neon(dbUrl);

(async () => {
  const rows = await sql`
    SELECT ba.id, ba."userId", ba."brokerName", ba."accountNumberLast4", ba."serverName",
           ba."isActive", ba."isPaperTrading", ba."initialEquity", ba."credentialsEncrypted",
           u.email
    FROM "BrokerAccount" ba
    JOIN "User" u ON u.id = ba."userId"
    WHERE ba."accountNumberLast4" IN ('1334', '1338')
    ORDER BY ba."connectedAt" DESC
    LIMIT 10
  `;

  for (const row of rows) {
    let creds = {};
    try {
      creds = JSON.parse(decrypt(row.credentialsEncrypted, aesKey));
    } catch (e) {
      creds = { decryptError: e.message };
    }
    console.log(
      JSON.stringify(
        {
          email: row.email,
          last4: row.accountNumberLast4,
          active: row.isActive,
          server: row.serverName,
          equity: row.initialEquity,
          login: creds.login,
          metaApiAccountId: creds.metaApiAccountId || null,
          executionMode: creds.executionMode || null,
          hasPassword: Boolean(creds.password),
        },
        null,
        2,
      ),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
