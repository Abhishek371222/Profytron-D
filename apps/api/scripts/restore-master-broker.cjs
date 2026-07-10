const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = '1b043a9a-36c2-4f55-9720-f8d6cbeb529c';
  try {
    const a = await prisma.brokerAccount.update({
      where: { id },
      data: { isActive: true, isMasterSource: true },
    });
    console.log('restored master', {
      id: a.id,
      isActive: a.isActive,
      isMasterSource: a.isMasterSource,
      last4: a.accountNumberLast4,
      server: a.serverName,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'abhi' } },
          { email: { contains: 'profytron' } },
        ],
      },
      select: { id: true, email: true },
    });
    for (const u of users) {
      const accts = await prisma.brokerAccount.findMany({
        where: { userId: u.id },
        select: {
          id: true,
          isActive: true,
          isMasterSource: true,
          accountNumberLast4: true,
          brokerName: true,
        },
      });
      console.log(u.email, accts);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
