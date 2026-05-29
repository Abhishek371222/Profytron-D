import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { SubscriptionStatus } from '@prisma/client';

interface CachedPosition {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
}

@Injectable()
export class MasterSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(MasterSyncService.name);
  private lastPositions = new Map<string, Map<string, CachedPosition>>();
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;

  constructor(
    private prisma: PrismaService,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    @InjectQueue('trade_execution') private tradeQueue: Queue,
  ) {}

  onModuleDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  /** Start polling all master broker accounts every 3 seconds. */
  startPolling(intervalMs = 3000) {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.pollAllMasters(), intervalMs);
    this.logger.log(`Master sync polling started (${intervalMs}ms interval)`);
  }

  private async pollAllMasters() {
    if (this.polling) return;
    this.polling = true;
    try {
      const masterAccounts = await this.prisma.brokerAccount.findMany({
        where: { isMasterSource: true, isActive: true, isPaperTrading: false },
        select: { id: true, credentialsEncrypted: true },
      });

      for (const account of masterAccounts) {
        await this.syncMasterAccount(account);
      }
    } catch (err) {
      this.logger.error(`Poll cycle error: ${err.message}`);
    } finally {
      this.polling = false;
    }
  }

  private async syncMasterAccount(account: { id: string; credentialsEncrypted: string }) {
    let metaApiAccountId: string;
    try {
      const creds = JSON.parse(this.crypto.decrypt(account.credentialsEncrypted));
      metaApiAccountId = creds.metaApiAccountId;
      if (!metaApiAccountId) return;
    } catch {
      return;
    }

    let currentPositions: CachedPosition[];
    try {
      const raw = await this.mtAdapter.getPositions(metaApiAccountId);
      currentPositions = raw.map((p: any) => ({
        id: p.id,
        symbol: p.symbol,
        type: p.type,
        volume: p.volume,
        openPrice: p.openPrice,
      }));
    } catch (err) {
      this.logger.warn(`Failed to fetch positions for master ${account.id}: ${err.message}`);
      return;
    }

    const prev = this.lastPositions.get(account.id) ?? new Map<string, CachedPosition>();
    const currentMap = new Map(currentPositions.map((p) => [p.id, p]));

    // Detect new positions (opened on master)
    for (const [id, pos] of currentMap) {
      if (!prev.has(id)) {
        await this.fanOutOpenSignal(account.id, pos);
      }
    }

    // Detect closed positions (gone from master)
    for (const [id] of prev) {
      if (!currentMap.has(id)) {
        await this.fanOutCloseSignal(account.id, id);
      }
    }

    this.lastPositions.set(account.id, currentMap);
  }

  private async fanOutOpenSignal(masterBrokerAccountId: string, pos: CachedPosition) {
    const signalType = pos.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL';
    this.logger.log(`Master ${masterBrokerAccountId} opened ${signalType} ${pos.symbol} @${pos.openPrice} vol=${pos.volume}`);

    // Fan out to all active subscribers of any strategy/bot
    const now = new Date();
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        lotMultiplier: true,
        executionPriority: true,
      },
      orderBy: { executionPriority: 'desc' },
    });

    if (subscriptions.length === 0) return;

    for (const sub of subscriptions) {
      await this.tradeQueue.add(
        'execute_trade',
        {
          userId: sub.userId,
          subscriptionId: sub.id,
          strategyId: sub.strategyId,
          masterBrokerAccountId,
          masterPositionId: pos.id,
          type: signalType,
          pair: pos.symbol,
          price: pos.openPrice,
          masterVolume: pos.volume,
          lotMultiplier: sub.lotMultiplier ?? 1.0,
          queuedAt: new Date().toISOString(),
          executionMode: 'COPY_TRADE',
        },
        { priority: Math.max(1, 100 - (sub.executionPriority ?? 0)) },
      );
    }
  }

  private async fanOutCloseSignal(masterBrokerAccountId: string, masterPositionId: string) {
    this.logger.log(`Master ${masterBrokerAccountId} closed position ${masterPositionId}`);

    // Find all open trades that were copy-opened from this master position
    const openTrades = await this.prisma.trade.findMany({
      where: {
        status: 'OPEN',
        brokerAccount: { userId: { not: undefined } },
        executionMetadataJson: { path: ['masterPositionId'], equals: masterPositionId },
      },
      select: { id: true, userId: true, brokerAccountId: true },
    });

    for (const trade of openTrades) {
      await this.tradeQueue.add('close_copy', {
        tradeId: trade.id,
        userId: trade.userId,
        brokerAccountId: trade.brokerAccountId,
      });
    }
  }

  /** Returns current poll status for admin dashboard */
  getMasterStatus() {
    const accounts: Record<string, { positionCount: number }> = {};
    for (const [accountId, positions] of this.lastPositions) {
      accounts[accountId] = { positionCount: positions.size };
    }
    return { polling: this.polling, accounts };
  }
}
