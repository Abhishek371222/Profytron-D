import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TradingGateway } from '../trading/trading.gateway';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../auth/redis.service';
import type { IORedis } from '../../config/redis.config';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';
import { SubscriptionTier } from '@prisma/client';
import { PLATFORM_PLANS } from '../../common/constants/pricing.constants';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';
import { EmailService } from '../email/email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly razorpay: Razorpay | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly tradingGateway: TradingGateway,
    private readonly copyFactorySync: CopyFactorySyncService,
    private readonly affiliatesService: AffiliatesService,
    private readonly activationService: ActivationService,
    private readonly agentEvents: AgentEventService,
    private readonly emailService: EmailService,
    @Inject(REDIS_CLIENT) private readonly redis: IORedis,
  ) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-01-27' as any,
        })
      : (null as any);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    this.razorpay =
      razorpayKeyId && razorpayKeySecret
        ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
        : null;
  }

  /** Local dev only — RAZORPAY_KEY_ID=DEMO_KEY skips the live Razorpay API. */
  private isRazorpayDemoMode(): boolean {
    return (
      process.env.NODE_ENV !== 'production' &&
      process.env.RAZORPAY_KEY_ID === 'DEMO_KEY'
    );
  }

  private demoOrderRedisKey(orderId: string): string {
    return `razorpay:demo:${orderId}`;
  }

  // ── Razorpay Standard Checkout ─────────────────────────────────────────────

  /**
   * Create a Razorpay order for the given user. `amount` is in paise (minimum
   * 100 = ₹1). The order id is returned to the browser so it can open the
   * Razorpay Checkout modal; no money moves until the payment is captured and
   * its signature verified server-side via verifyRazorpayPayment().
   */
  async createRazorpayOrder(
    userId: string,
    amount: number,
    currency = 'INR',
    receipt?: string,
    extraNotes?: Record<string, string>,
  ) {
    if (!Number.isInteger(amount) || amount < 100) {
      throw new BadRequestException(
        'Amount must be an integer of at least 100 paise (₹1).',
      );
    }

    if (this.isRazorpayDemoMode()) {
      const orderId = `order_demo_${crypto.randomBytes(8).toString('hex')}`;
      await this.redis.set(
        this.demoOrderRedisKey(orderId),
        JSON.stringify({
          userId,
          amount,
          currency,
          notes: extraNotes ?? {},
        }),
        'EX',
        3600,
      );
      return {
        orderId,
        amount,
        currency,
        keyId: 'DEMO_KEY',
        demo: true,
      };
    }

    if (!this.razorpay) {
      throw new BadRequestException(
        'Razorpay is not configured (missing RAZORPAY_KEY_ID/SECRET).',
      );
    }

    try {
      const order = await this.razorpay.orders.create({
        amount,
        currency,
        // Razorpay caps receipt at 40 chars; keep it short (userId is in notes).
        receipt: (receipt || `wlt_${Date.now()}`).slice(0, 40),
        notes: { userId, ...(extraNotes ?? {}) },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error: any) {
      const status = error?.statusCode;
      this.logger.error(
        `Razorpay order creation failed for user ${userId}: ${error?.error?.description || error?.message}`,
      );
      if (status === 401 || status === 403) {
        throw new ForbiddenException(
          'Razorpay authentication failed. Set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in apps/api/.env (or use DEMO_KEY for local simulation).',
        );
      }
      throw new BadRequestException(
        error?.error?.description || 'Failed to create Razorpay order.',
      );
    }
  }

  /**
   * Complete a demo Razorpay order in local development (RAZORPAY_KEY_ID=DEMO_KEY).
   * Credits the wallet without opening the Razorpay checkout modal.
   */
  async completeDemoRazorpayOrder(userId: string, orderId: string) {
    if (!this.isRazorpayDemoMode()) {
      throw new BadRequestException(
        'Demo payments are only available in development with RAZORPAY_KEY_ID=DEMO_KEY.',
      );
    }
    if (!orderId.startsWith('order_demo_')) {
      throw new BadRequestException('Invalid demo order id.');
    }

    const raw = await this.redis.get(this.demoOrderRedisKey(orderId));
    if (!raw) {
      throw new BadRequestException('Demo order expired or not found.');
    }

    const stored = JSON.parse(raw) as {
      userId: string;
      amount: number;
      currency: string;
      notes?: Record<string, string>;
    };

    if (stored.userId !== userId) {
      throw new ForbiddenException('Demo order does not belong to this user.');
    }

    const paymentId = `pay_demo_${crypto.randomBytes(8).toString('hex')}`;
    const amountRupees = Number(stored.amount) / 100;
    const notes = stored.notes ?? {};

    await this.creditWallet(
      userId,
      amountRupees,
      'DEPOSIT',
      {
        source: 'razorpay_demo',
        orderId,
        paymentId,
      },
      `razorpay_payment_${paymentId}`,
    );

    if (notes.type === 'platform_subscription' && notes.planId) {
      await this.activatePlatformSubscriptionFromPayment(
        userId,
        notes.planId,
        notes.billingCycle ?? 'MONTHLY',
        paymentId,
        amountRupees,
      );
    } else {
      await this.activationService.track(
        userId,
        ACTIVATION_EVENTS.FIRST_WALLET_DEPOSIT,
        { amount: amountRupees },
      );
      await this.affiliatesService.processFirstDepositBonus(
        userId,
        amountRupees,
      );
      await this.affiliatesService.calculateCommission(
        userId,
        amountRupees,
        paymentId,
      );
    }

    await this.notifications.create(
      userId,
      'Deposit Successful',
      `₹${amountRupees.toFixed(2)} has been added to your wallet (demo mode).`,
    );

    await this.redis.del(this.demoOrderRedisKey(orderId));

    return {
      success: true,
      orderId,
      paymentId,
      amount: amountRupees,
      currency: stored.currency,
      demo: true,
    };
  }

  /**
   * Verify a completed Razorpay Checkout payment.
   *
   * Razorpay signs `${order_id}|${payment_id}` with HMAC-SHA256 using the key
   * secret. We recompute it and compare in constant time. Only on a match do we
   * fetch the authoritative paid amount from Razorpay (never trusting the
   * client) and credit the user's wallet — idempotently, using the same key the
   * webhook uses so a payment can't be double-credited.
   */
  async verifyRazorpayPayment(
    userId: string,
    payload: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    },
  ) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequestException(
        'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.',
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !this.razorpay) {
      throw new BadRequestException('Razorpay is not configured.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const provided = Buffer.from(razorpay_signature);
    const expected = Buffer.from(expectedSignature);
    const signatureValid =
      provided.length === expected.length &&
      crypto.timingSafeEqual(provided, expected);

    if (!signatureValid) {
      this.logger.warn(
        `Razorpay signature mismatch for order ${razorpay_order_id} (user ${userId})`,
      );
      throw new BadRequestException('Payment signature verification failed.');
    }

    // Signature is valid — pull the authoritative amount from Razorpay so the
    // credited value can't be tampered with on the client.
    const order = await this.razorpay.orders.fetch(razorpay_order_id);
    const orderNotes = (order.notes ?? {}) as Record<string, string>;
    const orderUserId = orderNotes.userId;
    if (orderUserId && orderUserId !== userId) {
      throw new ForbiddenException(
        'Payment order does not belong to the authenticated user.',
      );
    }
    const creditUserId = orderUserId || userId;
    const amountRupees = Number(order.amount) / 100;

    await this.creditWallet(
      creditUserId,
      amountRupees,
      'DEPOSIT',
      {
        source: 'razorpay_checkout',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      },
      `razorpay_payment_${razorpay_payment_id}`,
    );

    if (orderNotes.type === 'platform_subscription' && orderNotes.planId) {
      await this.activatePlatformSubscriptionFromPayment(
        creditUserId,
        orderNotes.planId,
        orderNotes.billingCycle ?? 'MONTHLY',
        razorpay_payment_id,
        amountRupees,
      );
    } else {
      await this.activationService.track(
        creditUserId,
        ACTIVATION_EVENTS.FIRST_WALLET_DEPOSIT,
        { amount: amountRupees },
      );
      await this.affiliatesService.processFirstDepositBonus(
        creditUserId,
        amountRupees,
      );
      await this.affiliatesService.calculateCommission(
        creditUserId,
        amountRupees,
        razorpay_payment_id,
      );
    }

    await this.notifications.create({
      userId: creditUserId,
      title: 'Deposit Successful',
      message: `₹${amountRupees.toFixed(2)} has been added to your wallet.`,
      type: 'SUCCESS',
      category: 'PAYMENT',
      priority: 'HIGH',
      actionUrl: '/wallet',
      sendPush: true,
    });

    // Send payment confirmation email (fire-and-forget)
    void this.prisma.user
      .findUnique({
        where: { id: creditUserId },
        select: { email: true, fullName: true },
      })
      .then((u) => {
        if (u) {
          void this.emailService.sendPaymentEmail(
            u.email,
            u.fullName,
            {
              type: 'SUCCESS',
              amount: amountRupees,
              currency: order.currency ?? 'INR',
              description:
                orderNotes.type === 'platform_subscription'
                  ? 'Platform subscription'
                  : 'Wallet deposit',
            },
            creditUserId,
          );
        }
      });

    return {
      success: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: amountRupees,
      currency: order.currency,
    };
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
      await this.redis.del(idempotencyKey).catch(() => undefined);
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

    const provided = Buffer.from(signature);
    const expected = Buffer.from(digest);
    const signatureValid =
      provided.length === expected.length &&
      crypto.timingSafeEqual(provided, expected);

    if (!signatureValid) {
      throw new ForbiddenException('Invalid Razorpay webhook signature');
    }
  }

  async handleRazorpayEvent(payload: any) {
    const eventType = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const refundEntity = payload?.payload?.refund?.entity;
    const subscriptionEntity = payload?.payload?.subscription?.entity;

    if (eventType === 'payment.captured' && paymentEntity?.notes?.userId) {
      const userId = paymentEntity.notes.userId;
      const strategyId = paymentEntity.notes.strategyId;
      const planType = paymentEntity.notes.planType ?? 'MONTHLY';
      const notes = paymentEntity.notes;

      if (notes.type === 'platform_subscription' && notes.planId) {
        await this.activatePlatformSubscriptionFromPayment(
          userId,
          notes.planId,
          notes.billingCycle ?? 'MONTHLY',
          paymentEntity.id,
          Number(paymentEntity.amount || 0) / 100,
        );
        void this.agentEvents.emit({
          type: AGENT_EVENTS.PAYMENT_SUCCEEDED,
          entityType: 'payment',
          entityId: paymentEntity.id,
          userId,
          payload: { planId: notes.planId, type: 'platform_subscription' },
          idempotencyKey: `payment-ok:${paymentEntity.id}`,
        });
        return { ok: true };
      }

      await this.creditWallet(
        userId,
        Number(paymentEntity.amount || 0) / 100,
        'DEPOSIT',
        { source: 'razorpay', paymentId: paymentEntity.id },
        `razorpay_payment_${paymentEntity.id}`,
      );

      // If this payment is for a strategy subscription, activate it
      if (strategyId) {
        await this.activateSubscription(userId, strategyId, planType, {
          id: paymentEntity.id,
          amount_total: paymentEntity.amount,
        });
      }

      void this.agentEvents.emit({
        type: AGENT_EVENTS.PAYMENT_SUCCEEDED,
        entityType: 'payment',
        entityId: paymentEntity.id,
        userId,
        payload: { strategyId, amount: paymentEntity.amount },
        idempotencyKey: `payment-ok:${paymentEntity.id}`,
      });
    }

    if (eventType === 'payment.failed' && paymentEntity?.notes?.userId) {
      const userId = paymentEntity.notes.userId;
      const strategyId = paymentEntity.notes.strategyId;
      this.logger.warn(
        `Razorpay payment failed for user ${userId}, payment ${paymentEntity.id}`,
      );

      // If tied to a strategy subscription, mark it inactive
      if (strategyId) {
        await this.prisma.userStrategySubscription.updateMany({
          where: { userId, strategyId, status: 'ACTIVE' },
          data: { status: 'INACTIVE' },
        });
      }

      await this.notifications.create(
        userId,
        'Payment Failed',
        'Your payment could not be processed. Please try again.',
        'ERROR',
      );

      void this.agentEvents.emit({
        type: AGENT_EVENTS.PAYMENT_FAILED,
        entityType: 'payment',
        entityId: paymentEntity.id,
        userId,
        payload: {
          strategyId,
          errorCode: paymentEntity.error_code,
          amount: paymentEntity.amount,
        },
        idempotencyKey: `payment-failed:${paymentEntity.id}`,
      });
    }

    if (eventType === 'refund.created' && refundEntity?.notes?.userId) {
      await this.creditWallet(
        refundEntity.notes.userId,
        Number(refundEntity.amount || 0) / 100,
        'WITHDRAWAL',
        { source: 'razorpay_refund', refundId: refundEntity.id },
        `razorpay_refund_${refundEntity.id}`,
      );
    }

    if (
      eventType === 'subscription.cancelled' &&
      subscriptionEntity?.notes?.userId
    ) {
      const userId = subscriptionEntity.notes.userId;
      const strategyId = subscriptionEntity.notes.strategyId;
      if (strategyId) {
        await this.prisma.userStrategySubscription.updateMany({
          where: { userId, strategyId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
      }
      void this.agentEvents.emit({
        type: AGENT_EVENTS.SUBSCRIPTION_CANCELLED,
        entityType: 'subscription',
        entityId: subscriptionEntity.id ?? userId,
        userId,
        payload: { strategyId },
        idempotencyKey: `sub-cancel:${subscriptionEntity.id ?? userId}`,
      });
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

    const followerBroker = await this.prisma.brokerAccount.findFirst({
      where: {
        userId,
        isActive: true,
        isPaperTrading: false,
        brokerName: { in: ['MT4', 'MT5'] },
      },
      orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
      select: { id: true },
    });

    const paymentReference =
      typeof stripeObject.subscription === 'string'
        ? stripeObject.subscription
        : typeof stripeObject.id === 'string'
          ? stripeObject.id
          : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          status: 'ACTIVE',
          planType,
          stripeSubId: paymentReference,
          brokerAccountId: followerBroker?.id ?? null,
          subscribedAt: new Date(),
          expiresAt,
          trialEndsAt: null,
        },
        update: {
          status: 'ACTIVE',
          planType,
          stripeSubId: paymentReference ?? undefined,
          brokerAccountId: followerBroker?.id ?? undefined,
          subscribedAt: new Date(),
          expiresAt,
          trialEndsAt: null,
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

    const subscription = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
      select: { id: true },
    });
    if (subscription) {
      await this.copyFactorySync.enqueueLinkSubscription(subscription.id);
    }
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

    const [renewalStrategy, renewalListing] = await Promise.all([
      this.prisma.strategy.findUniqueOrThrow({
        where: { id: subscription.strategyId },
        select: { creatorId: true },
      }),
      this.prisma.marketplaceListing.findUnique({
        where: { strategyId: subscription.strategyId },
        select: { creatorSharePct: true },
      }),
    ]);

    await this.creditWallet(
      renewalStrategy.creatorId,
      amount * (renewalListing?.creatorSharePct ?? 0.8),
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
    // Atomic, per-user serialized credit/debit. The advisory lock + ledger
    // recompute + insert all run inside one DB transaction so concurrent wallet
    // writes can't lost-update the balance. The unique `idempotencyKey` is the
    // ultimate double-credit guard (a duplicate insert rolls the txn back).
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;

        const existing = await tx.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          return existing;
        }

        const sums = await tx.walletTransaction.groupBy({
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

        return tx.walletTransaction.create({
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
      });
    } catch (e: any) {
      // Concurrent duplicate for the same idempotency key — return the row that
      // the other writer committed instead of surfacing a 500 to the webhook.
      if (e?.code === 'P2002') {
        const existing = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) return existing;
      }
      throw e;
    }
  }

  // NEW METHODS FOR PAYMENT MODELS
  async createPaymentRecord(
    userId: string,
    amount: number,
    method: string,
    description?: string,
  ) {
    return this.prisma.payment.create({
      data: {
        userId,
        amount,
        method: method as any,
        status: 'PENDING',
        description,
      },
    });
  }

  async completePaymentRecord(
    paymentId: string,
    razorpayOrderId?: string,
    razorpayPaymentId?: string,
  ) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        razorpayOrderId,
        razorpayPaymentId,
        completedAt: new Date(),
      },
    });
  }

  async generateInvoice(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const taxRate = parseFloat(process.env.TAX_RATE || '0.18');
    const tax = payment.amount * taxRate;
    const total = payment.amount + tax;

    return this.prisma.invoice.create({
      data: {
        userId: payment.userId,
        paymentId,
        invoiceNumber,
        amount: payment.amount,
        tax,
        total,
        currency: payment.currency,
        description: payment.description,
        items: [
          {
            description: payment.description || 'Service',
            amount: payment.amount,
          },
        ],
      },
    });
  }

  async getSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    });
    if (plans.length > 0) return plans;
    return PLATFORM_PLANS.filter((p) => p.monthlyPrice >= 0).map((p) => ({
      id: p.slug,
      name: p.name,
      description: p.description,
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.annualPrice,
      features: p.features,
      maxStrategies: p.maxStrategies,
      maxCopyTrades: p.maxCopyTrades,
      prioritySupport: p.prioritySupport,
    }));
  }

  async getCurrentSubscription(userId: string) {
    const sub = await this.prisma.userSubscription.findFirst({
      // Defensive: only treat as current if the period hasn't lapsed, in case
      // the expiry cron hasn't run yet. Avoids showing a paid plan as ACTIVE
      // past its expiry.
      where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      include: { plan: true },
      orderBy: { subscribedAt: 'desc' },
    });
    if (!sub) return null;

    const monthlyAmount =
      sub.billingCycle === 'ANNUAL'
        ? (sub.plan.annualPrice ?? sub.plan.monthlyPrice * 12) / 12
        : sub.plan.monthlyPrice;

    return {
      ...sub,
      planName: sub.plan.name,
      monthlyAmount,
      renewsAt: sub.nextBillingAt ?? sub.expiresAt,
    };
  }

  async createPlatformPlanOrder(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY',
  ) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { OR: [{ id: planId }, { name: planId }] },
    });
    if (!plan || plan.monthlyPrice <= 0) {
      throw new BadRequestException('Invalid subscription plan');
    }

    const amountRupees =
      billingCycle === 'ANNUAL'
        ? (plan.annualPrice ?? plan.monthlyPrice * 12)
        : plan.monthlyPrice;
    const amountPaise = Math.round(amountRupees * 100);

    return this.createRazorpayOrder(
      userId,
      amountPaise,
      'INR',
      `sub_${plan.id.slice(0, 8)}`,
      {
        type: 'platform_subscription',
        planId: plan.id,
        billingCycle,
      },
    );
  }

  private tierFromPlanName(name: string): SubscriptionTier {
    const slug = name.toLowerCase();
    if (slug.includes('enterprise') || slug.includes('business')) {
      return 'INSTITUTIONAL';
    }
    if (slug.includes('pro')) return 'ELITE';
    if (slug.includes('starter')) return 'PRO';
    return 'FREE';
  }

  private async activatePlatformSubscriptionFromPayment(
    userId: string,
    planId: string,
    billingCycle: string,
    paymentRef: string,
    amount: number,
  ) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) return;

    // Idempotency: the same Razorpay payment can arrive via both the client
    // `verify` call and the `payment.captured` webhook. `Payment.razorpayPaymentId`
    // is unique, so a second pass would throw P2002 (uncaught → 500 → Razorpay
    // retries forever). Short-circuit if we've already recorded this payment.
    const alreadyRecorded = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentRef },
      select: { id: true },
    });
    if (alreadyRecorded) return;

    const priorActive = await this.prisma.userSubscription.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });
    const isUpgrade = priorActive.some(
      (s) => s.planId !== planId && s.plan.monthlyPrice < plan.monthlyPrice,
    );

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'INR',
        method: 'UPI',
        status: 'COMPLETED',
        description: `${plan.name} subscription (${billingCycle})`,
        razorpayPaymentId: paymentRef,
      },
    });

    const expiresAt = new Date();
    if (billingCycle === 'ANNUAL') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await this.prisma.userSubscription.upsert({
      where: { userId_planId: { userId, planId } },
      create: {
        userId,
        planId,
        paymentId: payment.id,
        status: 'ACTIVE',
        billingCycle,
        expiresAt,
        nextBillingAt: expiresAt,
      },
      update: {
        paymentId: payment.id,
        status: 'ACTIVE',
        billingCycle,
        expiresAt,
        nextBillingAt: expiresAt,
        cancelledAt: null,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: this.tierFromPlanName(plan.name) },
    });

    await this.notifications.create(
      userId,
      'Subscription Active',
      `Your ${plan.name} plan is now active.`,
      'SUCCESS',
      '/settings/billing',
    );

    await this.affiliatesService.calculateCommission(
      userId,
      amount,
      paymentRef,
    );

    if (isUpgrade) {
      void this.agentEvents.emit({
        type: AGENT_EVENTS.SUBSCRIPTION_UPGRADED,
        entityType: 'subscription',
        entityId: planId,
        userId,
        payload: { planName: plan.name, amount },
        idempotencyKey: `sub-upgrade:${userId}:${planId}:${paymentRef}`,
      });
    }
  }

  async createSubscription(userId: string, planId: string, paymentId?: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    return this.prisma.userSubscription.create({
      data: {
        userId,
        planId,
        paymentId,
        status: 'ACTIVE',
        expiresAt,
        nextBillingAt: expiresAt,
      },
    });
  }

  async getPaymentHistory(userId: string, limit = 10, skip = 0) {
    const rows = await this.prisma.payment.findMany({
      where: { userId },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });

    const total = await this.prisma.payment.count({ where: { userId } });

    const payments = rows.map((p) => ({
      id: p.id,
      date: p.completedAt ?? p.createdAt,
      description: p.description ?? 'Payment',
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoice?.invoiceNumber,
    }));

    return { payments, total };
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }
}
