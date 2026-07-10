const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}

(async () => {
  const prisma = new PrismaClient();
  const accounts = await prisma.brokerAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      brokerName: true,
      accountNumberLast4: true,
      isPaperTrading: true,
      isActive: true,
    },
    orderBy: { connectedAt: 'desc' },
    take: 20,
  });
  console.log('ACTIVE accounts:', JSON.stringify(accounts, null, 2));
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
