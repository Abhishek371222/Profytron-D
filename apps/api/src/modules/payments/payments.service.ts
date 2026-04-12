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
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new ForbiddenException('Invalid Stripe webhook signature');
    }
  }

  async handleStripeEvent(event: any) {
    const idempotencyKey = `stripe:event:${event.id}`;
    const lock = await this.redis.set(idempotencyKey, 'processing', 'EX', 86400, 'NX');
    if (lock !== 'OK') {
      return { ok: true, duplicate: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
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
          const invoice = event.data.object as any;
          const metadata = (invoice.parent as any)?.subscription_details?.metadata || invoice.metadata || {};
          const userId = metadata.userId;
          if (userId && invoice.amount_paid > 0) {
            await this.creditWallet(
              userId,
              invoice.amount_paid / 100,
              'DEPOSIT',
              {
                source: 'stripe_invoice',
                invoiceId: invoice.id,
              },
              event.id,
            );
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          const stripeSubId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
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
          const stripeSub = event.data.object as any;
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
      this.logger.error(`Stripe webhook failed for event ${event.id}`, error as any);
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
      (stripeObject as any).current_period_end ||
      ((stripeObject as any).subscription_details?.current_period_end as number | undefined);
    const expiresAt = currentPeriodEndUnix
      ? new Date(currentPeriodEndUnix * 1000)
      : planType === 'LIFETIME'
        ? null
        : new Date(Date.now() + (planType === 'ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000);

    const paidAmount = Number(stripeObject.amount_total || 0) / 100;

    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          status: 'ACTIVE',
          planType,
          stripeSubId:
            typeof stripeObject.subscription === 'string' ? stripeObject.subscription : null,
          subscribedAt: new Date(),
          expiresAt,
        },
        update: {
          status: 'ACTIVE',
          planType,
          stripeSubId:
            typeof stripeObject.subscription === 'string' ? stripeObject.subscription : undefined,
          subscribedAt: new Date(),
          expiresAt,
        },
      });

      await tx.marketplaceListing.update({
        where: { strategyId },
        data: { totalRevenue: { increment: paidAmount } },
      });

      await tx.strategy.update({
        where: { id: strategyId },
        data: {
          copiesCount: { increment: 1 },
          totalRevenue: { increment: paidAmount },
        },
      });
    });

    if (paidAmount > 0) {
      await this.creditWallet(
        listing.strategy.creatorId,
        paidAmount * 0.7,
        'MARKETPLACE_SALE',
        {
          source: 'marketplace_sale',
          strategyId,
          buyerId: userId,
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
