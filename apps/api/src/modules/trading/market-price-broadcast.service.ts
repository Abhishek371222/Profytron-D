import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { MarketService } from '../market/market.service';
import { TradingGateway } from './trading.gateway';

@Injectable()
export class MarketPriceBroadcastService implements OnModuleInit {
  private readonly logger = new Logger(MarketPriceBroadcastService.name);
  private broadcasting = false;

  constructor(
    private readonly marketService: MarketService,
    private readonly gateway: TradingGateway,
  ) {}

  onModuleInit() {
    this.logger.log('Market price broadcast service started (8s interval)');
    void this.broadcast();
  }

  @Interval(8000)
  async broadcast() {
    if (this.broadcasting) return;
    this.broadcasting = true;
    try {
      const quotes = await this.marketService.getAllQuotes();
      if (quotes.length > 0) {
        this.gateway.broadcastPrices(quotes);
      }
    } catch (err) {
      this.logger.debug(
        `Price broadcast skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.broadcasting = false;
    }
  }
}
