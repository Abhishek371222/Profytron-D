import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import PDFDocument from 'pdfkit';
import Stripe from 'stripe';
import {
  Prisma,
  ProfitShareState,
  SubscriptionBillingModel,
  SubscriptionStatus,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { randomUUID, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { IORedis } from '../../config/redis.config';
import {
  CreateWalletTransactionDto,
  InitiateDepositDto,
  InitiateWithdrawalDto,
  WalletTransactionsQueryDto,
} from './dto/wallet.dto';
import { REDIS_CLIENT } from '../auth/redis.service';
import { EmailService } from '../email/email.service';
import { buildWalletPaymentFields } from './wallet-payment.util';

@Injectable()
export class WalletService {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: IORedis,
    @InjectQueue('withdrawal-processing')
    private readonly withdrawalQueue: Queue,
    @InjectQueue('copyfactory_sync')
    private readonly copyFactoryQueue: Queue,
    private readonly emailService: EmailService,
  ) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY)
      : (null as any);
  }

  async sendWithdrawalOtp(userId: string): Promise<{ sent: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const otp = randomInt(100000, 1000000).toString();
    const key = `withdrawal_otp:${userId}`;

    await this.redis.set(key, otp, 'EX', 600); // 10 minute TTL

    await this.emailService.sendOtpEmail(user.email, otp);
    this.logger.log(`Withdrawal OTP sent to user ${userId}`);

    return { sent: true };
  }

  private async getGroupedSums(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.walletTransaction.groupBy({
      by: ['direction', 'status'],
      where: { userId },
      _sum: { amount: true },
    });
  }

  private extractAmount(
    grouped: Array<{
      direction: TransactionDirection;
      status: TransactionStatus;
      _sum: { amount: number | null };
    }>,
    direction: TransactionDirection,
    status: TransactionStatus,
  ) {
    return (
      grouped.find(
        (entry) => entry.direction === direction && entry.status === status,
      )?._sum.amount ?? 0
    );
  }

  async getBalance(userId: string) {
    const grouped = await this.getGroupedSums(userId);

    const confirmedIn = this.extractAmount(grouped, 'IN', 'CONFIRMED');
    const confirmedOut = this.extractAmount(grouped, 'OUT', 'CONFIRMED');
    const pendingIn = this.extractAmount(grouped, 'IN', 'PENDING');
    const pendingOut = this.extractAmount(grouped, 'OUT', 'PENDING');
    const total = confirmedIn - confirmedOut;

    return {
      total,
      available: total - pendingOut,
      pendingIn,
      pendingOut,
      currency: 'INR',
    };
  }

  async getTransactions(userId: string, query: WalletTransactionsQueryDto) {
    const { type, status, dateFrom, dateTo, cursor, limit = 20 } = query;

    // Build a single createdAt filter so the date range AND the pagination
    // cursor coexist. dateTo is treated as INCLUSIVE end-of-day — otherwise
    // `new Date('2026-06-22')` is midnight UTC and `lte` silently drops every
    // transaction made later that same day (the "deposits not showing after
    // selecting today" bug).
    const createdAt: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setUTCHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    if (cursor) {
      createdAt.lt = new Date(cursor);
    }
    const hasCreatedAtFilter = Object.keys(createdAt).length > 0;

    const where: Prisma.WalletTransactionWhereInput = {
      userId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(hasCreatedAtFilter ? { createdAt } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      this.prisma.walletTransaction.count({
        where: {
          userId,
          ...(type ? { type } : {}),
          ...(status ? { status } : {}),
          // Count ignores the pagination cursor (it's the total for the filter).
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(createdAt.gte ? { gte: createdAt.gte } : {}),
                  ...(createdAt.lte ? { lte: createdAt.lte } : {}),
                },
              }
            : {}),
        },
      }),
    ]);

    const hasMore = rows.length > limit;
    const transactions = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
      ? transactions[transactions.length - 1].createdAt.toISOString()
      : null;

    return {
      transactions: transactions.map((entry) => this.mapTransaction(entry)),
      nextCursor,
      total,
    };
  }

  private mapTransaction(entry: {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    direction: TransactionDirection;
    amount: number;
    balanceAfter: number;
    billingId: string;
    paymentCategory: string | null;
    senderAddress: string | null;
    receiverAddress: string | null;
    externalTxnId: string | null;
    description: string | null;
    reference: string | null;
    metadataJson: Prisma.JsonValue;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    return {
      id: entry.id,
      type: entry.type,
      status: entry.status,
      direction: entry.direction,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      billingId: entry.billingId,
      paymentCategory: entry.paymentCategory,
      senderAddress: entry.senderAddress,
      receiverAddress: entry.receiverAddress,
      externalTxnId: entry.externalTxnId,
      description: entry.description,
      reference: entry.reference,
      metadata: entry.metadataJson,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  async initiateDeposit(userId: string, dto: InitiateDepositDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const metadataIdempotencyKey = randomUUID();

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(dto.amount * 100),
      currency: 'inr',
      metadata: { userId, idempotencyKey: metadataIdempotencyKey },
      description: 'Profytron wallet deposit',
    });

    const current = await this.getBalance(userId);
    const paymentFields = buildWalletPaymentFields({
      type: 'DEPOSIT',
      direction: 'IN',
      userId,
      externalTxnId: intent.id,
      metadata: {
        paymentIntentId: intent.id,
        stripeMetadataKey: metadataIdempotencyKey,
        gateway: 'stripe',
      },
    });
    const tx = await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        direction: 'IN',
        amount: dto.amount,
        status: 'PENDING',
        balanceAfter: current.available,
        idempotencyKey: intent.id,
        reference: intent.id,
        description: 'Wallet deposit initiated',
        stripePaymentId: intent.id,
        ...paymentFields,
      },
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      transactionId: tx.id,
      billingId: tx.billingId,
    };
  }

  async confirmDeposit(userId: string, paymentIntentId: string) {
    const existing = await this.prisma.walletTransaction.findUnique({
      where: { idempotencyKey: paymentIntentId },
    });

    if (!existing) {
      throw new NotFoundException('Deposit transaction not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Deposit does not belong to user');
    }

    if (existing.status === 'CONFIRMED') {
      return existing;
    }

    const current = await this.getBalance(userId);
    const transaction = await this.prisma.walletTransaction.update({
      where: { id: existing.id },
      data: {
        status: 'CONFIRMED',
        balanceAfter: current.total + existing.amount,
        description: 'Wallet deposit confirmed',
      },
    });
    await this.reconcileProfitShareAutoResume(userId);
    return transaction;
  }

  async previewWithdrawalImpact(userId: string, amount: number) {
    if (!amount || amount <= 0) {
      return {
        willPauseProfitShareBots: false,
        affectedSubscriptions: [],
        remainingBalance: (await this.getBalance(userId)).available,
      };
    }

    const balance = await this.getBalance(userId);
    const remainingBalance = balance.available - amount;
    const affectedSubscriptions =
      await this.getProfitShareSubscriptionsBelowBuffer(
        userId,
        remainingBalance,
      );

    return {
      willPauseProfitShareBots: affectedSubscriptions.length > 0,
      affectedSubscriptions,
      remainingBalance,
      requiredBuffer: Math.max(
        0,
        ...affectedSubscriptions.map((sub) => sub.requiredBuffer),
      ),
    };
  }

  async initiateWithdrawal(userId: string, dto: InitiateWithdrawalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.kycStatus !== 'VERIFIED') {
      throw new ForbiddenException('KYC required');
    }

    if (dto.amount < 500) {
      throw new BadRequestException('Minimum withdrawal amount is 500');
    }

    // Validate withdrawal OTP
    if (!dto.otp) {
      throw new BadRequestException('OTP is required for withdrawal');
    }
    const otpKey = `withdrawal_otp:${userId}`;
    const storedOtp = await this.redis.get(otpKey);
    if (!storedOtp) {
      throw new BadRequestException(
        'OTP expired or not requested. Please request a new OTP.',
      );
    }
    if (storedOtp !== dto.otp.toString()) {
      throw new BadRequestException('Invalid OTP');
    }
    // Invalidate OTP after successful validation (one-time use)
    await this.redis.del(otpKey);

    // Atomically check available balance and write the debit row in ONE DB
    // transaction, serialized per-user with a Postgres advisory lock. This
    // closes the overdraft race that existed when the only guard was a
    // best-effort Redis lock (which fails open if Redis is down/evicted).
    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;

      const grouped = await this.getGroupedSums(userId, tx);
      const confirmedIn = this.extractAmount(grouped, 'IN', 'CONFIRMED');
      const confirmedOut = this.extractAmount(grouped, 'OUT', 'CONFIRMED');
      const pendingOut = this.extractAmount(grouped, 'OUT', 'PENDING');
      const available = confirmedIn - confirmedOut - pendingOut;

      if (dto.amount > available) {
        throw new BadRequestException('Insufficient balance');
      }

      const paymentFields = buildWalletPaymentFields({
        type: 'WITHDRAWAL',
        direction: 'OUT',
        userId,
        userAccountAddress: dto.bankAccount,
        externalTxnId: null,
        metadata: {
          bankAccount: dto.bankAccount,
          otpVerified: true,
          gateway: 'bank_transfer',
        },
      });

      return tx.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          direction: 'OUT',
          amount: dto.amount,
          status: 'PENDING',
          balanceAfter: available - dto.amount,
          idempotencyKey: `wd_${randomUUID()}`,
          reference: dto.bankAccount || 'Bank account',
          description: 'Withdrawal initiated',
          ...paymentFields,
        },
      });
    });

    await this.withdrawalQueue.add(
      'process',
      { transactionId: transaction.id, userId, amount: dto.amount },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    );

    const withdrawalImpact = await this.pauseProfitShareBelowBuffer(
      userId,
      transaction.balanceAfter,
    );

    return {
      transaction: this.mapTransaction(transaction),
      estimatedArrival: '1-2 business days',
      withdrawalImpact,
    };
  }

  /**
   * Admin-only withdrawal from any user wallet (including deleted accounts).
   * Skips OTP and KYC — audited via metadata.
   */
  async adminForceWithdrawal(
    targetUserId: string,
    adminId: string,
    dto: { amount: number; bankAccount?: string; note?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${targetUserId}`}))`;

      const grouped = await this.getGroupedSums(targetUserId, tx);
      const confirmedIn = this.extractAmount(grouped, 'IN', 'CONFIRMED');
      const confirmedOut = this.extractAmount(grouped, 'OUT', 'CONFIRMED');
      const pendingOut = this.extractAmount(grouped, 'OUT', 'PENDING');
      const available = confirmedIn - confirmedOut - pendingOut;

      if (dto.amount > available) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${available}`,
        );
      }

      const paymentFields = buildWalletPaymentFields({
        type: 'WITHDRAWAL',
        direction: 'OUT',
        userId: targetUserId,
        userAccountAddress: dto.bankAccount,
        paymentCategory: 'Wallet Withdrawal',
        metadata: {
          adminForced: true,
          adminId,
          bankAccount: dto.bankAccount || null,
          note: dto.note || null,
          targetEmail: user.email,
          gateway: 'admin_force',
        },
      });

      return tx.walletTransaction.create({
        data: {
          userId: targetUserId,
          type: 'WITHDRAWAL',
          direction: 'OUT',
          amount: dto.amount,
          status: 'PENDING',
          balanceAfter: available - dto.amount,
          idempotencyKey: `admin_wd_${randomUUID()}`,
          reference: dto.bankAccount || 'Admin forced withdrawal',
          description: dto.note?.trim() || 'Admin withdrawal',
          ...paymentFields,
        },
      });
    });

    await this.withdrawalQueue.add(
      'process',
      {
        transactionId: transaction.id,
        userId: targetUserId,
        amount: dto.amount,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    );

    this.logger.log(
      `Admin ${adminId} withdrew ${dto.amount} from user ${targetUserId}`,
    );

    return {
      transaction,
      user: { id: user.id, email: user.email, fullName: user.fullName },
      estimatedArrival: '1-2 business days',
    };
  }

  async getTransactionDetail(userId: string, transactionId: string) {
    const tx = await this.prisma.walletTransaction.findFirst({
      where: { id: transactionId, userId },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    return this.mapTransaction(tx);
  }

  /**
   * Resolve a payment by canonical billing ID (PRF-WLT-…).
   * Users may only look up their own; pass `asAdmin` for support tooling.
   */
  async getTransactionByBillingId(
    billingId: string,
    opts: { userId?: string; asAdmin?: boolean },
  ) {
    const normalized = billingId.trim().toUpperCase();
    const tx = await this.prisma.walletTransaction.findUnique({
      where: { billingId: normalized },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });
    if (!tx) {
      throw new NotFoundException('No payment found for this Billing ID');
    }
    if (!opts.asAdmin && opts.userId && tx.userId !== opts.userId) {
      throw new ForbiddenException('Billing ID does not belong to this account');
    }
    return {
      ...this.mapTransaction(tx),
      user: opts.asAdmin
        ? { id: tx.user.id, email: tx.user.email, fullName: tx.user.fullName }
        : undefined,
    };
  }

  async generateStatement(userId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

    const transactions = await this.prisma.walletTransaction.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        createdAt: { gte: start, lt: end },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (transactions.length === 0) {
      throw new BadRequestException(
        'No confirmed transactions found for this month. Statement PDF cannot be generated.',
      );
    }

    const previous = await this.prisma.walletTransaction.findFirst({
      where: {
        userId,
        status: 'CONFIRMED',
        createdAt: { lt: start },
      },
      orderBy: { createdAt: 'desc' },
    });

    const openingBalance = previous?.balanceAfter ?? 0;
    const closingBalance =
      transactions.length > 0
        ? transactions[transactions.length - 1].balanceAfter
        : openingBalance;

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Profytron Wallet Statement', { align: 'left' });
      doc.moveDown();
      doc.fontSize(11).text(`User: ${userId}`);
      doc.text(`Period: ${year}-${String(month).padStart(2, '0')}`);
      doc.text(`Opening Balance: INR ${openingBalance.toFixed(2)}`);
      doc.text(`Closing Balance: INR ${closingBalance.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(12).text('Transactions', { underline: true });
      doc.moveDown(0.5);

      transactions.forEach((tx) => {
        doc
          .fontSize(10)
          .text(
            `${tx.createdAt.toISOString()} | ${tx.type} | ${tx.status} | ${tx.direction} | INR ${tx.amount.toFixed(2)} | Bal: INR ${tx.balanceAfter.toFixed(2)}`,
          );
      });

      doc.end();
    });

    return {
      transactions,
      openingBalance,
      closingBalance,
      period: `${year}-${String(month).padStart(2, '0')}`,
      pdfBuffer,
    };
  }

  async createTransaction(userId: string, dto: CreateWalletTransactionDto) {
    const transaction = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });

      if (existing) {
        return existing;
      }

      const grouped = await this.getGroupedSums(userId, tx);
      const confirmedIn = this.extractAmount(grouped, 'IN', 'CONFIRMED');
      const confirmedOut = this.extractAmount(grouped, 'OUT', 'CONFIRMED');
      const currentBalance = confirmedIn - confirmedOut;

      const balanceAfter =
        dto.direction === 'IN'
          ? currentBalance + dto.amount
          : currentBalance - dto.amount;

      const paymentFields = buildWalletPaymentFields({
        type: dto.type,
        direction: dto.direction,
        userId,
        externalTxnId: dto.reference,
        metadata: (dto.metadataJson as Record<string, unknown> | undefined) ?? {},
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: dto.type,
          direction: dto.direction,
          amount: dto.amount,
          status: dto.status ?? 'CONFIRMED',
          idempotencyKey: dto.idempotencyKey,
          balanceAfter,
          description: dto.description,
          reference: dto.reference,
          ...paymentFields,
          metadataJson: {
            ...paymentFields.metadataJson,
            ...((dto.metadataJson as Record<string, unknown> | undefined) ?? {}),
          } as Prisma.JsonObject,
        },
      });
      return transaction;
    });
    if (
      transaction.direction === TransactionDirection.IN &&
      transaction.status === TransactionStatus.CONFIRMED
    ) {
      await this.reconcileProfitShareAutoResume(userId);
    }
    return transaction;
  }

  private async getProfitShareSubscriptionsBelowBuffer(
    userId: string,
    remainingBalance: number,
  ) {
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        billingModel: SubscriptionBillingModel.PROFIT_SHARE,
        profitShareAccruedUnsettled: { gt: 0 },
      },
      select: {
        id: true,
        strategyId: true,
        profitShareAccruedUnsettled: true,
        strategy: { select: { name: true } },
      },
    });

    return subscriptions
      .filter(
        (subscription) =>
          (subscription.profitShareAccruedUnsettled ?? 0) >= remainingBalance,
      )
      .map((subscription) => ({
        subscriptionId: subscription.id,
        strategyId: subscription.strategyId,
        botName: subscription.strategy.name,
        requiredBuffer: subscription.profitShareAccruedUnsettled ?? 0,
      }));
  }

  private async pauseProfitShareBelowBuffer(
    userId: string,
    remainingBalance: number,
  ) {
    const affectedSubscriptions =
      await this.getProfitShareSubscriptionsBelowBuffer(
        userId,
        remainingBalance,
      );

    for (const subscription of affectedSubscriptions) {
      await this.prisma.userStrategySubscription.update({
        where: { id: subscription.subscriptionId },
        data: {
          status: SubscriptionStatus.PAUSED,
          profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        },
      });
      await this.enqueueCopyFactory('unlink', subscription.subscriptionId);
    }

    return {
      willPauseProfitShareBots: affectedSubscriptions.length > 0,
      affectedSubscriptions,
      remainingBalance,
    };
  }

  private async reconcileProfitShareAutoResume(userId: string) {
    const balance = await this.getBalance(userId);
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.PAUSED,
        billingModel: SubscriptionBillingModel.PROFIT_SHARE,
        profitShareState: ProfitShareState.PROFIT_SHARE_PAUSED,
        profitShareAccruedUnsettled: { not: null },
      },
      select: {
        id: true,
        profitShareAccruedUnsettled: true,
      },
    });

    for (const subscription of subscriptions) {
      const liability = subscription.profitShareAccruedUnsettled ?? 0;
      if (liability >= balance.available) continue;

      await this.prisma.userStrategySubscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          profitShareState:
            liability > 0
              ? ProfitShareState.PROFIT_SHARE_DUE
              : ProfitShareState.PROFIT_SHARE_OK,
        },
      });
      await this.enqueueCopyFactory('link', subscription.id);
    }
  }

  private async enqueueCopyFactory(
    action: 'link' | 'unlink',
    subscriptionId: string,
  ) {
    try {
      await this.copyFactoryQueue.add(
        'sync_copyfactory',
        { action, subscriptionId },
        {
          jobId: `${action}:${subscriptionId}::`,
          removeOnComplete: true,
          removeOnFail: 50,
          attempts: 4,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
    } catch (error) {
      this.logger.warn(
        `CopyFactory ${action} skipped for ${subscriptionId}: ${(error as Error).message}`,
      );
    }
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
    } catch (error) {
      this.logger.warn('Stripe webhook signature verification failed');
      throw new ForbiddenException('Invalid Stripe webhook signature');
    }
  }

  async handleStripeWebhook(payload: any) {
    this.logger.log(`Processing Stripe Webhook Event`);
    const event = payload;

    const paymentsHandled = new Set([
      'checkout.session.completed',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.deleted',
    ]);
    if (paymentsHandled.has(event.type)) {
      this.logger.log(
        `Skipping ${event.type} — canonical handler is /v1/webhooks/stripe`,
      );
      return { received: true, ignored: true, delegatedToPayments: true };
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const userId = intent.metadata.userId;
      if (!userId) {
        this.logger.warn(
          `Ignoring payment_intent.succeeded without userId metadata: ${intent.id}`,
        );
        return { received: true, ignored: true };
      }
      await this.confirmDeposit(userId, intent.id);
      this.logger.log(
        `Deposit confirmed for user ${userId}: ${intent.amount / 100}`,
      );
      return { received: true };
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session?.metadata?.userId;
      const strategyId = session?.metadata?.strategyId;
      if (!userId || !strategyId) {
        this.logger.warn(
          `Ignoring checkout.session.completed without required metadata: ${session.id}`,
        );
        return { received: true, ignored: true };
      }
      const amount = (session.amount_total || 0) / 100;

      await this.prisma.$transaction(async (tx) => {
        const grouped = await tx.walletTransaction.groupBy({
          by: ['direction'],
          where: { userId, status: 'CONFIRMED' },
          _sum: { amount: true },
        });
        const confirmedIn =
          grouped.find((entry) => entry.direction === 'IN')?._sum.amount ?? 0;
        const confirmedOut =
          grouped.find((entry) => entry.direction === 'OUT')?._sum.amount ?? 0;
        const currentBalance = confirmedIn - confirmedOut;

        const paymentFields = buildWalletPaymentFields({
          type: 'SUBSCRIPTION_PAYMENT',
          direction: 'OUT',
          userId,
          externalTxnId: session.id,
          metadata: {
            strategyId,
            gateway: 'stripe_checkout',
            sessionId: session.id,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            amount,
            direction: 'OUT',
            type: 'SUBSCRIPTION_PAYMENT',
            status: 'CONFIRMED',
            balanceAfter: currentBalance - amount,
            stripePaymentId: session.id,
            description: `Subscription for strategy ${strategyId}`,
            idempotencyKey: `sub_${session.id}`,
            ...paymentFields,
          },
        });

        await tx.userStrategySubscription.upsert({
          where: { userId_strategyId: { userId, strategyId } },
          create: {
            userId,
            strategyId,
            status: 'ACTIVE',
            planType: 'MONTHLY',
            subscribedAt: new Date(),
          },
          update: {
            status: 'ACTIVE',
            subscribedAt: new Date(),
          },
        });
      });
      this.logger.log(
        `Subscription activated for user ${userId} -> Strategy ${strategyId}`,
      );
      return { received: true };
    }

    this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    return { received: true, ignored: true };
  }
}
