const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(__dirname, '../../../render.env'), 'utf8');
const db = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice(13);
const sql = neon(db);

(async () => {
  const users = await sql`
    SELECT id, email FROM "User"
    WHERE email IN ('abhishekaj371@gmail.com', 'abhiaj371@gmail.com', 'admin@profytron.com')
  `;
  console.log('users', users);

  for (const u of users) {
    const trades = await sql`
      SELECT id, symbol, side, status, volume, "openPrice", "closePrice", pnl,
             "openedAt", "closedAt", "brokerTicket", "executionMode"
      FROM "Trade"
      WHERE "userId" = ${u.id}
      ORDER BY "openedAt" DESC NULLS LAST
      LIMIT 8
    `;
    console.log('\ntrades for', u.email, 'count_sample', trades.length);
    console.log(JSON.stringify(trades, null, 2));

    const subs = await sql`
      SELECT id, status, "strategyId", "brokerAccountId", "createdAt"
      FROM "UserStrategySubscription"
      WHERE "userId" = ${u.id}
      ORDER BY "createdAt" DESC
      LIMIT 5
    `;
    console.log('subscriptions', JSON.stringify(subs, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
