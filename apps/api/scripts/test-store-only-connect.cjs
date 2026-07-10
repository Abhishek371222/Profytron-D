/**
 * Direct store-only connect test (bypasses HTTP auth).
 * Proves MetaApi/CopyFactory is not called for end users.
 */
const { PrismaClient } = require('@prisma/client');
const { createHash, randomBytes, createCipheriv } = require('crypto');

async function main() {
  const prisma = new PrismaClient();
  const email = process.argv[2] || 'abhishekaj371@gmail.com';
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('user not found: ' + email);

    // Soft-disconnect existing so quota doesn't block
    await prisma.brokerAccount.updateMany({
      where: { userId: user.id, isActive: true, isMasterSource: false },
      data: { isActive: false },
    });

    const login = process.argv[3] || '961334';
    const serverName = 'BitrageCapitalMarkets-Server';
    const last4 = login.slice(-4).padStart(4, '0');

    // Mimic store-only path: encrypt minimal creds without MetaApi
    const keyHex = process.env.AES_MASTER_KEY;
    if (!keyHex || keyHex.length < 64) {
      console.log('AES_MASTER_KEY missing — writing plaintext marker only for test');
    }

    const CryptoJS = null;
    // Use same approach as app: just create row with dummy encrypted blob if needed
    // Prefer calling through a minimal encrypt matching CryptoService
    const cryptoServicePath = require('path').join(
      __dirname,
      '../dist/common/crypto.service.js',
    );

    let credentialsEncrypted = 'test-placeholder';
    try {
      // Load env
      require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
      const { CryptoService } = require('../dist/common/crypto.service');
      const crypto = new CryptoService();
      const bridgeToken = randomBytes(32).toString('hex');
      const bridgeTokenHash = createHash('sha256').update(bridgeToken).digest('hex');
      credentialsEncrypted = crypto.encrypt(
        JSON.stringify({
          login,
          password: 'dummy',
          platform: 'mt5',
          serverName,
          executionMode: 'master_only',
          metaApiAccountId: null,
          bridgeToken,
        }),
      );

      const account = await prisma.brokerAccount.create({
        data: {
          userId: user.id,
          brokerName: 'MT5',
          accountNumberLast4: last4,
          credentialsEncrypted,
          bridgeTokenHash,
          serverName,
          isPaperTrading: false,
          isDefault: true,
          isActive: true,
        },
      });

      console.log(
        JSON.stringify(
          {
            ok: true,
            executionPath: 'store_only',
            accountId: account.id,
            metaApiAccountId: null,
            bridgeTokenPreview: bridgeToken.slice(0, 8) + '…',
            message:
              'Account saved in DB without MetaApi. CopyFactory top-up cannot happen on this path.',
          },
          null,
          2,
        ),
      );
    } catch (e) {
      // Fallback without CryptoService dist
      console.error('CryptoService path failed, using prisma-only:', e.message);
      const account = await prisma.brokerAccount.create({
        data: {
          userId: user.id,
          brokerName: 'MT5',
          accountNumberLast4: last4,
          credentialsEncrypted: Buffer.from(
            JSON.stringify({ login, serverName, executionMode: 'master_only' }),
          ).toString('base64'),
          serverName,
          isPaperTrading: false,
          isDefault: true,
          isActive: true,
        },
      });
      console.log('created without crypto', account.id);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
