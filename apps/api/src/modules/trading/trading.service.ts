import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { TradingGateway } from './trading.gateway';
import { MasterSyncService } from './master-sync.service';
import { randomUUID } from 'crypto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    private masterSync: MasterSyncService,
    @InjectQueue('trade_execution') private tradeQueue: any,
  ) {
    // Start polling master accounts on app startup
    this.masterSync.startPolling(3000);
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

    // Persist a durable signal audit entry until a dedicated signal model exists.
    await this.prisma.auditLog.create({
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
    });

    const now = new Date();

    // Find all users subscribed to this strategy who are currently active and non-expired.
    // null expiresAt means lifetime or free subscription — always valid.
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        strategyId,
        status: SubscriptionStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        userId: true,
        executionPriority: true,
        slippageBps: true,
        riskOverrideEnabled: true,
        maxDrawdownPct: true,
        excludedSymbolsJson: true,
        latencyLimitMs: true,
      },
    });

    // Explicitly track signal skips for subscriptions that are active but already expired.
    const expiredSubscriptions =
      await this.prisma.userStrategySubscription.findMany({
        where: {
          strategyId,
          status: SubscriptionStatus.ACTIVE,
          expiresAt: { not: null, lte: now },
        },
        select: { userId: true, expiresAt: true },
      });

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

    const riskBlocked: Array<{ userId: string; reason: string }> = [];
    const queueJobs = [] as Promise<unknown>[];

    for (const [index, subscription] of orderedSubscriptions.entries()) {
      const reason = await this.getRiskBlockReason(subscription.userId, {
        pair,
        riskOverrideEnabled: subscription.riskOverrideEnabled,
        maxDrawdownPct: subscription.maxDrawdownPct,
        excludedSymbolsJson: subscription.excludedSymbolsJson,
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

    await this.prisma.auditLog.create({
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
    });

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
        select: { id: true, symbol: true, direction: true, openPrice: true, profit: true, brokerAccountId: true, brokerTicket: true },
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
      const realTrades = openTrades.filter((t) => t.brokerAccountId && t.brokerTicket);
      const paperTrades = openTrades.filter((t) => !t.brokerAccountId || !t.brokerTicket);

      // Queue MetaAPI close for real positions
      await Promise.all(
        realTrades.map((trade) =>
          this.tradeQueue.add(
            'close_copy',
            { tradeId: trade.id, userId, brokerAccountId: trade.brokerAccountId },
            { priority: 1 },
          ),
        ),
      );

      // Immediately cancel paper trades in DB
      if (paperTrades.length > 0) {
        await this.prisma.trade.updateMany({
          where: { id: { in: paperTrades.map((t) => t.id) } },
          data: { status: 'CANCELLED', closedAt: now, executionMode: 'EMERGENCY_STOP' },
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
            closedViaMetaApi: Boolean(trade.brokerAccountId && trade.brokerTicket),
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
          select: { name: true, category: true, riskLevel: true, monthlyPrice: true },
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
      update.status = data.isPaused ? SubscriptionStatus.PAUSED : SubscriptionStatus.ACTIVE;
    }

    return this.prisma.userStrategySubscription.update({
      where: { id: subscriptionId },
      data: update,
    });
  }

  async getOpenTrades(userId: string) {
    return this.prisma.trade.findMany({
      where: { userId, status: 'OPEN' },
      select: {
        id: true, symbol: true, direction: true, volume: true,
        openPrice: true, fillPrice: true, profit: true, status: true,
        openedAt: true, strategyId: true, brokerTicket: true, isPaper: true,
      },
      orderBy: { openedAt: 'desc' },
    });
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
        id: true, symbol: true, direction: true, volume: true,
        openPrice: true, closePrice: true, profit: true, status: true,
        openedAt: true, closedAt: true, strategyId: true, isPaper: true,
      },
      orderBy: { closedAt: 'desc' },
      take: options.limit + 1,
    });

    const hasMore = rows.length > options.limit;
    const data = hasMore ? rows.slice(0, options.limit) : rows;
    return {
      rows: data,
      nextCursor: hasMore ? data[data.length - 1]?.closedAt?.toISOString() ?? null : null,
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

  private async getRiskBlockReason(
    userId: string,
    input: {
      pair: string;
      riskOverrideEnabled: boolean;
      maxDrawdownPct: number | null;
      excludedSymbolsJson: unknown;
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

    const drawdown = await this.calculateUserDrawdownPct(userId);
    if (drawdown >= input.maxDrawdownPct) {
      return `drawdown ${drawdown.toFixed(2)}% exceeds limit ${input.maxDrawdownPct}%`;
    }

    return null;
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

  private async calculateUserDrawdownPct(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        userId,
        status: 'CLOSED',
        profit: { not: null },
      },
      orderBy: { closedAt: 'asc' },
      select: { profit: true },
    });

    if (trades.length === 0) {
      return 0;
    }

    const baseEquity = 10000;
    let equity = baseEquity;
    let peak = baseEquity;
    let maxDrawdown = 0;

    for (const trade of trades) {
      equity += trade.profit ?? 0;
      peak = Math.max(peak, equity);
      const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return this.round(maxDrawdown, 4);
  }

  private round(value: number, digits = 2) {
    const precision = 10 ** digits;
    return Math.round(value * precision) / precision;
  }
}
