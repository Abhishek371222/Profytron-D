import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionCleanupService {
  private readonly logger = new Logger(SubscriptionCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireSubscriptions(): Promise<void> {
    const now = new Date();

    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        brokerAccountId: true,
        expiresAt: true,
      },
    });

    if (subscriptions.length === 0) {
      return;
    }

    const subscriptionIds = subscriptions.map(
      (subscription) => subscription.id,
    );
    const brokerAccountIds = [
      ...new Set(
        subscriptions
          .map((subscription) => subscription.brokerAccountId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    await this.prisma.userStrategySubscription.updateMany({
      where: {
        id: { in: subscriptionIds },
        status: SubscriptionStatus.ACTIVE,
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
        cancelledAt: now,
      },
    });

    if (brokerAccountIds.length > 0) {
      await this.prisma.brokerAccount.updateMany({
        where: {
          id: { in: brokerAccountIds },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    await this.prisma.auditLog.createMany({
      data: subscriptions.map((subscription) => ({
        eventType: 'SUBSCRIPTION_AUTO_EXPIRED',
        userId: subscription.userId,
        detailsJson: {
          subscriptionId: subscription.id,
          strategyId: subscription.strategyId,
          brokerAccountId: subscription.brokerAccountId,
          expiresAt: subscription.expiresAt?.toISOString() ?? null,
          processedAt: now.toISOString(),
          brokerDeactivated:
            subscription.brokerAccountId !== null &&
            subscription.brokerAccountId !== undefined,
        },
        triggeredBy: 'SYSTEM_CRON',
      })),
    });

    this.logger.log(
      `Auto-expired ${subscriptions.length} subscription(s) and deactivated ${brokerAccountIds.length} broker account(s).`,
    );
  }
}
