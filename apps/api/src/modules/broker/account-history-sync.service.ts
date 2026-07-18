import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MetaApiFullSnapshot,
  MetaTraderAdapter,
} from './adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { RedisService } from '../auth/redis.service';
import { TradeDirection, TradeStatus } from '@prisma/client';
import { seedInitialEquity } from '../../common/utils/account-performance.util';
import { AccountSnapshotGateway } from './account-snapshot.gateway';

type DealGroup = { positionId: string; deals: any[] };

const ACCOUNT_SYNC_INTERVAL_MS = 10_000;
/** Cap JSON blob size so Neon writes stay under interactive timeouts. */
const MAX_SNAPSHOT_DEALS_JSON = 400;
const MAX_SNAPSHOT_ORDERS_JSON = 200;
const CREATE_MANY_CHUNK = 200;

type NormalizedSnapshot = {
  info: any;
  account: any;
  positions: any[];
  pendingOrders: any[];
  deals: any[];
  orderHistory: any[];
  symbols: any[];
  marketData: any[];
  status: any;
  copyTrading: any;
  performance: Record<string, number>;
  risk: Record<string, any>;
  events: Array<{
    eventType: string;
    entityType?: string;
    entityId?: string;
    detailsJson?: Record<string, any>;
    occurredAt?: Date;
  }>;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  floatingPnl: number;
  realizedProfit: number;
  unrealizedProfit: number;
  todayProfit: number;
  todayLoss: number;
  weeklyProfit: number;
  monthlyProfit: number;
  netProfit: number;
};

