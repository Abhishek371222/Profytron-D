import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TradingGateway } from '../trading/trading.gateway';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../auth/redis.service';
import type { IORedis } from '../../config/redis.config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly tradingGateway: TradingGateway,
    @Inject(REDIS_CLIENT) private readonly redis: IORedis,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-01-27' as any,
    });
  }

  verifyAndBuildStripeEvent(rawBody: Buffer, signature: string): any {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Missing STRIPE_WEBHOOK_SECRET');
    }
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch {
      throw new ForbiddenException('Invalid Stripe webhook signature');
    }
  }

  async handleStripeEvent(event: any) {
    const idempotencyKey = `stripe:event:${event.id}`;
    const lock = await this.redis.set(
      idempotencyKey,
      'processing',
      'EX',
      86400,
      'NX',
    );
    if (lock !== 'OK') {
      return { ok: true, duplicate: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const metadata = session.metadata || {};
          if (metadata.userId && metadata.strategyId && metadata.planType) {
            await this.activateSubscription(
              metadata.userId,
              metadata.strategyId,
              metadata.planType,
              session,
            );
          }
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          const stripeSubId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : null;
          if (stripeSubId && invoice.amount_paid > 0) {
            await this.handleSubscriptionInvoicePaid(stripeSubId, invoice);
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const stripeSubId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : null;
          if (stripeSubId) {
            await this.prisma.userStrategySubscription.updateMany({
              where: { stripeSubId },
              data: {
                status: 'INACTIVE',
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              },
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const stripeSub = event.data.object;
          await this.prisma.userStrategySubscription.updateMany({
            where: { stripeSubId: stripeSub.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
            },
          });
          break;
        }
        default:
          break;
      }

      await this.redis.set(idempotencyKey, 'processed', 'EX', 86400);
      return { ok: true };
    } catch (error) {
      this.logger.error(`Stripe webhook failed for event ${event.id}`, error);
      throw error;
    }
  }

  verifyRazorpaySignature(rawBody: Buffer, signature: string): void {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('Missing RAZORPAY_WEBHOOK_SECRET');
    }

    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (digest !== signature) {
      throw new ForbiddenException('Invalid Razorpay webhook signature');
    }
  }

  async handleRazorpayEvent(payload: any) {
    const eventType = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const refundEntity = payload?.payload?.refund?.entity;

    if (eventType === 'payment.captured' && paymentEntity?.notes?.userId) {
      await this.creditWallet(
        paymentEntity.notes.userId,
        Number(paymentEntity.amount || 0) / 100,
        'DEPOSIT',
        {
          source: 'razorpay',
          paymentId: paymentEntity.id,
        },
        `razorpay_payment_${paymentEntity.id}`,
      );
    }

    if (eventType === 'refund.created' && refundEntity?.notes?.userId) {
      await this.creditWallet(
        refundEntity.notes.userId,
        Number(refundEntity.amount || 0) / 100,
        'WITHDRAWAL',
        {
          source: 'razorpay_refund',
          refundId: refundEntity.id,
        },
        `razorpay_refund_${refundEntity.id}`,
      );
    }

    return { ok: true };
  }

  async activateSubscription(
    userId: string,
    strategyId: string,
    planType: string,
    stripeObject: any,
  ) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { strategyId },
      include: {
        strategy: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!listing) {
      throw new BadRequestException('Strategy listing not found');
    }

    const currentPeriodEndUnix =
      stripeObject.current_period_end ||
      (stripeObject.subscription_details?.current_period_end as
        | number
        | undefined);
    const expiresAt = currentPeriodEndUnix
      ? new Date(currentPeriodEndUnix * 1000)
      : planType === 'LIFETIME'
        ? null
        : new Date(
            Date.now() +
              (planType === 'ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000,
          );

    const paidAmount = Number(stripeObject.amount_total || 0) / 100;
    const creatorShare = paidAmount * (listing.creatorSharePct ?? 0.8);
    const platformShare = Math.max(0, paidAmount - creatorShare);

    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          status: 'ACTIVE',
          planType,
          stripeSubId:
            typeof stripeObject.subscription === 'string'
              ? stripeObject.subscription
              : null,
          subscribedAt: new Date(),
          expiresAt,
        },
        update: {
          status: 'ACTIVE',
          planType,
          stripeSubId:
            typeof stripeObject.subscription === 'string'
              ? stripeObject.subscription
              : undefined,
          subscribedAt: new Date(),
          expiresAt,
        },
      });

      await tx.marketplaceListing.update({
        where: { strategyId },
        data: {
          totalRevenue: { increment: paidAmount },
          lastPayoutAt: new Date(),
        },
      });

      await tx.strategy.update({
        where: { id: strategyId },
        data: {
          copiesCount: { increment: 1 },
          totalRevenue: { increment: paidAmount },
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'MARKETPLACE_PAYOUT_RECORDED',
          userId,
          detailsJson: {
            strategyId,
            paidAmount,
            creatorShare,
            platformShare,
            planType,
            stripePaymentId: stripeObject.id,
          },
          triggeredBy: listing.strategy.creatorId,
        },
      });
    });

    if (paidAmount > 0) {
      await this.creditWallet(
        listing.strategy.creatorId,
        creatorShare,
        'MARKETPLACE_SALE',
        {
          source: 'marketplace_sale',
          strategyId,
          buyerId: userId,
          creatorSharePct: listing.creatorSharePct,
          platformSharePct: listing.platformSharePct,
          platformShare,
        },
        `creator_credit_${stripeObject.id}`,
      );
    }

    await this.notifications.create(
      userId,
      'Subscription Active',
      'Your marketplace subscription is now active.',
      'SUCCESS',
    );

    this.tradingGateway.sendToUser(userId, 'strategy_activated', {
      strategyId,
      planType,
      activatedAt: new Date().toISOString(),
    });
  }

  private getPeriodEndDate(stripeObject: any): Date | null {
    const unixPeriodEnd =
      stripeObject.current_period_end ||
      (stripeObject.subscription_details?.current_period_end as
        | number
        | undefined) ||
      stripeObject.lines?.data?.[0]?.period?.end;

    return unixPeriodEnd ? new Date(unixPeriodEnd * 1000) : null;
  }

  private async createSubscriptionPaymentRecord(
    userId: string,
    amount: number,
    reference: string,
    idempotencyKey: string,
    metadata: Record<string, unknown>,
  ) {
    const existing = await this.prisma.walletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    const grouped = await this.prisma.walletTransaction.groupBy({
      by: ['direction'],
      where: { userId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });

    const credits =
      grouped.find((entry) => entry.direction === 'IN')?._sum.amount ?? 0;
    const debits =
      grouped.find((entry) => entry.direction === 'OUT')?._sum.amount ?? 0;
    const currentBalance = credits - debits;

    return this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'SUBSCRIPTION_PAYMENT',
        direction: 'OUT',
        amount,
        balanceAfter: currentBalance - amount,
        status: 'CONFIRMED',
        reference,
        idempotencyKey,
        metadataJson: metadata as any,
      },
    });
  }

  private async handleSubscriptionInvoicePaid(
    stripeSubId: string,
    invoice: any,
  ) {
    const subscription = await this.prisma.userStrategySubscription.findFirst({
      where: { stripeSubId },
    });

    if (!subscription) {
      this.logger.warn(
        `No local subscription found for Stripe subscription ${stripeSubId}`,
      );
      return;
    }

    const amount = Number(invoice.amount_paid || 0) / 100;
    const expiresAt =
      this.getPeriodEndDate(invoice) ||
      (subscription.planType === 'ANNUAL'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          expiresAt,
          cancelledAt: null,
        },
      });

      await tx.marketplaceListing.update({
        where: { strategyId: subscription.strategyId },
        data: { totalRevenue: { increment: amount } },
      });

      await tx.strategy.update({
        where: { id: subscription.strategyId },
        data: { totalRevenue: { increment: amount } },
      });
    });

    await this.createSubscriptionPaymentRecord(
      subscription.userId,
      amount,
      invoice.id,
      `subscription_invoice_${invoice.id}`,
      {
        source: 'stripe_invoice',
        invoiceId: invoice.id,
        stripeSubId,
        strategyId: subscription.strategyId,
      },
    );

    await this.creditWallet(
      (
        await this.prisma.strategy.findUniqueOrThrow({
          where: { id: subscription.strategyId },
          select: { creatorId: true },
        })
      ).creatorId,
      amount * 0.7,
      'MARKETPLACE_SALE',
      {
        source: 'marketplace_renewal',
        invoiceId: invoice.id,
        strategyId: subscription.strategyId,
        buyerId: subscription.userId,
      },
      `creator_credit_invoice_${invoice.id}`,
    );

    await this.notifications.create(
      subscription.userId,
      'Subscription Renewed',
      'Your recurring marketplace subscription payment was confirmed.',
      'SUCCESS',
    );
  }

  async creditWallet(
    userId: string,
    amount: number,
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'MARKETPLACE_SALE',
    metadata: Record<string, unknown>,
    idempotencyKey: string,
  ) {
    const lockKey = `wallet_lock:${userId}`;

    let lockAcquired = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await this.redis.set(lockKey, '1', 'EX', 10, 'NX');
      if (result === 'OK') {
        lockAcquired = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!lockAcquired) {
      throw new BadRequestException('Could not acquire wallet lock');
    }

    try {
      const existing = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return existing;
      }

      const sums = await this.prisma.walletTransaction.groupBy({
        by: ['direction'],
        where: { userId, status: 'CONFIRMED' },
        _sum: { amount: true },
      });

      const credits =
        sums.find((item) => item.direction === 'IN')?._sum.amount ?? 0;
      const debits =
        sums.find((item) => item.direction === 'OUT')?._sum.amount ?? 0;
      const currentBalance = credits - debits;

      const direction = type === 'WITHDRAWAL' ? 'OUT' : 'IN';
      const normalizedAmount = Math.abs(amount);
      const balanceAfter =
        direction === 'IN'
          ? currentBalance + normalizedAmount
          : currentBalance - normalizedAmount;

      return this.prisma.walletTransaction.create({
        data: {
          userId,
          type,
          direction,
          amount: normalizedAmount,
          balanceAfter,
          status: 'CONFIRMED',
          idempotencyKey,
          metadataJson: metadata as any,
        },
      });
    } finally {
      await this.redis.del(lockKey);
    }
  }
}
