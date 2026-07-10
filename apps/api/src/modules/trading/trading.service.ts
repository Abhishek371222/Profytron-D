import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { TradingGateway } from './trading.gateway';
import { MasterSyncService } from './master-sync.service';
import { TrailingStopService } from './trailing-stop.service';
import { CopyFactoryPositionSyncService } from './copy-factory-position-sync.service';
import { MarketService, type MarketSymbol } from '../market/market.service';
import {
  mapTradeSymbolToMarket as mapSymbol,
  estimateUnrealizedPnl as estimatePnl,
} from './utils/pnl.util';
import type { BulkCloseScope, ManualOrderDto } from './dto/trade-actions.dto';
import { randomUUID } from 'crypto';
import { SubscriptionStatus } from '@prisma/client';
import { isPaidCopySubscription } from '../../common/utils/copy-subscription.util';
import { isMasterOnlyExecution } from '../../common/utils/execution-mode.util';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    private masterSync: MasterSyncService,
    private marketService: MarketService,
    private trailingStop: TrailingStopService,
    private copyFactoryPositionSync: CopyFactoryPositionSyncService,
    @InjectQueue('trade_execution') private tradeQueue: any,
  ) {
    const hasMetaApiToken = Boolean(process.env.METAAPI_TOKEN?.trim());
    const masterOnly = isMasterOnlyExecution();

    // Option 1: MetaApi master bridge only — detect master fills via MasterSync.
    // Never start CopyFactory subscriber sync; never require CF in production.
    if (masterOnly) {
      if (!hasMetaApiToken) {
        this.logger.error(
          'FATAL: EXECUTION_MODE=master_only requires METAAPI_TOKEN for the operator master account.',
        );
        throw new Error(
          'Boot refused: master_only mode needs METAAPI_TOKEN (master bridge).',
        );
      }
      this.logger.log(
        'EXECUTION_MODE=master_only — MasterSync on; CopyFactory subscriber path off (no per-user MetaApi seats)',
      );
      this.masterSync.startPolling(
        Number(process.env.MASTER_SYNC_INTERVAL_MS) || 3000,
      );
    } else {
      const isProduction = process.env.NODE_ENV === 'production';
      const copyFactoryRequested = process.env.COPYFACTORY_ENABLED !== 'false';
      const useCopyFactory = hasMetaApiToken && copyFactoryRequested;

      if (isProduction) {
        if (!useCopyFactory) {
          this.logger.error(
            'FATAL: Production CopyFactory mode requires METAAPI_TOKEN with COPYFACTORY_ENABLED≠false.',
          );
          throw new Error(
            'Production boot refused: CopyFactory is required in copyfactory mode.',
          );
        }
        this.logger.log(
          'CopyFactory enabled — legacy MasterSync disabled (production)',
        );
        this.copyFactoryPositionSync.startPolling(5000);
      } else if (useCopyFactory) {
        this.logger.log(
          'CopyFactory enabled — legacy master position polling disabled',
        );
        this.copyFactoryPositionSync.startPolling(5000);
      } else {
        this.masterSync.startPolling(3000);
      }
    }

    if (process.env.TRAILING_STOP_ENABLED !== 'false') {
      this.trailingStop.startPolling(
        Number(process.env.TRAILING_STOP_INTERVAL_MS) || 5000,
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
    this.prisma.auditLog
      .create({
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
      })
      .catch((err: Error) =>
        this.logger.error(`Audit write failed: ${err.message}`),
      );

    const now = new Date();

    // Single query for ALL active subscriptions — then partition in JS (avoids double scan).
    const allActiveSubs = await this.prisma.userStrategySubscription.findMany({
      where: { strategyId, status: SubscriptionStatus.ACTIVE },
      select: {
        id: true,
        userId: true,
        status: true,
        executionPriority: true,
        slippageBps: true,
        riskOverrideEnabled: true,
        maxDrawdownPct: true,
        excludedSymbolsJson: true,
        latencyLimitMs: true,
        expiresAt: true,
        trialEndsAt: true,
        stripeSubId: true,
        planType: true,
      },
    });

    const expiredSubscriptions = allActiveSubs.filter(
      (s) => s.expiresAt !== null && s.expiresAt <= now,
    );
    const subscriptions = allActiveSubs.filter(
      (s) =>
        (s.expiresAt === null || s.expiresAt > now) &&
        isPaidCopySubscription(s),
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

    this.prisma.auditLog
      .create({
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
      })
      .catch((err: Error) =>
        this.logger.error(`Audit write failed: ${err.message}`),
      );

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
      timestamp: now.toISOString(),
      status: openTrades.length === 0 ? 'NO_OPEN_TRADES' : 'SUCCESS',
      closedTrades: closedCount,
      stoppedAt: now.toISOString(),
    };
  }

  async closeTrade(userId: string, tradeId: string, volume?: number) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId, status: 'OPEN' },
      select: { id: true, volume: true },
    });
    if (!trade) throw new NotFoundException('Open trade not found');
    if (volume != null && (volume <= 0 || volume > trade.volume)) {
      throw new BadRequestException('Invalid partial close volume');
    }
    await this.tradeQueue.add(
      'close_trade',
      { tradeId, userId, volume: volume ?? undefined },
      { priority: 1 },
    );
    return {
      success: true,
      tradeId,
      mode: volume != null && volume < trade.volume ? 'PARTIAL' : 'FULL',
    };
  }

  async modifyTrade(
    userId: string,
    tradeId: string,
    changes: { stopLoss?: number; takeProfit?: number },
  ) {
    await this.assertOpenTrade(userId, tradeId);
    await this.tradeQueue.add('modify_trade', {
      tradeId,
      userId,
      stopLoss: changes.stopLoss,
      takeProfit: changes.takeProfit,
    });
    return { success: true, tradeId };
  }

  async breakEven(userId: string, tradeId: string, offsetPips?: number) {
    await this.assertOpenTrade(userId, tradeId);
    await this.tradeQueue.add('break_even', {
      tradeId,
      userId,
      offsetPips: offsetPips ?? 0,
    });
    return { success: true, tradeId };
  }

  async setTrailingStop(userId: string, tradeId: string, distance: number) {
    await this.assertOpenTrade(userId, tradeId);
    await this.tradeQueue.add('trailing_stop', {
      tradeId,
      userId,
      distance,
      active: true,
    });
    return { success: true, tradeId, distance };
  }

  async bulkClose(userId: string, scope: BulkCloseScope) {
    const open = await this.getOpenTrades(userId);
    const selected = open.filter((t) => {
      switch (scope) {
        case 'BUYS':
          return t.direction === 'LONG';
        case 'SELLS':
          return t.direction === 'SHORT';
        case 'PROFITABLE':
          return (t.profit ?? 0) > 0;
        case 'LOSING':
          return (t.profit ?? 0) < 0;
        case 'ALL':
        default:
          return true;
      }
    });
    await Promise.all(
      selected.map((t) =>
        this.tradeQueue.add(
          'close_trade',
          { tradeId: t.id, userId },
          { priority: 1 },
        ),
      ),
    );
    return { success: true, scope, queued: selected.length };
  }

  async placeManualOrder(userId: string, dto: ManualOrderDto) {
    const account = await this.prisma.brokerAccount.findFirst({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
      select: { id: true },
    });
    if (!account) {
      throw new BadRequestException('Connect a broker account first');
    }

    let price = 0;
    const marketSymbol = this.mapTradeSymbolToMarket(dto.symbol);
    if (marketSymbol) {
      try {
        const q = await this.marketService.getQuote(marketSymbol);
        price = typeof q?.price === 'number' ? q.price : 0;
      } catch {
        /* best-effort fill price; processor will still record the order */
      }
    }

    await this.tradeQueue.add(
      'execute_trade',
      {
        userId,
        strategyId: null,
        type: dto.side,
        pair: dto.symbol.toUpperCase(),
        price,
        requestedPrice: price,
        volume: dto.volume,
        stopLoss: dto.stopLoss,
        takeProfit: dto.takeProfit,
        queuedAt: new Date().toISOString(),
        executionMode: 'MANUAL',
      },
      { priority: 1 },
    );
    return {
      success: true,
      symbol: dto.symbol.toUpperCase(),
      side: dto.side,
      volume: dto.volume,
    };
  }

  private async assertOpenTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId, status: 'OPEN' },
      select: { id: true },
    });
    if (!trade) throw new NotFoundException('Open trade not found');
    return trade;
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

  async getOpenTrades(userId: string, brokerAccountId?: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        status: 'OPEN',
        ...(brokerAccountId ? { brokerAccountId } : {}),
      },
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

    const needsQuote = trades.some((t) => t.profit == null);
    const quoteBySymbol = new Map<string, number>();
    if (needsQuote) {
      try {
        const quotes = await this.marketService.getAllQuotes();
        for (const q of quotes) {
          quoteBySymbol.set(q.symbol, q.price);
        }
      } catch {
        // Fall through — unrealized PnL defaults to 0 per trade.
      }
    }

    return trades.map((trade) => {
      let profit = trade.profit;
      if (profit == null) {
        const marketSymbol = this.mapTradeSymbolToMarket(trade.symbol);
        if (marketSymbol) {
          const quote = quoteBySymbol.get(marketSymbol);
          profit = quote != null ? this.estimateUnrealizedPnl(trade, quote) : 0;
        } else {
          profit = 0;
        }
      }
      return { ...trade, profit, unrealizedPnl: profit };
    });
  }

  private mapTradeSymbolToMarket(symbol: string): MarketSymbol | null {
    return mapSymbol(symbol, this.marketService.supportedSymbols);
  }

  private estimateUnrealizedPnl(
    trade: {
      direction: string;
      volume: number;
      openPrice: number;
      fillPrice: number | null;
    },
    currentPrice: number,
  ): number {
    return estimatePnl(trade, currentPrice);
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
  private async buildDrawdownMap(
    userIds: string[],
  ): Promise<Map<string, number>> {
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
