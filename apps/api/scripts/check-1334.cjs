const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../../render.env');
const env = fs.readFileSync(envPath, 'utf8');
const dbUrl = env
  .split(/\r?\n/)
  .find((l) => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length);
if (!dbUrl) throw new Error('DATABASE_URL missing');

const sql = neon(dbUrl);

(async () => {
  const rows = await sql`
    SELECT ba.id, ba."userId", ba."brokerName", ba."accountNumberLast4", ba."serverName",
           ba."isActive", ba."isPaperTrading", ba."initialEquity",
           u.email
    FROM "BrokerAccount" ba
    JOIN "User" u ON u.id = ba."userId"
    WHERE ba."accountNumberLast4" IN ('1334', '1338')
    ORDER BY ba."connectedAt" DESC
    LIMIT 10
  `;
  console.log(JSON.stringify(rows, null, 2));

  for (const row of rows) {
    const cred = await sql`
      SELECT "credentialsEncrypted" FROM "BrokerAccount" WHERE id = ${row.id}
    `;
    const raw = cred[0]?.credentialsEncrypted || '';
    const hasMeta =
      raw.includes('metaApiAccountId') ||
      raw.includes('metaapi') ||
      raw.includes('executionMode');
    // credentials are encrypted JSON blob — just report length
    console.log(
      `account ${row.accountNumberLast4} active=${row.isActive} equity=${row.initialEquity} encLen=${raw.length}`,
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
