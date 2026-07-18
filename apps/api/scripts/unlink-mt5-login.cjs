const { PrismaClient } = require('@prisma/client');
const { createDecipheriv } = require('crypto');
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
const targetLogin = process.argv[2] || '961334';
const last4 = targetLogin.slice(-4).padStart(4, '0');

function decryptNest(storedData, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const parsed = JSON.parse(storedData);
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function main() {
  const aesKey = process.env.AES_MASTER_KEY;
  if (!aesKey) throw new Error('AES_MASTER_KEY missing');

  const candidates = await prisma.brokerAccount.findMany({
    where: { accountNumberLast4: last4, isPaperTrading: false },
    select: {
      id: true,
      userId: true,
      isActive: true,
      serverName: true,
      credentialsEncrypted: true,
      user: { select: { email: true } },
    },
  });

  const matchIds = [];
  for (const row of candidates) {
    try {
      const creds = JSON.parse(decryptNest(row.credentialsEncrypted, aesKey));
      if (String(creds.login ?? '').trim() === targetLogin) {
        matchIds.push(row.id);
        console.log(
          `MATCH ${row.id} email=${row.user?.email} active=${row.isActive} server=${row.serverName}`,
        );
      }
    } catch (e) {
      console.log(`skip ${row.id}: ${e.message}`);
    }
  }

  if (matchIds.length === 0) {
    console.log('No matching BrokerAccount rows found.');
    return;
  }

  await prisma.$transaction([
    prisma.userStrategySubscription.updateMany({
      where: { brokerAccountId: { in: matchIds } },
      data: { brokerAccountId: null },
    }),
    prisma.brokerAccount.updateMany({
      where: { id: { in: matchIds } },
      data: { isActive: false },
    }),
  ]);

  const stillActive = await prisma.brokerAccount.count({
    where: { id: { in: matchIds }, isActive: true },
  });

  console.log(
    `Deactivated ${matchIds.length} BrokerAccount row(s). Still active: ${stillActive}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
