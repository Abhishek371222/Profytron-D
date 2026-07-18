import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from './trading.gateway';

@Processor('trade_execution_dlq')
export class TradeDlqProcessor {
  private readonly logger = new Logger(TradeDlqProcessor.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
  ) {}

  @Process('dead_letter')
  async handleDeadLetter(
    job: Job<{
      originalName: string;
      originalData: any;
      failedReason: string;
      attemptsMade: number;
    }>,
  ) {
    const { originalName, originalData, failedReason, attemptsMade } = job.data;
    const userId = originalData?.userId ?? null;
    this.logger.error(
      `DLQ: ${originalName} for user ${userId} failed after ${attemptsMade} attempts — ${failedReason}`,
    );

    await this.prisma.auditLog
      .create({
        data: {
          eventType: 'TRADE_JOB_DEAD_LETTER',
          userId,
          detailsJson: {
            jobName: originalName,
            failedReason,
            attemptsMade,
            payload: originalData ?? null,
          },
          triggeredBy: 'SYSTEM',
        },
      })
      .catch(() => undefined);

    if (userId) {
      this.gateway.sendToUser(userId, 'trade_failed', {
        action: originalName,
        symbol: originalData?.pair ?? originalData?.symbol ?? null,
        reason: failedReason,
      });
      await this.prisma.notification
        .create({
          data: {
            userId,
            type: 'ERROR',
            title: 'Trade action failed',
            body: `A ${originalName.replace(/_/g, ' ')} request could not be completed after multiple attempts. Our team has been notified.`,
            actionUrl: '/dashboard',
          },
        })
        .catch(() => undefined);
    }
  }
}
