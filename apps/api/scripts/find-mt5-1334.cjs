const { PrismaClient } = require('@prisma/client');
const { createDecipheriv } = require('crypto');
const fs = require('fs');
const path = require('path');

// Load .env without dotenv package
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
  const last4 = process.argv[2] || '1334';
  const aesKey = process.env.AES_MASTER_KEY;

  const rows = await prisma.brokerAccount.findMany({
    where: {
      accountNumberLast4: last4,
    },
    select: {
      id: true,
      userId: true,
      isActive: true,
      isPaperTrading: true,
      accountNumberLast4: true,
      serverName: true,
      brokerName: true,
      connectedAt: true,
      createdAt: true,
      credentialsEncrypted: true,
      user: { select: { email: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${rows.length} row(s) for last4=${last4}`);
  for (const r of rows) {
    let login = '?';
    let metaApiAccountId = null;
    if (aesKey && r.credentialsEncrypted) {
      try {
        const creds = JSON.parse(decryptNest(r.credentialsEncrypted, aesKey));
        login = String(creds.login ?? '?');
        metaApiAccountId = creds.metaApiAccountId || null;
      } catch (e) {
        login = `decrypt_fail:${e.message}`;
      }
    }
    console.log(
      JSON.stringify(
        {
          id: r.id,
          email: r.user?.email,
          fullName: r.user?.fullName,
          isActive: r.isActive,
          isPaperTrading: r.isPaperTrading,
          last4: r.accountNumberLast4,
          serverName: r.serverName,
          brokerName: r.brokerName,
          login,
          metaApiAccountId,
          connectedAt: r.connectedAt,
          createdAt: r.createdAt,
        },
        null,
        2,
      ),
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
