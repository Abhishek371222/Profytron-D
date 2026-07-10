const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(__dirname, '../../../render.env'), 'utf8');
const db = env.split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL=')).slice(13);
const sql = neon(db);
sql`
  UPDATE "BrokerAccount"
  SET "initialEquity" = 122.53
  WHERE id = 'fdd3f450-1d1e-4e0c-a03a-59c271105731'
  RETURNING id, "initialEquity"
`.then((r) => console.log(JSON.stringify(r))).catch((e) => {
  console.error(e);
  process.exit(1);
});
