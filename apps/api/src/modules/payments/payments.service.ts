import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
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
import {
  ProfitShareState,
  SubscriptionBillingModel,
  SubscriptionTier,
  SubscriptionStatus,
} from '@prisma/client';
import { PLATFORM_PLANS } from '../../common/constants/pricing.constants';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';
import { EmailService } from '../email/email.service';
import { SubscriptionProvisioningService } from '../provisioning/subscription-provisioning.service';
import { requireActiveMt5Broker } from '../../common/utils/broker-requirement.util';
import { buildWalletPaymentFields } from '../wallet/wallet-payment.util';
import { CryptoService } from '../../common/crypto.service';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';

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
    private readonly cryptoService: CryptoService,
    private readonly mtAdapter: MetaTraderAdapter,
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

  private isRazorpayDemoMode(): boolean {
    return (
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test') &&
      process.env.RAZORPAY_KEY_ID === 'DEMO_KEY' &&
      process.env.ALLOW_DEMO_PAYMENTS === 'true'
    );
  }

  private demoOrderRedisKey(orderId: string): string {
    return `razorpay:demo:${orderId}`;
  }

  private isProfitShareBilling(value?: string | null): boolean {
    return value === SubscriptionBillingModel.PROFIT_SHARE;
  }

  private async captureEquityBaseline(
    brokerAccountId: string,
  ): Promise<number> {
    const broker = await this.prisma.brokerAccount.findUnique({
      where: { id: brokerAccountId },
      select: { credentialsEncrypted: true },
    });
    if (!broker) {
      throw new BadRequestException('Broker account not found');
    }

    const creds = JSON.parse(
      this.cryptoService.decrypt(broker.credentialsEncrypted),
    ) as { metaApiAccountId?: string; metaApiRegion?: string };
    if (!creds.metaApiAccountId) {
      throw new BadRequestException('MT5 account is not ready for live equity');
    }

    const equity = await this.mtAdapter.getLiveEquity(
      creds.metaApiAccountId,
      creds.metaApiRegion,
    );
    if (equity == null || equity <= 0) {
      throw new BadRequestException(
        'Could not read live MT5 equity for profit-share baseline',
      );
    }
    return equity;
  }

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
      const isProfitShare = this.isProfitShareBilling(notes.billingModel);
      if (isProfitShare) {
        await this.creditWallet(
          userId,
          amountRupees,
          'DEPOSIT',
          {
            source: 'profit_share_upfront',
            orderId,
            paymentId,
            strategyId: notes.strategyId,
            billingModel: notes.billingModel,
          },
          `profit_share_upfront_${paymentId}`,
        );
      }
      await this.activateSubscription(
        userId,
        notes.strategyId,
        notes.planType ?? 'MONTHLY',
        {
          id: paymentId,
          amount_total: stored.amount,
          billingModel: notes.billingModel,
          profitSharePct: notes.profitSharePct,
        },
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

    const isPlatformDemo =
      notes.type === 'platform_subscription' && notes.planId;
    const isMarketplaceDemo =
      notes.type === 'marketplace_subscription' && notes.strategyId;
    const isProfitShareDemo =
      Boolean(isMarketplaceDemo) &&
      this.isProfitShareBilling(notes.billingModel);

    // Align with live verifyPayment: never wallet-credit pure platform checkout.
    if ((!isMarketplaceDemo && !isPlatformDemo) || isProfitShareDemo) {
      await this.creditWallet(
        userId,
        amountRupees,
        'DEPOSIT',
        {
          source: isProfitShareDemo ? 'profit_share_upfront' : 'razorpay_demo',
          orderId,
          paymentId,
        },
        isProfitShareDemo
          ? `profit_share_upfront_${paymentId}`
          : `razorpay_payment_${paymentId}`,
      );
    }

    if (isPlatformDemo) {
      await this.activatePlatformSubscriptionFromPayment(
        userId,
        notes.planId,
        notes.billingCycle ?? 'MONTHLY',
        paymentId,
        amountRupees,
      );
    } else if (isMarketplaceDemo) {
      await this.activateSubscription(
        userId,
        notes.strategyId,
        notes.planType ?? 'MONTHLY',
        {
          id: paymentId,
          amount_total: stored.amount,
          billingModel: notes.billingModel,
          profitSharePct: notes.profitSharePct,
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
      isPlatformDemo ? 'Subscription Active' : 'Deposit Successful',
      isPlatformDemo
        ? `Demo mode: platform plan payment of ₹${amountRupees.toFixed(2)} confirmed.`
        : `₹${amountRupees.toFixed(2)} has been added to your wallet (demo mode).`,
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

    const isProfitShareMarketplace =
      Boolean(isMarketplacePayment) &&
      this.isProfitShareBilling(orderNotes.billingModel);

    // Platform plan checkout activates entitlement only — never wallet DEPOSIT.
    // Marketplace fixed subscriptions do not deposit. Profit-share upfront does.
    // Wallet top-up (no subscription type notes) deposits.
    const shouldCreditWallet =
      isProfitShareMarketplace || (!isMarketplacePayment && !isPlatformPayment);

    if (shouldCreditWallet) {
      await this.creditWallet(
        creditUserId,
        amountRupees,
        'DEPOSIT',
        {
          source: isProfitShareMarketplace
            ? 'profit_share_upfront'
            : 'razorpay_checkout',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          strategyId: orderNotes.strategyId,
          billingModel: orderNotes.billingModel,
        },
        isProfitShareMarketplace
          ? `profit_share_upfront_${razorpay_payment_id}`
          : `razorpay_payment_${razorpay_payment_id}`,
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
          billingModel: orderNotes.billingModel,
          profitSharePct: orderNotes.profitSharePct,
        },
      );
    } else if (shouldCreditWallet) {
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

    const notifyTitle = isPlatformPayment
      ? 'Subscription Payment Received'
      : isMarketplacePayment
        ? 'Payment Received'
        : 'Deposit Successful';
    const notifyMessage = isPlatformPayment
      ? `Your platform subscription payment of ₹${amountRupees.toFixed(2)} was confirmed.`
      : isMarketplacePayment
        ? isProfitShareMarketplace
          ? `₹${amountRupees.toFixed(2)} was added to your wallet for profit sharing. Bot setup is in progress.`
          : `Your bot subscription payment of ₹${amountRupees.toFixed(2)} was confirmed. Setup is in progress.`
        : `₹${amountRupees.toFixed(2)} has been added to your wallet.`;
    const notifyUrl = isPlatformPayment
      ? '/billing'
      : isMarketplacePayment
        ? '/my-bots'
        : '/wallet';

    await this.notifications.create({
      userId: creditUserId,
      title: notifyTitle,
      message: notifyMessage,
      type: 'SUCCESS',
      category: 'PAYMENT',
      priority: 'HIGH',
      actionUrl: notifyUrl,
      sendPush: true,
    });

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
            if (this.isProfitShareBilling(metadata.billingModel)) {
              await this.creditWallet(
                metadata.userId,
                Number(session.amount_total || 0) / 100,
                'DEPOSIT',
                {
                  source: 'profit_share_upfront',
                  paymentId: session.id,
                  strategyId: metadata.strategyId,
                  billingModel: metadata.billingModel,
                },
                `profit_share_upfront_${session.id}`,
              );
            }
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
                where: { stripeSubId, status: 'ACTIVE' },
                select: { id: true },
              });
            if (failedSubs.length) {
              await this.prisma.userStrategySubscription.updateMany({
                where: {
                  id: { in: failedSubs.map((s) => s.id) },
                  status: 'ACTIVE',
                },
                data: {
                  status: 'INACTIVE',
                  expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                },
              });
              for (const sub of failedSubs) {
                await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
              }
            } else {
              this.logger.warn(
                `STRIPE_PAYMENT_FAILED_CONFLICT: no ACTIVE subscriptions for stripeSubId ${stripeSubId} (already modified by another process)`,
              );
            }
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const stripeSub = event.data.object;
          const cancellableStatuses: SubscriptionStatus[] = [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAUSED,
            SubscriptionStatus.PROVISIONING,
          ];
          const cancelledSubs =
            await this.prisma.userStrategySubscription.findMany({
              where: {
                stripeSubId: stripeSub.id,
                status: { in: cancellableStatuses },
              },
              select: { id: true },
            });
          if (cancelledSubs.length) {
            await this.prisma.userStrategySubscription.updateMany({
              where: {
                id: { in: cancelledSubs.map((s) => s.id) },
                status: { in: cancellableStatuses },
              },
              data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
              },
            });
            for (const sub of cancelledSubs) {
              await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
            }
          } else {
            this.logger.warn(
              `STRIPE_SUBSCRIPTION_DELETED_CONFLICT: no cancellable subscriptions for stripeSubId ${stripeSub.id} (already modified by another process)`,
            );
          }
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object;
          await this.handleStripeChargeRefunded(charge);
          break;
        }
        case 'payment_intent.succeeded': {
          // Wallet deposits use PaymentIntent; canonical /webhooks/stripe must confirm them
          // even when deploy only wires this endpoint (not /wallet/webhook).
          const intent = event.data.object;
          const userId = intent?.metadata?.userId;
          if (userId && intent?.id) {
            try {
              const pending = await this.prisma.walletTransaction.findUnique({
                where: { idempotencyKey: intent.id },
              });
              if (pending && pending.userId === userId) {
                if (pending.status !== 'CONFIRMED') {
                  const sums = await this.prisma.walletTransaction.groupBy({
                    by: ['direction'],
                    where: { userId, status: 'CONFIRMED' },
                    _sum: { amount: true },
                  });
                  const credits =
                    sums.find((s) => s.direction === 'IN')?._sum.amount ?? 0;
                  const debits =
                    sums.find((s) => s.direction === 'OUT')?._sum.amount ?? 0;
                  await this.prisma.walletTransaction.update({
                    where: { id: pending.id },
                    data: {
                      status: 'CONFIRMED',
                      balanceAfter: credits - debits + pending.amount,
                      description: 'Wallet deposit confirmed',
                    },
                  });
                }
              } else if (
                !pending &&
                Number(intent.amount_received || intent.amount || 0) > 0
              ) {
                // Deposit row missing (race) — credit via idempotent wallet deposit path
                await this.creditWallet(
                  userId,
                  Number(intent.amount_received || intent.amount || 0) / 100,
                  'DEPOSIT',
                  {
                    source: 'stripe_payment_intent',
                    paymentIntentId: intent.id,
                  },
                  `stripe_deposit_${intent.id}`,
                );
              }
            } catch (err) {
              this.logger.error(
                `payment_intent.succeeded handling failed for ${intent.id}`,
                err instanceof Error ? err.stack : err,
              );
              throw err;
            }
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

    const entityId =
      paymentEntity?.id ?? refundEntity?.id ?? subscriptionEntity?.id;
    let razorpayEventKey: string | null = null;
    if (eventType && entityId) {
      razorpayEventKey = `razorpay:event:${eventType}:${entityId}`;
      const lock = await this.redis.set(
        razorpayEventKey,
        'processing',
        'EX',
        86400,
        'NX',
      );
      if (lock !== 'OK') {
        return { ok: true, duplicate: true };
      }
    }

    try {
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
          const isProfitShare = this.isProfitShareBilling(notes.billingModel);
          if (isProfitShare) {
            await this.creditWallet(
              userId,
              Number(paymentEntity.amount || 0) / 100,
              'DEPOSIT',
              {
                source: 'profit_share_upfront',
                paymentId: paymentEntity.id,
                strategyId,
                billingModel: notes.billingModel,
              },
              `profit_share_upfront_${paymentEntity.id}`,
            );
          }
          await this.activateSubscription(userId, strategyId, planType, {
            id: paymentEntity.id,
            amount_total: paymentEntity.amount,
            billingModel: notes.billingModel,
            profitSharePct: notes.profitSharePct,
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

        if (strategyId) {
          const failedSubs =
            await this.prisma.userStrategySubscription.findMany({
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

      if (eventType === 'refund.created' && refundEntity?.id) {
        await this.handleRazorpayRefundCreated(refundEntity);
      }

      if (
        eventType === 'subscription.cancelled' &&
        subscriptionEntity?.notes?.userId
      ) {
        const userId = subscriptionEntity.notes.userId;
        const strategyId = subscriptionEntity.notes.strategyId;
        if (strategyId) {
          const cancellableStatuses: SubscriptionStatus[] = [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAUSED,
            SubscriptionStatus.PROVISIONING,
          ];
          const cancelledSubs =
            await this.prisma.userStrategySubscription.findMany({
              where: {
                userId,
                strategyId,
                status: { in: cancellableStatuses },
              },
              select: { id: true },
            });
          if (cancelledSubs.length) {
            await this.prisma.userStrategySubscription.updateMany({
              where: {
                id: { in: cancelledSubs.map((s) => s.id) },
                status: { in: cancellableStatuses },
              },
              data: { status: 'CANCELLED', cancelledAt: new Date() },
            });
            for (const sub of cancelledSubs) {
              await this.copyFactorySync.enqueueUnlinkSubscription(sub.id);
            }
          } else {
            this.logger.warn(
              `RAZORPAY_SUBSCRIPTION_CANCELLED_CONFLICT: no cancellable subscriptions for user ${userId}, strategy ${strategyId} (already modified by another process)`,
            );
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
    } catch (error) {
      if (razorpayEventKey) {
        await this.redis.del(razorpayEventKey).catch(() => undefined);
      }
      throw error;
    }
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
    const billingModel = this.isProfitShareBilling(
      stripeObject.billingModel ?? stripeObject.metadata?.billingModel,
    )
      ? SubscriptionBillingModel.PROFIT_SHARE
      : SubscriptionBillingModel.FIXED;
    const isProfitShare =
      billingModel === SubscriptionBillingModel.PROFIT_SHARE;
    const profitSharePct = Number(
      stripeObject.profitSharePct ??
        stripeObject.metadata?.profitSharePct ??
        30,
    );
    const equityBaselineAtSubscribe = isProfitShare
      ? await this.captureEquityBaseline(followerBroker.id)
      : null;

    const currentPeriodEndUnix =
      stripeObject.current_period_end ||
      (stripeObject.subscription_details?.current_period_end as
        | number
        | undefined);
    const expiresAt = isProfitShare
      ? null
      : currentPeriodEndUnix
        ? new Date(currentPeriodEndUnix * 1000)
        : planType === 'LIFETIME'
          ? null
          : new Date(
              Date.now() +
                (planType === 'ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000,
            );

    const paidAmount = Number(stripeObject.amount_total || 0) / 100;
    const marketplaceRevenue = isProfitShare ? 0 : paidAmount;
    const creatorShare = paidAmount * (listing.creatorSharePct ?? 0.8);
    const platformShare = isProfitShare
      ? 0
      : Math.max(0, paidAmount - creatorShare);

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
          billingModel,
          profitSharePct: isProfitShare ? profitSharePct : null,
          equityBaselineAtSubscribe,
          profitShareAccruedUnsettled: isProfitShare ? 0 : null,
          profitShareState: isProfitShare
            ? ProfitShareState.PROFIT_SHARE_OK
            : null,
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
          billingModel,
          profitSharePct: isProfitShare ? profitSharePct : null,
          equityBaselineAtSubscribe,
          profitShareAccruedUnsettled: isProfitShare ? 0 : null,
          profitShareState: isProfitShare
            ? ProfitShareState.PROFIT_SHARE_OK
            : null,
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
          totalRevenue: { increment: marketplaceRevenue },
          lastPayoutAt: new Date(),
        },
      });

      await tx.strategy.update({
        where: { id: strategyId },
        data: {
          copiesCount: { increment: 1 },
          totalRevenue: { increment: marketplaceRevenue },
        },
      });

      await tx.auditLog.create({
        data: {
          eventType: 'MARKETPLACE_PAYOUT_RECORDED',
          userId,
          detailsJson: {
            strategyId,
            paidAmount,
            creatorShare: isProfitShare ? 0 : creatorShare,
            platformShare,
            planType,
            billingModel,
            equityBaselineAtSubscribe,
            stripePaymentId: stripeObject.id,
          },
          triggeredBy: listing.strategy.creatorId,
        },
      });
    });

    if (!isProfitShare && paidAmount > 0) {
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

    // Fixed marketplace purchases get a Payment + Invoice for buyer billing history
    // (profit-share upfront is walleted separately and is not a line-item invoice here).
    if (!isProfitShare && paidAmount > 0 && paymentReference) {
      await this.ensureMarketplacePaymentInvoice({
        userId,
        amount: paidAmount,
        description: `Marketplace: ${listing.strategy.name} (${planType})`,
        paymentReference,
        strategyId,
        currency:
          typeof stripeObject.currency === 'string'
            ? stripeObject.currency.toUpperCase()
            : 'INR',
        isRazorpay: String(paymentReference).startsWith('pay_'),
      });
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

    if (
      subscription.status === 'CANCELLED' ||
      subscription.cancelledAt != null
    ) {
      this.logger.warn(
        `Skipping renewal for subscription ${subscription.id} — already cancelled by user (cancelledAt=${subscription.cancelledAt?.toISOString() ?? 'unknown'}), refusing to reactivate`,
      );
      return;
    }

    const amount = Number(invoice.amount_paid || 0) / 100;
    const expiresAt =
      this.getPeriodEndDate(invoice) ||
      (subscription.planType === 'ANNUAL'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    let renewed = false;
    await this.prisma.$transaction(async (tx) => {
      // Conditional write closes TOCTOU: a cancel landing between the
      // pre-check and this write must not silently reactivate the sub.
      const updated = await tx.userStrategySubscription.updateMany({
        where: {
          id: subscription.id,
          cancelledAt: null,
          status: { not: 'CANCELLED' },
        },
        data: {
          status: 'ACTIVE',
          expiresAt,
          cancelledAt: null,
        },
      });

      if (updated.count === 0) {
        this.logger.warn(
          `Skipping renewal for subscription ${subscription.id} — concurrent cancel won the race`,
        );
        return;
      }

      renewed = true;

      await tx.marketplaceListing.update({
        where: { strategyId: subscription.strategyId },
        data: { totalRevenue: { increment: amount } },
      });

      await tx.strategy.update({
        where: { id: subscription.strategyId },
        data: { totalRevenue: { increment: amount } },
      });
    });

    if (!renewed) {
      return;
    }

    // Record history as Payment row only — card renewals must NOT create a wallet OUT
    // against the buyer (that wrongly debits deposits unrelated to the charge).
    try {
      const pi =
        typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent
          : invoice.id;
      await this.prisma.payment.create({
        data: {
          userId: subscription.userId,
          amount,
          currency: String(invoice.currency || 'usd').toUpperCase(),
          method: 'STRIPE',
          status: 'COMPLETED',
          stripePaymentId: pi,
          description: `Marketplace renewal (${subscription.strategyId})`,
          completedAt: new Date(),
          metadataJson: {
            source: 'stripe_invoice',
            invoiceId: invoice.id,
            stripeSubId,
            strategyId: subscription.strategyId,
          },
        },
      });
    } catch (err: unknown) {
      if (
        !(
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code?: string }).code === 'P2002'
        )
      ) {
        this.logger.warn(
          `Renewal payment record create failed for invoice ${invoice.id}: ${
            err instanceof Error ? err.message : 'unknown'
          }`,
        );
      }
    }

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
    try {
      const transaction = await this.prisma.$transaction(async (tx) => {
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
              metadata: metadata,
            }),
          },
        });
      });
      if (transaction.direction === 'IN') {
        await this.reconcileProfitShareAutoResume(userId);
      }
      return transaction;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const existing = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existing) return existing;
      }
      throw e;
    }
  }

  private async reconcileProfitShareAutoResume(userId: string) {
    const sums = await this.prisma.walletTransaction.groupBy({
      by: ['direction'],
      where: { userId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });
    const credits =
      sums.find((item) => item.direction === 'IN')?._sum.amount ?? 0;
    const debits =
      sums.find((item) => item.direction === 'OUT')?._sum.amount ?? 0;
    const available = credits - debits;

    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.PAUSED,
        billingModel: SubscriptionBillingModel.PROFIT_SHARE,
        profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        profitShareAccruedUnsettled: { not: null },
      },
      select: { id: true, profitShareAccruedUnsettled: true },
    });

    const due = subscriptions.filter(
      (subscription) =>
        (subscription.profitShareAccruedUnsettled ?? 0) < available,
    );
    const dueWithLiability = due
      .filter((s) => (s.profitShareAccruedUnsettled ?? 0) > 0)
      .map((s) => s.id);
    const dueOk = due
      .filter((s) => (s.profitShareAccruedUnsettled ?? 0) <= 0)
      .map((s) => s.id);

    if (dueWithLiability.length) {
      await this.prisma.userStrategySubscription.updateMany({
        where: {
          id: { in: dueWithLiability },
          status: SubscriptionStatus.PAUSED,
          profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
          profitShareState: ProfitShareState.PROFIT_SHARE_DUE,
        },
      });
    }
    if (dueOk.length) {
      await this.prisma.userStrategySubscription.updateMany({
        where: {
          id: { in: dueOk },
          status: SubscriptionStatus.PAUSED,
          profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
          profitShareState: ProfitShareState.PROFIT_SHARE_OK,
        },
      });
    }
    for (const subscription of due) {
      await this.copyFactorySync.enqueueLinkSubscription(subscription.id);
    }
  }

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
    const existing = await this.prisma.invoice.findUnique({
      where: { paymentId },
    });
    if (existing) {
      return existing;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Deterministic unique number — paymentId is unique so collisions are impossible.
    const compactId = payment.id.replace(/-/g, '').slice(0, 12).toUpperCase();
    const issued = payment.completedAt ?? payment.createdAt;
    const ymd = [
      issued.getUTCFullYear(),
      String(issued.getUTCMonth() + 1).padStart(2, '0'),
      String(issued.getUTCDate()).padStart(2, '0'),
    ].join('');
    const invoiceNumber = `INV-${ymd}-${compactId}`;

    const taxRate = parseFloat(process.env.TAX_RATE || '0.18');
    const tax = Math.round(payment.amount * taxRate * 100) / 100;
    const total = Math.round((payment.amount + tax) * 100) / 100;

    const meta =
      payment.metadataJson && typeof payment.metadataJson === 'object'
        ? (payment.metadataJson as Record<string, unknown>)
        : {};

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
        // Relative download path — PDFs generated on demand (no object storage required)
        pdfUrl: `/v1/subscriptions/invoices/${paymentId}/download`,
        items: [
          {
            description: payment.description || 'Service',
            amount: payment.amount,
            taxRate,
            tax,
            quantity: 1,
            currency: payment.currency,
            paymentId: payment.id,
            razorpayPaymentId: payment.razorpayPaymentId ?? null,
            stripePaymentId: payment.stripePaymentId ?? null,
            ...meta,
          },
        ],
      },
    });
  }

  async getSubscriptionPlans() {
    const cacheKey = 'api:cache:subscription-plans:v2';
    try {
      const hit = await this.redis.get(cacheKey);
      if (hit) return JSON.parse(hit);
    } catch (err) {
      this.logger.debug(
        `subscription plans cache miss/read error: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    });

    const enrich = (row: {
      id: string;
      name: string;
      description: string | null;
      monthlyPrice: number;
      annualPrice: number | null;
      features: unknown;
      maxStrategies: number | null;
      maxCopyTrades: number | null;
      prioritySupport: boolean | null;
    }) => {
      const cfg = PLATFORM_PLANS.find(
        (p) =>
          p.name.toLowerCase() === row.name.toLowerCase() ||
          p.slug === row.id ||
          p.slug === row.name.toLowerCase(),
      );
      return {
        id: row.id,
        name: row.name,
        description: row.description ?? cfg?.description ?? '',
        monthlyPrice: row.monthlyPrice,
        annualPrice:
          row.annualPrice ?? cfg?.annualPrice ?? row.monthlyPrice * 12,
        features: Array.isArray(row.features)
          ? row.features
          : (cfg?.features ?? []),
        maxStrategies: row.maxStrategies ?? cfg?.maxStrategies ?? 1,
        maxCopyTrades: row.maxCopyTrades ?? cfg?.maxCopyTrades ?? 1,
        prioritySupport: row.prioritySupport ?? cfg?.prioritySupport ?? false,
        trialEligible: cfg?.trialEligible ?? false,
        slug: cfg?.slug ?? row.name.toLowerCase().replace(/\s+/g, '-'),
        tier: cfg?.tier ?? 'FREE',
        maxBrokerAccounts: cfg?.maxBrokerAccounts ?? 1,
        maxTeamMembers: cfg?.maxTeamMembers ?? 0,
        recommended: cfg?.recommended ?? false,
        cta: cfg?.cta ?? 'Choose plan',
        ctaHref: cfg?.ctaHref ?? '/settings/billing',
      };
    };

    const result =
      plans.length > 0
        ? plans.map(enrich)
        : PLATFORM_PLANS.filter((p) => p.monthlyPrice >= 0).map((p) => ({
            id: p.slug,
            name: p.name,
            description: p.description,
            monthlyPrice: p.monthlyPrice,
            annualPrice: p.annualPrice,
            features: p.features,
            maxStrategies: p.maxStrategies,
            maxCopyTrades: p.maxCopyTrades,
            prioritySupport: p.prioritySupport,
            trialEligible: p.trialEligible,
            slug: p.slug,
            tier: p.tier,
            maxBrokerAccounts: p.maxBrokerAccounts,
            maxTeamMembers: p.maxTeamMembers,
            recommended: p.recommended,
            cta: p.cta,
            ctaHref: p.ctaHref,
          }));

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 120);
    } catch (err) {
      this.logger.debug(
        `subscription plans cache write error: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
    return result;
  }

  async getCurrentSubscription(userId: string) {
    const sub = await this.prisma.userSubscription.findFirst({
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

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.userSubscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { subscribedAt: 'desc' },
    });
    if (!sub) {
      throw new NotFoundException('No active subscription to cancel');
    }
    if (sub.cancelledAt) {
      return sub;
    }
    return this.prisma.userSubscription.update({
      where: { id: sub.id },
      data: { cancelledAt: new Date(), autoRenewal: false },
    });
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

  /**
   * Grants a 7-day, no-payment trial of a Starter/Pro-equivalent plan.
   * No gateway call is made — entitlement is granted directly and reclaimed
   * by the existing expirePlatformSubscriptions() cron once expiresAt passes.
   */
  async startPlatformTrial(userId: string, planId: string) {
    if (process.env.PLATFORM_TRIALS_ENABLED === 'false') {
      throw new ForbiddenException('Free trials are currently unavailable.');
    }

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { OR: [{ id: planId }, { name: planId }] },
    });
    if (!plan) {
      throw new BadRequestException('Invalid subscription plan');
    }

    const planConfig = PLATFORM_PLANS.find(
      (p) => p.name.toLowerCase() === plan.name.toLowerCase(),
    );
    if (!planConfig?.trialEligible) {
      throw new BadRequestException(
        'This plan is not eligible for a free trial',
      );
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Everything that decides eligibility AND writes the result must happen
    // inside one transaction, behind a row lock on this user, so concurrent
    // trial-start requests for the same user serialize instead of racing:
    // the second request only proceeds past FOR UPDATE once the first has
    // committed (or rolled back), and then re-reads the now-current state.
    const { sub: subscription, user } = await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

        const lockedUser = await tx.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            fullName: true,
            emailVerified: true,
            hasUsedPlatformTrial: true,
          },
        });
        if (!lockedUser) {
          throw new NotFoundException('User not found');
        }
        if (!lockedUser.emailVerified) {
          throw new ForbiddenException(
            'Please verify your email before starting a trial.',
          );
        }
        if (lockedUser.hasUsedPlatformTrial) {
          throw new ForbiddenException(
            'You have already used your free trial.',
          );
        }

        const existingActive = await tx.userSubscription.findFirst({
          where: { userId, status: 'ACTIVE' },
        });
        if (existingActive) {
          throw new ForbiddenException(
            'You already have an active subscription.',
          );
        }

        const sub = await tx.userSubscription.upsert({
          where: { userId_planId: { userId, planId: plan.id } },
          create: {
            userId,
            planId: plan.id,
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            autoRenewal: false,
            subscribedAt: now,
            expiresAt: trialEndsAt,
            isTrial: true,
            trialStartedAt: now,
            trialEndsAt,
          },
          update: {
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            autoRenewal: false,
            subscribedAt: now,
            expiresAt: trialEndsAt,
            cancelledAt: null,
            isTrial: true,
            trialStartedAt: now,
            trialEndsAt,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: this.tierFromPlanName(plan.name),
            hasUsedPlatformTrial: true,
          },
        });

        return { sub, user: lockedUser };
      },
      // A burst of concurrent requests for the same user serializes behind
      // the row lock above; Prisma's 5s default interactive-transaction
      // timeout can be exceeded purely by queueing (confirmed under a
      // 10-concurrent-request live test), which would otherwise surface as
      // a raw 500 instead of a clean rejection. 10s gives comfortable
      // headroom without letting a genuinely stuck transaction hang long.
      { timeout: 10000 },
    );

    await this.notifications
      .create(
        userId,
        'Trial Started',
        `Your ${plan.name} trial is active for 7 days — no payment required.`,
        'SUCCESS',
        '/settings/billing',
      )
      .catch(() => undefined);

    await this.emailService
      .sendTrialStartedEmail(
        user.email,
        user.fullName,
        plan.name,
        trialEndsAt,
        userId,
      )
      .catch(() => undefined);

    void this.agentEvents.emit({
      type: AGENT_EVENTS.TRIAL_STARTED,
      entityType: 'subscription',
      entityId: subscription.id,
      userId,
      payload: {
        planId: plan.id,
        planName: plan.name,
        trialEndsAt: trialEndsAt.toISOString(),
      },
      idempotencyKey: `trial-started:${subscription.id}`,
    });

    return subscription;
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

    const alreadyRecorded = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentRef },
      select: { id: true },
    });
    if (alreadyRecorded) return;

    const now = new Date();
    const priorActive = await this.prisma.userSubscription.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
    });

    const priorPaidOther = priorActive.filter(
      (s) => s.planId !== planId && !s.isTrial,
    );
    const priorMaxPrice = Math.max(
      0,
      ...priorActive.map((s) => s.plan.monthlyPrice),
    );
    const isUpgrade =
      priorPaidOther.length > 0 && plan.monthlyPrice > priorMaxPrice;
    const isDowngrade =
      priorPaidOther.length > 0 && plan.monthlyPrice < priorMaxPrice;

    // Basic time proration: unused days on the highest prior paid plan carry forward
    // (no gateway credit — prepaid one-shot charges the new period amount in full).
    let remainingMs = 0;
    for (const prior of priorPaidOther) {
      if (prior.expiresAt && prior.expiresAt.getTime() > now.getTime()) {
        remainingMs = Math.max(
          remainingMs,
          prior.expiresAt.getTime() - now.getTime(),
        );
      }
    }

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
          completedAt: now,
          metadataJson: {
            type: 'platform_subscription',
            planId,
            billingCycle,
            isUpgrade,
            isDowngrade,
            carriedForwardMs: remainingMs,
            replacedPlanIds: priorPaidOther.map((s) => s.planId),
          },
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

    try {
      await this.generateInvoice(payment.id);
    } catch (err) {
      this.logger.warn(
        `Invoice generation failed for payment ${payment.id}: ${(err as Error).message}`,
      );
    }

    const periodMs =
      billingCycle === 'ANNUAL'
        ? 365 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + periodMs + remainingMs);

    const samePlanTrial = priorActive.find(
      (s) => s.planId === planId && s.isTrial && !s.trialConvertedAt,
    );

    // Replace every other ACTIVE platform sub (paid or trial) so only one ACTIVE remains.
    const othersToCancel = priorActive.filter((s) => s.planId !== planId);

    await this.prisma.$transaction(async (tx) => {
      if (othersToCancel.length) {
        await tx.userSubscription.updateMany({
          where: {
            id: { in: othersToCancel.map((s) => s.id) },
            status: 'ACTIVE',
          },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            autoRenewal: false,
            ...(othersToCancel.some((s) => s.isTrial)
              ? { trialConvertedAt: now }
              : {}),
          },
        });
        // Stamp trial conversion only on trial rows being superseded
        for (const trial of othersToCancel.filter(
          (s) => s.isTrial && !s.trialConvertedAt,
        )) {
          await tx.userSubscription.update({
            where: { id: trial.id },
            data: { trialConvertedAt: now },
          });
        }
      }

      await tx.userSubscription.upsert({
        where: { userId_planId: { userId, planId } },
        create: {
          userId,
          planId,
          paymentId: payment.id,
          status: 'ACTIVE',
          billingCycle,
          autoRenewal: true,
          expiresAt,
          nextBillingAt: expiresAt,
        },
        update: {
          paymentId: payment.id,
          status: 'ACTIVE',
          billingCycle,
          autoRenewal: true,
          expiresAt,
          nextBillingAt: expiresAt,
          cancelledAt: null,
          ...(samePlanTrial
            ? { isTrial: false, trialEndsAt: null, trialConvertedAt: now }
            : { isTrial: false, trialEndsAt: null }),
        },
      });
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: this.tierFromPlanName(plan.name) },
    });

    const changeLabel = isUpgrade
      ? 'upgraded to'
      : isDowngrade
        ? 'changed to'
        : 'activated';
    await this.notifications.create(
      userId,
      'Subscription Active',
      `Your plan was ${changeLabel} ${plan.name}.` +
        (remainingMs > 0
          ? ' Remaining time from your previous plan was carried forward.'
          : ''),
      'SUCCESS',
      '/billing',
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
        payload: {
          planName: plan.name,
          amount,
          carriedForwardMs: remainingMs,
        },
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
      invoiceId: p.invoice?.id,
      invoiceNumber: p.invoice?.invoiceNumber,
      canDownloadInvoice: Boolean(p.invoice),
    }));

    return { payments, total };
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      // Hard cap — previously fully unbounded; long-tenured accounts could
      // accumulate hundreds of monthly invoices.
      take: 200,
    });
  }

  async getRefundHistory(userId: string, limit = 50) {
    const refundedPayments = await this.prisma.payment.findMany({
      where: { userId, status: 'REFUNDED' },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        currency: true,
        description: true,
        updatedAt: true,
        razorpayPaymentId: true,
        stripePaymentId: true,
        metadataJson: true,
      },
    });

    const walletClawbacks = await this.prisma.walletTransaction.findMany({
      where: {
        userId,
        type: 'WITHDRAWAL',
        status: 'CONFIRMED',
        OR: [
          { reference: { startsWith: 'refund_' } },
          { idempotencyKey: { startsWith: 'razorpay_refund_' } },
          { idempotencyKey: { startsWith: 'stripe_refund_' } },
          { idempotencyKey: { startsWith: 'admin_refund_' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        reference: true,
        idempotencyKey: true,
        metadataJson: true,
      },
    });

    return { refundedPayments, walletClawbacks };
  }

  /**
   * Single aggregate for Billing Center — reduces N parallel page-load calls
   * into one round-trip. Keeps existing /payments, /invoices, /current usable.
   */
  async getBillingCenter(userId: string) {
    const [current, plans, invoices, paymentHistory, refunds] =
      await Promise.all([
        this.getCurrentSubscription(userId),
        this.getSubscriptionPlans(),
        this.getInvoices(userId),
        this.getPaymentHistory(userId, 50, 0),
        this.getRefundHistory(userId, 20),
      ]);

    const now = new Date();
    const completed = paymentHistory.payments.filter(
      (p) => p.status === 'COMPLETED' || p.status === 'REFUNDED',
    );
    const spentThisMonth = completed
      .filter((p) => {
        const d = new Date(p.date);
        return (
          p.status === 'COMPLETED' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);
    const spentThisYear = completed
      .filter((p) => {
        const d = new Date(p.date);
        return (
          p.status === 'COMPLETED' && d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      current,
      plans,
      invoices,
      payments: paymentHistory.payments,
      paymentsTotal: paymentHistory.total,
      refunds,
      summary: {
        spentThisMonth,
        spentThisYear,
        completedCount: paymentHistory.payments.filter(
          (p) => p.status === 'COMPLETED',
        ).length,
      },
    };
  }

  async downloadInvoicePdf(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        userId,
        OR: [{ id: invoiceId }, { paymentId: invoiceId }],
      },
      include: {
        payment: true,
        user: { select: { email: true, fullName: true } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfBuffer = await this.renderInvoicePdf(invoice);

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        downloadedCount: { increment: 1 },
        pdfUrl:
          invoice.pdfUrl ?? `/v1/subscriptions/invoices/${invoice.id}/download`,
      },
    });

    const safeNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    return {
      buffer: pdfBuffer,
      filename: `${safeNumber}.pdf`,
      invoiceNumber: invoice.invoiceNumber,
    };
  }

  private async renderInvoicePdf(invoice: {
    invoiceNumber: string;
    amount: number;
    tax: number;
    total: number;
    currency: string;
    description: string | null;
    issuedAt: Date;
    items: unknown;
    user?: { email: string | null; fullName: string | null } | null;
    payment?: {
      id: string;
      razorpayPaymentId: string | null;
      stripePaymentId: string | null;
    } | null;
  }): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Profytron Tax Invoice', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#444444');
      doc.text(`Invoice: ${invoice.invoiceNumber}`);
      doc.text(`Issued: ${invoice.issuedAt.toISOString().slice(0, 10)}`);
      doc.text(`Currency: ${invoice.currency}`);
      if (invoice.user?.fullName || invoice.user?.email) {
        doc.text(
          `Bill to: ${invoice.user?.fullName ?? ''}${
            invoice.user?.email ? ` <${invoice.user.email}>` : ''
          }`.trim(),
        );
      }
      if (invoice.payment?.razorpayPaymentId) {
        doc.text(
          `Gateway ref (Razorpay): ${invoice.payment.razorpayPaymentId}`,
        );
      }
      if (invoice.payment?.stripePaymentId) {
        doc.text(`Gateway ref (Stripe): ${invoice.payment.stripePaymentId}`);
      }
      doc.moveDown();
      doc
        .fillColor('#000000')
        .fontSize(12)
        .text('Line items', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10);
      doc.text(invoice.description || 'Service charge');
      doc.text(
        `Taxable amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`,
      );
      doc.text(`Tax (GST): ${invoice.currency} ${invoice.tax.toFixed(2)}`);
      doc
        .fontSize(12)
        .text(`Total: ${invoice.currency} ${invoice.total.toFixed(2)}`, {
          underline: true,
        });
      doc.moveDown();
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(
          'This document is generated by Profytron for accounting records. Contact support@profytron.com for GST updates.',
        );
      doc.end();
    });
  }

  private async ensureMarketplacePaymentInvoice(params: {
    userId: string;
    amount: number;
    description: string;
    paymentReference: string;
    strategyId: string;
    currency: string;
    isRazorpay: boolean;
  }) {
    try {
      const existing = await this.prisma.payment.findFirst({
        where: params.isRazorpay
          ? { razorpayPaymentId: params.paymentReference }
          : { stripePaymentId: params.paymentReference },
        select: { id: true, invoice: { select: { id: true } } },
      });
      if (existing?.invoice) return existing;
      if (existing) {
        await this.generateInvoice(existing.id);
        return existing;
      }

      const payment = await this.prisma.payment.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          currency: params.currency || 'INR',
          method: params.isRazorpay ? 'UPI' : 'STRIPE',
          status: 'COMPLETED',
          description: params.description,
          completedAt: new Date(),
          razorpayPaymentId: params.isRazorpay
            ? params.paymentReference
            : undefined,
          stripePaymentId: params.isRazorpay
            ? undefined
            : params.paymentReference,
          metadataJson: {
            type: 'marketplace_subscription',
            strategyId: params.strategyId,
          },
        },
      });
      await this.generateInvoice(payment.id);
      return payment;
    } catch (err) {
      this.logger.warn(
        `Marketplace invoice skipped for ${params.paymentReference}: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
      return null;
    }
  }

  private async handleRazorpayRefundCreated(refundEntity: {
    id?: string;
    amount?: number;
    payment_id?: string;
    notes?: Record<string, string>;
  }) {
    const refundId = refundEntity.id;
    if (!refundId) return;

    const amount = Number(refundEntity.amount || 0) / 100;
    const paymentIdFromNotes = refundEntity.notes?.paymentId;
    const userIdFromNotes = refundEntity.notes?.userId;

    let payment = paymentIdFromNotes
      ? await this.prisma.payment.findUnique({
          where: { id: paymentIdFromNotes },
        })
      : null;

    if (!payment && refundEntity.payment_id) {
      payment = await this.prisma.payment.findFirst({
        where: { razorpayPaymentId: refundEntity.payment_id },
      });
    }

    const userId = userIdFromNotes || payment?.userId;
    if (!userId || amount <= 0) {
      this.logger.warn(
        `Razorpay refund ${refundId} skipped — missing userId (notes.userId or payment lookup)`,
      );
      return;
    }

    await this.reconcileRefund({
      userId,
      amount: payment ? Math.min(amount, payment.amount) : amount,
      refundId,
      source: 'razorpay',
      paymentDbId: payment?.id,
      gatewayPaymentId: refundEntity.payment_id ?? payment?.razorpayPaymentId,
      reason: refundEntity.notes?.reason,
    });
  }

  private async handleStripeChargeRefunded(charge: {
    id?: string;
    amount_refunded?: number;
    payment_intent?: string | { id?: string } | null;
    metadata?: Record<string, string>;
    refunds?: { data?: Array<{ id?: string; amount?: number }> };
  }) {
    const refundEntries = charge.refunds?.data?.length
      ? charge.refunds.data
      : [
          {
            id: charge.id ? `ch_refund_${charge.id}` : undefined,
            amount: charge.amount_refunded,
          },
        ];

    const pi =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    const payment =
      (pi
        ? await this.prisma.payment.findFirst({
            where: { stripePaymentId: pi },
          })
        : null) ??
      (charge.id
        ? await this.prisma.payment.findFirst({
            where: { stripePaymentId: charge.id },
          })
        : null);

    const userId = charge.metadata?.userId || payment?.userId;
    if (!userId) {
      this.logger.warn(
        `Stripe charge.refunded skipped — no userId for charge ${charge.id}`,
      );
      return;
    }

    for (const entry of refundEntries) {
      const refundId = entry.id ?? `stripe_refund_${charge.id}`;
      const amount = Number(entry.amount ?? charge.amount_refunded ?? 0) / 100;
      if (amount <= 0) continue;
      await this.reconcileRefund({
        userId,
        amount: payment ? Math.min(amount, payment.amount) : amount,
        refundId,
        source: 'stripe',
        paymentDbId: payment?.id,
        gatewayPaymentId: pi ?? charge.id,
      });
    }
  }

  /**
   * Marks Payment REFUNDED and, if the original payment deposited wallet funds,
   * claws back via WITHDRAWAL (OUT). Idempotent per refundId.
   */
  async reconcileRefund(params: {
    userId: string;
    amount: number;
    refundId: string;
    source: 'razorpay' | 'stripe' | 'admin';
    paymentDbId?: string | null;
    gatewayPaymentId?: string | null;
    reason?: string;
    adminId?: string;
  }) {
    const {
      userId,
      amount,
      refundId,
      source,
      paymentDbId,
      gatewayPaymentId,
      reason,
      adminId,
    } = params;

    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    const walletIdempotencyKey =
      source === 'razorpay'
        ? `razorpay_refund_${refundId}`
        : source === 'stripe'
          ? `stripe_refund_${refundId}`
          : `admin_refund_${refundId}`;

    let payment = paymentDbId
      ? await this.prisma.payment.findUnique({ where: { id: paymentDbId } })
      : null;

    if (!payment && gatewayPaymentId) {
      payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { razorpayPaymentId: gatewayPaymentId },
            { stripePaymentId: gatewayPaymentId },
          ],
        },
      });
    }

    if (payment && payment.status !== 'REFUNDED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          metadataJson: {
            ...((payment.metadataJson as object) ?? {}),
            refund: {
              refundId,
              source,
              amount,
              reason: reason ?? null,
              adminId: adminId ?? null,
              at: new Date().toISOString(),
            },
          },
        },
      });
    }

    // Only claw back wallet when a prior DEPOSIT was credited for this gateway payment.
    const depositKeys = [
      payment?.razorpayPaymentId
        ? `razorpay_payment_${payment.razorpayPaymentId}`
        : null,
      payment?.razorpayPaymentId
        ? `profit_share_upfront_${payment.razorpayPaymentId}`
        : null,
      payment?.stripePaymentId
        ? `profit_share_upfront_${payment.stripePaymentId}`
        : null,
      gatewayPaymentId ? `razorpay_payment_${gatewayPaymentId}` : null,
      gatewayPaymentId ? `profit_share_upfront_${gatewayPaymentId}` : null,
      gatewayPaymentId ? `stripe_deposit_${gatewayPaymentId}` : null,
    ].filter((k): k is string => Boolean(k));

    const priorDeposit =
      depositKeys.length > 0
        ? await this.prisma.walletTransaction.findFirst({
            where: {
              userId,
              direction: 'IN',
              status: 'CONFIRMED',
              idempotencyKey: { in: depositKeys },
            },
          })
        : null;

    let walletTx = null as Awaited<ReturnType<typeof this.creditWallet>> | null;
    if (priorDeposit) {
      walletTx = await this.creditWallet(
        userId,
        amount,
        'WITHDRAWAL',
        {
          source: `${source}_refund`,
          refundId,
          paymentId: payment?.id,
          reason: reason ?? null,
          priorDepositKey: priorDeposit.idempotencyKey,
          adminId: adminId ?? null,
        },
        walletIdempotencyKey,
      );
    } else {
      this.logger.log(
        `Refund ${refundId}: no wallet deposit to claw back (subscription payment or already processed)`,
      );
    }

    await this.notifications.create({
      userId,
      title: 'Refund Processed',
      message: priorDeposit
        ? `A refund of ₹${amount.toFixed(2)} was applied. Related wallet balance was adjusted.`
        : `A refund of ₹${amount.toFixed(2)} was recorded for your payment.`,
      type: 'INFO',
      category: 'PAYMENT',
      priority: 'HIGH',
      actionUrl: '/billing',
      sendPush: true,
    });

    void this.prisma.user
      .findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      })
      .then((u) => {
        if (u) {
          void this.emailService.sendPaymentEmail(
            u.email,
            u.fullName,
            {
              type: 'SUCCESS',
              amount,
              currency: payment?.currency ?? 'INR',
              description: `Refund ${refundId}${reason ? `: ${reason}` : ''}`,
            },
            userId,
          );
        }
      });

    return {
      refundId,
      paymentId: payment?.id ?? null,
      amount,
      walletAdjusted: Boolean(priorDeposit),
      walletTransactionId: walletTx?.id ?? null,
    };
  }

  /**
   * Admin-initiated refund: calls Razorpay/Stripe when possible, then reconciles ledger.
   */
  async adminRefundPayment(
    adminId: string,
    paymentId: string,
    amount?: number,
    reason?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === 'REFUNDED') {
      return {
        alreadyRefunded: true,
        paymentId: payment.id,
        amount: payment.amount,
      };
    }
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Cannot refund payment in status ${payment.status}`,
      );
    }

    const refundAmount = amount ?? payment.amount;
    if (refundAmount <= 0 || refundAmount > payment.amount) {
      throw new BadRequestException('Invalid refund amount');
    }

    let gatewayRefundId = `admin_${payment.id}_${Date.now()}`;
    let gatewayRefundSucceeded = false;

    if (payment.razorpayPaymentId && this.razorpay) {
      try {
        const refund = await this.razorpay.payments.refund(
          payment.razorpayPaymentId,
          {
            amount: Math.round(refundAmount * 100),
            notes: {
              userId: payment.userId,
              paymentId: payment.id,
              adminId,
              reason: reason ?? 'admin_refund',
            },
          },
        );
        gatewayRefundId = (refund as { id?: string })?.id ?? gatewayRefundId;
        gatewayRefundSucceeded = true;
      } catch (err) {
        this.logger.error(
          `Razorpay refund failed for payment ${payment.id}`,
          err instanceof Error ? err.stack : err,
        );
        throw new BadRequestException(
          `Razorpay refund failed: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    } else if (payment.razorpayPaymentId && !this.razorpay) {
      throw new BadRequestException(
        'Razorpay is not configured; cannot refund this payment at the gateway',
      );
    } else if (payment.stripePaymentId && this.stripe) {
      try {
        const stripeParams: {
          amount: number;
          metadata: Record<string, string>;
          payment_intent?: string;
          charge?: string;
        } = {
          amount: Math.round(refundAmount * 100),
          metadata: {
            userId: payment.userId,
            paymentId: payment.id,
            adminId,
            reason: reason ?? 'admin_refund',
          },
        };
        if (payment.stripePaymentId.startsWith('pi_')) {
          stripeParams.payment_intent = payment.stripePaymentId;
        } else if (payment.stripePaymentId.startsWith('ch_')) {
          stripeParams.charge = payment.stripePaymentId;
        } else {
          throw new Error(
            `Unsupported Stripe payment reference: ${payment.stripePaymentId}`,
          );
        }
        const refund = await this.stripe.refunds.create(stripeParams);
        gatewayRefundId = refund.id;
        gatewayRefundSucceeded = true;
      } catch (err) {
        this.logger.error(
          `Stripe refund failed for payment ${payment.id}`,
          err instanceof Error ? err.stack : err,
        );
        throw new BadRequestException(
          `Stripe refund failed: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    } else if (payment.stripePaymentId && !this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured; cannot refund this payment at the gateway',
      );
    } else {
      // Manual ledger-only refunds require explicit operator opt-in.
      if (process.env.ALLOW_LEDGER_ONLY_REFUNDS !== 'true') {
        throw new BadRequestException(
          'Payment has no refundable gateway id. Set ALLOW_LEDGER_ONLY_REFUNDS=true only for controlled manual reconciliation.',
        );
      }
      gatewayRefundSucceeded = true;
    }

    if (!gatewayRefundSucceeded) {
      throw new BadRequestException('Gateway refund did not succeed');
    }

    const source: 'razorpay' | 'stripe' | 'admin' = payment.razorpayPaymentId
      ? 'razorpay'
      : payment.stripePaymentId
        ? 'stripe'
        : 'admin';

    return this.reconcileRefund({
      userId: payment.userId,
      amount: refundAmount,
      refundId: gatewayRefundId,
      source: source === 'admin' ? 'admin' : source,
      paymentDbId: payment.id,
      gatewayPaymentId:
        payment.razorpayPaymentId ?? payment.stripePaymentId ?? null,
      reason,
      adminId,
    });
  }
}
