const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}

function encrypt(plaintext) {
  const key = Buffer.from(process.env.AES_MASTER_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return JSON.stringify({ iv: iv.toString('hex'), encrypted, authTag: cipher.getAuthTag().toString('hex') });
}

(async () => {
  const prisma = new PrismaClient();
  const brokerId = '1b043a9a-36c2-4f55-9720-f8d6cbeb529c';
  const creds = {
    login: '961338',
    password: process.env.ADMIN_MT5_PASSWORD,
    serverName: 'BitrageCapitalMarkets-Server',
    platform: 'mt5',
    metaApiAccountId: '789f8612-bded-470e-a5a1-6626c3c48f04',
    metaApiRegion: 'london',
    copyFactoryRoles: ['PROVIDER'],
  };
  await prisma.brokerAccount.update({
    where: { id: brokerId },
    data: { credentialsEncrypted: encrypt(JSON.stringify(creds)), isMasterSource: true, isActive: true },
  });
  console.log(JSON.stringify({ ok: true, brokerId, login: creds.login, metaApiAccountId: creds.metaApiAccountId, passwordUpdated: true }));
  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
