const path = require('path');
const { createRequire } = require('module');
const apiDir = path.join(__dirname, '..', 'apps', 'api');
const apiRequire = createRequire(path.join(apiDir, 'package.json'));
const { PrismaClient } = apiRequire('@prisma/client');
process.chdir(apiDir);

async function main() {
  const prisma = new PrismaClient();
  const tables = [
    'UserStrategySubscription',
    'Strategy',
    'BrokerAccount',
    'LeaderboardEntry',
    'AiRiskPolicy',
  ];
  for (const table of tables) {
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      console.log(`${table}: OK`);
    } catch (e) {
      console.log(`${table}: MISSING`);
    }
  }
  await prisma.$disconnect();
}

main();
