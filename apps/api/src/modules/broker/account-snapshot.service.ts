import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function isMissingTableError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === 'P2021' ||
    /does not exist in the current database/i.test(String(e?.message ?? ''))
  );
}

@Injectable()
export class AccountSnapshotService {
  constructor(private prisma: PrismaService) {}

  private async assertAccess(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.brokerAccount.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId === userId) return;

    const share = await this.prisma.brokerAccountShare.findFirst({
      where: { brokerAccountId: accountId, memberUserId: userId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!share) throw new ForbiddenException('No access to this account');
  }

  private safeLimit(limit?: number, fallback = 200, max = 1000): number {
    const parsed = Number(limit ?? fallback);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(Math.trunc(parsed), 1), max);
  }

  private async latestSnapshot(accountId: string) {
    const db = this.prisma as any;
    try {
      const pointer = await db.accountLatestSnapshot.findUnique({
        where: { brokerAccountId: accountId },
        include: { snapshot: true },
      });
      if (pointer?.snapshot) return pointer.snapshot;
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }
    return db.accountSnapshot.findFirst({
      where: { brokerAccountId: accountId },
      orderBy: { capturedAt: 'desc' },
    });
  }

  async getLatestSnapshot(userId: string, accountId: string) {
    await this.assertAccess(userId, accountId);
    const snapshot = await this.latestSnapshot(accountId);
    if (!snapshot) {
      return { available: false, snapshot: null };
    }
    return {
      available: true,
      source: 'database',
      lastSyncedAt: snapshot.capturedAt,
      lastSuccessfulSync: snapshot.lastSuccessfulSync ?? snapshot.capturedAt,
      syncDuration: snapshot.syncDurationMs,
      syncStatus: snapshot.syncStatus,
      metaApiLatency: snapshot.metaApiLatencyMs,
      apiVersion: snapshot.apiVersion,
      snapshot,
    };
  }

  async getSummary(userId: string, accountId: string) {
    const latest = await this.getLatestSnapshot(userId, accountId);
    const snapshot = latest.snapshot;
    if (!snapshot) return latest;
    return {
      available: true,
      source: 'database',
      lastSyncedAt: snapshot.capturedAt,
      lastSuccessfulSync: snapshot.lastSuccessfulSync ?? snapshot.capturedAt,
      syncDuration: snapshot.syncDurationMs,
      syncStatus: snapshot.syncStatus,
      metaApiLatency: snapshot.metaApiLatencyMs,
      apiVersion: snapshot.apiVersion,
      account: {
        id: accountId,
        login: snapshot.login,
        broker: snapshot.broker,
        server: snapshot.server,
        platform: snapshot.platform,
        currency: snapshot.currency,
        leverage: snapshot.leverage,
        connectionStatus: snapshot.connectionStatus,
        synchronizationStatus: snapshot.synchronizationStatus,
      },
      metrics: {
        balance: snapshot.balance,
        equity: snapshot.equity,
        credit: snapshot.credit,
        margin: snapshot.margin,
        freeMargin: snapshot.freeMargin,
        marginLevel: snapshot.marginLevel,
        floatingPnl: snapshot.floatingPnl,
        realizedProfit: snapshot.realizedProfit,
        unrealizedProfit: snapshot.unrealizedProfit,
        todayProfit: snapshot.todayProfit,
        todayLoss: snapshot.todayLoss,
        weeklyProfit: snapshot.weeklyProfit,
        monthlyProfit: snapshot.monthlyProfit,
        netProfit: snapshot.netProfit,
        positionsCount: snapshot.positionsCount,
      },
    };
  }

  async getSnapshotHistory(
    userId: string,
    accountId: string,
    limit = 200,
  ) {
    await this.assertAccess(userId, accountId);
    const snapshots = await this.prisma.accountSnapshot.findMany({
      where: { brokerAccountId: accountId },
      orderBy: { capturedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 1000),
    });
    return { snapshots };
  }

