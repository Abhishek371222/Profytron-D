import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MarketService } from '../market/market.service';
import { RedisService } from '../auth/redis.service';
import { runBacktest } from './engine/backtest-engine';
import { compileGraph } from './compiler/strategy-compiler';
import { generatePine } from './codegen/pine-generator';
import { generateMql5 } from './codegen/mql5-generator';
import { StrategyDefinition, OhlcCandle } from './types';
import * as crypto from 'crypto';

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(
    private readonly market: MarketService,
    private readonly redis: RedisService,
  ) {}

  async runFromDefinition(
    definition: StrategyDefinition,
    startDate: string,
    endDate: string,
    initialCapital = 10_000,
  ) {
    const cacheKey = `backtest:def:${this.hash({ definition, startDate, endDate, initialCapital })}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const candles = await this.fetchCandles(
      definition.symbol as any,
      definition.timeframe as any,
      startDate,
      endDate,
    );
    if (candles.length < 20)
      throw new BadRequestException('Insufficient market data for backtest');

    const result = runBacktest(definition, candles, initialCapital);

    await this.redis.set(cacheKey, JSON.stringify(result), 3600);
    return result;
  }

  async runFromGraph(
    nodes: any[],
    edges: any[],
    startDate: string,
    endDate: string,
    initialCapital = 10_000,
  ) {
    const definition = compileGraph(nodes, edges);
    return this.runFromDefinition(
      definition,
      startDate,
      endDate,
      initialCapital,
    );
  }

  compileGraph(nodes: any[], edges: any[]): StrategyDefinition {
    return compileGraph(nodes, edges);
  }

  generatePineScript(definition: StrategyDefinition): string {
    return generatePine(definition);
  }

  generateMql5(definition: StrategyDefinition): string {
    return generateMql5(definition);
  }

  private async fetchCandles(
    symbol: any,
    timeframe: any,
    startDate: string,
    endDate: string,
  ): Promise<OhlcCandle[]> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const msPerCandle = this.timeframeToMs(timeframe);
    const totalCandles = Math.min(Math.ceil((end - start) / msPerCandle), 2000);

    // MarketService caps at 500 — loop to gather full range
    const all: OhlcCandle[] = [];
    const batchSize = 500;
    let remaining = totalCandles;

    while (remaining > 0) {
      const limit = Math.min(remaining, batchSize);
      const result = await this.market.getOHLC(symbol, timeframe, limit);
      all.push(...result.candles);
      remaining -= limit;
      if (result.candles.length < limit) break;
    }

    // Filter to requested date range
    return all.filter((c) => {
      const t = new Date(c.datetime).getTime();
      return t >= start && t <= end;
    });
  }

  private timeframeToMs(timeframe: string): number {
    const map: Record<string, number> = {
      '1m': 60_000,
      '5m': 5 * 60_000,
      '15m': 15 * 60_000,
      '1h': 60 * 60_000,
      '4h': 4 * 60 * 60_000,
      '1d': 24 * 60 * 60_000,
    };
    return map[timeframe] ?? 60 * 60_000;
  }

  private hash(obj: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(obj))
      .digest('hex')
      .slice(0, 16);
  }
}
