const { PrismaClient } = require('@prisma/client');

async function main() {
  const email = process.argv[2] || 'abhiaj371@gmail.com';
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) {
      console.error('User not found:', email);
      process.exit(1);
    }

    const active = await prisma.brokerAccount.findMany({
      where: { userId: user.id, isActive: true },
      select: {
        id: true,
        brokerName: true,
        accountNumberLast4: true,
        serverName: true,
      },
    });
    console.log(
      `User ${user.fullName} <${user.email}> has ${active.length} active broker(s)`,
    );
    for (const a of active) {
      console.log(
        ` - ${a.id} ${a.brokerName} ***${a.accountNumberLast4} @ ${a.serverName}`,
      );
    }

    if (active.length === 0) {
      console.log('Nothing to disconnect.');
      return;
    }

    const ids = active.map((a) => a.id);
    await prisma.$transaction([
      prisma.brokerAccount.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
      }),
      prisma.userStrategySubscription.updateMany({
        where: { brokerAccountId: { in: ids } },
        data: { brokerAccountId: null },
      }),
    ]);

    const remaining = await prisma.brokerAccount.count({
      where: { userId: user.id, isActive: true },
    });
    console.log(`Disconnected ${ids.length}. Active remaining: ${remaining}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
