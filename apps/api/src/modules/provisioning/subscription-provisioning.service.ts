import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from '../trading/trading.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionProvisioningService {
  private readonly logger = new Logger(SubscriptionProvisioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradingGateway: TradingGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async startProvisioning(
    subscriptionId: string,
    userId: string,
    strategyId: string,
    strategyName: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.PROVISIONING },
      });
      await tx.provisioningJob.upsert({
        where: { subscriptionId },
        create: {
          subscriptionId,
          status: 'PENDING',
          startedAt: new Date(),
        },
        update: {
          status: 'RUNNING',
          startedAt: new Date(),
          lastError: null,
        },
      });
    });

    this.emitStatusChange(userId, strategyId, strategyName, 'PROVISIONING');

    await this.notifications.create(
      userId,
      'Subscription Processing',
      `Your ${strategyName} bot subscription is being set up. This usually completes within a few minutes.`,
      'INFO',
    );
  }

  async completeProvisioning(
    subscriptionId: string,
    userId: string,
    strategyId: string,
    strategyName: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.ACTIVE },
      });
      await tx.provisioningJob.updateMany({
        where: { subscriptionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });

    this.emitStatusChange(userId, strategyId, strategyName, 'ACTIVE');
    this.tradingGateway.sendToUser(userId, 'bot_activated', {
      strategyId,
      botName: strategyName,
      activatedAt: new Date().toISOString(),
    });
    this.tradingGateway.sendToUser(userId, 'strategy_activated', {
      strategyId,
      botName: strategyName,
      activatedAt: new Date().toISOString(),
    });

    await this.notifications.create(
      userId,
      'Bot Active',
      `Your ${strategyName} trading bot is now active.`,
      'SUCCESS',
    );
  }

  async failProvisioning(
    subscriptionId: string,
    userId: string,
    strategyId: string,
    strategyName: string,
    error: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.FAILED },
      });
      await tx.provisioningJob.updateMany({
        where: { subscriptionId },
        data: {
          status: 'FAILED',
          lastError: error.slice(0, 4000),
          completedAt: new Date(),
        },
      });
    });

    this.logger.error(
      `Provisioning failed for subscription ${subscriptionId}: ${error}`,
    );

    this.emitStatusChange(userId, strategyId, strategyName, 'FAILED');

    await this.notifications.create(
      userId,
      'Bot Setup Delayed',
      `We could not finish setting up ${strategyName}. Our team has been notified — please contact support if this persists.`,
      'WARNING',
    );
  }

  async recordProvisioningAttempt(
    subscriptionId: string,
    error?: string,
  ): Promise<void> {
    await this.prisma.provisioningJob.updateMany({
      where: { subscriptionId },
      data: {
        status: 'RUNNING',
        attempts: { increment: 1 },
        ...(error ? { lastError: error.slice(0, 4000) } : {}),
      },
    });
  }

  private emitStatusChange(
    userId: string,
    strategyId: string,
    botName: string,
    status: string,
  ): void {
    this.tradingGateway.sendToUser(userId, 'subscription_status_changed', {
      strategyId,
      botName,
      status,
      updatedAt: new Date().toISOString(),
    });
  }
}
