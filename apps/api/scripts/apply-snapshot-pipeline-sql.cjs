const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

const prisma = new PrismaClient();
const sqlPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260718123000_full_metaapi_snapshot_pipeline',
  'migration.sql',
);

async function main() {
  const raw = fs.readFileSync(sqlPath, 'utf8');
  // Split on semicolons but keep DO $$ blocks intact
  const statements = [];
  let buf = '';
  let inDo = false;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;
    if (trimmed.startsWith('DO $$')) inDo = true;
    buf += line + '\n';
    if (inDo) {
      if (trimmed.endsWith('$$;') || trimmed === 'END $$;') {
        statements.push(buf.trim());
        buf = '';
        inDo = false;
      }
      continue;
    }
    if (trimmed.endsWith(';')) {
      statements.push(buf.trim());
      buf = '';
    }
  }
  if (buf.trim()) statements.push(buf.trim());

  let ok = 0;
  let skip = 0;
  for (const stmt of statements) {
    if (!stmt || stmt === ';') continue;
    try {
      await prisma.$executeRawUnsafe(stmt);
      ok += 1;
    } catch (e) {
      skip += 1;
      const msg = String(e.message || e);
      if (
        !msg.includes('already exists') &&
        !msg.includes('duplicate') &&
        !/relation .* already exists/i.test(msg)
      ) {
        console.warn('stmt warn:', msg.slice(0, 160));
      }
    }
  }

  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'AccountSnapshot%'
    ORDER BY table_name
  `);
  console.log(JSON.stringify({ ok, skip, tables }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
