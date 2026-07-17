import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { RedisService } from '../auth/redis.service';
import { TradingGateway } from './trading.gateway';
import { CopyLedgerService } from './copy-ledger.service';
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
  comment?: string | null;
  magic?: number | null;
}

type ActiveSub = {
  id: string;
  userId: string;
  strategyId: string;
  brokerAccountId: string;
  subscribedAt: Date;
};

/**
 * Keeps DB Trade rows + broker equity in sync with MetaAPI for every active bot.
 * Attributes positions to the correct strategy so My Bots PnL / totals stay real.
 */
@Injectable()
export class BotTradeSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(BotTradeSyncService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;
  private readonly instanceId = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;
  private readonly lastPolledAt = new Map<string, number>();
  private readonly consecutiveFailures = new Map<string, number>();
  private readonly minPollIntervalMs =
    Number(process.env.BOT_TRADE_SYNC_INTERVAL_MS) || 12_000;
  private readonly userSyncCooldown = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    private redis: RedisService,
    private gateway: TradingGateway,
    private ledger: CopyLedgerService,
  ) {}

  onModuleDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  startPolling(intervalMs = 8_000) {
    if (!process.env.METAAPI_TOKEN?.trim()) {
      this.logger.warn('Bot trade sync skipped — METAAPI_TOKEN missing');
      return;
    }
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => void this.syncAllAccounts(), intervalMs);
    this.logger.log(
      `Bot trade / PnL sync started (${intervalMs}ms tick, ${this.minPollIntervalMs}ms per-account min)`,
    );
    // Kick once on boot so My Bots is not empty until the first interval.
    void this.syncAllAccounts();
  }

  /** On-demand sync for one user (My Bots refresh). Throttled to 8s. */
  async syncUser(
    userId: string,
  ): Promise<{ synced: number; tradesTouched: number }> {
    const last = this.userSyncCooldown.get(userId) ?? 0;
    if (Date.now() - last < 8_000) {
      return { synced: 0, tradesTouched: 0 };
    }
    this.userSyncCooldown.set(userId, Date.now());

    const subs = await this.prisma.userStrategySubscription.findMany({
      where: {
        userId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PROVISIONING,
            SubscriptionStatus.PAUSED,
          ],
        },
        brokerAccountId: { not: null },
        brokerAccount: { isPaperTrading: false, isActive: true },
      },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        brokerAccountId: true,
        subscribedAt: true,
        brokerAccount: { select: { id: true, credentialsEncrypted: true } },
      },
      orderBy: { subscribedAt: 'desc' },
    });

    let synced = 0;
    let tradesTouched = 0;
    const seen = new Set<string>();
    for (const sub of subs) {
      if (!sub.brokerAccountId || !sub.brokerAccount) continue;
      if (seen.has(sub.brokerAccountId)) continue;
      seen.add(sub.brokerAccountId);
      const accountSubs = subs.filter(
        (s) => s.brokerAccountId === sub.brokerAccountId,
      ) as ActiveSub[];
      tradesTouched += await this.syncBrokerAccount({
        userId: sub.userId,
        brokerAccountId: sub.brokerAccountId,
        credentialsEncrypted: sub.brokerAccount.credentialsEncrypted,
        subscriptions: accountSubs,
      });
      synced += 1;
    }
    return { synced, tradesTouched };
  }

  private async syncAllAccounts() {
    if (this.polling) return;
    if (this.mtAdapter.isRateLimited()) return;

    let isLeader = false;
    try {
      isLeader = await this.redis.tryRenewableLock(
        'bot-trade-sync:leader',
        this.instanceId,
        20,
      );
    } catch {
      return;
    }
    if (!isLeader) return;

    this.polling = true;
    try {
      const subs = await this.prisma.userStrategySubscription.findMany({
        where: {
          status: {
            in: [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.PROVISIONING,
              SubscriptionStatus.PAUSED,
            ],
          },
          brokerAccountId: { not: null },
          brokerAccount: { isPaperTrading: false, isActive: true },
        },
        select: {
          id: true,
          userId: true,
          strategyId: true,
          brokerAccountId: true,
          subscribedAt: true,
          brokerAccount: { select: { id: true, credentialsEncrypted: true } },
        },
        orderBy: { subscribedAt: 'desc' },
      });

      const byAccount = new Map<
        string,
        {
          userId: string;
          credentialsEncrypted: string;
          subscriptions: ActiveSub[];
        }
      >();

      for (const sub of subs) {
        if (!sub.brokerAccountId || !sub.brokerAccount) continue;
        const existing = byAccount.get(sub.brokerAccountId);
        const row: ActiveSub = {
          id: sub.id,
          userId: sub.userId,
          strategyId: sub.strategyId,
          brokerAccountId: sub.brokerAccountId,
          subscribedAt: sub.subscribedAt,
        };
        if (existing) {
          existing.subscriptions.push(row);
        } else {
          byAccount.set(sub.brokerAccountId, {
            userId: sub.userId,
            credentialsEncrypted: sub.brokerAccount.credentialsEncrypted,
            subscriptions: [row],
          });
        }
      }

      const now = Date.now();
      for (const [brokerAccountId, group] of byAccount) {
        const last = this.lastPolledAt.get(brokerAccountId) ?? 0;
        if (now - last < this.minPollIntervalMs) continue;
        this.lastPolledAt.set(brokerAccountId, now);
        try {
          await this.syncBrokerAccount({
            userId: group.userId,
            brokerAccountId,
            credentialsEncrypted: group.credentialsEncrypted,
            subscriptions: group.subscriptions,
          });
          this.consecutiveFailures.delete(brokerAccountId);
        } catch (err) {
          const fails =
            (this.consecutiveFailures.get(brokerAccountId) ?? 0) + 1;
          this.consecutiveFailures.set(brokerAccountId, fails);
          this.logger.warn(
            `Bot trade sync failed account=${brokerAccountId} (${fails}x): ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Bot trade sync cycle failed: ${(err as Error).message}`,
      );
    } finally {
      this.polling = false;
    }
  }

  private resolveStrategyId(
    pos: BrokerPosition,
    subscriptions: ActiveSub[],
    existingStrategyId?: string | null,
  ): string | null {
    if (existingStrategyId) return existingStrategyId;
    if (subscriptions.length === 1) return subscriptions[0].strategyId;

    const comment = String(pos.comment || '');
    for (const sub of subscriptions) {
      const short = sub.strategyId.slice(0, 8);
      if (
        comment.includes(sub.strategyId) ||
        comment.includes(short) ||
        comment.toLowerCase().includes('profytron')
      ) {
        if (comment.includes(short) || comment.includes(sub.strategyId)) {
          return sub.strategyId;
        }
      }
    }

    // Newest active subscription on this account (TrendRider etc.)
    return subscriptions[0]?.strategyId ?? null;
  }

  private async syncBrokerAccount(input: {
    userId: string;
    brokerAccountId: string;
    credentialsEncrypted: string;
    subscriptions: ActiveSub[];
  }): Promise<number> {
    let creds: { metaApiAccountId?: string; metaApiRegion?: string };
    try {
      creds = JSON.parse(this.crypto.decrypt(input.credentialsEncrypted));
    } catch {
      return 0;
    }
    if (
      !creds.metaApiAccountId ||
      String(creds.metaApiAccountId).startsWith('mock-')
    ) {
      return 0;
    }

    const raw = await this.mtAdapter.getPositions(
      creds.metaApiAccountId,
      creds.metaApiRegion,
    );
    const brokerPositions: BrokerPosition[] = raw
      .map((p: any) => ({
        id: String(p.id ?? p.positionId ?? ''),
        symbol: String(p.symbol || ''),
        type: String(p.type || ''),
        volume: Number(p.volume ?? 0),
        openPrice: Number(p.openPrice ?? p.price ?? 0),
        stopLoss: p.stopLoss ?? null,
        takeProfit: p.takeProfit ?? null,
        profit:
          typeof p.profit === 'number'
            ? p.profit
            : Number(p.unrealizedProfit ?? 0) || 0,
        comment: p.comment ?? p.brokerComment ?? null,
        magic: typeof p.magic === 'number' ? p.magic : null,
      }))
      .filter((p) => p.id && p.symbol);

    const openDbTrades = await this.prisma.trade.findMany({
      where: {
        userId: input.userId,
        brokerAccountId: input.brokerAccountId,
        status: TradeStatus.OPEN,
      },
    });

    const dbByTicket = new Map(
      openDbTrades
        .filter((t) => t.brokerTicket)
        .map((t) => [t.brokerTicket!, t]),
    );
    const brokerIds = new Set(brokerPositions.map((p) => p.id));
    let touched = 0;

    // Create / update open positions
    for (const pos of brokerPositions) {
      const existing = dbByTicket.get(pos.id);
      if (existing) {
        const strategyId = this.resolveStrategyId(
          pos,
          input.subscriptions,
          existing.strategyId,
        );
        const nextProfit = Number(pos.profit ?? existing.profit ?? 0);
        const needsUpdate =
          (Number.isFinite(nextProfit) &&
            nextProfit !== Number(existing.profit ?? 0)) ||
          (strategyId && strategyId !== existing.strategyId);

        if (needsUpdate) {
          const updated = await this.prisma.trade.update({
            where: { id: existing.id },
            data: {
              profit: nextProfit,
              ...(strategyId && !existing.strategyId
                ? { strategyId }
                : strategyId && strategyId !== existing.strategyId
                  ? { strategyId }
                  : {}),
            },
          });
          touched += 1;
          this.gateway.sendToUser(input.userId, 'trade_updated', updated);
        }
        continue;
      }

      const direction =
        pos.type?.toUpperCase().includes('SELL') ||
        pos.type?.toUpperCase() === 'SHORT'
          ? TradeDirection.SHORT
          : TradeDirection.LONG;
      const strategyId = this.resolveStrategyId(pos, input.subscriptions);
      const sub =
        input.subscriptions.find((s) => s.strategyId === strategyId) ??
        input.subscriptions[0];

      const trade = await this.prisma.trade.create({
        data: {
          userId: input.userId,
          strategyId,
          brokerAccountId: input.brokerAccountId,
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
          executionMode: 'BOT_TRADE_SYNC',
          executionMetadataJson: {
            subscriptionId: sub?.id ?? null,
            botTradeSync: true,
            comment: pos.comment ?? null,
            magic: pos.magic ?? null,
          },
        },
      });
      touched += 1;

      await this.ledger.recordEvent({
        type: TradeEventType.POSITION_OPENED,
        userId: input.userId,
        tradeId: trade.id,
        symbol: pos.symbol,
        side: direction,
        volume: pos.volume,
        price: pos.openPrice,
        details: { source: 'bot_trade_sync' },
      });
      this.gateway.sendToUser(input.userId, 'trade_opened', trade);
    }

    // Close trades that disappeared from MetaAPI — keep last known profit
    for (const trade of openDbTrades) {
      if (!trade.brokerTicket) continue;
      if (brokerIds.has(trade.brokerTicket)) continue;

      const closed = await this.prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: TradeStatus.CLOSED,
          closedAt: new Date(),
          // Keep profit as last floating value (best available without deal history)
          profit: trade.profit ?? 0,
          ...(trade.strategyId
            ? {}
            : {
                strategyId: this.resolveStrategyId(
                  {
                    id: trade.brokerTicket,
                    symbol: trade.symbol,
                    type: trade.direction,
                    volume: trade.volume,
                    openPrice: trade.openPrice,
                    profit: trade.profit ?? 0,
                    comment: null,
                  },
                  input.subscriptions,
                ),
              }),
        },
      });
      touched += 1;
      this.gateway.sendToUser(input.userId, 'trade_closed', closed);
    }

    // Heal orphan OPEN trades with null strategyId when only one bot is linked
    if (input.subscriptions.length === 1) {
      const healed = await this.prisma.trade.updateMany({
        where: {
          userId: input.userId,
          brokerAccountId: input.brokerAccountId,
          strategyId: null,
          status: { in: [TradeStatus.OPEN, TradeStatus.CLOSED] },
        },
        data: { strategyId: input.subscriptions[0].strategyId },
      });
      touched += healed.count;
    }

    // Persist live equity so bot % / Overview stay aligned
    const live = await this.mtAdapter.getLiveEquity(
      creds.metaApiAccountId,
      creds.metaApiRegion,
    );
    if (live != null && Number.isFinite(live) && live > 0) {
      await this.prisma.brokerAccount.update({
        where: { id: input.brokerAccountId },
        data: {
          lastConnectedAt: new Date(),
          lastKnownEquity: live,
          lastKnownBalance: live,
          // Keep initialEquity if unset; otherwise leave baseline — live is for status.
          ...((await this.shouldSeedEquity(input.brokerAccountId))
            ? { initialEquity: live }
            : {}),
        },
      });
      this.gateway.sendToUser(input.userId, 'account_equity', {
        brokerAccountId: input.brokerAccountId,
        equity: live,
      });
    }

    return touched;
  }

  private async shouldSeedEquity(brokerAccountId: string): Promise<boolean> {
    const row = await this.prisma.brokerAccount.findUnique({
      where: { id: brokerAccountId },
      select: { initialEquity: true },
    });
    return !row?.initialEquity || Number(row.initialEquity) <= 0;
  }
}
