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
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { IORedis } from '../../config/redis.config';
import {
  CreateWalletTransactionDto,
  InitiateDepositDto,
  InitiateWithdrawalDto,
  WalletTransactionsQueryDto,
} from './dto/wallet.dto';
import { REDIS_CLIENT } from '../auth/redis.service';

@Injectable()
export class WalletService {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: IORedis,
    @InjectQueue('withdrawal-processing')
    private readonly withdrawalQueue: Queue,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
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
    const where: Prisma.WalletTransactionWhereInput = {
      userId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
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
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                  ...(dateTo ? { lte: new Date(dateTo) } : {}),
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
      transactions: transactions.map((entry) => ({
        id: entry.id,
        type: entry.type,
        status: entry.status,
        direction: entry.direction,
        amount: entry.amount,
        balanceAfter: entry.balanceAfter,
        description: entry.description,
        reference: entry.reference,
        metadata: entry.metadataJson,
        createdAt: entry.createdAt,
      })),
      nextCursor,
      total,
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
        metadataJson: {
          paymentIntentId: intent.id,
          stripeMetadataKey: metadataIdempotencyKey,
        },
        stripePaymentId: intent.id,
      },
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      transactionId: tx.id,
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
    return this.prisma.walletTransaction.update({
      where: { id: existing.id },
      data: {
        status: 'CONFIRMED',
        balanceAfter: current.total + existing.amount,
        description: 'Wallet deposit confirmed',
      },
    });
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

    const lockKey = `wallet_lock:${userId}`;
    const lock = await this.redis.set(lockKey, '1', 'EX', 30, 'NX');
    if (lock !== 'OK') {
      throw new BadRequestException('Could not acquire wallet lock');
    }

    try {
      const current = await this.getBalance(userId);
      if (dto.amount > current.available) {
        throw new BadRequestException('Insufficient balance');
      }

      const transaction = await this.prisma.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          direction: 'OUT',
          amount: dto.amount,
          status: 'PENDING',
          balanceAfter: current.available - dto.amount,
          idempotencyKey: `wd_${randomUUID()}`,
          reference: dto.bankAccount || 'HDFC Bank ****4521',
          description: 'Withdrawal initiated',
          metadataJson: {
            bankAccount: dto.bankAccount || 'HDFC Bank ****4521',
            otpUsed: Boolean(dto.otp),
          },
        },
      });

      await this.withdrawalQueue.add(
        'process',
        { transactionId: transaction.id, userId, amount: dto.amount },
        { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
      );

      return {
        transaction,
        estimatedArrival: '1-2 business days',
      };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async getTransactionDetail(userId: string, transactionId: string) {
    const tx = await this.prisma.walletTransaction.findFirst({
      where: { id: transactionId, userId },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    return tx;
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
    return this.prisma.$transaction(async (tx) => {
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

      return tx.walletTransaction.create({
        data: {
          userId,
          type: dto.type,
          direction: dto.direction,
          amount: dto.amount,
          status: dto.status ?? 'CONFIRMED',
          idempotencyKey: dto.idempotencyKey,
          balanceAfter,
          metadataJson: dto.metadataJson as Prisma.JsonObject | undefined,
          description: dto.description,
          reference: dto.reference,
        },
      });
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
    } catch (error) {
      this.logger.warn('Stripe webhook signature verification failed');
      throw new ForbiddenException('Invalid Stripe webhook signature');
    }
  }

  async handleStripeWebhook(payload: any) {
    this.logger.log(`Processing Stripe Webhook Event`);
    const event = payload;

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
