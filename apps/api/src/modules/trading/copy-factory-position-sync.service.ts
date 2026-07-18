import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { RedisService } from '../auth/redis.service';
import { TradingGateway } from './trading.gateway';
import { CopyLedgerService } from './copy-ledger.service';
import { CopyFactoryService } from '../copy-factory/copy-factory.service';
import {
  SubscriptionStatus,
  TradeDirection,
  TradeStatus,
  TradeEventType,
} from '@prisma/client';

interface BrokerPosition {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  profit?: number;
}

@Injectable()
export class CopyFactoryPositionSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(CopyFactoryPositionSyncService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;
  private readonly instanceId = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

  private readonly lastPolledAt = new Map<string, number>();
  private readonly consecutiveFailures = new Map<string, number>();
  private readonly minPollIntervalMs =
    Number(process.env.COPY_SYNC_MIN_INTERVAL_MS) || 15_000;

  constructor(
    private prisma: PrismaService,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    private redis: RedisService,
    private gateway: TradingGateway,
    private ledger: CopyLedgerService,
    private copyFactory: CopyFactoryService,
  ) {}

  onModuleDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  startPolling(intervalMs = 5000) {
    if (!this.copyFactory.isEnabled()) return;
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.syncAllFollowers(), intervalMs);
    this.logger.log(
      `CopyFactory position sync started (${intervalMs}ms interval)`,
    );
  }

  private async syncAllFollowers() {
    if (this.polling) return;

    let isLeader = false;
    try {
      isLeader = await this.redis.tryRenewableLock(
        'copyfactory:position-sync:leader',
        this.instanceId,
        15,
      );
    } catch (err) {
      this.logger.warn(
        `Leader-lock check failed, skipping cycle: ${(err as Error).message}`,
      );
      return;
    }
    if (!isLeader) return;

    this.polling = true;
    try {
      const subs = await this.prisma.userStrategySubscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          brokerAccountId: { not: null },
          brokerAccount: { isPaperTrading: false, isActive: true },
        },
        select: {
          id: true,
          userId: true,
          strategyId: true,
          brokerAccountId: true,
          brokerAccount: { select: { credentialsEncrypted: true } },
        },
      });

      const now = Date.now();
      const seenAccounts = new Set<string>();
      const activeAccountIds = new Set<string>();

      for (const sub of subs) {
        if (!sub.brokerAccountId || !sub.brokerAccount) continue;
        activeAccountIds.add(sub.brokerAccountId);

        if (seenAccounts.has(sub.brokerAccountId)) continue;
        seenAccounts.add(sub.brokerAccountId);

        const last = this.lastPolledAt.get(sub.brokerAccountId) ?? 0;
        if (now - last < this.minPollIntervalMs) continue;
        this.lastPolledAt.set(sub.brokerAccountId, now);

        try {
          await this.syncAccountPositions({
            ...sub,
            brokerAccountId: sub.brokerAccountId,
            brokerAccount: sub.brokerAccount,
          });
          this.consecutiveFailures.delete(sub.brokerAccountId);
        } catch (err) {
          const fails =
            (this.consecutiveFailures.get(sub.brokerAccountId) ?? 0) + 1;
          this.consecutiveFailures.set(sub.brokerAccountId, fails);
          const log = fails >= 3 ? 'error' : 'warn';
          this.logger[log](
            `Position sync failed for user ${sub.userId} (account ${sub.brokerAccountId}, ${fails} consecutive): ${(err as Error).message}`,
          );
          if (fails === 3) {
            this.gateway.sendToUser(sub.userId, 'account_sync_degraded', {
              brokerAccountId: sub.brokerAccountId,
            });
          }
        }
      }

      for (const key of this.lastPolledAt.keys()) {
        if (!activeAccountIds.has(key)) {
          this.lastPolledAt.delete(key);
          this.consecutiveFailures.delete(key);
        }
      }
    } catch (err) {
      this.logger.warn(
        `CopyFactory follower sync cycle failed: ${(err as Error).message}`,
      );
    } finally {
      this.polling = false;
    }
  }

  private async syncAccountPositions(sub: {
    id: string;
    userId: string;
    strategyId: string;
    brokerAccountId: string;
    brokerAccount: { credentialsEncrypted: string };
  }) {
    let creds: { metaApiAccountId?: string; metaApiRegion?: string };
    try {
      creds = JSON.parse(
        this.crypto.decrypt(sub.brokerAccount.credentialsEncrypted),
      );
    } catch {
      return;
    }
    if (!creds.metaApiAccountId) return;

    const raw = await this.mtAdapter.getPositions(
      creds.metaApiAccountId,
      creds.metaApiRegion,
    );
    const brokerPositions: BrokerPosition[] = raw.map((p: any) => ({
      id: String(p.id),
      symbol: p.symbol,
      type: p.type,
      volume: Number(p.volume),
      openPrice: Number(p.openPrice ?? p.openPrice),
      stopLoss: p.stopLoss ?? null,
      takeProfit: p.takeProfit ?? null,
      profit: typeof p.profit === 'number' ? p.profit : undefined,
    }));

    const openDbTrades = await this.prisma.trade.findMany({
      where: {
        userId: sub.userId,
        brokerAccountId: sub.brokerAccountId,
        status: TradeStatus.OPEN,
      },
    });

    const dbByTicket = new Map(
      openDbTrades
        .filter((t) => t.brokerTicket)
        .map((t) => [t.brokerTicket!, t]),
    );
    const brokerIds = new Set(brokerPositions.map((p) => p.id));

    for (const pos of brokerPositions) {
      const existing = dbByTicket.get(pos.id);
      if (existing) {
        const nextProfit =
          typeof pos.profit === 'number'
            ? pos.profit
            : Number(existing.profit ?? 0);
        if (nextProfit !== Number(existing.profit ?? 0)) {
          await this.prisma.trade.update({
            where: { id: existing.id },
            data: { profit: nextProfit },
          });
        }
        continue;
      }
      const direction =
        pos.type?.toUpperCase() === 'POSITION_TYPE_SELL' ||
        pos.type?.toUpperCase() === 'SELL'
          ? TradeDirection.SHORT
          : TradeDirection.LONG;

      const trade = await this.prisma.trade.create({
        data: {
          userId: sub.userId,
          strategyId: sub.strategyId,
          brokerAccountId: sub.brokerAccountId,
          brokerTicket: pos.id,
          symbol: pos.symbol,
          direction,
          volume: pos.volume,
          openPrice: pos.openPrice,
          fillPrice: pos.openPrice,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          profit: pos.profit ?? 0,
          isPaper: false,
          status: TradeStatus.OPEN,
          executionMode: 'COPYFACTORY_SYNC',
          executionMetadataJson: {
            subscriptionId: sub.id,
            copyFactorySync: true,
          },
        },
      });

      await this.ledger.recordEvent({
        type: TradeEventType.POSITION_OPENED,
        userId: sub.userId,
        tradeId: trade.id,
        symbol: pos.symbol,
        side: direction,
        volume: pos.volume,
        price: pos.openPrice,
        details: { source: 'copyfactory_position_sync' },
      });

      this.gateway.sendToUser(sub.userId, 'trade_opened', trade);
    }

    for (const trade of openDbTrades) {
      if (!trade.brokerTicket) continue;
      if (brokerIds.has(trade.brokerTicket)) continue;
      if (trade.executionMode !== 'COPYFACTORY_SYNC') continue;

      const closed = await this.prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: TradeStatus.CLOSED,
          closedAt: new Date(),
          profit: trade.profit ?? 0,
        },
      });
      this.gateway.sendToUser(sub.userId, 'trade_closed', closed);
    }
  }
}
