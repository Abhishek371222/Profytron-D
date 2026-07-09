import { PrismaService } from '../../prisma/prisma.service';
import { BrokerRequiredException } from '../exceptions/broker-required.exception';

/** Returns the user's active live MT5/MT4 broker account or throws 428. */
export async function requireActiveMt5Broker(
  prisma: PrismaService,
  userId: string,
) {
  const broker = await prisma.brokerAccount.findFirst({
    where: {
      userId,
      isActive: true,
      isPaperTrading: false,
      brokerName: { in: ['MT4', 'MT5'] },
    },
    orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
    select: {
      id: true,
      brokerName: true,
      accountNumberLast4: true,
      serverName: true,
      lastConnectedAt: true,
    },
  });

  if (!broker) {
    throw new BrokerRequiredException();
  }

  return broker;
}
