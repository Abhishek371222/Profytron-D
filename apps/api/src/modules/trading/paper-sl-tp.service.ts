import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { TradeStatus } from '@prisma/client';
import { mapTradeSymbolToMarket } from './utils/pnl.util';
import { evaluatePaperStopLevels } from './utils/paper-sl-tp.util';

/**
 * Paper trading only: poll open paper positions for SL/TP hits and enqueue
 * the shared close_trade path (no separate PnL math, no live/MetaAPI path).
 */
@Injectable()
export class PaperSlTpService implements OnModuleDestroy {
  private readonly logger = new Logger(PaperSlTpService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private prisma: PrismaService,
    private market: MarketService,
    @InjectQueue('trade_execution') private tradeQueue: Queue,
  ) {}

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  startPolling(intervalMs = 5000) {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.logger.log(
      `Paper SL/TP polling started (${intervalMs}ms interval)`,
    );
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const trades = await this.prisma.trade.findMany({
        where: {
          status: TradeStatus.OPEN,
          isPaper: true,
          OR: [{ stopLoss: { not: null } }, { takeProfit: { not: null } }],
        },
        select: {
          id: true,
          userId: true,
          symbol: true,
          direction: true,
          stopLoss: true,
          takeProfit: true,
        },
        take: 200,
      });
      if (trades.length === 0) return;

      const priceCache = new Map<string, number | null>();
      for (const t of trades) {
        const marketSymbol = mapTradeSymbolToMarket(
          t.symbol,
          this.market.supportedSymbols,
        );
        if (!marketSymbol) continue;

        if (!priceCache.has(marketSymbol)) {
          try {
            const q = await this.market.getQuote(marketSymbol);
            priceCache.set(
              marketSymbol,
              typeof q?.price === 'number' ? q.price : null,
            );
          } catch {
            priceCache.set(marketSymbol, null);
          }
        }
        const price = priceCache.get(marketSymbol);
        if (price == null) continue;

        const outcome = evaluatePaperStopLevels(t, price);
        if (!outcome) continue;

        try {
          await this.tradeQueue.add(
            'close_trade',
            { tradeId: t.id, userId: t.userId },
            {
              jobId: `paper-sltp-close:${t.id}`,
              priority: 1,
              removeOnComplete: true,
              removeOnFail: true,
            },
          );
          this.logger.log(
            `Paper ${outcome} hit for trade ${t.id} @ ${price} — close queued`,
          );
        } catch (err) {
          // Duplicate jobId means a close is already queued — expected.
          const msg = (err as Error)?.message ?? String(err);
          if (!/already exists|JobId/i.test(msg)) {
            this.logger.warn(
              `Failed to queue paper SL/TP close for ${t.id}: ${msg}`,
            );
          }
        }
      }
    } catch (err) {
      const message = (err as Error)?.message ?? String(err);
      const isTransientDbError =
        /can't reach database server|connection.*closed|P10(01|08|17)/i.test(
          message,
        );
      if (isTransientDbError) {
        this.logger.warn(
          `Paper SL/TP tick skipped (DB unavailable): ${message}`,
        );
      } else {
        this.logger.error(`Paper SL/TP tick error: ${message}`);
      }
    } finally {
      this.running = false;
    }
  }
}
