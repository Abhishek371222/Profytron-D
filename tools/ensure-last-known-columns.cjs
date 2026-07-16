const path = require('path');
const { createRequire } = require('module');
const root = path.join(__dirname, '..');
const apiDir = path.join(root, 'apps', 'api');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const { PrismaClient } = apiRequire('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    await p.$executeRawUnsafe(
      'ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "lastKnownEquity" DOUBLE PRECISION',
    );
    await p.$executeRawUnsafe(
      'ALTER TABLE "BrokerAccount" ADD COLUMN IF NOT EXISTS "lastKnownBalance" DOUBLE PRECISION',
    );
    console.log('columns ok');
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
