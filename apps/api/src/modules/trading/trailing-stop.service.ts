import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { TradeDirection, TradeStatus } from '@prisma/client';
import { mapTradeSymbolToMarket } from './utils/pnl.util';

/**
 * Polls open trades that have a trailing-stop config in executionMetadataJson
 * and ratchets the stop-loss in the favourable direction only. When the stop
 * should move, it enqueues a `modify_trade` job (reusing the same broker-
 * agnostic path as manual SL modifications) rather than mutating directly.
 */
@Injectable()
export class TrailingStopService implements OnModuleDestroy {
  private readonly logger = new Logger(TrailingStopService.name);
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
    this.timer = setInterval(() => this.tick(), intervalMs);
    this.logger.log(`Trailing-stop polling started (${intervalMs}ms interval)`);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const trades = await this.prisma.trade.findMany({
        where: {
          status: TradeStatus.OPEN,
          executionMetadataJson: {
            path: ['trailing', 'active'],
            equals: true,
          },
        },
        select: {
          id: true,
          userId: true,
          symbol: true,
          direction: true,
          openPrice: true,
          fillPrice: true,
          stopLoss: true,
          executionMetadataJson: true,
        },
      });
      if (trades.length === 0) return;

      const priceCache = new Map<string, number | null>();
      for (const t of trades) {
        const meta = (t.executionMetadataJson as any) ?? {};
        const distance = Number(meta?.trailing?.distance);
        if (!Number.isFinite(distance) || distance <= 0) continue;

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

        const desiredSl =
          t.direction === TradeDirection.LONG
            ? price - distance
            : price + distance;

        // Only ratchet in the favourable direction (never loosen the stop).
        const improves =
          t.stopLoss == null ||
          (t.direction === TradeDirection.LONG
            ? desiredSl > t.stopLoss
            : desiredSl < t.stopLoss);
        if (!improves) continue;

        const decimals = price > 100 ? 2 : 5;
        await this.tradeQueue.add('modify_trade', {
          tradeId: t.id,
          userId: t.userId,
          stopLoss: Number(desiredSl.toFixed(decimals)),
        });
      }
    } catch (err) {
      this.logger.error(`Trailing-stop tick error: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
