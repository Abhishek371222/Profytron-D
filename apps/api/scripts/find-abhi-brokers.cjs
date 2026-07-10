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
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Abhi', mode: 'insensitive' } },
        { email: { contains: 'abhi', mode: 'insensitive' } },
        { username: { contains: 'abhi', mode: 'insensitive' } },
      ],
    },
    select: { id: true, email: true, fullName: true },
  });
  console.log('users', JSON.stringify(users, null, 2));
  for (const u of users) {
    const accounts = await prisma.brokerAccount.findMany({
      where: { userId: u.id, isActive: true },
      select: { id: true, brokerName: true, accountNumberLast4: true, isPaperTrading: true },
    });
    console.log(u.email, 'accounts', JSON.stringify(accounts));
  }
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
