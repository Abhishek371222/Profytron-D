const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const env = fs.readFileSync('d:/Profytron-D-main/Profytron-D-main/render.env', 'utf8');
const db = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
if (!db) throw new Error('no DATABASE_URL');
const sql = neon(db);
(async () => {
  const strategies = await sql`
    SELECT id, name, "copyFactoryStrategyId", "isPublished", "masterBrokerAccountId"
    FROM "Strategy"
    ORDER BY "createdAt" DESC
    LIMIT 20
  `;
  console.log('STRATEGIES', JSON.stringify(strategies, null, 2));
  const events = await sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'UserActivationEvent'
  `;
  console.log('ACTIVATION COLS', events.map((c) => c.column_name).join(','));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
