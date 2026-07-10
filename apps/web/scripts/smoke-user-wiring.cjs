const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Inline minimal copy of link helpers for smoke test (uses same MetaApi calls)
const { createDecipheriv, createCipheriv, randomBytes, randomUUID } = require('crypto');

const env = fs.readFileSync(path.join(__dirname, '../../../render.env'), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^"|"$/g, '') : '';
};

const PROVISIONING =
  'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CF_API = 'https://copyfactory-api-v1.new-york.agiliumtrade.ai';

function headers(token) {
  return {
    'auth-token': token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function main() {
  const sql = neon(get('DATABASE_URL'));
  const token = get('METAAPI_TOKEN');
  const users = await sql`
    SELECT id, email FROM "User" WHERE email ILIKE ${'%abhishekaj371%'} LIMIT 1
  `;
  console.log('user', users[0]);
  if (!users[0]) return;

  const subs = await sql`
    SELECT s.id, s.status, s."strategyId", st.name, st."copyFactoryStrategyId", st."masterBrokerAccountId"
    FROM "UserStrategySubscription" s
    JOIN "Strategy" st ON st.id = s."strategyId"
    WHERE s."userId" = ${users[0].id}
  `;
  console.log('subs', subs);

  const brokers = await sql`
    SELECT id, "accountNumberLast4", "isActive"
    FROM "BrokerAccount"
    WHERE "userId" = ${users[0].id} AND "isActive" = true
  `;
  console.log('brokers', brokers);

  // Confirm CF subscriber still linked
  const metaId = 'ac010ea8-d527-4984-bba9-d7e148ee2892';
  const res = await fetch(
    `${CF_API}/users/current/configuration/subscribers/${metaId}`,
    { headers: headers(token) },
  );
  console.log('cf status', res.status, await res.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
