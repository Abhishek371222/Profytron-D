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
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { PLATFORM_PLANS } from '../../common/constants/pricing.constants';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';
import { EmailService } from '../email/email.service';
import { SubscriptionProvisioningService } from '../provisioning/subscription-provisioning.service';
import { requireActiveMt5Broker } from '../../common/utils/broker-requirement.util';
import { buildWalletPaymentFields } from '../wallet/wallet-payment.util';

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
    private readonly provisioning: SubscriptionProvisioningService,
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
          `Razorpay rejected key "${process.env.RAZORPAY_KEY_ID || '(missing)'}" (401 Authentication failed). ` +
            `Key ID and Key Secret do not match — regenerate both in Razorpay Dashboard → Account & Settings → API Keys (Test mode), ` +
            `then update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in apps/api/.env and restart the API.`,
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

    if (notes.type === 'marketplace_subscription' && notes.strategyId) {
      await this.activateSubscription(
        userId,
        notes.strategyId,
        notes.planType ?? 'MONTHLY',
        { id: paymentId, amount_total: stored.amount },
      );
      await this.redis.del(this.demoOrderRedisKey(orderId));
      return {
        success: true,
        orderId,
        paymentId,
        amount: amountRupees,
        currency: stored.currency,
        demo: true,
        provisioning: true,
      };
    }

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
    } else if (notes.type === 'marketplace_subscription' && notes.strategyId) {
      await this.activateSubscription(
        userId,
        notes.strategyId,
        notes.planType ?? 'MONTHLY',
        {
          id: paymentId,
          amount_total: stored.amount,
        },
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

    const isMarketplacePayment =
      orderNotes.type === 'marketplace_subscription' && orderNotes.strategyId;
    const isPlatformPayment =
      orderNotes.type === 'platform_subscription' && orderNotes.planId;

    if (!isMarketplacePayment) {
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
    }

    if (isPlatformPayment) {
      await this.activatePlatformSubscriptionFromPayment(
        creditUserId,
        orderNotes.planId,
        orderNotes.billingCycle ?? 'MONTHLY',
        razorpay_payment_id,
        amountRupees,
      );
    } else if (
      orderNotes.type === 'marketplace_subscription' &&
      orderNotes.strategyId
    ) {
      await this.activateSubscription(
        creditUserId,
        orderNotes.strategyId,
        orderNotes.planType ?? 'MONTHLY',
        {
          id: razorpay_payment_id,
          amount_total: order.amount,
        },
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
      title: isMarketplacePayment ? 'Payment Received' : 'Deposit Successful',
      message: isMarketplacePayment
        ? `Your bot subscription payment of ₹${amountRupees.toFixed(2)} was confirmed. Setup is in progress.`
        : `₹${amountRupees.toFixed(2)} has been added to your wallet.`,
      type: 'SUCCESS',
      category: 'PAYMENT',
      priority: 'HIGH',
      actionUrl: isMarketplacePayment ? '/my-bots' : '/wallet',
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
                  : orderNotes.type === 'marketplace_subscription'
                    ? 'Bot subscription'
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
    if (!signature?.trim()) {
      throw new ForbiddenException('Missing Stripe webhook signature');
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret?.trim()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException(
          'STRIPE_WEBHOOK_SECRET is required in production',
        );
      }
      throw new BadRequestException('Missing STRIPE_WEBHOOK_SECRET');
    }
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured.');
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
            const failedSubs =
              await this.prisma.userStrategySubscription.findMany({
                where: { stripeSubId },
                select: { id: true },
              });
            await this.prisma.userStrategySubscription.updateMany({
              where: { stripeSubId },
              data: {
                status: 'INACTIVE',
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              },
            });
            for (const sub of failedSubs) {
              await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
            }
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const stripeSub = event.data.object;
          const cancelledSubs =
            await this.prisma.userStrategySubscription.findMany({
              where: { stripeSubId: stripeSub.id },
              select: { id: true },
            });
          await this.prisma.userStrategySubscription.updateMany({
            where: { stripeSubId: stripeSub.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
            },
          });
          for (const sub of cancelledSubs) {
            await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
          }
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
    if (!signature?.trim()) {
      throw new ForbiddenException('Missing Razorpay webhook signature');
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret?.trim()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException(
          'RAZORPAY_WEBHOOK_SECRET is required in production',
        );
      }
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

    // Event-level idempotency: Razorpay retries webhook deliveries and the same
    // payment also arrives via the client `verify` call. Lock on the stable
    // (eventType + entityId) pair so concurrent/duplicate deliveries no-op
    // (mirrors the Stripe handler). Downstream writes are also idempotent, but
    // this prevents wasteful double-processing and races.
    const entityId =
      paymentEntity?.id ?? refundEntity?.id ?? subscriptionEntity?.id;
    if (eventType && entityId) {
      const idempotencyKey = `razorpay:event:${eventType}:${entityId}`;
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
    }

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

      if (notes.type === 'marketplace_subscription' && strategyId) {
        await this.activateSubscription(userId, strategyId, planType, {
          id: paymentEntity.id,
          amount_total: paymentEntity.amount,
        });
        void this.agentEvents.emit({
          type: AGENT_EVENTS.PAYMENT_SUCCEEDED,
          entityType: 'payment',
          entityId: paymentEntity.id,
          userId,
          payload: { strategyId, type: 'marketplace_subscription' },
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

      // If tied to a strategy subscription, mark it inactive and unlink CF
      if (strategyId) {
        const failedSubs = await this.prisma.userStrategySubscription.findMany({
          where: { userId, strategyId, status: 'ACTIVE' },
          select: { id: true },
        });
        await this.prisma.userStrategySubscription.updateMany({
          where: { userId, strategyId, status: 'ACTIVE' },
          data: { status: 'INACTIVE' },
        });
        for (const sub of failedSubs) {
          await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
        }
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
        const cancelledSubs =
          await this.prisma.userStrategySubscription.findMany({
            where: { userId, strategyId },
            select: { id: true },
          });
        await this.prisma.userStrategySubscription.updateMany({
          where: { userId, strategyId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        for (const sub of cancelledSubs) {
          await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
        }
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
            name: true,
            creatorId: true,
          },
        },
      },
    });

    if (!listing) {
      throw new BadRequestException('Strategy listing not found');
    }

    const followerBroker = await requireActiveMt5Broker(this.prisma, userId);

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

    const followerBrokerId = followerBroker.id;

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
          status: SubscriptionStatus.PROVISIONING,
          planType,
          stripeSubId: paymentReference,
          brokerAccountId: followerBrokerId,
          subscribedAt: new Date(),
          expiresAt,
          trialEndsAt: null,
          lotMultiplier: 1,
          executionProfileJson: {
            sizingMode: 'MULTIPLIER',
            copyFactoryPending: true,
          },
        },
        update: {
          status: SubscriptionStatus.PROVISIONING,
          planType,
          stripeSubId: paymentReference ?? undefined,
          brokerAccountId: followerBrokerId,
          subscribedAt: new Date(),
          expiresAt,
          trialEndsAt: null,
          lotMultiplier: 1,
          executionProfileJson: {
            sizingMode: 'MULTIPLIER',
            copyFactoryPending: true,
          },
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

    const subscription = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
      select: { id: true },
    });
    if (subscription) {
      await this.provisioning.startProvisioning(
        subscription.id,
        userId,
        strategyId,
        listing.strategy.name,
      );
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
        ...buildWalletPaymentFields({
          type: 'SUBSCRIPTION_PAYMENT',
          direction: 'OUT',
          userId,
          externalTxnId: reference,
          metadata,
        }),
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

        // A refund/clawback (OUT) can legitimately drive the wallet negative if
        // the user already spent the funds — that's correct accounting (they
        // owe the platform). But it must never happen silently: flag it so ops
        // can reconcile/recover instead of it disappearing into the ledger.
        if (direction === 'OUT' && balanceAfter < 0) {
          this.logger.warn(
            `Wallet clawback drove user ${userId} negative: balance ${currentBalance} -> ${balanceAfter} (${type}, key ${idempotencyKey}). Manual reconciliation required.`,
          );
        }

        return tx.walletTransaction.create({
          data: {
            userId,
            type,
            direction,
            amount: normalizedAmount,
            balanceAfter,
            status: 'CONFIRMED',
            idempotencyKey,
            ...buildWalletPaymentFields({
              type,
              direction,
              userId,
              externalTxnId:
                typeof metadata?.paymentId === 'string'
                  ? metadata.paymentId
                  : typeof metadata?.orderId === 'string'
                    ? metadata.orderId
                    : idempotencyKey,
              metadata: metadata as Record<string, unknown>,
            }),
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
    if (slug.includes('enterprise')) return 'INSTITUTIONAL';
    if (slug.includes('business')) return 'BUSINESS';
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

    // `razorpayPaymentId` is unique. The verify call and the webhook can both
    // clear the `alreadyRecorded` read above and then race on insert; the loser
    // hits P2002. Treat that as "already processed" instead of bubbling a 500
    // (which would make Razorpay retry forever).
    let payment: { id: string };
    try {
      payment = await this.prisma.payment.create({
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
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        return;
      }
      throw err;
    }

    // Issue a tax invoice for the platform purchase. Best-effort: a billing
    // record must never block subscription activation. paymentId is unique, so
    // this is naturally idempotent across verify/webhook replays.
    try {
      await this.generateInvoice(payment.id);
    } catch (err) {
      this.logger.warn(
        `Invoice generation failed for payment ${payment.id}: ${(err as Error).message}`,
      );
    }

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