@Injectable()
export class AccountHistorySyncService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AccountHistorySyncService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;
  private readonly instanceId = `ahs-${process.pid}-${Math.random().toString(36).slice(2, 10)}`;
  private readonly dealsLookbackMs = 3 * 24 * 60 * 60 * 1000;
  private readonly minSnapshotGapMs = ACCOUNT_SYNC_INTERVAL_MS;

  constructor(
    private prisma: PrismaService,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    private redis: RedisService,
    private snapshotGateway: AccountSnapshotGateway,
  ) {}

  onModuleInit() {
    // Match the 1-minute cadence the rest of the dashboard polls at, so a
    // newly closed/opened trade lands in the DB within ~1 minute — not 5.
    // In local/dev, default slower so MetaAPI free-tier 429s do not starve Nest.
    const defaultMs =
      process.env.NODE_ENV === 'production' ? 60 * 1000 : 5 * 60 * 1000;
    this.startPolling(
      Number(process.env.ACCOUNT_HISTORY_SYNC_INTERVAL_MS) || defaultMs,
    );

  }

  onModuleDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  startPolling(intervalMs = ACCOUNT_SYNC_INTERVAL_MS) {
    if (!process.env.METAAPI_TOKEN?.trim()) {
      this.logger.warn('Account history sync skipped — METAAPI_TOKEN missing');
      return;
    }
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => void this.syncAllAccounts(), intervalMs);
    this.logger.log(`Account history sync started (${intervalMs}ms tick)`);
    // Defer the boot tick so Nest can finish accepting HTTP before MetaAPI work.
    setTimeout(() => void this.syncAllAccounts(), 15_000);
  }

  private async syncAllAccounts() {
    if (this.polling) return;
    if (this.mtAdapter.isRateLimited()) {
      this.logger.debug(
        `Account history sync skipped — MetaAPI cooldown ${Math.ceil(this.mtAdapter.rateLimitRemainingMs() / 1000)}s`,
      );
      return;
    }

    let isLeader = false;
    try {
      isLeader = await this.redis.tryRenewableLock(
        'account-history-sync:leader',
        this.instanceId,
        Math.ceil(this.minSnapshotGapMs / 1000),
      );
    } catch {
      return;
    }
    if (!isLeader) return;

    this.polling = true;
    try {
      const accounts = await this.prisma.brokerAccount.findMany({
        where: { isActive: true, isPaperTrading: false },
        select: { id: true, userId: true, credentialsEncrypted: true },
      });

      for (const account of accounts) {
        if (this.mtAdapter.isRateLimited()) break;
        try {
          await this.syncAccount(
            account.id,
            account.userId,
            account.credentialsEncrypted,
          );
        } catch (err) {
          const msg = (err as Error).message || '';
          // 429 / cooldown: stop the whole cycle; do not log per-account spam.
          if (msg.includes('rate-limited') || msg.includes('status code 429')) {
            this.logger.warn(
              `Account history sync paused after MetaAPI rate limit (account=${account.id})`,
            );
            break;
          }
          this.logger.warn(
            `Account history sync failed account=${account.id}: ${msg}`,
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Account history sync cycle failed: ${(err as Error).message}`,
      );
    } finally {
      this.polling = false;
    }
  }

  private async syncAccount(
    brokerAccountId: string,
    userId: string,
    credentialsEncrypted: string,
  ): Promise<void> {
    let creds: { metaApiAccountId?: string; metaApiRegion?: string };
    try {
      creds = JSON.parse(this.crypto.decrypt(credentialsEncrypted));
    } catch {
      return;
    }
    const metaApiAccountId = creds.metaApiAccountId;
    if (!metaApiAccountId || metaApiAccountId.startsWith('mock-')) return;
    const region = creds.metaApiRegion;

    // One account-information + positions fetch per cycle, shared by the
    // debounced equity history, the DB-first full snapshot, and open-position
    // sync — MetaAPI gets called once per account per tick, not three times.
    const syncStarted = Date.now();
    const to = new Date();
    const from = new Date(Date.now() - this.dealsLookbackMs);
    const full = await this.mtAdapter.getFullSnapshot(metaApiAccountId, region, {
      dealsFrom: from,
      dealsTo: to,
    });
    const syncDurationMs = Date.now() - syncStarted;

    if (full) {
      // Isolate stages so one slow write never aborts equity/positions/closed-trade sync.
      await this.runSyncStage('equity', brokerAccountId, () =>
        this.snapshotEquity(brokerAccountId, full.info),
      );
      await this.runSyncStage('open-positions', brokerAccountId, () =>
        this.syncOpenPositions(brokerAccountId, userId, full.positions),
      );
      await this.runSyncStage('full-snapshot', brokerAccountId, () =>
        this.snapshotFull(brokerAccountId, userId, full, syncDurationMs),
      );
      await this.runSyncStage('closed-trades', brokerAccountId, () =>
        this.syncClosedTrades(
          brokerAccountId,
          userId,
          metaApiAccountId,
          region,
          full.deals,
        ),
      );
    }
  }

  private async runSyncStage(
    stage: string,
    brokerAccountId: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.warn(
        `Account sync stage=${stage} account=${brokerAccountId}: ${(err as Error).message}`,
      );
    }
  }

  private async snapshotEquity(
    brokerAccountId: string,
    info: any,
  ): Promise<void> {
    const last = await this.prisma.equitySnapshot.findFirst({
      where: { brokerAccountId },
      orderBy: { capturedAt: 'desc' },
      select: { capturedAt: true },
    });
    if (
      last &&
      Date.now() - last.capturedAt.getTime() < this.minSnapshotGapMs
    ) {
      return;
    }

    const balance = Number(info?.balance ?? 0);
    const equity = Number(info?.equity ?? info?.balance ?? 0);
    if (!Number.isFinite(equity) || equity <= 0) return;
    const margin = Number(info?.margin ?? 0);
    const freeMargin = Number(info?.freeMargin ?? 0);

    await this.prisma.equitySnapshot.create({
      data: { brokerAccountId, balance, equity, margin, freeMargin },
    });

    const account = await this.prisma.brokerAccount.findUnique({
      where: { id: brokerAccountId },
      select: { initialEquity: true },
    });
    const seed = seedInitialEquity(account?.initialEquity, equity || balance);

    await this.prisma.brokerAccount.update({
      where: { id: brokerAccountId },
      data: {
        lastConnectedAt: new Date(),
        lastKnownEquity: equity,
        lastKnownBalance: balance,
        ...(seed != null ? { initialEquity: seed } : {}),
      },
    });
  }

  /** Appends the full DB-first snapshot every cycle. Never writes on a
   * failed/invalid fetch — the read API simply keeps serving the last
   * successful row, satisfying "never show stale data as zero." */
  private async snapshotFull(
    brokerAccountId: string,
    userId: string,
    full: MetaApiFullSnapshot,
    syncDurationMs: number,
  ): Promise<void> {
    const previous = await this.prisma.accountSnapshot.findFirst({
      where: { brokerAccountId },
      orderBy: { capturedAt: 'desc' },
      select: {
        id: true,
        balance: true,
        equity: true,
        margin: true,
        positionsJson: true,
      },
    });
    const normalized = this.normalizeFullSnapshot(full, previous);
    if (!normalized) return;

    // Parent row + latest pointer first (fast). Child table writes can exceed
    // Prisma's default 5s interactive-transaction timeout when deal history is large,
    // so they run outside $transaction — JSON columns on the parent remain the
    // durable read fallback if child writes fail.
    const snapshot = await this.prisma.accountSnapshot.create({
      data: {
        brokerAccountId,
        login:
          normalized.info?.login != null ? String(normalized.info.login) : null,
        broker: normalized.info?.broker ?? null,
        server: normalized.info?.server ?? null,
        platform: normalized.info?.platform ?? null,
        currency: normalized.info?.currency ?? null,
        leverage:
          normalized.info?.leverage != null
            ? Number(normalized.info.leverage)
            : null,
        connectionStatus:
          normalized.status?.connectionStatus ??
          normalized.account?.connectionStatus ??
          'CONNECTED',
        synchronizationStatus:
          normalized.status?.synchronizationState ??
          normalized.info?.connectionStatus ??
          normalized.account?.state ??
          'SYNCHRONIZED',
        balance: normalized.balance,
        equity: normalized.equity,
        credit: Number(normalized.info?.credit ?? 0),
        margin: normalized.margin,
        freeMargin: normalized.freeMargin,
        marginLevel: normalized.marginLevel,
        floatingPnl: normalized.floatingPnl,
        positionsJson: normalized.positions,
        positionsCount: normalized.positions.length,
        pendingOrdersJson: normalized.pendingOrders.slice(
          -MAX_SNAPSHOT_ORDERS_JSON,
        ),
        dealsJson: normalized.deals.slice(-MAX_SNAPSHOT_DEALS_JSON),
        orderHistoryJson: normalized.orderHistory.slice(
          -MAX_SNAPSHOT_ORDERS_JSON,
        ),
        symbolsJson: normalized.symbols,
        marketDataJson: normalized.marketData,
        accountStatusJson: normalized.status,
        copyTradingJson: normalized.copyTrading,
        performanceJson: normalized.performance,
        riskJson: normalized.risk,
        eventsJson: normalized.events,
        realizedProfit: normalized.realizedProfit,
        unrealizedProfit: normalized.unrealizedProfit,
        todayProfit: normalized.todayProfit,
        todayLoss: normalized.todayLoss,
        weeklyProfit: normalized.weeklyProfit,
        monthlyProfit: normalized.monthlyProfit,
        netProfit: normalized.netProfit,
        syncStatus: 'SUCCESS',
        syncDurationMs,
        metaApiLatencyMs: full.latencyMs,
        apiVersion: 'metaapi-v1',
        errorMessage:
          Object.keys(full.sectionErrors).length > 0
            ? JSON.stringify(full.sectionErrors)
            : null,
        lastSuccessfulSync: new Date(),
      },
    });

    try {
      await this.writeSnapshotChildren(
        this.prisma,
        brokerAccountId,
        snapshot.id,
        normalized,
      );
    } catch (err: any) {
      this.logger.warn(
        `Snapshot child write failed account=${brokerAccountId} snapshot=${snapshot.id}: ${err?.message ?? err}`,
      );
    }

    await this.prisma.accountLatestSnapshot.upsert({
      where: { brokerAccountId },
      create: {
        brokerAccountId,
        snapshotId: snapshot.id,
        lastSyncedAt: snapshot.capturedAt,
        lastSuccessfulSync: snapshot.capturedAt,
        syncDurationMs,
        syncStatus: 'SUCCESS',
        metaApiLatencyMs: full.latencyMs,
        apiVersion: 'metaapi-v1',
      },
      update: {
        snapshotId: snapshot.id,
        lastSyncedAt: snapshot.capturedAt,
        lastSuccessfulSync: snapshot.capturedAt,
        syncDurationMs,
        syncStatus: 'SUCCESS',
        metaApiLatencyMs: full.latencyMs,
        apiVersion: 'metaapi-v1',
      },
    });

    this.snapshotGateway.sendToUser(userId, 'snapshot.updated', {
      brokerAccountId,
      snapshotId: snapshot.id,
      capturedAt: snapshot.capturedAt,
      syncStatus: snapshot.syncStatus,
      syncDurationMs,
      metaApiLatencyMs: full.latencyMs,
      apiVersion: snapshot.apiVersion,
    });
  }

  private normalizeFullSnapshot(
    full: MetaApiFullSnapshot,
    previous?: {
      balance: number;
      equity: number;
      margin: number;
      positionsJson: any;
    } | null,
  ): NormalizedSnapshot | null {
    const { info } = full;
    const balance = this.num(info?.balance);
    const equity = this.num(info?.equity ?? info?.balance);
    if (!Number.isFinite(equity) || equity <= 0) return null;

    const margin = this.num(info?.margin);
    const freeMargin = this.num(info?.freeMargin ?? Math.max(0, equity - margin));
    const marginLevel = this.num(
      info?.marginLevel ?? (margin > 0 ? (equity / margin) * 100 : 0),
    );
    const floatingPnl = full.positions.reduce(
      (sum, p) => sum + this.num(p?.profit ?? p?.unrealizedProfit),
      0,
    );
    const realizedProfit = full.deals.reduce(
      (sum, d) => sum + this.num(d?.profit) + this.num(d?.commission) + this.num(d?.swap),
      0,
    );
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayPnl = this.sumDealProfitSince(full.deals, todayStart);
    const weeklyProfit = this.sumDealProfitSince(full.deals, weekStart);
    const monthlyProfit = this.sumDealProfitSince(full.deals, monthStart);
    const performance = this.computePerformance(
      full.deals,
      full.positions,
      previous?.balance ?? balance,
      balance,
      equity,
    );
    const risk = this.computeRisk(full.positions, equity, margin, freeMargin);
    const status = {
      connected: true,
      connectionStatus:
        full.account?.connectionStatus ?? info?.connectionStatus ?? 'CONNECTED',
      synchronizationState:
        info?.state ?? full.account?.state ?? info?.connectionStatus ?? 'SYNCHRONIZED',
      terminalState: full.terminalState?.terminal?.state ?? full.account?.state ?? null,
      lastHeartbeat:
        full.terminalState?.terminal?.lastUpdated ||
        full.account?.lastConnectedToBrokerTime ||
        null,
      lastConnected:
        full.account?.lastConnectedToBrokerTime ||
        full.account?.connectedAt ||
        null,
      lastDisconnected: full.account?.lastDisconnectedFromBrokerTime ?? null,
      raw: full.terminalState,
    };

    return {
      info,
      account: full.account,
      positions: full.positions,
      pendingOrders: full.pendingOrders,
      deals: full.deals,
      orderHistory: full.orderHistory,
      symbols: full.symbols,
      marketData: full.marketData,
      status,
      copyTrading: full.copyTrading,
      performance,
      risk,
      events: this.detectEvents(full, previous, balance, equity, margin),
      balance,
      equity,
      margin,
      freeMargin,
      marginLevel,
      floatingPnl,
      realizedProfit,
      unrealizedProfit: floatingPnl,
      todayProfit: Math.max(todayPnl, 0),
      todayLoss: Math.min(todayPnl, 0),
      weeklyProfit,
      monthlyProfit,
      netProfit: realizedProfit + floatingPnl,
    };
  }

  private async writeSnapshotChildren(
    tx: any,
    brokerAccountId: string,
    snapshotId: string,
    normalized: NormalizedSnapshot,
  ): Promise<void> {
    // Child tables are optional until the full snapshot migration is applied.
    // Parent AccountSnapshot JSON columns remain the durable read fallback.
    try {
      await this.writeSnapshotChildrenInner(
        tx,
        brokerAccountId,
        snapshotId,
        normalized,
      );
    } catch (err: any) {
      const message = String(err?.message ?? '');
      if (
        err?.code === 'P2021' ||
        /does not exist in the current database/i.test(message) ||
        /Transaction (already closed|not found)/i.test(message) ||
        /interactive transaction timeout/i.test(message)
      ) {
        this.logger.warn(
          `Snapshot child tables unavailable — kept JSON payload only (${message.slice(0, 160) || 'missing table'})`,
        );
        return;
      }
      throw err;
    }
  }

  private async createManyChunked(
    createMany: (args: { data: any[] }) => Promise<unknown>,
    rows: any[],
  ): Promise<void> {
    for (let i = 0; i < rows.length; i += CREATE_MANY_CHUNK) {
      await createMany({ data: rows.slice(i, i + CREATE_MANY_CHUNK) });
    }
  }

  private async writeSnapshotChildrenInner(
    tx: any,
    brokerAccountId: string,
    snapshotId: string,
    normalized: NormalizedSnapshot,
  ): Promise<void> {
    if (normalized.positions.length) {
      await this.createManyChunked(
        (args) => tx.accountSnapshotPosition.createMany(args),
        normalized.positions.map((p) => ({
          snapshotId,
          brokerAccountId,
          positionId: this.text(p?.id ?? p?.positionId),
          ticket: this.text(p?.ticket ?? p?.id ?? p?.positionId),
          symbol: this.text(p?.symbol) || 'UNKNOWN',
          side: this.positionSide(p),
          volume: this.num(p?.volume),
          openPrice: this.numOrNull(p?.openPrice ?? p?.price),
          currentPrice: this.numOrNull(p?.currentPrice ?? p?.currentTickValue),
          stopLoss: this.numOrNull(p?.stopLoss),
          takeProfit: this.numOrNull(p?.takeProfit),
          commission: this.num(p?.commission),
          swap: this.num(p?.swap),
          profit: this.num(p?.profit ?? p?.unrealizedProfit),
          comment: this.text(p?.comment),
          magicNumber: this.text(p?.magic ?? p?.magicNumber),
          openTime: this.dateOrNull(p?.time ?? p?.openTime),
          durationSeconds: this.durationSeconds(p?.time ?? p?.openTime),
          currentPips: this.numOrNull(p?.currentPips ?? p?.pips),
          risk: this.numOrNull(p?.risk),
          reward: this.numOrNull(p?.reward),
          status: this.text(p?.status ?? 'OPEN'),
          rawJson: p,
        })),
      );
    }

    if (normalized.pendingOrders.length) {
      await this.createManyChunked(
        (args) => tx.accountSnapshotPendingOrder.createMany(args),
        normalized.pendingOrders.map((o) => ({
          snapshotId,
          brokerAccountId,
          orderId: this.text(o?.id ?? o?.orderId),
          symbol: this.text(o?.symbol) || 'UNKNOWN',
          orderType: this.text(o?.type ?? o?.orderType),
          volume: this.num(o?.volume),
          entryPrice: this.numOrNull(o?.openPrice ?? o?.price),
          stopLoss: this.numOrNull(o?.stopLoss),
          takeProfit: this.numOrNull(o?.takeProfit),
          expiration: this.dateOrNull(o?.expirationTime ?? o?.expiration),
          comment: this.text(o?.comment),
          status: this.text(o?.state ?? o?.status),
          createdTime: this.dateOrNull(o?.time ?? o?.createdTime),
          rawJson: o,
        })),
      );
    }

    if (normalized.deals.length) {
      await this.createManyChunked(
        (args) => tx.accountSnapshotDeal.createMany(args),
        normalized.deals.slice(-MAX_SNAPSHOT_DEALS_JSON).map((d) => ({
          snapshotId,
          brokerAccountId,
          dealId: this.text(d?.id ?? d?.dealId),
          positionId: this.text(d?.positionId),
          orderId: this.text(d?.orderId),
          symbol: this.text(d?.symbol),
          price: this.numOrNull(d?.price),
          volume: this.num(d?.volume),
          commission: this.num(d?.commission),
          swap: this.num(d?.swap),
          fee: this.num(d?.fee),
          profit: this.num(d?.profit),
          time: this.dateOrNull(d?.time),
          executionType: this.text(d?.type ?? d?.entryType),
          rawJson: d,
        })),
      );
    }

    if (normalized.orderHistory.length) {
      await this.createManyChunked(
        (args) => tx.accountSnapshotOrderHistory.createMany(args),
        normalized.orderHistory.slice(-MAX_SNAPSHOT_ORDERS_JSON).map((o) => ({
          snapshotId,
          brokerAccountId,
          ticket: this.text(o?.ticket ?? o?.id ?? o?.orderId),
          positionId: this.text(o?.positionId),
          symbol: this.text(o?.symbol),
          openPrice: this.numOrNull(o?.openPrice ?? o?.price),
          closePrice: this.numOrNull(o?.closePrice ?? o?.currentPrice),
          openTime: this.dateOrNull(o?.openTime ?? o?.time),
          closeTime: this.dateOrNull(o?.closeTime ?? o?.doneTime),
          profit: this.num(o?.profit),
          swap: this.num(o?.swap),
          commission: this.num(o?.commission),
          netProfit:
            this.num(o?.profit) + this.num(o?.swap) + this.num(o?.commission),
          holdingSeconds: this.holdingSeconds(o?.openTime ?? o?.time, o?.closeTime ?? o?.doneTime),
          exitReason: this.text(o?.reason ?? o?.state),
          rawJson: o,
        })),
      );
    }

    if (normalized.symbols.length) {
      await this.createManyChunked(
        (args) => tx.accountSnapshotSymbol.createMany(args),
        normalized.symbols.map((s) => ({
          snapshotId,
          brokerAccountId,
          symbol: this.text(s?.symbol ?? s) || 'UNKNOWN',
          bid: this.numOrNull(s?.bid),
          ask: this.numOrNull(s?.ask),
          spread: this.numOrNull(s?.spread),
          digits: this.intOrNull(s?.digits),
          contractSize: this.numOrNull(s?.contractSize),
          tickSize: this.numOrNull(s?.tickSize),
          tickValue: this.numOrNull(s?.tickValue),
          minLot: this.numOrNull(s?.minVolume ?? s?.minLot),
          maxLot: this.numOrNull(s?.maxVolume ?? s?.maxLot),
          lotStep: this.numOrNull(s?.volumeStep ?? s?.lotStep),
          tradingEnabled:
            typeof s?.tradeAllowed === 'boolean' ? s.tradeAllowed : null,
          rawJson: typeof s === 'object' ? s : { symbol: s },
        })),
      );
    }

    if (normalized.marketData.length) {
      await this.createManyChunked(
        (args) => tx.accountSnapshotMarketData.createMany(args),
        normalized.marketData.map((m) => {
          const tick = m?.tick ?? m;
          const spec = m?.specification ?? {};
          return {
            snapshotId,
            brokerAccountId,
            symbol: this.text(m?.symbol ?? tick?.symbol) || 'UNKNOWN',
            bid: this.numOrNull(tick?.bid),
            ask: this.numOrNull(tick?.ask),
            spread: this.numOrNull(tick?.spread),
            open: this.numOrNull(tick?.open),
            high: this.numOrNull(tick?.high),
            low: this.numOrNull(tick?.low),
            close: this.numOrNull(tick?.close),
            volume: this.numOrNull(tick?.volume),
            timeframe: this.text(tick?.timeframe),
            tickTimestamp: this.dateOrNull(tick?.time),
            rawJson: { tick, specification: spec },
          };
        }),
      );
    }

    await tx.accountSnapshotStatus.create({
      data: {
        snapshotId,
        brokerAccountId,
        connected: Boolean(normalized.status?.connected),
        connectionStatus: this.text(normalized.status?.connectionStatus),
        synchronizationState: this.text(normalized.status?.synchronizationState),
        terminalState: this.text(normalized.status?.terminalState),
        lastHeartbeat: this.dateOrNull(normalized.status?.lastHeartbeat),
        lastConnected: this.dateOrNull(normalized.status?.lastConnected),
        lastDisconnected: this.dateOrNull(normalized.status?.lastDisconnected),
        rawJson: normalized.status,
      },
    });

    if (normalized.copyTrading) {
      await tx.accountSnapshotCopyTrading.create({
        data: {
          snapshotId,
          brokerAccountId,
          masterAccountId: this.text(normalized.copyTrading?.masterAccountId),
          followerAccountIds: normalized.copyTrading?.followerAccountIds ?? [],
          subscriptionStatus: this.text(normalized.copyTrading?.subscriptionStatus),
          lotMultiplier: this.numOrNull(normalized.copyTrading?.lotMultiplier),
          riskMultiplier: this.numOrNull(normalized.copyTrading?.riskMultiplier),
          copyDelayMs: this.intOrNull(normalized.copyTrading?.copyDelayMs),
          copyStatus: this.text(normalized.copyTrading?.copyStatus),
          syncStatus: this.text(normalized.copyTrading?.syncStatus),
          rawJson: normalized.copyTrading,
        },
      });
    }

    await tx.accountSnapshotPerformance.create({
      data: { snapshotId, brokerAccountId, ...normalized.performance, rawJson: normalized.performance },
    });
    await tx.accountSnapshotRisk.create({
      data: { snapshotId, brokerAccountId, ...normalized.risk, rawJson: normalized.risk },
    });

    if (normalized.events.length) {
      await tx.accountSnapshotEvent.createMany({
        data: normalized.events.map((event) => ({
          snapshotId,
          brokerAccountId,
          eventType: event.eventType,
          entityType: event.entityType ?? null,
          entityId: event.entityId ?? null,
          detailsJson: event.detailsJson ?? {},
          occurredAt: event.occurredAt ?? new Date(),
        })),
      });
    }
  }

  private computePerformance(
    deals: any[],
    positions: any[],
    baseBalance: number,
    balance: number,
    equity: number,
  ): Record<string, number> {
    const pnls = deals.map((d) => this.num(d?.profit)).filter((v) => v !== 0);
    const wins = pnls.filter((v) => v > 0);
    const losses = pnls.filter((v) => v < 0);
    const grossProfit = wins.reduce((s, v) => s + v, 0);
    const grossLoss = Math.abs(losses.reduce((s, v) => s + v, 0));
    const net = pnls.reduce((s, v) => s + v, 0);
    const maxDrawdown = Math.max(0, baseBalance > 0 ? ((baseBalance - equity) / baseBalance) * 100 : 0);
    const avg = (values: number[]) =>
      values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
    return {
      totalReturn: baseBalance > 0 ? ((equity - baseBalance) / baseBalance) * 100 : 0,
      absoluteReturn: equity - baseBalance,
      roi: baseBalance > 0 ? (net / baseBalance) * 100 : 0,
      dailyReturn: 0,
      weeklyReturn: 0,
      monthlyReturn: 0,
      yearlyReturn: 0,
      cagr: 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0,
      expectancy: avg(pnls),
      recoveryFactor: maxDrawdown > 0 ? net / maxDrawdown : 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: maxDrawdown > 0 ? net / maxDrawdown : 0,
      winRate: pnls.length ? (wins.length / pnls.length) * 100 : 0,
      lossRate: pnls.length ? (losses.length / pnls.length) * 100 : 0,
      averageWin: avg(wins),
      averageLoss: avg(losses),
      largestWin: wins.length ? Math.max(...wins) : 0,
      largestLoss: losses.length ? Math.min(...losses) : 0,
      averageHoldingSeconds: 0,
      maxDrawdown,
      relativeDrawdown: maxDrawdown,
      floatingDrawdown: Math.max(0, balance - equity),
      balanceDrawdown: Math.max(0, baseBalance - balance),
      currentDrawdown: maxDrawdown,
      maximumConsecutiveWins: this.maxStreak(pnls, (v) => v > 0),
      maximumConsecutiveLosses: this.maxStreak(pnls, (v) => v < 0),
      averageTradeDurationSeconds: 0,
      averagePips: avg(positions.map((p) => this.num(p?.currentPips ?? p?.pips))),
      averageRiskReward: avg(positions.map((p) => this.num(p?.reward) / Math.max(this.num(p?.risk), 1))),
      bestDay: wins.length ? Math.max(...wins) : 0,
      worstDay: losses.length ? Math.min(...losses) : 0,
      bestWeek: wins.length ? Math.max(...wins) : 0,
      worstWeek: losses.length ? Math.min(...losses) : 0,
      bestMonth: wins.length ? Math.max(...wins) : 0,
      worstMonth: losses.length ? Math.min(...losses) : 0,
      totalLots: positions.reduce((s, p) => s + this.num(p?.volume), 0),
      averageLotSize: avg(positions.map((p) => this.num(p?.volume))),
      tradesToday: deals.length,
      tradesThisWeek: deals.length,
      tradesThisMonth: deals.length,
    };
  }

  private computeRisk(
    positions: any[],
    equity: number,
    margin: number,
    freeMargin: number,
  ): Record<string, any> {
    const exposureBySymbol: Record<string, number> = {};
    let largestPosition = 0;
    for (const p of positions) {
      const volume = this.num(p?.volume);
      const price = this.num(p?.currentPrice ?? p?.openPrice ?? p?.price);
      const exposure = Math.abs(volume * price);
      const symbol = this.text(p?.symbol) || 'UNKNOWN';
      exposureBySymbol[symbol] = (exposureBySymbol[symbol] ?? 0) + exposure;
      largestPosition = Math.max(largestPosition, exposure);
    }
    const portfolioExposure = Object.values(exposureBySymbol).reduce(
      (s, v) => s + v,
      0,
    );
    return {
      currentExposure: portfolioExposure,
      portfolioExposure,
      marginUsage: equity > 0 ? (margin / equity) * 100 : 0,
      freeMarginPct: equity > 0 ? (freeMargin / equity) * 100 : 0,
      riskPerTrade: 0,
      riskPct: 0,
      largestPosition,
      largestExposure: largestPosition,
      currencyExposureJson: {},
      symbolExposureJson: exposureBySymbol,
      estimatedValueAtRisk: portfolioExposure * 0.02,
      maximumAdverseExcursion: 0,
      maximumFavorableExcursion: 0,
    };
  }

  private detectEvents(
    full: MetaApiFullSnapshot,
    previous: { balance: number; equity: number; margin: number; positionsJson: any } | null | undefined,
    balance: number,
    equity: number,
    margin: number,
  ): NormalizedSnapshot['events'] {
    const events: NormalizedSnapshot['events'] = [
      { eventType: 'SYNCHRONIZATION_FINISHED', detailsJson: { sectionErrors: full.sectionErrors } },
    ];
    const prevPositions = Array.isArray(previous?.positionsJson)
      ? previous?.positionsJson
      : [];
    const prevIds = new Set<string>(
      prevPositions
        .map((p: any) => this.text(p?.id ?? p?.positionId))
        .filter((value: string | null): value is string => Boolean(value)),
    );
    const nextIds = new Set<string>(
      full.positions
        .map((p) => this.text(p?.id ?? p?.positionId))
        .filter((value: string | null): value is string => Boolean(value)),
    );
    for (const id of nextIds) {
      if (!prevIds.has(id)) events.push({ eventType: 'POSITION_OPENED', entityType: 'position', entityId: id });
    }
    for (const id of prevIds) {
      if (!nextIds.has(id)) events.push({ eventType: 'POSITION_CLOSED', entityType: 'position', entityId: id });
    }
    if (previous && previous.balance !== balance) {
      events.push({ eventType: 'BALANCE_CHANGED', detailsJson: { previous: previous.balance, current: balance } });
    }
    if (previous && previous.equity !== equity) {
      events.push({ eventType: 'EQUITY_CHANGED', detailsJson: { previous: previous.equity, current: equity } });
    }
    if (previous && previous.margin !== margin) {
      events.push({ eventType: 'MARGIN_CHANGED', detailsJson: { previous: previous.margin, current: margin } });
    }
    for (const order of full.pendingOrders) {
      events.push({
        eventType: 'ORDER_CREATED',
        entityType: 'order',
        entityId: this.text(order?.id ?? order?.orderId) ?? undefined,
      });
    }
    return events;
  }

  private sumDealProfitSince(deals: any[], since: Date): number {
    return deals.reduce((sum, deal) => {
      const time = this.dateOrNull(deal?.time);
      if (!time || time < since) return sum;
      return sum + this.num(deal?.profit) + this.num(deal?.commission) + this.num(deal?.swap);
    }, 0);
  }

  private maxStreak(values: number[], predicate: (value: number) => boolean): number {
    let max = 0;
    let current = 0;
    for (const value of values) {
      if (predicate(value)) {
        current += 1;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    return max;
  }

  private positionSide(position: any): string | null {
    const raw = String(position?.type ?? position?.side ?? '').toUpperCase();
    if (raw.includes('SELL') || raw.includes('SHORT')) return 'SELL';
    if (raw.includes('BUY') || raw.includes('LONG')) return 'BUY';
    return raw || null;
  }

  private num(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private numOrNull(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private intOrNull(value: unknown): number | null {
    const n = this.numOrNull(value);
    return n == null ? null : Math.trunc(n);
  }

  private text(value: unknown): string | null {
    if (value == null) return null;
    const text = String(value).trim();
    return text ? text : null;
  }

  private dateOrNull(value: unknown): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isFinite(date.getTime()) ? date : null;
  }

  private durationSeconds(start: unknown): number | null {
    const date = this.dateOrNull(start);
    if (!date) return null;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  }

  private holdingSeconds(start: unknown, end: unknown): number | null {
    const from = this.dateOrNull(start);
    const to = this.dateOrNull(end);
    if (!from || !to) return null;
    return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
  }

  private async syncOpenPositions(
    brokerAccountId: string,
    userId: string,
    positions: any[],
  ): Promise<void> {
    if (!positions.length) return;

    const openDb = await this.prisma.trade.findMany({
      where: { brokerAccountId, status: TradeStatus.OPEN },
      select: { id: true, brokerTicket: true, profit: true },
    });
    const dbByTicket = new Map(
      openDb.filter((t) => t.brokerTicket).map((t) => [t.brokerTicket!, t]),
    );

    for (const pos of positions) {
      const ticket = String(pos.id ?? pos.positionId ?? '');
      if (!ticket) continue;
      const symbol = String(pos.symbol || '');
      if (!symbol) continue;
      const direction = String(pos.type || '')
        .toUpperCase()
        .includes('SELL')
        ? TradeDirection.SHORT
        : TradeDirection.LONG;
      const profit =
        typeof pos.profit === 'number'
          ? pos.profit
          : Number(pos.unrealizedProfit ?? 0) || 0;

      const existing = dbByTicket.get(ticket);
      if (existing) {
        if (Number(existing.profit ?? 0) !== profit) {
          await this.prisma.trade.update({
            where: { id: existing.id },
            data: { profit },
          });
        }
        continue;
      }

      await this.prisma.trade.upsert({
        where: {
          brokerAccountId_brokerTicket: {
            brokerAccountId,
            brokerTicket: ticket,
          },
        },
        create: {
          userId,
          brokerAccountId,
          brokerTicket: ticket,
          symbol,
          direction,
          volume: Number(pos.volume ?? 0),
          openPrice: Number(pos.openPrice ?? pos.price ?? 0),
          fillPrice: Number(pos.openPrice ?? pos.price ?? 0),
          stopLoss: pos.stopLoss ?? null,
          takeProfit: pos.takeProfit ?? null,
          profit,
          isPaper: false,
          status: TradeStatus.OPEN,
          executionMode: 'ACCOUNT_HISTORY_SYNC',
          openedAt: pos.time ? new Date(pos.time) : new Date(),
        },
        update: { profit },
      });
    }
  }

  private async syncClosedTrades(
    brokerAccountId: string,
    userId: string,
    metaApiAccountId: string,
    region?: string,
    prefetchedDeals?: any[],
  ): Promise<void> {
    const to = new Date();
    const from = new Date(Date.now() - this.dealsLookbackMs);
    const deals =
      prefetchedDeals ??
      (await this.mtAdapter.getHistoryDeals(metaApiAccountId, from, to, region));
    if (!deals.length) return;

    const groups = this.groupClosedPositions(deals);
    if (!groups.length) return;

    for (const group of groups) {
      const outDeal = [...group.deals].reverse().find((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
      const inDeal = group.deals.find((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('IN'),
      );
      if (!outDeal) continue;

      const symbol = String(
        group.deals.find((d) => d.symbol)?.symbol || '',
      ).replace(/\.|#/g, '');
      if (!symbol) continue;

      const profit = group.deals.reduce(
        (sum, d) =>
          sum +
          Number(d.profit || 0) +
          Number(d.commission || 0) +
          Number(d.swap || 0),
        0,
      );
      const direction = String(inDeal?.type || outDeal.type || '')
        .toUpperCase()
        .includes('SELL')
        ? TradeDirection.SHORT
        : TradeDirection.LONG;

      await this.prisma.trade.upsert({
        where: {
          brokerAccountId_brokerTicket: {
            brokerAccountId,
            brokerTicket: group.positionId,
          },
        },
        create: {
          userId,
          brokerAccountId,
          brokerTicket: group.positionId,
          symbol,
          direction,
          volume: Number(inDeal?.volume ?? outDeal.volume ?? 0),
          openPrice: Number(inDeal?.price ?? outDeal.price ?? 0),
          closePrice: Number(outDeal.price ?? 0),
          fillPrice: Number(inDeal?.price ?? outDeal.price ?? 0),
          profit,
          commission: group.deals.reduce(
            (s, d) => s + Number(d.commission || 0),
            0,
          ),
          swap: group.deals.reduce((s, d) => s + Number(d.swap || 0), 0),
          isPaper: false,
          status: TradeStatus.CLOSED,
          openedAt: inDeal?.time
            ? new Date(inDeal.time)
            : new Date(outDeal.time),
          closedAt: new Date(outDeal.time),
          executionMode: 'ACCOUNT_HISTORY_SYNC',
        },
        update: {
          status: TradeStatus.CLOSED,
          closePrice: Number(outDeal.price ?? 0),
          profit,
          closedAt: new Date(outDeal.time),
        },
      });
    }
  }

  private groupClosedPositions(deals: any[]): DealGroup[] {
    const isBalanceDeal = (d: any): boolean => {
      const type = String(d?.type || d?.dealType || '').toUpperCase();
      return (
        type.includes('BALANCE') ||
        type.includes('CREDIT') ||
        type.includes('CHARGE') ||
        type.includes('CORRECTION') ||
        type.includes('BONUS')
      );
    };

    const byPosition = new Map<string, any[]>();
    for (const d of deals) {
      if (isBalanceDeal(d)) continue;
      const pid = String(d.positionId || '');
      if (!pid) continue;
      if (!byPosition.has(pid)) byPosition.set(pid, []);
      byPosition.get(pid)!.push(d);
    }

    const groups: DealGroup[] = [];
    for (const [positionId, dealsForPos] of byPosition) {
      const hasOut = dealsForPos.some((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
      if (!hasOut) continue;
      groups.push({ positionId, deals: dealsForPos });
    }
    return groups;
  }
}
