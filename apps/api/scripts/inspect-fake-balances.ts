import { PrismaClient } from '@prisma/client';
import { CryptoService } from '../src/common/crypto.service';

const prisma = new PrismaClient();
const cryptoService = new CryptoService();

/** Read-only report: broker accounts showing balance/equity data despite having
 * no genuine MetaApi link, bridge connection, or intentional master_only mode.
 * Paper/demo accounts are excluded — their simulated balance is by design. */
async function main() {
  const accounts = await prisma.brokerAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      brokerName: true,
      accountNumberLast4: true,
      isPaperTrading: true,
      bridgeTokenHash: true,
      initialEquity: true,
      lastKnownEquity: true,
      lastKnownBalance: true,
      credentialsEncrypted: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });

  const rows: Record<string, unknown>[] = [];

  for (const a of accounts) {
    if (a.isPaperTrading) continue;

    let metaApiId: string | undefined;
    let executionMode: string | undefined;
    let decryptFailed = false;
    try {
      const creds = JSON.parse(cryptoService.decrypt(a.credentialsEncrypted));
      metaApiId = creds.metaApiAccountId;
      executionMode = creds.executionMode;
    } catch {
      decryptFailed = true;
    }

    const hasBridge = Boolean(a.bridgeTokenHash);
    const isMasterOnly = executionMode === 'master_only';
    const hasRealMetaApiId = Boolean(metaApiId) && !metaApiId!.startsWith('mock-');
    const genuinelyLinked = hasRealMetaApiId || hasBridge || isMasterOnly;

    const hasStaleData =
      a.initialEquity != null || a.lastKnownEquity != null || a.lastKnownBalance != null;

    if (!genuinelyLinked && hasStaleData) {
      rows.push({
        accountId: a.id,
        userEmail: a.user.email,
        broker: a.brokerName,
        last4: a.accountNumberLast4,
        metaApiId: metaApiId ?? null,
        executionMode: executionMode ?? null,
        decryptFailed,
        initialEquity: a.initialEquity,
        lastKnownEquity: a.lastKnownEquity,
        lastKnownBalance: a.lastKnownBalance,
        createdAt: a.createdAt.toISOString(),
      });
    }
  }

  console.log(
    `Scanned ${accounts.length} active broker account(s) (paper accounts excluded).`,
  );
  console.log(
    `Found ${rows.length} account(s) with balance/equity data but no genuine MetaApi/bridge/master link:\n`,
  );
  console.table(rows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
