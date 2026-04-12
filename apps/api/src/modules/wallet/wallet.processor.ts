import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('withdrawal-processing')
export class WalletProcessor {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('process')
  async processWithdrawal(job: Job<{ transactionId: string; userId: string }>) {
    const { transactionId, userId } = job.data;

    const tx = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx || tx.status !== 'PENDING') {
      return;
    }

    const grouped = await this.prisma.walletTransaction.groupBy({
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
      await this.prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          description: 'Withdrawal failed due to insufficient available funds at processing time',
        },
      });
      return;
    }

    await this.prisma.walletTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'CONFIRMED',
        balanceAfter: available - tx.amount,
      },
    });

    this.logger.log(`Withdrawal processed for user ${userId}: ${tx.amount}`);
  }
}
