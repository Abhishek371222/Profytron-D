import { PrismaService } from '../../prisma/prisma.service';
import { BrokerRequiredException } from '../exceptions/broker-required.exception';
import { SubscriptionStatus } from '@prisma/client';

const LIVE_BROKER_NAMES = ['MT4', 'MT5'] as const;

export async function findActiveLiveBroker(
  prisma: PrismaService,
  userId: string,
) {
  return prisma.brokerAccount.findFirst({
    where: {
      userId,
      isActive: true,
      isPaperTrading: false,
      brokerName: { in: [...LIVE_BROKER_NAMES] },
    },
    orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
    select: {
      id: true,
      brokerName: true,
      accountNumberLast4: true,
      serverName: true,
      lastConnectedAt: true,
      initialEquity: true,
      isPaperTrading: true,
    },
  });
}

export async function findAnyActiveBroker(
  prisma: PrismaService,
  userId: string,
) {
  const live = await findActiveLiveBroker(prisma, userId);
  if (live) return live;
  return prisma.brokerAccount.findFirst({
    where: { userId, isActive: true },
    orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
    select: {
      id: true,
      brokerName: true,
      accountNumberLast4: true,
      serverName: true,
      lastConnectedAt: true,
      initialEquity: true,
      isPaperTrading: true,
    },
  });
}

export async function requireActiveMt5Broker(
  prisma: PrismaService,
  userId: string,
) {
  const broker = await findActiveLiveBroker(prisma, userId);

  if (!broker) {
    throw new BrokerRequiredException();
  }

  return broker;
}

export async function linkOrphanStrategySubscriptions(
  prisma: PrismaService,
  userId: string,
  brokerAccountId: string,
) {
  const result = await prisma.userStrategySubscription.updateMany({
    where: {
      userId,
      brokerAccountId: null,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PROVISIONING,
          SubscriptionStatus.PAUSED,
        ],
      },
    },
    data: { brokerAccountId },
  });
  return result.count;
}
