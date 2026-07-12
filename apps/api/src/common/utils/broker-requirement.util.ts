import { PrismaService } from '../../prisma/prisma.service';
import { BrokerRequiredException } from '../exceptions/broker-required.exception';
import { SubscriptionStatus } from '@prisma/client';

const LIVE_BROKER_NAMES = ['MT4', 'MT5'] as const;

/** Active live MT4/MT5 for the user (default preferred). Does not throw. */
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

/** Any active broker (live first, then paper) — for display backfill. */
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

/** Returns the user's active live MT5/MT4 broker account or throws 428. */
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

/**
 * Attach a broker to every subscription that still has brokerAccountId = null.
 * Fixes reconnect / activate-without-broker cases for existing and new users.
 */
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
