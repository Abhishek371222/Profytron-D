const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}
(async () => {
  const prisma = new PrismaClient();
  const id = 'a2c1922d-6ba8-4eb3-9110-3bfb924067b4';
  const updated = await prisma.brokerAccount.update({
    where: { id },
    data: { isActive: false },
  });
  await prisma.userStrategySubscription.updateMany({
    where: { brokerAccountId: id },
    data: { brokerAccountId: null },
  });
  console.log(JSON.stringify({ ok: true, id: updated.id, isActive: updated.isActive, brokerName: updated.brokerName }));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
