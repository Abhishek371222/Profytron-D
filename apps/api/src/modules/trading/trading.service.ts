import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { TradingGateway } from './trading.gateway';
import { MasterSyncService } from './master-sync.service';
import { MarketService, type MarketSymbol } from '../market/market.service';
import { randomUUID } from 'crypto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    private masterSync: MasterSyncService,
    private marketService: MarketService,
    @InjectQueue('trade_execution') private tradeQueue: any,
  ) {
    const useCopyFactory =
      process.env.METAAPI_TOKEN &&
      process.env.COPYFACTORY_ENABLED !== 'false';
    if (!useCopyFactory) {
      this.masterSync.startPolling(3000);
    } else {
      this.logger.log(
        'CopyFactory enabled — legacy master position polling disabled',
      );
    }
  }

  async processSignal(
    strategyId: string,
    signalType: string,
    pair: string,
    price: number,
  ) {
    this.logger.log(
      `[Signal] ${strategyId} triggered ${signalType} for ${pair} at ${price}`,
    );

    const signalId = randomUUID();

    // Persist signal audit off the critical path — fire-and-forget.
    this.prisma.auditLog.create({
      data: {
        eventType: 'TRADING_SIGNAL_RECEIVED',
        userId: null,
        detailsJson: {
          signalId,
          strategyId,
          type: signalType,
          pair,
          price,
          timestamp: new Date().toISOString(),
        },
        triggeredBy: strategyId,
      },
    }).catch((err: Error) => this.logger.error(`Audit write failed: ${err.message}`));

    const now = new Date();

    // Single query for ALL active subscriptions — then partition in JS (avoids double scan).
    const allActiveSubs = await this.prisma.userStrategySubscription.findMany({
      where: { strategyId, status: SubscriptionStatus.ACTIVE },
      select: {
        id: true,
        userId: true,
        executionPriority: true,
        slippageBps: true,
        riskOverrideEnabled: true,
        maxDrawdownPct: true,
        excludedSymbolsJson: true,
        latencyLimitMs: true,
        expiresAt: true,
      },
    });

    const expiredSubscriptions = allActiveSubs.filter(
      (s) => s.expiresAt !== null && s.expiresAt <= now,
    );
    const subscriptions = allActiveSubs.filter(
      (s) => s.expiresAt === null || s.expiresAt > now,
    );

    if (expiredSubscriptions.length > 0) {
      await this.prisma.auditLog.createMany({
        data: expiredSubscriptions.map((subscription) => ({
          eventType: 'TRADING_SIGNAL_SKIPPED_EXPIRED',
          userId: subscription.userId,
          detailsJson: {
            signalId,
            strategyId,
            type: signalType,
            pair,
            price,
            expiresAt: subscription.expiresAt?.toISOString() ?? null,
            skippedAt: now.toISOString(),
          },
          triggeredBy: strategyId,
        })),
      });
    }

    const orderedSubscriptions = [...subscriptions].sort(
      (a, b) => (b.executionPriority ?? 0) - (a.executionPriority ?? 0),
    );

    // Pre-compute drawdowns for ALL subscribers in a single DB round-trip,
    // eliminating the N+1 query that previously hit the DB once per subscriber.
    const userIdsNeedingDrawdown = orderedSubscriptions
      .filter((s) => s.riskOverrideEnabled && s.maxDrawdownPct != null)
      .map((s) => s.userId);
    const drawdownMap = await this.buildDrawdownMap(userIdsNeedingDrawdown);

    const riskBlocked: Array<{ userId: string; reason: string }> = [];
    const queueJobs = [] as Promise<unknown>[];

    for (const [index, subscription] of orderedSubscriptions.entries()) {
      const reason = this.getRiskBlockReason(subscription.userId, {
        pair,
        riskOverrideEnabled: subscription.riskOverrideEnabled,
        maxDrawdownPct: subscription.maxDrawdownPct,
        excludedSymbolsJson: subscription.excludedSymbolsJson,
        drawdownPct: drawdownMap.get(subscription.userId) ?? 0,
      });

      if (reason) {
        riskBlocked.push({ userId: subscription.userId, reason });
        continue;
      }

      const icebergSliceCount = Math.max(
        1,
        Math.ceil(orderedSubscriptions.length / 15),
      );
      const icebergSliceIndex = Math.floor(index / 15);
      const executionLatencyBudgetMs =
        subscription.latencyLimitMs ?? Math.max(75, 500 - index * 10);
      const slippageBps = this.calculateSlippageBps(
        subscription.slippageBps ?? 0,
        index,
        orderedSubscriptions.length,
        icebergSliceIndex,
      );

      queueJobs.push(
        this.tradeQueue.add(
          'execute_trade',
          {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            signalId,
            strategyId,
            type: signalType,
            pair,
            price,
            requestedPrice: price,
            queuedAt: now.toISOString(),
            executionMode: icebergSliceCount > 1 ? 'ICEBERG' : 'STREAMED',
            executionMetadataJson: {
              signalId,
              strategyId,
              pair,
              priority: subscription.executionPriority ?? 0,
              slippageBps,
              icebergSliceCount,
              icebergSliceIndex,
              executionLatencyBudgetMs,
            },
            icebergSliceCount,
            icebergSliceIndex,
            slippageBps,
          },
          {
            priority: Math.max(1, 100 - (subscription.executionPriority ?? 0)),
          },
        ),
      );
    }

    if (riskBlocked.length > 0) {
      await this.prisma.auditLog.createMany({
        data: riskBlocked.map((blocked) => ({
          eventType: 'TRADING_SIGNAL_SKIPPED_RISK_LIMIT',
          userId: blocked.userId,
          detailsJson: {
            signalId,
            strategyId,
            type: signalType,
            pair,
            reason: blocked.reason,
            skippedAt: now.toISOString(),
          },
          triggeredBy: strategyId,
        })),
      });
    }

    // Fan out queue jobs in parallel so all eligible subscribers get execution quickly.
    await Promise.all(queueJobs);

    return {
      signalId,
      subscribersNotified: queueJobs.length,
      subscribersBlocked: riskBlocked.length,
    };
  }

  async broadcastMasterSignal(input: {
    sourceBrokerAccountId: string;
    strategyId: string;
    signalType: string;
    pair: string;
    price: number;
  }) {
    const sourceAccount = await this.prisma.brokerAccount.findUnique({
      where: { id: input.sourceBrokerAccountId },
      select: {
        id: true,
        userId: true,
        isMasterSource: true,
        isActive: true,
        brokerName: true,
        accountNumberLast4: true,
      },
    });

    if (!sourceAccount || !sourceAccount.isActive) {
      throw new Error('Master broker account is not available');
    }

    if (!sourceAccount.isMasterSource) {
      throw new Error('Broker account is not marked as a master source');
    }

    this.prisma.auditLog.create({
      data: {
        eventType: 'MASTER_TRADING_SIGNAL_BROADCAST',
        userId: sourceAccount.userId,
        detailsJson: {
          sourceBrokerAccountId: sourceAccount.id,
          brokerName: sourceAccount.brokerName,
          accountNumberLast4: sourceAccount.accountNumberLast4,
          strategyId: input.strategyId,
          type: input.signalType,
          pair: input.pair,
          price: input.price,
          broadcastAt: new Date().toISOString(),
        },
        triggeredBy: sourceAccount.id,
      },
    }).catch((err: Error) => this.logger.error(`Audit write failed: ${err.message}`));

    return this.processSignal(
      input.strategyId,
      input.signalType,
      input.pair,
      input.price,
    );
  }

  async emergencyStop(userId: string) {
    this.logger.warn(`[EMERGENCY] Stop triggered for user ${userId}`);

    const now = new Date();

    const [openTrades] = await Promise.all([
      this.prisma.trade.findMany({
        where: { userId, status: 'OPEN' },
        select: {
          id: true,
          symbol: true,
          direction: true,
          openPrice: true,
          profit: true,
          brokerAccountId: true,
          brokerTicket: true,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          eventType: 'TRADING_EMERGENCY_STOP',
          userId,
          detailsJson: { requestedAt: now.toISOString() },
          triggeredBy: userId,
        },
      }),
    ]);

    let closedCount = 0;
    if (openTrades.length > 0) {
      // For real broker positions: queue close_copy jobs so MetaAPI actually closes them
      // For paper/no-ticket trades: mark cancelled directly
      const realTrades = openTrades.filter(
        (t) => t.brokerAccountId && t.brokerTicket,
      );
      const paperTrades = openTrades.filter(
        (t) => !t.brokerAccountId || !t.brokerTicket,
      );

      // Queue MetaAPI close for real positions
      await Promise.all(
        realTrades.map((trade) =>
          this.tradeQueue.add(
            'close_copy',
            {
              tradeId: trade.id,
              userId,
              brokerAccountId: trade.brokerAccountId,
            },
            { priority: 1 },
          ),
        ),
      );

      // Immediately cancel paper trades in DB
      if (paperTrades.length > 0) {
        await this.prisma.trade.updateMany({
          where: { id: { in: paperTrades.map((t) => t.id) } },
          data: {
            status: 'CANCELLED',
            closedAt: now,
            executionMode: 'EMERGENCY_STOP',
          },
        });
      }

      closedCount = openTrades.length;

      await this.prisma.auditLog.createMany({
        data: openTrades.map((trade) => ({
          eventType: 'TRADE_EMERGENCY_CLOSED',
          userId,
          detailsJson: {
            tradeId: trade.id,
            symbol: trade.symbol,
            direction: trade.direction,
            openPrice: trade.openPrice,
            closedViaMetaApi: Boolean(
              trade.brokerAccountId && trade.brokerTicket,
            ),
            closedAt: now.toISOString(),
          },
          triggeredBy: userId,
        })),
      });
    }

    this.gateway.sendToUser(userId, 'emergency_stop_triggered', {
      timestamp: now,
      status: openTrades.length === 0 ? 'NO_OPEN_TRADES' : 'SUCCESS',
      closedTrades: closedCount,
    });

    return {
      success: true,
      userId,
      closedTrades: closedCount,
      stoppedAt: now.toISOString(),
    };
  }

  async getMySubscriptions(userId: string) {
    return this.prisma.userStrategySubscription.findMany({
      where: { userId },
      select: {
        id: true,
        strategyId: true,
        status: true,
        planType: true,
        subscribedAt: true,
        expiresAt: true,
        lotMultiplier: true,
        executionPriority: true,
        lastExecutionAt: true,
        lastLatencyMs: true,
        brokerAccountId: true,
        strategy: {
          select: {
            name: true,
            category: true,
            riskLevel: true,
            monthlyPrice: true,
          },
        },
      },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    data: { lotMultiplier?: number; isPaused?: boolean },
  ) {
    const sub = await this.prisma.userStrategySubscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const update: Record<string, any> = {};
    if (data.lotMultiplier !== undefined) {
      update.lotMultiplier = Math.min(Math.max(data.lotMultiplier, 0.01), 5.0);
    }
    if (data.isPaused !== undefined) {
      update.status = data.isPaused
        ? SubscriptionStatus.PAUSED
        : SubscriptionStatus.ACTIVE;
    }

    return this.prisma.userStrategySubscription.update({
      where: { id: subscriptionId },
      data: update,
    });
  }

  async getOpenTrades(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, status: 'OPEN' },
      select: {
        id: true,
        symbol: true,
        direction: true,
        volume: true,
        openPrice: true,
        fillPrice: true,
        profit: true,
        status: true,
        openedAt: true,
        strategyId: true,
        brokerTicket: true,
        isPaper: true,
      },
      orderBy: { openedAt: 'desc' },
    });

    return Promise.all(
      trades.map(async (trade) => {
        let profit = trade.profit;
        if (profit == null) {
          const marketSymbol = this.mapTradeSymbolToMarket(trade.symbol);
          if (marketSymbol) {
            try {
              const quote = await this.marketService.getQuote(marketSymbol);
              profit = this.estimateUnrealizedPnl(trade, quote.price);
            } catch {
              profit = 0;
            }
          } else {
            profit = 0;
          }
        }
        return { ...trade, profit, unrealizedPnl: profit };
      }),
    );
  }

  private mapTradeSymbolToMarket(symbol: string): MarketSymbol | null {
    const normalized = symbol.toUpperCase().replace(/[^A-Z]/g, '');
    if (normalized.includes('BTC')) return 'BTCUSDT';
    if (normalized.includes('XAU') || normalized.includes('GOLD')) return 'XAUUSD';
    if (normalized.includes('EUR')) return 'EURUSD';
    if (this.marketService.supportedSymbols.includes(normalized as MarketSymbol)) {
      return normalized as MarketSymbol;
    }
    return null;
  }

  private estimateUnrealizedPnl(
    trade: { direction: string; volume: number; openPrice: number; fillPrice: number | null },
    currentPrice: number,
  ): number {
    const entry = trade.fillPrice ?? trade.openPrice;
    if (!entry || !currentPrice) return 0;
    const dir = trade.direction === 'LONG' ? 1 : -1;
    const multiplier = entry > 100 ? 1 : 100_000;
    return Number((dir * (currentPrice - entry) * trade.volume * multiplier).toFixed(2));
  }

  async getTradeHistory(
    userId: string,
    options: { limit: number; cursor?: string; symbol?: string },
  ) {
    const where: any = {
      userId,
      status: { in: ['CLOSED', 'CANCELLED'] },
      ...(options.symbol ? { symbol: options.symbol.toUpperCase() } : {}),
      ...(options.cursor ? { closedAt: { lt: new Date(options.cursor) } } : {}),
    };

    const rows = await this.prisma.trade.findMany({
      where,
      select: {
        id: true,
        symbol: true,
        direction: true,
        volume: true,
        openPrice: true,
        closePrice: true,
        profit: true,
        status: true,
        openedAt: true,
        closedAt: true,
        strategyId: true,
        isPaper: true,
      },
      orderBy: { closedAt: 'desc' },
      take: options.limit + 1,
    });

    const hasMore = rows.length > options.limit;
    const data = hasMore ? rows.slice(0, options.limit) : rows;
    return {
      rows: data,
      nextCursor: hasMore
        ? (data[data.length - 1]?.closedAt?.toISOString() ?? null)
        : null,
    };
  }

  getMasterStatus() {
    return this.masterSync.getMasterStatus();
  }

  private calculateSlippageBps(
    baseSlippageBps: number,
    subscriberIndex: number,
    totalSubscribers: number,
    icebergSliceIndex: number,
  ) {
    const crowdingFactor =
      totalSubscribers > 1
        ? (subscriberIndex / Math.max(totalSubscribers - 1, 1)) * 6
        : 0;
    const slicePressure = icebergSliceIndex * 0.75;
    return this.round(baseSlippageBps + 1 + crowdingFactor + slicePressure, 4);
  }

  /**
   * Synchronous risk check — drawdown is pre-fetched via buildDrawdownMap().
   * No DB call here; eliminates the N+1 query from processSignal().
   */
  private getRiskBlockReason(
    userId: string,
    input: {
      pair: string;
      riskOverrideEnabled: boolean;
      maxDrawdownPct: number | null;
      excludedSymbolsJson: unknown;
      drawdownPct: number;
    },
  ) {
    const pair = input.pair.toUpperCase();
    const excludedSymbols = this.normalizeExcludedSymbols(
      input.excludedSymbolsJson,
    );
    if (excludedSymbols.includes(pair)) {
      return `symbol ${pair} is excluded`;
    }

    if (!input.riskOverrideEnabled || input.maxDrawdownPct == null) {
      return null;
    }

    if (input.drawdownPct >= input.maxDrawdownPct) {
      return `drawdown ${input.drawdownPct.toFixed(2)}% exceeds limit ${input.maxDrawdownPct}%`;
    }

    return null;
  }

  /**
   * Batch-fetch max drawdown for multiple users in a single DB query.
   * Returns a map of userId → drawdownPct.
   */
  private async buildDrawdownMap(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const trades = await this.prisma.trade.findMany({
      where: {
        userId: { in: userIds },
        status: 'CLOSED',
        profit: { not: null },
      },
      orderBy: { closedAt: 'asc' },
      select: { userId: true, profit: true },
    });

    const byUser = new Map<string, number[]>();
    for (const t of trades) {
      const arr = byUser.get(t.userId) ?? [];
      arr.push(t.profit ?? 0);
      byUser.set(t.userId, arr);
    }

    const result = new Map<string, number>();
    const baseEquity = 10000;
    for (const [uid, profits] of byUser.entries()) {
      let equity = baseEquity;
      let peak = baseEquity;
      let maxDrawdown = 0;
      for (const p of profits) {
        equity += p;
        peak = Math.max(peak, equity);
        const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, dd);
      }
      result.set(uid, this.round(maxDrawdown, 4));
    }

    for (const uid of userIds) {
      if (!result.has(uid)) result.set(uid, 0);
    }

    return result;
  }

  private normalizeExcludedSymbols(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).toUpperCase());
    }
    if (value && typeof value === 'object') {
      const asRecord = value as Record<string, unknown>;
      if (Array.isArray(asRecord.symbols)) {
        return asRecord.symbols.map((item) => String(item).toUpperCase());
      }
    }
    return [];
  }

  private round(value: number, digits = 2) {
    const precision = 10 ** digits;
    return Math.round(value * precision) / precision;
  }
}
