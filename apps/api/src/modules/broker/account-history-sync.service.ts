import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetaTraderAdapter } from './adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { RedisService } from '../auth/redis.service';
import { TradeDirection, TradeStatus } from '@prisma/client';
import { seedInitialEquity } from '../../common/utils/account-performance.util';

type DealGroup = { positionId: string; deals: any[] };

/**
 * Durable persistence layer for every connected MetaAPI broker account — not
 * just bot-subscribed ones (see BotTradeSyncService for that narrower path).
 *
 * On a fixed interval this:
 *  1. Snapshots balance/equity into EquitySnapshot so the equity curve and
 *     account value survive even if MetaAPI's own deal history is thin,
 *     rate-limited, or the account is later disconnected.
 *  2. Upserts closed trades (from history deals) and open positions into the
 *     Trade table, keyed by (brokerAccountId, brokerTicket), so recent
 *     trades / trade history are backed by our own database instead of being
 *     re-fetched from MetaAPI on every page load.
 *
 * Runs for ALL active, non-paper BrokerAccount rows with a real (non-mock)
 * MetaAPI account id, regardless of whether the account is used by a bot
 * subscription.
 */
@Injectable()
export class AccountHistorySyncService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AccountHistorySyncService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private polling = false;
  private readonly instanceId = `ahs-${process.pid}-${Math.random().toString(36).slice(2, 10)}`;
  /** How far back to re-pull history deals each tick — a wide overlap window
   *  is cheap (upsert is idempotent) and covers gaps from downtime/restarts. */
  private readonly dealsLookbackMs = 3 * 24 * 60 * 60 * 1000;
  private readonly minSnapshotGapMs = 4 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    private redis: RedisService,
  ) {}

  onModuleInit() {
    // Match the 1-minute cadence the rest of the dashboard polls at, so a
    // newly closed/opened trade lands in the DB within ~1 minute — not 5.
    this.startPolling(
      Number(process.env.ACCOUNT_HISTORY_SYNC_INTERVAL_MS) || 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  startPolling(intervalMs = 60 * 1000) {
    if (!process.env.METAAPI_TOKEN?.trim()) {
      this.logger.warn('Account history sync skipped — METAAPI_TOKEN missing');
      return;
    }
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => void this.syncAllAccounts(), intervalMs);
    this.logger.log(`Account history sync started (${intervalMs}ms tick)`);
    void this.syncAllAccounts();
  }

  private async syncAllAccounts() {
    if (this.polling) return;

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
        try {
          await this.syncAccount(
            account.id,
            account.userId,
            account.credentialsEncrypted,
          );
        } catch (err) {
          this.logger.warn(
            `Account history sync failed account=${account.id}: ${(err as Error).message}`,
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

    await this.snapshotEquity(brokerAccountId, metaApiAccountId, region);
    await this.syncOpenPositions(
      brokerAccountId,
      userId,
      metaApiAccountId,
      region,
    );
    await this.syncClosedTrades(
      brokerAccountId,
      userId,
      metaApiAccountId,
      region,
    );
  }

  private async snapshotEquity(
    brokerAccountId: string,
    metaApiAccountId: string,
    region?: string,
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

    const snap = await this.mtAdapter.getAccountSnapshot(
      metaApiAccountId,
      region,
    );
    if (!snap || !Number.isFinite(snap.equity) || snap.equity <= 0) return;

    await this.prisma.equitySnapshot.create({
      data: {
        brokerAccountId,
        balance: snap.balance,
        equity: snap.equity,
        margin: snap.margin,
        freeMargin: snap.freeMargin,
      },
    });

    const account = await this.prisma.brokerAccount.findUnique({
      where: { id: brokerAccountId },
      select: { initialEquity: true },
    });
    const seed = seedInitialEquity(
      account?.initialEquity,
      snap.equity || snap.balance,
    );

    await this.prisma.brokerAccount.update({
      where: { id: brokerAccountId },
      data: {
        lastConnectedAt: new Date(),
        lastKnownEquity: snap.equity,
        lastKnownBalance: snap.balance,
        ...(seed != null ? { initialEquity: seed } : {}),
      },
    });
  }

  private async syncOpenPositions(
    brokerAccountId: string,
    userId: string,
    metaApiAccountId: string,
    region?: string,
  ): Promise<void> {
    const positions = await this.mtAdapter.getPositions(
      metaApiAccountId,
      region,
    );
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
  ): Promise<void> {
    const to = new Date();
    const from = new Date(Date.now() - this.dealsLookbackMs);
    const deals = await this.mtAdapter.getHistoryDeals(
      metaApiAccountId,
      from,
      to,
      region,
    );
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
