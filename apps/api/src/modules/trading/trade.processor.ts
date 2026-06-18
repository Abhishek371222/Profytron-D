import { InjectQueue, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job, Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from './trading.gateway';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import {
  TradeDirection,
  TradeStatus,
  ExecutionStatus,
  TradeEventType,
} from '@prisma/client';
import { CopyLedgerService } from './copy-ledger.service';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';
import { MarketService } from '../market/market.service';
import {
  mapTradeSymbolToMarket,
  estimateUnrealizedPnl,
} from './utils/pnl.util';
import {
  computeFollowerVolume,
  type SizingMode,
} from './utils/lot-sizing.util';
import { AiRiskService } from '../ai-risk/ai-risk.service';

@Processor('trade_execution')
export class TradeProcessor {
  private readonly logger = new Logger(TradeProcessor.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
    private activationService: ActivationService,
    private market: MarketService,
    private aiRisk: AiRiskService,
    private ledger: CopyLedgerService,
    @InjectQueue('trade_execution_dlq') private dlq: Queue,
  ) {}

  /**
   * Routes jobs that have exhausted all retries to the dead-letter queue so
   * they can be inspected / replayed and the user notified.
   */
  @OnQueueFailed()
  async onJobFailed(job: Job, err: Error) {
    const maxAttempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return; // more retries pending
    try {
      await this.dlq.add('dead_letter', {
        originalName: job.name,
        originalData: job.data,
        failedReason: err?.message ?? 'unknown',
        attemptsMade: job.attemptsMade,
      });
    } catch (e) {
      this.logger.error(`Failed to enqueue DLQ job: ${(e as Error).message}`);
    }
  }

  @Process('execute_trade')
  async handleTradeExecution(job: Job<any>) {
    const {
      userId,
      subscriptionId,
      signalId,
      strategyId,
      type,
      pair,
      price,
      requestedPrice,
      queuedAt,
      executionMode,
      executionMetadataJson,
      icebergSliceIndex,
      icebergSliceCount,
      slippageBps,
      masterVolume,
      lotMultiplier,
      masterPositionId,
      volume: explicitVolume,
      stopLoss: requestedStopLoss,
      takeProfit: requestedTakeProfit,
    } = job.data;
    this.logger.log(`Executing trade for user ${userId} on ${pair}`);

    try {
      // ── Pre-trade risk gate ──────────────────────────────────────────────
      // Enforced for every entry (copy, signal, manual). Blocks the trade when
      // a configured limit is breached; hard breaches also halt + close.
      const risk = await this.aiRisk.evaluatePreTrade(userId, subscriptionId);
      if (!risk.allowed) {
        await this.prisma.auditLog
          .create({
            data: {
              eventType: 'TRADE_BLOCKED_RISK_LIMIT',
              userId,
              detailsJson: {
                code: risk.code ?? null,
                reason: risk.reason ?? null,
                symbol: pair,
                subscriptionId: subscriptionId ?? null,
              },
              triggeredBy: 'SYSTEM',
            },
          })
          .catch(() => undefined);
        this.gateway.sendToUser(userId, 'trade_blocked', {
          symbol: pair,
          reason: risk.reason,
          code: risk.code,
        });
        if (risk.hardStop) {
          await this.aiRisk.enforceRiskStop(userId, risk).catch((err) => {
            this.logger.error(`Risk stop enforcement failed: ${err.message}`);
          });
        }
        this.logger.warn(
          `Trade blocked for ${userId} on ${pair}: ${risk.reason}`,
        );
        return;
      }

      let brokerAccount = null;
      let subscriptionSizing: {
        mode?: SizingMode | null;
        multiplier?: number | null;
        fixedLot?: number | null;
      } | null = null;

      if (subscriptionId) {
        const subscription =
          await this.prisma.userStrategySubscription.findUnique({
            where: { id: subscriptionId },
            select: {
              brokerAccountId: true,
              userId: true,
              lotMultiplier: true,
              executionProfileJson: true,
            },
          });

        if (subscription) {
          const profile = (subscription.executionProfileJson as any) ?? {};
          subscriptionSizing = {
            mode: profile.sizingMode ?? null,
            multiplier: subscription.lotMultiplier ?? lotMultiplier ?? 1.0,
            fixedLot:
              typeof profile.fixedLot === 'number' ? profile.fixedLot : null,
          };
        }

        if (subscription?.brokerAccountId) {
          brokerAccount = await this.prisma.brokerAccount.findFirst({
            where: {
              id: subscription.brokerAccountId,
              userId,
              isActive: true,
            },
          });
        }
      }

      if (!brokerAccount) {
        brokerAccount = await this.prisma.brokerAccount.findFirst({
          where: { userId, isActive: true, isDefault: true },
        });
      }

      if (!brokerAccount) {
        brokerAccount = await this.prisma.brokerAccount.findFirst({
          where: {
            userId,
            isActive: true,
            isPaperTrading: false,
            brokerName: { in: ['MT4', 'MT5'] },
          },
          orderBy: { connectedAt: 'desc' },
        });
      }

      if (!brokerAccount) {
        throw new Error(`No broker account for user ${userId}`);
      }

      const direction =
        type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT;
      const queuedTimestamp = queuedAt
        ? new Date(queuedAt).getTime()
        : Date.now();
      const executionLatencyMs = Math.max(0, Date.now() - queuedTimestamp);
      const adjustedFillPrice = this.calculateFillPrice(
        direction,
        price,
        slippageBps ?? 0,
      );

      // Volume: manual orders carry an explicit volume; copy/signal trades are
      // sized by the follower's configured method (fixed / multiplier /
      // equity-ratio) via the deterministic lot-sizing engine.
      let volume: number;
      if (explicitVolume != null && masterVolume == null) {
        volume = Math.max(0.01, parseFloat(Number(explicitVolume).toFixed(2)));
      } else {
        let masterEquity: number | null = null;
        let followerEquity: number | null = null;
        if (subscriptionSizing?.mode === 'EQUITY_RATIO') {
          followerEquity = await this.resolveEquity(brokerAccount);
          const masterBrokerAccountId = job.data.masterBrokerAccountId as
            | string
            | undefined;
          if (masterBrokerAccountId) {
            const master = await this.prisma.brokerAccount.findUnique({
              where: { id: masterBrokerAccountId },
              select: {
                credentialsEncrypted: true,
                initialEquity: true,
                isPaperTrading: true,
              },
            });
            masterEquity = master ? await this.resolveEquity(master) : null;
          }
        }
        volume = computeFollowerVolume({
          mode: subscriptionSizing?.mode ?? 'MULTIPLIER',
          masterVolume: masterVolume ?? null,
          multiplier: subscriptionSizing?.multiplier ?? lotMultiplier ?? 1.0,
          fixedLot: subscriptionSizing?.fixedLot ?? null,
          masterEquity,
          followerEquity,
        });
      }

      let brokerOrderId: string | null = null;

      // Real execution via MetaAPI for non-paper accounts
      if (!brokerAccount.isPaperTrading && this.mtAdapter.isLive) {
        try {
          const creds = JSON.parse(
            this.crypto.decrypt(brokerAccount.credentialsEncrypted),
          );
          if (creds.metaApiAccountId) {
            const result = await this.mtAdapter.executeTrade(
              creds.metaApiAccountId,
              {
                actionType:
                  direction === TradeDirection.LONG
                    ? 'ORDER_TYPE_BUY'
                    : 'ORDER_TYPE_SELL',
                symbol: pair,
                volume,
                ...(requestedStopLoss != null
                  ? { stopLoss: requestedStopLoss }
                  : {}),
                ...(requestedTakeProfit != null
                  ? { takeProfit: requestedTakeProfit }
                  : {}),
                comment: `Profytron copy ${strategyId?.slice(0, 8) ?? 'manual'}`,
              },
              creds.metaApiRegion,
            );
            brokerOrderId = result.orderId;
          }
        } catch (err) {
          this.logger.error(
            `MetaAPI trade execution failed for ${userId}: ${err.message}`,
          );
          await this.ledger.recordExecution({
            followerUserId: userId,
            subscriptionId: subscriptionId ?? null,
            masterPositionId: masterPositionId ?? null,
            symbol: pair,
            side: type,
            requestedVolume: volume,
            requestedPrice: requestedPrice ?? price,
            status: ExecutionStatus.FAILED,
            errorReason: err?.message ?? 'metaapi_error',
          });
          await this.ledger.recordEvent({
            type: TradeEventType.EXECUTION_FAILED,
            userId,
            masterPositionId: masterPositionId ?? null,
            symbol: pair,
            side: type,
            volume,
            details: { error: err?.message ?? 'metaapi_error' },
          });
          // Rethrow so Bull retries and ultimately dead-letters the job.
          throw err;
        }
      }

      const trade = await this.prisma.trade.create({
        data: {
          userId,
          strategyId: strategyId ?? null,
          brokerAccountId: brokerAccount.id,
          symbol: pair,
          direction,
          volume,
          openPrice: adjustedFillPrice,
          status: TradeStatus.OPEN,
          openedAt: new Date(),
          isPaper: brokerAccount.isPaperTrading,
          stopLoss: requestedStopLoss ?? null,
          takeProfit: requestedTakeProfit ?? null,
          requestedPrice: requestedPrice ?? price,
          fillPrice: adjustedFillPrice,
          slippageBps: slippageBps ?? 0,
          executionLatencyMs,
          brokerTicket: brokerOrderId,
          icebergSliceIndex: icebergSliceIndex ?? null,
          icebergSliceCount: icebergSliceCount ?? null,
          executionMode: executionMode ?? 'STREAMED',
          executionMetadataJson: {
            ...(executionMetadataJson ?? {}),
            signalId: signalId ?? null,
            subscriptionId: subscriptionId ?? null,
            masterPositionId: masterPositionId ?? null,
            executionLatencyMs,
          },
        },
      });

      if (subscriptionId || masterPositionId) {
        await this.ledger.recordExecution({
          followerUserId: userId,
          subscriptionId: subscriptionId ?? null,
          followerTradeId: trade.id,
          masterPositionId: masterPositionId ?? null,
          followerTicket: brokerOrderId,
          symbol: pair,
          side: type,
          requestedVolume: volume,
          filledVolume: volume,
          requestedPrice: requestedPrice ?? price,
          fillPrice: adjustedFillPrice,
          slippageBps: slippageBps ?? 0,
          latencyMs: executionLatencyMs,
          status: ExecutionStatus.FILLED,
        });
      }
      await this.ledger.recordEvent({
        type: TradeEventType.POSITION_OPENED,
        userId,
        tradeId: trade.id,
        masterPositionId: masterPositionId ?? null,
        symbol: pair,
        side: type,
        volume,
        price: adjustedFillPrice,
      });

      if (brokerAccount.isPaperTrading) {
        await this.activationService.track(
          userId,
          ACTIVATION_EVENTS.FIRST_PAPER_TRADE,
          { tradeId: trade.id, symbol: pair },
        );
      } else {
        await this.activationService.track(
          userId,
          ACTIVATION_EVENTS.FIRST_REAL_TRADE,
          { tradeId: trade.id, symbol: pair },
        );
      }

      if (subscriptionId) {
        await this.prisma.userStrategySubscription.update({
          where: { id: subscriptionId },
          data: {
            lastLatencyMs: executionLatencyMs,
            lastExecutionAt: new Date(),
          },
        });
      }

      this.gateway.sendToUser(userId, 'trade_opened', trade);
      this.logger.log(
        `Trade ${trade.id} opened for ${userId} (paper=${brokerAccount.isPaperTrading})`,
      );

      // Auto-close paper trades after 10s for simulation
      if (brokerAccount.isPaperTrading) {
        setTimeout(async () => {
          try {
            const closePrice =
              adjustedFillPrice * (1 + (Math.random() * 0.02 - 0.01));
            const profitValue =
              (closePrice - adjustedFillPrice) *
              (direction === TradeDirection.LONG ? 1 : -1) *
              1000;

            // Only close if still OPEN — it may have been cancelled by an emergency stop.
            const { count } = await this.prisma.trade.updateMany({
              where: { id: trade.id, status: TradeStatus.OPEN },
              data: {
                status: TradeStatus.CLOSED,
                closePrice,
                profit: profitValue,
                closedAt: new Date(),
              },
            });
            if (count > 0) {
              const closedTrade = await this.prisma.trade.findUnique({
                where: { id: trade.id },
              });
              this.gateway.sendToUser(userId, 'trade_closed', closedTrade);
            }
          } catch (err) {
            this.logger.error(
              `Paper trade auto-close failed for ${trade.id}: ${err.message}`,
            );
          }
        }, 10000);
      }
    } catch (error) {
      this.logger.error(`Failed to execute trade: ${error.message}`);
      // Rethrow so Bull can retry and ultimately dead-letter the job.
      throw error;
    }
  }

  @Process('close_copy')
  async handleCloseCopy(
    job: Job<{ tradeId: string; userId: string; brokerAccountId: string }>,
  ) {
    const { tradeId, userId, brokerAccountId } = job.data;
    this.logger.log(`Closing copy trade ${tradeId} for user ${userId}`);

    if (!brokerAccountId) {
      throw new Error(`close_copy missing brokerAccountId for trade ${tradeId}`);
    }

    try {
      const trade = await this.prisma.trade.findUnique({
        where: { id: tradeId },
        select: {
          id: true,
          status: true,
          brokerTicket: true,
          openPrice: true,
          direction: true,
        },
      });

      if (!trade || trade.status !== 'OPEN') return;

      const brokerAccount = await this.prisma.brokerAccount.findUnique({
        where: { id: brokerAccountId },
        select: { credentialsEncrypted: true, isPaperTrading: true },
      });

      if (!brokerAccount) {
        throw new Error(`No broker account ${brokerAccountId} for close_copy`);
      }

      if (
        !brokerAccount.isPaperTrading &&
        this.mtAdapter.isLive &&
        trade.brokerTicket
      ) {
        const creds = JSON.parse(
          this.crypto.decrypt(brokerAccount.credentialsEncrypted),
        );
        if (creds.metaApiAccountId) {
          await this.mtAdapter.closePosition(
            creds.metaApiAccountId,
            trade.brokerTicket,
            creds.metaApiRegion,
          );
        }
      }

      const closedTrade = await this.prisma.trade.update({
        where: { id: tradeId },
        data: { status: TradeStatus.CLOSED, closedAt: new Date() },
      });

      this.gateway.sendToUser(userId, 'trade_closed', closedTrade);
    } catch (error) {
      this.logger.error(
        `Failed to close copy trade ${tradeId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('close_trade')
  async handleCloseTrade(
    job: Job<{ tradeId: string; userId: string; volume?: number }>,
  ) {
    const { tradeId, userId, volume } = job.data;
    try {
      const trade = await this.prisma.trade.findFirst({
        where: { id: tradeId, userId, status: TradeStatus.OPEN },
      });
      if (!trade) return;

      const account = trade.brokerAccountId
        ? await this.prisma.brokerAccount.findUnique({
            where: { id: trade.brokerAccountId },
          })
        : null;
      const isPaper = account?.isPaperTrading ?? trade.isPaper;
      const isLiveBroker =
        !!account &&
        !account.isPaperTrading &&
        this.mtAdapter.isLive &&
        !!trade.brokerTicket;

      const currentPrice =
        (await this.getCurrentPrice(trade.symbol)) ??
        trade.fillPrice ??
        trade.openPrice;

      const isPartial = volume != null && volume > 0 && volume < trade.volume;
      const closeVolume = isPartial ? volume : trade.volume;

      let creds: any = null;
      if (isLiveBroker && account) {
        try {
          creds = JSON.parse(this.crypto.decrypt(account.credentialsEncrypted));
        } catch {
          creds = null;
        }
      }

      if (isPartial) {
        if (isLiveBroker && creds?.metaApiAccountId && trade.brokerTicket) {
          await this.mtAdapter.closePositionPartial(
            creds.metaApiAccountId,
            trade.brokerTicket,
            closeVolume,
            creds.metaApiRegion,
          );
        }

        const sliceProfit = estimateUnrealizedPnl(
          {
            direction: trade.direction,
            volume: closeVolume,
            openPrice: trade.openPrice,
            fillPrice: trade.fillPrice,
          },
          currentPrice,
        );

        const [, updatedOpen] = await this.prisma.$transaction([
          this.prisma.trade.create({
            data: {
              userId,
              strategyId: trade.strategyId,
              brokerAccountId: trade.brokerAccountId,
              brokerTicket: trade.brokerTicket,
              symbol: trade.symbol,
              direction: trade.direction,
              volume: closeVolume,
              openPrice: trade.openPrice,
              fillPrice: trade.fillPrice,
              closePrice: currentPrice,
              stopLoss: trade.stopLoss,
              takeProfit: trade.takeProfit,
              profit: sliceProfit,
              isPaper,
              status: TradeStatus.CLOSED,
              openedAt: trade.openedAt,
              closedAt: new Date(),
              executionMode: 'PARTIAL_CLOSE',
              executionMetadataJson: { partialOf: trade.id },
            },
          }),
          this.prisma.trade.update({
            where: { id: trade.id },
            data: { volume: Number((trade.volume - closeVolume).toFixed(2)) },
          }),
        ]);

        this.gateway.sendToUser(userId, 'trade_partially_closed', {
          tradeId: trade.id,
          remainingVolume: updatedOpen.volume,
          closedVolume: closeVolume,
          profit: sliceProfit,
        });
        return;
      }

      // Full close
      if (isLiveBroker && creds?.metaApiAccountId && trade.brokerTicket) {
        await this.mtAdapter.closePosition(
          creds.metaApiAccountId,
          trade.brokerTicket,
          creds.metaApiRegion,
        );
      }

      const profit =
        trade.profit ??
        estimateUnrealizedPnl(
          {
            direction: trade.direction,
            volume: trade.volume,
            openPrice: trade.openPrice,
            fillPrice: trade.fillPrice,
          },
          currentPrice,
        );

      const { count } = await this.prisma.trade.updateMany({
        where: { id: trade.id, status: TradeStatus.OPEN },
        data: {
          status: TradeStatus.CLOSED,
          closePrice: currentPrice,
          profit,
          closedAt: new Date(),
        },
      });
      if (count > 0) {
        const closed = await this.prisma.trade.findUnique({
          where: { id: trade.id },
        });
        this.gateway.sendToUser(userId, 'trade_closed', closed);
      }
    } catch (error) {
      this.logger.error(`Failed to close trade ${tradeId}: ${error.message}`);
      throw error;
    }
  }

  @Process('modify_trade')
  async handleModifyTrade(
    job: Job<{
      tradeId: string;
      userId: string;
      stopLoss?: number;
      takeProfit?: number;
    }>,
  ) {
    const { tradeId, userId, stopLoss, takeProfit } = job.data;
    try {
      const trade = await this.prisma.trade.findFirst({
        where: { id: tradeId, userId, status: TradeStatus.OPEN },
        select: {
          id: true,
          userId: true,
          brokerTicket: true,
          brokerAccountId: true,
        },
      });
      if (!trade) return;
      const account = await this.loadAccount(trade.brokerAccountId);
      await this.applyModify(trade, account, { stopLoss, takeProfit });
    } catch (error) {
      this.logger.error(`Failed to modify trade ${tradeId}: ${error.message}`);
      throw error;
    }
  }

  @Process('break_even')
  async handleBreakEven(
    job: Job<{ tradeId: string; userId: string; offsetPips?: number }>,
  ) {
    const { tradeId, userId, offsetPips } = job.data;
    try {
      const trade = await this.prisma.trade.findFirst({
        where: { id: tradeId, userId, status: TradeStatus.OPEN },
        select: {
          id: true,
          userId: true,
          brokerTicket: true,
          brokerAccountId: true,
          direction: true,
          openPrice: true,
          fillPrice: true,
        },
      });
      if (!trade) return;
      const account = await this.loadAccount(trade.brokerAccountId);
      const entry = trade.fillPrice ?? trade.openPrice;
      const pip = entry > 100 ? 0.1 : 0.0001;
      const offset = (offsetPips ?? 0) * pip;
      const sl =
        trade.direction === TradeDirection.LONG
          ? entry + offset
          : entry - offset;
      await this.applyModify(trade, account, {
        stopLoss: Number(sl.toFixed(entry > 100 ? 2 : 5)),
      });
    } catch (error) {
      this.logger.error(
        `Failed to set break-even for ${tradeId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('trailing_stop')
  async handleTrailingStop(
    job: Job<{
      tradeId: string;
      userId: string;
      distance: number;
      active?: boolean;
    }>,
  ) {
    const { tradeId, userId, distance, active } = job.data;
    try {
      const trade = await this.prisma.trade.findFirst({
        where: { id: tradeId, userId, status: TradeStatus.OPEN },
        select: { id: true, executionMetadataJson: true },
      });
      if (!trade) return;
      const meta = (trade.executionMetadataJson as any) ?? {};
      const updated = await this.prisma.trade.update({
        where: { id: trade.id },
        data: {
          executionMetadataJson: {
            ...meta,
            trailing: { distance, active: active !== false },
          },
        },
      });
      this.gateway.sendToUser(userId, 'trade_modified', updated);
    } catch (error) {
      this.logger.error(
        `Failed to set trailing stop for ${tradeId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Resolve an account's equity for equity-ratio sizing: prefer live equity
   * from the broker (cached), fall back to the recorded initial equity.
   */
  private async resolveEquity(account: {
    credentialsEncrypted: string;
    isPaperTrading: boolean;
    initialEquity: number | null;
  }): Promise<number | null> {
    if (!account.isPaperTrading && this.mtAdapter.isLive) {
      try {
        const creds = JSON.parse(
          this.crypto.decrypt(account.credentialsEncrypted),
        );
        if (creds.metaApiAccountId) {
          const eq = await this.mtAdapter.getLiveEquity(
            creds.metaApiAccountId,
            creds.metaApiRegion,
          );
          if (eq != null && eq > 0) return eq;
        }
      } catch {
        /* fall back to recorded equity */
      }
    }
    return account.initialEquity ?? null;
  }

  private async loadAccount(brokerAccountId: string | null) {
    if (!brokerAccountId) return null;
    return this.prisma.brokerAccount.findUnique({
      where: { id: brokerAccountId },
      select: { isPaperTrading: true, credentialsEncrypted: true },
    });
  }

  private async applyModify(
    trade: { id: string; userId: string; brokerTicket: string | null },
    account: { isPaperTrading: boolean; credentialsEncrypted: string } | null,
    changes: { stopLoss?: number; takeProfit?: number },
  ) {
    const isLiveBroker =
      !!account &&
      !account.isPaperTrading &&
      this.mtAdapter.isLive &&
      !!trade.brokerTicket;
    if (isLiveBroker && account) {
      try {
        const creds = JSON.parse(
          this.crypto.decrypt(account.credentialsEncrypted),
        );
        if (creds.metaApiAccountId && trade.brokerTicket) {
          await this.mtAdapter.modifyPosition(
            creds.metaApiAccountId,
            trade.brokerTicket,
            changes,
            creds.metaApiRegion,
          );
        }
      } catch (err) {
        this.logger.error(
          `MetaAPI modify failed for ${trade.id}: ${err.message}`,
        );
      }
    }
    const updated = await this.prisma.trade.update({
      where: { id: trade.id },
      data: {
        ...(changes.stopLoss != null ? { stopLoss: changes.stopLoss } : {}),
        ...(changes.takeProfit != null
          ? { takeProfit: changes.takeProfit }
          : {}),
      },
    });
    this.gateway.sendToUser(trade.userId, 'trade_modified', updated);
    return updated;
  }

  private async getCurrentPrice(symbol: string): Promise<number | null> {
    const marketSymbol = mapTradeSymbolToMarket(
      symbol,
      this.market.supportedSymbols,
    );
    if (!marketSymbol) return null;
    try {
      const q = await this.market.getQuote(marketSymbol);
      return typeof q?.price === 'number' ? q.price : null;
    } catch {
      return null;
    }
  }

  private calculateFillPrice(
    direction: TradeDirection,
    price: number,
    slippageBps: number,
  ) {
    const slip = (Math.max(slippageBps, 0) / 10000) * price;
    return direction === TradeDirection.LONG ? price + slip : price - slip;
  }
}
