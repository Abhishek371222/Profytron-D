import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TradeEventType,
  ExecutionStatus,
  Prisma,
} from '@prisma/client';

/**
 * Append-only ledger for the copy-trading lifecycle. All writes are
 * best-effort: a logging failure must never break trade execution.
 */
@Injectable()
export class CopyLedgerService {
  private readonly logger = new Logger(CopyLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(input: {
    type: TradeEventType;
    masterAccountId?: string | null;
    masterPositionId?: string | null;
    userId?: string | null;
    tradeId?: string | null;
    symbol?: string | null;
    side?: string | null;
    volume?: number | null;
    price?: number | null;
    stopLoss?: number | null;
    takeProfit?: number | null;
    details?: Prisma.InputJsonValue | null;
  }): Promise<void> {
    try {
      await this.prisma.tradeEvent.create({
        data: {
          type: input.type,
          masterAccountId: input.masterAccountId ?? null,
          masterPositionId: input.masterPositionId ?? null,
          userId: input.userId ?? null,
          tradeId: input.tradeId ?? null,
          symbol: input.symbol ?? null,
          side: input.side ?? null,
          volume: input.volume ?? null,
          price: input.price ?? null,
          stopLoss: input.stopLoss ?? null,
          takeProfit: input.takeProfit ?? null,
          detailsJson: input.details ?? undefined,
        },
      });
    } catch (err) {
      this.logger.warn(
        `recordEvent(${input.type}) skipped: ${(err as Error).message}`,
      );
    }
  }

  async recordExecution(input: {
    followerUserId: string;
    followerTradeId?: string | null;
    masterPositionId?: string | null;
    masterTicket?: string | null;
    followerTicket?: string | null;
    symbol: string;
    side: string;
    requestedVolume: number;
    filledVolume?: number | null;
    requestedPrice?: number | null;
    fillPrice?: number | null;
    slippageBps?: number;
    latencyMs?: number | null;
    status?: ExecutionStatus;
    errorReason?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.tradeExecution.create({
        data: {
          followerUserId: input.followerUserId,
          followerTradeId: input.followerTradeId ?? null,
          masterPositionId: input.masterPositionId ?? null,
          masterTicket: input.masterTicket ?? null,
          followerTicket: input.followerTicket ?? null,
          symbol: input.symbol,
          side: input.side,
          requestedVolume: input.requestedVolume,
          filledVolume: input.filledVolume ?? null,
          requestedPrice: input.requestedPrice ?? null,
          fillPrice: input.fillPrice ?? null,
          slippageBps: input.slippageBps ?? 0,
          latencyMs: input.latencyMs ?? null,
          status: input.status ?? ExecutionStatus.PENDING,
          errorReason: input.errorReason ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`recordExecution skipped: ${(err as Error).message}`);
    }
  }
}
