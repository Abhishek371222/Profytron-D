const fs = require('fs');
const path = require('path');
const { PrismaClient, UserRole, SubscriptionTier, KycStatus, StrategyCategory, RiskLevel } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { randomUUID } = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}

const META_ID = '789f8612-bded-470e-a5a1-6626c3c48f04';
const LOGIN = '961338';
const SERVER = 'BitrageCapitalMarkets-Server';
const REGION = 'london';
const STRATEGY_NAME = process.env.MASTER_COPY_STRATEGY_NAME || 'Profytron Master Bot';

function encrypt(plaintext) {
  const key = Buffer.from(process.env.AES_MASTER_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({ iv: iv.toString('hex'), encrypted, authTag });
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@profytron.com';
    let admin = await prisma.user.findFirst({ where: { email }, select: { id: true, email: true, role: true } });
    if (!admin) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Demo@123', 12);
      admin = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: 'Profytron Admin',
          username: 'profytron_admin',
          emailVerified: true,
          isActive: true,
          referralCode: randomUUID(),
          role: UserRole.ADMIN,
          subscriptionTier: SubscriptionTier.ELITE,
          kycStatus: KycStatus.VERIFIED,
        },
        select: { id: true, email: true, role: true },
      });
      console.log('Created admin', email);
    } else if (admin.role !== 'ADMIN') {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { role: UserRole.ADMIN },
        select: { id: true, email: true, role: true },
      });
    }

    const creds = {
      login: LOGIN,
      password: process.env.ADMIN_MT5_PASSWORD || '',
      serverName: SERVER,
      platform: 'mt5',
      metaApiAccountId: META_ID,
      metaApiRegion: REGION,
      copyFactoryRoles: ['PROVIDER'],
    };
    const credentialsEncrypted = encrypt(JSON.stringify(creds));
    const last4 = LOGIN.slice(-4);

    let broker = await prisma.brokerAccount.findFirst({
      where: { userId: admin.id, accountNumberLast4: last4, serverName: SERVER },
    });
    if (!broker) {
      broker = await prisma.brokerAccount.findFirst({
        where: { userId: admin.id, isMasterSource: true },
      });
    }

    if (!broker) {
      broker = await prisma.brokerAccount.create({
        data: {
          userId: admin.id,
          brokerName: 'MT5',
          accountNumberLast4: last4,
          serverName: SERVER,
          credentialsEncrypted,
          isPaperTrading: false,
          isActive: true,
          isDefault: true,
          isMasterSource: true,
        },
      });
      console.log('Created BrokerAccount', broker.id);
    } else {
      broker = await prisma.brokerAccount.update({
        where: { id: broker.id },
        data: {
          credentialsEncrypted,
          serverName: SERVER,
          accountNumberLast4: last4,
          brokerName: 'MT5',
          isPaperTrading: false,
          isActive: true,
          isDefault: true,
          isMasterSource: true,
        },
      });
      console.log('Updated BrokerAccount', broker.id);
    }

    await prisma.brokerAccount.updateMany({
      where: { userId: admin.id, id: { not: broker.id }, isMasterSource: true },
      data: { isMasterSource: false },
    });

    const monthlyPrice = Number(process.env.MASTER_COPY_MONTHLY_PRICE || 49);
    const annualPrice = Number(process.env.MASTER_COPY_ANNUAL_PRICE || 399);

    let strategy = await prisma.strategy.findFirst({
      where: { creatorId: admin.id, name: STRATEGY_NAME, deletedAt: null },
      include: { listing: true },
    });

    if (!strategy) {
      strategy = await prisma.strategy.create({
        data: {
          creatorId: admin.id,
          name: STRATEGY_NAME,
          description:
            'Automated trading bot powered by the Profytron operator MT5 account. Buy access, connect your broker, and live bot execution starts after payment.',
          category: StrategyCategory.TREND,
          riskLevel: RiskLevel.MEDIUM,
          configJson: {
            type: 'master_copy',
            masterBrokerAccountId: broker.id,
            copyMode: 'position_sync',
          },
          monthlyPrice,
          annualPrice,
          lifetimePrice: 0,
          maxCopies: 500,
          isFeatured: true,
          isPublished: true,
          isVerified: true,
          masterBrokerAccountId: broker.id,
        },
        include: { listing: true },
      });
      console.log('Created Strategy', strategy.id);
    } else {
      strategy = await prisma.strategy.update({
        where: { id: strategy.id },
        data: {
          masterBrokerAccountId: broker.id,
          isPublished: true,
          isVerified: true,
          isFeatured: true,
        },
        include: { listing: true },
      });
      console.log('Updated Strategy', strategy.id);
    }

    if (!strategy.listing) {
      const listingData = {
        strategyId: strategy.id,
        monthlyPrice,
        annualPrice,
        lifetimePrice: 0,
        trialDays: 0,
        isActive: true,
      };
      try {
        await prisma.marketplaceListing.create({ data: listingData });
      } catch (e) {
        console.log('Listing create attempt fields error, retrying with title...', e.message);
        await prisma.marketplaceListing.create({
          data: {
            ...listingData,
            title: STRATEGY_NAME,
            description: 'Operator-run master bot — live copy after purchase.',
          },
        });
      }
      console.log('Created marketplace listing');
    }

    console.log(JSON.stringify({
      ok: true,
      adminEmail: admin.email,
      brokerAccountId: broker.id,
      strategyId: strategy.id,
      metaApiAccountId: META_ID,
      login: LOGIN,
      server: SERVER,
      region: REGION,
      note: 'Master linked. No subscriber MetaApi accounts created.',
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});