  async getPositions(userId: string, accountId: string) {
    const { snapshot } = await this.getLatestSnapshot(userId, accountId);
    if (!snapshot) return { positions: [], capturedAt: null };
    try {
      const rows = await (this.prisma as any).accountSnapshotPosition.findMany({
        where: { snapshotId: snapshot.id },
        orderBy: { openTime: 'desc' },
      });
      return {
        positions: rows.length ? rows : ((snapshot.positionsJson as any[]) ?? []),
        capturedAt: snapshot.capturedAt,
        syncStatus: snapshot.syncStatus,
      };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return {
        positions: (snapshot.positionsJson as any[]) ?? [],
        capturedAt: snapshot.capturedAt,
        syncStatus: snapshot.syncStatus,
      };
    }
  }

  async getPendingOrders(userId: string, accountId: string) {
    const { snapshot } = await this.getLatestSnapshot(userId, accountId);
    if (!snapshot) return { orders: [], capturedAt: null };
    try {
      const orders = await (this.prisma as any).accountSnapshotPendingOrder.findMany({
        where: { snapshotId: snapshot.id },
        orderBy: { createdTime: 'desc' },
      });
      return {
        orders: orders.length ? orders : ((snapshot.pendingOrdersJson as any[]) ?? []),
        capturedAt: snapshot.capturedAt,
      };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return {
        orders: (snapshot.pendingOrdersJson as any[]) ?? [],
        capturedAt: snapshot.capturedAt,
      };
    }
  }

