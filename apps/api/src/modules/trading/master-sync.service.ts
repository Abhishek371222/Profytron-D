import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { RedisService } from '../auth/redis.service';
import { SubscriptionStatus, TradeEventType } from '@prisma/client';
import { isPaidCopySubscription } from '../../common/utils/copy-subscription.util';
import { CopyLedgerService } from './copy-ledger.service';

interface CachedPosition {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
}

interface MasterSyncHealth {
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
}

const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24; // keep snapshots a day
const snapshotKey = (accountId: string) => `mastersync:positions:${accountId}`;

/**
 * Real-time master-trade detection.
 *
 * Detects OPEN, CLOSE and MODIFY (SL/TP/volume) changes on each master account
 * and fans the change out to paid followers. Snapshot state is persisted to
 * Redis so detection survives process restarts and can run behind multiple
 * instances without losing closes or re-firing opens.
 *
 * This polls the MetaApi REST positions endpoint. To upgrade to true websocket
 * streaming, swap `mtAdapter.getPositions` for a streaming connection's
 * synchronization listener — the diff/fan-out logic below stays identical.
 */
@Injectable()
export class MasterSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(MasterSyncService.name);
  private lastPositions = new Map<string, Map<string, CachedPosition>>();
  /** Per-master connection health so a silent stall is visible to ops/admin. */
  private syncHealth = new Map<string, MasterSyncHealth>();
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;
  /** Unique per-process token for the master-poll leader lease. */
  private readonly instanceId = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

  constructor(
    private prisma: PrismaService,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    private redis: RedisService,
    private ledger: CopyLedgerService,
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
    if (this.mtAdapter.isRateLimited()) return;
    // Only one instance polls masters when scaled horizontally (leader lease).
    const isLeader = await this.redis.tryRenewableLock(
      'mastersync:leader',
      this.instanceId,
      10,
    );
    if (!isLeader) return;
    this.polling = true;
    try {
      const masterAccounts = await this.prisma.brokerAccount.findMany({
        where: { isMasterSource: true, isActive: true, isPaperTrading: false },
        select: { id: true, credentialsEncrypted: true },
      });

      for (const account of masterAccounts) {
        if (this.mtAdapter.isRateLimited()) break;
        await this.syncMasterAccount(account);
      }
    } catch (err) {
      this.logger.error(`Poll cycle error: ${err.message}`);
    } finally {
      this.polling = false;
    }
  }

  /** Load a master's last snapshot, preferring memory then Redis. */
  private async loadSnapshot(
    accountId: string,
  ): Promise<Map<string, CachedPosition>> {
    const inMemory = this.lastPositions.get(accountId);
    if (inMemory) return inMemory;
    try {
      const raw = await this.redis.get(snapshotKey(accountId));
      if (raw) {
        const arr = JSON.parse(raw) as CachedPosition[];
        const map = new Map(arr.map((p) => [p.id, p]));
        this.lastPositions.set(accountId, map);
        return map;
      }
    } catch (err) {
      this.logger.warn(
        `Snapshot load failed for ${accountId}: ${(err as Error).message}`,
      );
    }
    return new Map<string, CachedPosition>();
  }

  private async saveSnapshot(
    accountId: string,
    map: Map<string, CachedPosition>,
  ) {
    this.lastPositions.set(accountId, map);
    try {
      await this.redis.set(
        snapshotKey(accountId),
        JSON.stringify([...map.values()]),
        SNAPSHOT_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(
        `Snapshot save failed for ${accountId}: ${(err as Error).message}`,
      );
    }
  }

  private async syncMasterAccount(account: {
    id: string;
    credentialsEncrypted: string;
  }) {
    let metaApiAccountId: string;
    let metaApiRegion: string | undefined;
    try {
      const creds = JSON.parse(
        this.crypto.decrypt(account.credentialsEncrypted),
      );
      metaApiAccountId = creds.metaApiAccountId;
      metaApiRegion = creds.metaApiRegion;
      if (!metaApiAccountId) return;
    } catch {
      return;
    }

    let currentPositions: CachedPosition[];
    try {
      const raw = await this.mtAdapter.getPositions(
        metaApiAccountId,
        metaApiRegion,
      );
      currentPositions = raw.map((p: any) => ({
        id: p.id,
        symbol: p.symbol,
        type: p.type,
        volume: p.volume,
        openPrice: p.openPrice,
        stopLoss: p.stopLoss ?? null,
        takeProfit: p.takeProfit ?? null,
      }));
    } catch (err) {
      const health = this.syncHealth.get(account.id) ?? {
        consecutiveFailures: 0,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastError: null,
      };
      health.consecutiveFailures += 1;
      health.lastErrorAt = new Date().toISOString();
      health.lastError = (err as Error).message;
      this.syncHealth.set(account.id, health);

      // Escalate a persistent stall: while a master can't be read, follower
      // copies silently stop — make that loud after a few cycles instead of an
      // endless stream of identical warnings.
      const level = health.consecutiveFailures >= 5 ? 'error' : 'warn';
      this.logger[level](
        `Failed to fetch positions for master ${account.id} ` +
          `(${health.consecutiveFailures} consecutive): ${(err as Error).message}`,
      );
      return;
    }

    // Healthy read — reset stall state.
    this.syncHealth.set(account.id, {
      consecutiveFailures: 0,
      lastSuccessAt: new Date().toISOString(),
      lastErrorAt: this.syncHealth.get(account.id)?.lastErrorAt ?? null,
      lastError: this.syncHealth.get(account.id)?.lastError ?? null,
    });

    const prev = await this.loadSnapshot(account.id);
    const currentMap = new Map(currentPositions.map((p) => [p.id, p]));

    await this.saveSnapshot(account.id, currentMap);

    // Opened on master
    for (const [id, pos] of currentMap) {
      if (!prev.has(id)) {
        await this.fanOutOpenSignal(account.id, pos);
      }
    }

    // Modified on master (SL / TP / volume change to an existing position)
    for (const [id, pos] of currentMap) {
      const before = prev.get(id);
      if (before && this.isModified(before, pos)) {
        await this.fanOutModifySignal(account.id, before, pos);
      }
    }

    // Closed on master
    for (const [id, pos] of prev) {
      if (!currentMap.has(id)) {
        await this.fanOutCloseSignal(account.id, id, pos);
      }
    }
  }

  private isModified(a: CachedPosition, b: CachedPosition): boolean {
    return (
      (a.stopLoss ?? null) !== (b.stopLoss ?? null) ||
      (a.takeProfit ?? null) !== (b.takeProfit ?? null) ||
      a.volume !== b.volume
    );
  }

  private async findActivePaidSubscribers(masterBrokerAccountId: string) {
    const now = new Date();
    const subscriptions = await this.prisma.userStrategySubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        strategy: { masterBrokerAccountId },
      },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        lotMultiplier: true,
        executionPriority: true,
        status: true,
        expiresAt: true,
        trialEndsAt: true,
        stripeSubId: true,
        planType: true,
      },
      orderBy: { executionPriority: 'desc' },
    });
    return subscriptions.filter((sub) => isPaidCopySubscription(sub, now));
  }

  private async fanOutOpenSignal(
    masterBrokerAccountId: string,
    pos: CachedPosition,
  ) {
    const signalType = pos.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL';
    this.logger.log(
      `Master ${masterBrokerAccountId} opened ${signalType} ${pos.symbol} @${pos.openPrice} vol=${pos.volume}`,
    );

    await this.ledger.recordEvent({
      type: TradeEventType.SIGNAL_RECEIVED,
      masterAccountId: masterBrokerAccountId,
      masterPositionId: pos.id,
      symbol: pos.symbol,
      side: signalType,
      volume: pos.volume,
      price: pos.openPrice,
      stopLoss: pos.stopLoss ?? null,
      takeProfit: pos.takeProfit ?? null,
    });

    const paidSubscribers = await this.findActivePaidSubscribers(
      masterBrokerAccountId,
    );
    if (paidSubscribers.length === 0) return;

    for (const sub of paidSubscribers) {
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
          stopLoss: pos.stopLoss ?? undefined,
          takeProfit: pos.takeProfit ?? undefined,
          queuedAt: new Date().toISOString(),
          executionMode: 'COPY_TRADE',
        },
        {
          jobId: `copy-open:${masterBrokerAccountId}:${pos.id}:${sub.userId}`,
          removeOnComplete: true,
          priority: Math.max(1, 100 - (sub.executionPriority ?? 0)),
        },
      );
    }
  }

  private async fanOutModifySignal(
    masterBrokerAccountId: string,
    before: CachedPosition,
    after: CachedPosition,
  ) {
    this.logger.log(
      `Master ${masterBrokerAccountId} modified position ${after.id} (SL ${before.stopLoss}->${after.stopLoss}, TP ${before.takeProfit}->${after.takeProfit})`,
    );

    await this.ledger.recordEvent({
      type: TradeEventType.POSITION_MODIFIED,
      masterAccountId: masterBrokerAccountId,
      masterPositionId: after.id,
      symbol: after.symbol,
      stopLoss: after.stopLoss ?? null,
      takeProfit: after.takeProfit ?? null,
      details: {
        prevStopLoss: before.stopLoss ?? null,
        prevTakeProfit: before.takeProfit ?? null,
        prevVolume: before.volume,
        newVolume: after.volume,
      },
    });

    // Volume decrease → partial/full close on followers; SL/TP propagate separately.
    const slTpUnchanged =
      (before.stopLoss ?? null) === (after.stopLoss ?? null) &&
      (before.takeProfit ?? null) === (after.takeProfit ?? null);
    const volumeDecreased = after.volume < before.volume && before.volume > 0;

    const openTrades = await this.prisma.trade.findMany({
      where: {
        status: 'OPEN',
        executionMetadataJson: {
          path: ['masterPositionId'],
          equals: after.id,
        },
      },
      select: { id: true, userId: true, volume: true },
    });

    if (volumeDecreased) {
      const masterCloseRatio = (before.volume - after.volume) / before.volume;
      for (const trade of openTrades) {
        const closeVolume = Number(
          Math.max(0.01, trade.volume * masterCloseRatio).toFixed(2),
        );
        const isFullClose = closeVolume >= trade.volume - 0.001;
        await this.tradeQueue.add(
          'close_trade',
          {
            tradeId: trade.id,
            userId: trade.userId,
            // TradeProcessor reads `volume` for partial closes (not closeVolume).
            ...(isFullClose ? {} : { volume: closeVolume }),
          },
          {
            jobId: `copy-vol:${after.id}:${trade.id}:${after.volume}`,
            removeOnComplete: true,
          },
        );
      }
    }

    if (slTpUnchanged) {
      return;
    }

    for (const trade of openTrades) {
      await this.tradeQueue.add(
        'modify_trade',
        {
          tradeId: trade.id,
          userId: trade.userId,
          ...(after.stopLoss != null ? { stopLoss: after.stopLoss } : {}),
          ...(after.takeProfit != null ? { takeProfit: after.takeProfit } : {}),
        },
        {
          jobId: `copy-mod:${after.id}:${trade.id}:${after.stopLoss}:${after.takeProfit}`,
          removeOnComplete: true,
        },
      );
    }
  }

  private async fanOutCloseSignal(
    masterBrokerAccountId: string,
    masterPositionId: string,
    pos?: CachedPosition,
  ) {
    this.logger.log(
      `Master ${masterBrokerAccountId} closed position ${masterPositionId}`,
    );

    await this.ledger.recordEvent({
      type: TradeEventType.POSITION_CLOSED,
      masterAccountId: masterBrokerAccountId,
      masterPositionId,
      symbol: pos?.symbol ?? null,
    });

    // Find all open trades that were copy-opened from this master position
    const openTrades = await this.prisma.trade.findMany({
      where: {
        status: 'OPEN',
        brokerAccount: { userId: { not: undefined } },
        executionMetadataJson: {
          path: ['masterPositionId'],
          equals: masterPositionId,
        },
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
    const accounts: Record<
      string,
      {
        positionCount: number;
        consecutiveFailures: number;
        stalled: boolean;
        lastSuccessAt: string | null;
        lastError: string | null;
      }
    > = {};
    const accountIds = new Set<string>([
      ...this.lastPositions.keys(),
      ...this.syncHealth.keys(),
    ]);
    for (const accountId of accountIds) {
      const health = this.syncHealth.get(accountId);
      accounts[accountId] = {
        positionCount: this.lastPositions.get(accountId)?.size ?? 0,
        consecutiveFailures: health?.consecutiveFailures ?? 0,
        stalled: (health?.consecutiveFailures ?? 0) >= 5,
        lastSuccessAt: health?.lastSuccessAt ?? null,
        lastError: health?.lastError ?? null,
      };
    }
    return { polling: this.polling, accounts };
  }
}
