const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(__dirname, '../../../render.env'), 'utf8');
const db = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice(13);
const sql = neon(db);

(async () => {
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'BrokerAccount'
    ORDER BY ordinal_position
  `;
  console.log(JSON.stringify(cols, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
