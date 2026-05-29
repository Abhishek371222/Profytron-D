const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const apiDir = path.join(__dirname, '..', 'apps', 'api');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const { PrismaClient } = apiRequire('@prisma/client');
process.chdir(apiDir);

async function main() {
  const sql = fs.readFileSync(
    path.join(apiDir, 'prisma/create-core-trading.sql'),
    'utf8',
  );
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`);

  const prisma = new PrismaClient();
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
    console.log('OK:', statement.slice(0, 60));
  }
  await prisma.$disconnect();
}

main().catch(console.error);