  async getDeals(userId: string, accountId: string, limit?: number) {
    await this.assertAccess(userId, accountId);
    const take = this.safeLimit(limit);
    try {
      const deals = await (this.prisma as any).accountSnapshotDeal.findMany({
        where: { brokerAccountId: accountId },
        orderBy: { time: 'desc' },
        take,
      });
      if (deals.length) return { deals };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }

    // Fallback 1: dealsJson on latest snapshot
    const snapshot = await this.latestSnapshot(accountId);
    const fromJson = Array.isArray(snapshot?.dealsJson)
      ? (snapshot.dealsJson as any[]).slice(0, take)
      : [];
    if (fromJson.length) return { deals: fromJson };

    // Fallback 2: closed Trade rows already synced from MetaAPI
    const trades = await this.prisma.trade.findMany({
      where: { brokerAccountId: accountId, status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
      take,
      select: {
        id: true,
        brokerTicket: true,
        symbol: true,
        openPrice: true,
        closePrice: true,
        volume: true,
        profit: true,
        commission: true,
        swap: true,
        openedAt: true,
        closedAt: true,
        direction: true,
      },
    });
    return {
      deals: trades.map((t) => ({
        id: t.id,
        dealId: t.brokerTicket,
        positionId: t.brokerTicket,
        symbol: t.symbol,
        price: t.closePrice ?? t.openPrice,
        volume: t.volume,
        commission: t.commission,
        swap: t.swap,
        profit: t.profit ?? 0,
        time: t.closedAt ?? t.openedAt,
        executionType: t.direction === 'SHORT' ? 'SELL' : 'BUY',
      })),
    };
  }

  async getBalanceHistory(userId: string, accountId: string, limit?: number) {
    await this.assertAccess(userId, accountId);
    const snapshots = await this.prisma.accountSnapshot.findMany({
      where: { brokerAccountId: accountId },
      orderBy: { capturedAt: 'asc' },
      take: this.safeLimit(limit, 200, 2000),
      select: { id: true, balance: true, capturedAt: true },
    });
    return { points: snapshots };
  }

  async getEquityHistory(userId: string, accountId: string, limit?: number) {
    await this.assertAccess(userId, accountId);
    const take = this.safeLimit(limit, 200, 2000);
    const snapshots = await this.prisma.accountSnapshot.findMany({
      where: { brokerAccountId: accountId },
      orderBy: { capturedAt: 'asc' },
      take,
      select: { id: true, equity: true, capturedAt: true },
    });
    if (snapshots.length) return { points: snapshots };

    const equity = await this.prisma.equitySnapshot.findMany({
      where: { brokerAccountId: accountId },
      orderBy: { capturedAt: 'asc' },
      take,
      select: { id: true, equity: true, capturedAt: true },
    });
    return { points: equity };
  }

  async getDrawdownHistory(userId: string, accountId: string, limit?: number) {
    await this.assertAccess(userId, accountId);
    try {
      const points = await (this.prisma as any).accountSnapshotPerformance.findMany({
        where: { brokerAccountId: accountId },
        orderBy: { capturedAt: 'asc' },
        take: this.safeLimit(limit, 200, 2000),
        select: {
          snapshotId: true,
          maxDrawdown: true,
          relativeDrawdown: true,
          floatingDrawdown: true,
          balanceDrawdown: true,
          currentDrawdown: true,
          capturedAt: true,
        },
      });
      return { points };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return { points: [] };
    }
  }

  async getReturnsHistory(userId: string, accountId: string, limit?: number) {
    await this.assertAccess(userId, accountId);
    try {
      const points = await (this.prisma as any).accountSnapshotPerformance.findMany({
        where: { brokerAccountId: accountId },
        orderBy: { capturedAt: 'asc' },
        take: this.safeLimit(limit, 200, 2000),
        select: {
          snapshotId: true,
          totalReturn: true,
          dailyReturn: true,
          weeklyReturn: true,
          monthlyReturn: true,
          yearlyReturn: true,
          capturedAt: true,
        },
      });
      return { points };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return { points: [] };
    }
  }

  async getAnalytics(userId: string, accountId: string) {
    const latest = await this.getLatestSnapshot(userId, accountId);
    return {
      analytics: latest.snapshot?.performanceJson ?? null,
      capturedAt: latest.snapshot?.capturedAt ?? null,
    };
  }

  async getPerformance(userId: string, accountId: string) {
    const { snapshot } = await this.getLatestSnapshot(userId, accountId);
    if (!snapshot) return { performance: null, capturedAt: null };
    try {
      const performance = await (this.prisma as any).accountSnapshotPerformance.findUnique({
        where: { snapshotId: snapshot.id },
      });
      return {
        performance: performance ?? snapshot.performanceJson,
        capturedAt: snapshot.capturedAt,
      };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return {
        performance: snapshot.performanceJson ?? null,
        capturedAt: snapshot.capturedAt,
      };
    }
  }

  async getRisk(userId: string, accountId: string) {
    const { snapshot } = await this.getLatestSnapshot(userId, accountId);
    if (!snapshot) return { risk: null, capturedAt: null };
    try {
      const risk = await (this.prisma as any).accountSnapshotRisk.findUnique({
        where: { snapshotId: snapshot.id },
      });
      return { risk: risk ?? snapshot.riskJson, capturedAt: snapshot.capturedAt };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return { risk: snapshot.riskJson ?? null, capturedAt: snapshot.capturedAt };
    }
  }

  async getSymbols(userId: string, accountId: string) {
    const { snapshot } = await this.getLatestSnapshot(userId, accountId);
    if (!snapshot) return { symbols: [], capturedAt: null };
    try {
      const symbols = await (this.prisma as any).accountSnapshotSymbol.findMany({
        where: { snapshotId: snapshot.id },
        orderBy: { symbol: 'asc' },
      });
      return {
        symbols: symbols.length ? symbols : ((snapshot.symbolsJson as any[]) ?? []),
        capturedAt: snapshot.capturedAt,
      };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return {
        symbols: (snapshot.symbolsJson as any[]) ?? [],
        capturedAt: snapshot.capturedAt,
      };
    }
  }

  async getTimeline(userId: string, accountId: string, limit?: number) {
    await this.assertAccess(userId, accountId);
    try {
      const events = await (this.prisma as any).accountSnapshotEvent.findMany({
        where: { brokerAccountId: accountId },
        orderBy: { occurredAt: 'desc' },
        take: this.safeLimit(limit),
      });
      return { events };
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      return { events: [] };
    }
  }
}
