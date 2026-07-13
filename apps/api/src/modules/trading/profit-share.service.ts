import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Prisma,
  ProfitShareLedgerStatus,
  ProfitShareState,
  SubscriptionBillingModel,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';

const PROFIT_SHARE_THRESHOLD_PCT = 5;
const DEFAULT_COMPANY_SHARE_PCT = 30;
const GRACE_DAYS = 3;

type ProfitShareSubscription = Prisma.UserStrategySubscriptionGetPayload<{
  include: {
    strategy: { select: { id: true; name: true } };
    brokerAccount: {
      select: { id: true; credentialsEncrypted: true };
    };
  };
}>;

@Injectable()
export class ProfitShareService {
  private readonly logger = new Logger(ProfitShareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly mtAdapter: MetaTraderAdapter,
    private readonly wallet: WalletService,
    private readonly notifications: NotificationsService,
    private readonly copyFactorySync: CopyFactorySyncService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkProfitShareLiability(): Promise<void> {
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        billingModel: SubscriptionBillingModel.PROFIT_SHARE,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
      },
      include: {
        strategy: { select: { id: true, name: true } },
        brokerAccount: {
          select: { id: true, credentialsEncrypted: true },
        },
      },
    });

    for (const subscription of subscriptions) {
      try {
        await this.evaluateSubscription(subscription);
      } catch (error) {
        this.logger.warn(
          `Profit-share check skipped for ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  @Cron('0 2 * * *')
  async settleMonthEndProfitShare(): Promise<void> {
    const now = new Date();
    const day = now.getUTCDate();
    if (day < 25 || day > 28) return;

    const period = this.currentUtcMonthPeriod(now);
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        billingModel: SubscriptionBillingModel.PROFIT_SHARE,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
      },
      include: {
        strategy: { select: { id: true, name: true } },
        brokerAccount: {
          select: { id: true, credentialsEncrypted: true },
        },
      },
    });

    for (const subscription of subscriptions) {
      try {
        await this.settleSubscription(subscription, period);
      } catch (error) {
        this.logger.warn(
          `Profit-share settlement skipped for ${subscription.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  @Cron('0 3 * * *')
  async blockPastGracePeriod(): Promise<void> {
    const now = new Date();
    const currentPeriod = this.currentUtcMonthPeriod(now);
    const blockAfter = new Date(currentPeriod.periodEnd);
    blockAfter.setUTCDate(blockAfter.getUTCDate() + GRACE_DAYS);
    if (now < blockAfter) return;

    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        billingModel: SubscriptionBillingModel.PROFIT_SHARE,
        status: SubscriptionStatus.ACTIVE,
        profitShareState: ProfitShareState.PROFIT_SHARE_SETTLING,
        profitShareLedgerEntries: {
          some: {
            periodStart: currentPeriod.periodStart,
            periodEnd: currentPeriod.periodEnd,
            status: ProfitShareLedgerStatus.PENDING,
            companyShareAmount: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        profitShareAccruedUnsettled: true,
        strategy: { select: { name: true } },
      },
    });

    for (const subscription of subscriptions) {
      await this.prisma.userStrategySubscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.BLOCKED,
          profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        },
      });
      await this.copyFactorySync.enqueueUnlinkSubscription(subscription.id);
      await this.notifications.create({
        userId: subscription.userId,
        title: 'Profit share access blocked',
        message: `${subscription.strategy.name} is blocked for new profit-share use until the pending ₹${(subscription.profitShareAccruedUnsettled ?? 0).toFixed(2)} settlement is paid.`,
        type: 'ERROR',
        category: 'PAYMENT',
        priority: 'CRITICAL',
        actionUrl: '/settings/billing',
        metadata: { subscriptionId: subscription.id },
        sendPush: true,
      });
    }
  }

  private async evaluateSubscription(
    subscription: ProfitShareSubscription,
  ): Promise<void> {
    const baseline = subscription.equityBaselineAtSubscribe;
    if (!baseline || baseline <= 0 || !subscription.brokerAccount) {
      await this.markChecked(subscription.id, {
        profitShareState: ProfitShareState.PROFIT_SHARE_OK,
      });
      return;
    }

    const equity = await this.getLiveEquity(subscription.brokerAccount);
    if (equity == null) {
      await this.markChecked(subscription.id, {});
      return;
    }

    const netPnl = equity - baseline;
    const profitPct = (netPnl / baseline) * 100;
    const sharePct = subscription.profitSharePct ?? DEFAULT_COMPANY_SHARE_PCT;

    if (netPnl <= 0 || profitPct <= PROFIT_SHARE_THRESHOLD_PCT) {
      await this.prisma.userStrategySubscription.update({
        where: { id: subscription.id },
        data: {
          profitShareAccruedUnsettled: 0,
          profitShareState: ProfitShareState.PROFIT_SHARE_OK,
          lastProfitCheckAt: new Date(),
        },
      });
      if (
        subscription.status === SubscriptionStatus.PAUSED &&
        subscription.profitShareState === ProfitShareState.PROFIT_SHARE_PAUSED
      ) {
        await this.resumeProfitShareSubscription(subscription);
      }
      return;
    }

    const accruedShare = this.money((netPnl * sharePct) / 100);
    const balance = await this.wallet.getBalance(subscription.userId);
    const now = new Date();
    const shouldPause = accruedShare >= balance.available;
    const shouldPing =
      !subscription.lastProfitPingAt ||
      now.getTime() - subscription.lastProfitPingAt.getTime() >=
        7 * 24 * 60 * 60 * 1000;

    if (shouldPause) {
      await this.pauseProfitShareSubscription(
        subscription,
        accruedShare,
        balance.available,
      );
      return;
    }

    await this.prisma.userStrategySubscription.update({
      where: { id: subscription.id },
      data: {
        profitShareAccruedUnsettled: accruedShare,
        profitShareState: ProfitShareState.PROFIT_SHARE_DUE,
        lastProfitCheckAt: now,
        ...(shouldPing ? { lastProfitPingAt: now } : {}),
      },
    });

    if (shouldPing) {
      await this.notifications.create({
        userId: subscription.userId,
        title: 'Profit share top-up reminder',
        message: `${subscription.strategy.name} is up ${profitPct.toFixed(2)}%. Current company share is ₹${accruedShare.toFixed(2)}; wallet buffer is ₹${balance.available.toFixed(2)}.`,
        type: 'WARNING',
        category: 'PAYMENT',
        priority: 'HIGH',
        actionUrl: '/settings/billing',
        metadata: {
          subscriptionId: subscription.id,
          strategyId: subscription.strategyId,
          accruedShare,
          walletAvailable: balance.available,
          profitPct,
        },
        sendPush: true,
      });
    }
  }

  private async settleSubscription(
    subscription: ProfitShareSubscription,
    period: { periodStart: Date; periodEnd: Date; deadline: Date },
  ): Promise<void> {
    const baseline = subscription.equityBaselineAtSubscribe;
    if (!baseline || baseline <= 0 || !subscription.brokerAccount) return;

    const equity = await this.getLiveEquity(subscription.brokerAccount);
    if (equity == null) return;

    const netPnl = this.money(equity - baseline);
    const sharePct = subscription.profitSharePct ?? DEFAULT_COMPANY_SHARE_PCT;

    if (netPnl < 0) {
      const creditAmount = this.money((Math.abs(netPnl) * sharePct) / 100);
      const walletTx = await this.wallet.createTransaction(subscription.userId, {
        type: 'PROFIT_SHARE_LOSS_CREDIT',
        direction: 'IN',
        amount: creditAmount,
        status: 'CONFIRMED',
        idempotencyKey: `profit-share-loss:${subscription.id}:${period.periodStart.toISOString()}`,
        description: `Profit-share loss credit for ${subscription.strategy.name}`,
        reference: subscription.id,
        metadataJson: {
          subscriptionId: subscription.id,
          strategyId: subscription.strategyId,
          periodStart: period.periodStart.toISOString(),
          periodEnd: period.periodEnd.toISOString(),
          netPnl,
        },
      });

      await this.prisma.profitShareLedgerEntry.upsert({
        where: {
          subscriptionId_periodStart_periodEnd: {
            subscriptionId: subscription.id,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
          },
        },
        create: {
          subscriptionId: subscription.id,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          netPnl,
          companySharePct: sharePct,
          companyShareAmount: creditAmount,
          status: ProfitShareLedgerStatus.CREDITED,
          settledAt: new Date(),
          walletTransactionId: walletTx.id,
        },
        update: {
          netPnl,
          companyShareAmount: creditAmount,
          status: ProfitShareLedgerStatus.CREDITED,
          settledAt: new Date(),
          walletTransactionId: walletTx.id,
        },
      });

      await this.prisma.userStrategySubscription.update({
        where: { id: subscription.id },
        data: {
          profitShareAccruedUnsettled: 0,
          profitShareState: ProfitShareState.PROFIT_SHARE_OK,
        },
      });

      await this.notifications.create({
        userId: subscription.userId,
        title: 'Profit-share loss credit added',
        message: `We credited ₹${creditAmount.toFixed(2)} to your wallet for ${subscription.strategy.name}'s monthly loss offset.`,
        type: 'SUCCESS',
        category: 'PAYMENT',
        priority: 'HIGH',
        actionUrl: '/wallet',
        metadata: { subscriptionId: subscription.id, walletTransactionId: walletTx.id },
        sendPush: true,
      });
      return;
    }

    const shareAmount = this.money((netPnl * sharePct) / 100);
    const balance = await this.wallet.getBalance(subscription.userId);
    if (shareAmount <= 0) return;

    if (balance.available >= shareAmount) {
      const walletTx = await this.wallet.createTransaction(subscription.userId, {
        type: 'PROFIT_SHARE_DEBIT',
        direction: 'OUT',
        amount: shareAmount,
        status: 'CONFIRMED',
        idempotencyKey: `profit-share-debit:${subscription.id}:${period.periodStart.toISOString()}`,
        description: `Profit-share settlement for ${subscription.strategy.name}`,
        reference: subscription.id,
        metadataJson: {
          subscriptionId: subscription.id,
          strategyId: subscription.strategyId,
          periodStart: period.periodStart.toISOString(),
          periodEnd: period.periodEnd.toISOString(),
          netPnl,
        },
      });

      await this.prisma.profitShareLedgerEntry.upsert({
        where: {
          subscriptionId_periodStart_periodEnd: {
            subscriptionId: subscription.id,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
          },
        },
        create: {
          subscriptionId: subscription.id,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          netPnl,
          companySharePct: sharePct,
          companyShareAmount: shareAmount,
          status: ProfitShareLedgerStatus.COLLECTED,
          settledAt: new Date(),
          walletTransactionId: walletTx.id,
        },
        update: {
          netPnl,
          companyShareAmount: shareAmount,
          status: ProfitShareLedgerStatus.COLLECTED,
          settledAt: new Date(),
          walletTransactionId: walletTx.id,
        },
      });

      await this.prisma.userStrategySubscription.update({
        where: { id: subscription.id },
        data: {
          profitShareAccruedUnsettled: 0,
          profitShareState: ProfitShareState.PROFIT_SHARE_OK,
        },
      });
      return;
    }

    await this.prisma.profitShareLedgerEntry.upsert({
      where: {
        subscriptionId_periodStart_periodEnd: {
          subscriptionId: subscription.id,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
        },
      },
      create: {
        subscriptionId: subscription.id,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        netPnl,
        companySharePct: sharePct,
        companyShareAmount: shareAmount,
        status: ProfitShareLedgerStatus.PENDING,
      },
      update: {
        netPnl,
        companyShareAmount: shareAmount,
        status: ProfitShareLedgerStatus.PENDING,
      },
    });

    await this.prisma.userStrategySubscription.update({
      where: { id: subscription.id },
      data: {
        profitShareAccruedUnsettled: shareAmount,
        profitShareState: ProfitShareState.PROFIT_SHARE_SETTLING,
      },
    });

    await this.notifications.create({
      userId: subscription.userId,
      title: 'Profit share settlement due',
      message: `${subscription.strategy.name} owes ₹${shareAmount.toFixed(2)} for this month. Please top up by ${period.deadline.toLocaleDateString('en-IN')} to keep profit-share access active.`,
      type: 'WARNING',
      category: 'PAYMENT',
      priority: 'CRITICAL',
      actionUrl: '/settings/billing',
      metadata: {
        subscriptionId: subscription.id,
        strategyId: subscription.strategyId,
        shareAmount,
        deadline: period.deadline.toISOString(),
      },
      sendPush: true,
    });
  }

  private async pauseProfitShareSubscription(
    subscription: ProfitShareSubscription,
    accruedShare: number,
    walletAvailable: number,
  ): Promise<void> {
    await this.prisma.userStrategySubscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.PAUSED,
        profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        profitShareAccruedUnsettled: accruedShare,
        lastProfitCheckAt: new Date(),
        lastProfitPingAt: new Date(),
      },
    });
    await this.copyFactorySync.enqueueUnlinkSubscription(subscription.id);
    await this.notifications.create({
      userId: subscription.userId,
      title: 'Bot paused: top-up required',
      message: `${subscription.strategy.name} was paused because the ₹${accruedShare.toFixed(2)} profit-share liability reached your ₹${walletAvailable.toFixed(2)} wallet buffer.`,
      type: 'ERROR',
      category: 'PAYMENT',
      priority: 'CRITICAL',
      actionUrl: '/settings/billing',
      metadata: {
        subscriptionId: subscription.id,
        strategyId: subscription.strategyId,
        accruedShare,
        walletAvailable,
      },
      sendPush: true,
    });
  }

  private async resumeProfitShareSubscription(
    subscription: ProfitShareSubscription,
  ): Promise<void> {
    await this.prisma.userStrategySubscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        profitShareState:
          (subscription.profitShareAccruedUnsettled ?? 0) > 0
            ? ProfitShareState.PROFIT_SHARE_DUE
            : ProfitShareState.PROFIT_SHARE_OK,
      },
    });
    await this.copyFactorySync.enqueueLinkSubscription(subscription.id);
  }

  private async markChecked(
    subscriptionId: string,
    data: Prisma.UserStrategySubscriptionUpdateInput,
  ): Promise<void> {
    await this.prisma.userStrategySubscription.update({
      where: { id: subscriptionId },
      data: { ...data, lastProfitCheckAt: new Date() },
    });
  }

  private async getLiveEquity(brokerAccount: {
    credentialsEncrypted: string;
  }): Promise<number | null> {
    const creds = JSON.parse(this.crypto.decrypt(brokerAccount.credentialsEncrypted)) as {
      metaApiAccountId?: string;
      metaApiRegion?: string;
    };
    if (!creds.metaApiAccountId) return null;
    return this.mtAdapter.getLiveEquity(
      creds.metaApiAccountId,
      creds.metaApiRegion,
    );
  }

  private currentUtcMonthPeriod(now: Date): {
    periodStart: Date;
    periodEnd: Date;
    deadline: Date;
  } {
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    );
    const deadline = new Date(periodEnd);
    deadline.setUTCHours(23, 59, 59, 999);
    return { periodStart, periodEnd, deadline };
  }

  private money(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
