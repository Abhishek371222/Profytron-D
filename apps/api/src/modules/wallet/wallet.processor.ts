import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('withdrawal-processing')
export class WalletProcessor {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Process('process')
  async processWithdrawal(job: Job<{ transactionId: string; userId: string }>) {
    const { transactionId, userId } = job.data;

    const tx = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx || tx.status !== 'PENDING') {
      return;
    }

    await this.prisma.$transaction(async (trx) => {
      await trx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;

      const grouped = await trx.walletTransaction.groupBy({
        by: ['direction'],
        where: { userId, status: 'CONFIRMED' },
        _sum: { amount: true },
      });

      const confirmedIn =
        grouped.find((entry) => entry.direction === 'IN')?._sum.amount ?? 0;
      const confirmedOut =
        grouped.find((entry) => entry.direction === 'OUT')?._sum.amount ?? 0;
      const available = confirmedIn - confirmedOut;

      if (available < tx.amount) {
        await trx.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            description:
              'Withdrawal failed due to insufficient available funds at processing time',
          },
        });
        return;
      }

      await trx.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'CONFIRMED',
          balanceAfter: available - tx.amount,
        },
      });
    });

    this.logger.log(`Withdrawal processed for user ${userId}: ${tx.amount}`);
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Withdrawal job ${job.id} failed (attempts=${job.attemptsMade}): ${error.message}`,
      error.stack,
    );
    const { transactionId, userId } = (job.data ?? {}) as {
      transactionId?: string;
      userId?: string;
    };
    if (!transactionId || !userId) return;

    try {
      const tx = await this.prisma.walletTransaction.findUnique({
        where: { id: transactionId },
      });
      if (tx && tx.status === 'PENDING') {
        await this.prisma.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            description:
              `Withdrawal processing exhausted retries: ${error.message}`.slice(
                0,
                500,
              ),
          },
        });
      }
      await this.notifications.create({
        userId,
        title: 'Withdrawal failed',
        message:
          'We could not complete your withdrawal after multiple attempts. Please retry or contact support.',
        type: 'ERROR',
        category: 'PAYMENT',
        priority: 'HIGH',
        actionUrl: '/wallet',
      });
    } catch (err) {
      this.logger.error(
        `Failed to mark withdrawal failed after queue error: ${
          err instanceof Error ? err.message : 'unknown'
        }`,
      );
    }
  }
}
