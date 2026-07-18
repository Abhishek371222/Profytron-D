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
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CopyBridgeService } from '../copy-bridge/copy-bridge.service';

const TRADE_CONCURRENCY = Number(process.env.TRADE_QUEUE_CONCURRENCY) || 15;
const TRADE_MODIFY_CONCURRENCY =
  Number(process.env.TRADE_MODIFY_CONCURRENCY) || 8;

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
    private email: EmailService,
    private notificationsService: NotificationsService,
    private copyBridge: CopyBridgeService,
    @InjectQueue('trade_execution_dlq') private dlq: Queue,
  ) {}

  @OnQueueFailed()
  async onJobFailed(job: Job, err: Error) {
    const maxAttempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
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

  @Process({ name: 'execute_trade', concurrency: TRADE_CONCURRENCY })
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

      let volume: number;
      if (explicitVolume != null && masterVolume == null) {
        volume = Math.max(0.01, parseFloat(Number(explicitVolume).toFixed(2)));
      } else {
        const sizingMode =
          subscriptionSizing?.mode ?? ('EQUITY_RATIO' as const);
        let masterEquity: number | null = null;
        let followerEquity: number | null = null;
        if (sizingMode === 'EQUITY_RATIO') {
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
        const sized = computeFollowerVolume({
          mode: sizingMode,
          masterVolume: masterVolume ?? null,
          multiplier: subscriptionSizing?.multiplier ?? lotMultiplier ?? 1.0,
          fixedLot: subscriptionSizing?.fixedLot ?? null,
          masterEquity,
          followerEquity,
          skipIfBelowMin: true,
        });
        if (sized == null) {
          this.logger.warn(
            `Skipping copy for user ${userId}: scaled lot below min (master=${masterVolume}, mode=${sizingMode})`,
          );
          await this.ledger.recordExecution({
            followerUserId: userId,
            subscriptionId: subscriptionId ?? null,
            masterPositionId: masterPositionId ?? null,
            symbol: pair,
            side: type,
            requestedVolume: 0,
            requestedPrice: requestedPrice ?? price,
            status: ExecutionStatus.FAILED,
            errorReason: 'TRADE_BLOCKED_INSUFFICIENT_LOT',
          });
          return;
        }
        volume = sized;
      }

      let brokerOrderId: string | null = null;
      let liveFillMode: 'metaapi' | 'ledger_mirror' | 'bridge' | 'paper' =
        brokerAccount.isPaperTrading ? 'paper' : 'ledger_mirror';
      let queueBridgeOpen = false;

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
            liveFillMode = 'metaapi';
          } else {
            queueBridgeOpen = true;
            liveFillMode = 'bridge';
            this.logger.log(
              `master_only bridge queue for user ${userId} ${pair} (no MetaApi seat)`,
            );
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
          throw err;
        }
      } else if (!brokerAccount.isPaperTrading) {
        queueBridgeOpen = true;
        liveFillMode = 'bridge';
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
            liveFillMode,
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

      if (queueBridgeOpen) {
        await this.copyBridge.enqueue({
          userId,
          brokerAccountId: brokerAccount.id,
          subscriptionId: subscriptionId ?? null,
          followerTradeId: trade.id,
          masterPositionId: masterPositionId ?? null,
          action: 'OPEN',
          symbol: pair,
          side: type,
          volume,
          price: adjustedFillPrice,
          stopLoss: requestedStopLoss ?? null,
          takeProfit: requestedTakeProfit ?? null,
        });
      }

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

      void this.notificationsService.create({
        userId,
        title: `Trade Opened — ${pair}`,
        message: `${type} @ ${adjustedFillPrice?.toFixed(5) ?? 'market'}`,
        type: 'INFO',
        category: 'TRADING',
        priority: 'NORMAL',
        actionUrl: '/dashboard',
        sendPush: true,
      });
      void this.prisma.user
        .findUnique({
          where: { id: userId },
          select: { email: true, fullName: true },
        })
        .then((u) => {
          if (u) {
            void this.email.sendTradeAlertEmail(
              u.email,
              u.fullName,
              {
                alertType: 'TRADE_OPENED',
                symbol: pair,
                direction: type,
                price: adjustedFillPrice,
                strategyName: strategyId ?? undefined,
              },
              userId,
            );
          }
        });

      if (brokerAccount.isPaperTrading) {
        setTimeout(async () => {
          try {
            const closePrice =
              adjustedFillPrice * (1 + (Math.random() * 0.02 - 0.01));
            const profitValue =
              (closePrice - adjustedFillPrice) *
              (direction === TradeDirection.LONG ? 1 : -1) *
              1000;

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
      throw error;
    }
  }

  @Process({ name: 'close_copy', concurrency: TRADE_CONCURRENCY })
  async handleCloseCopy(
    job: Job<{ tradeId: string; userId: string; brokerAccountId: string }>,
  ) {
    const { tradeId, userId, brokerAccountId } = job.data;
    this.logger.log(`Closing copy trade ${tradeId} for user ${userId}`);

    if (!brokerAccountId) {
      throw new Error(
        `close_copy missing brokerAccountId for trade ${tradeId}`,
      );
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

      const creds = !brokerAccount.isPaperTrading
        ? (() => {
            try {
              return JSON.parse(
                this.crypto.decrypt(brokerAccount.credentialsEncrypted),
              );
            } catch {
              return {};
            }
          })()
        : {};

      if (
        !brokerAccount.isPaperTrading &&
        this.mtAdapter.isLive &&
        trade.brokerTicket &&
        creds.metaApiAccountId
      ) {
        await this.mtAdapter.closePosition(
          creds.metaApiAccountId,
          trade.brokerTicket,
          creds.metaApiRegion,
        );
      } else if (!brokerAccount.isPaperTrading && !creds.metaApiAccountId) {
        const openTrade = await this.prisma.trade.findUnique({
          where: { id: tradeId },
          select: {
            symbol: true,
            volume: true,
            direction: true,
            brokerTicket: true,
          },
        });
        if (openTrade) {
          await this.copyBridge.enqueue({
            userId,
            brokerAccountId,
            followerTradeId: tradeId,
            action: 'CLOSE',
            symbol: openTrade.symbol,
            side: openTrade.direction === TradeDirection.LONG ? 'BUY' : 'SELL',
            volume: openTrade.volume,
            brokerTicket: openTrade.brokerTicket ?? trade.brokerTicket ?? null,
          });
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

  @Process({ name: 'close_trade', concurrency: TRADE_CONCURRENCY })
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
        if (closed) {
          const isProfit = (closed.profit ?? 0) > 0;
          void this.notificationsService.create({
            userId,
            title: isProfit
              ? `Take Profit Hit — ${closed.symbol}`
              : `Trade Closed — ${closed.symbol}`,
            message: `P&L: ${isProfit ? '+' : ''}${(closed.profit ?? 0).toFixed(2)} USD`,
            type: isProfit ? 'SUCCESS' : 'WARNING',
            category: 'TRADING',
            priority: 'NORMAL',
            actionUrl: '/dashboard',
            sendPush: true,
          });
        }
        void this.prisma.user
          .findUnique({
            where: { id: userId },
            select: { email: true, fullName: true },
          })
          .then((u) => {
            if (u && closed) {
              const alertType =
                closed.profit != null && closed.profit > 0
                  ? 'TP_HIT'
                  : 'TRADE_CLOSED';
              void this.email.sendTradeAlertEmail(
                u.email,
                u.fullName,
                {
                  alertType,
                  symbol: closed.symbol,
                  direction: closed.direction,
                  price: closed.closePrice ?? undefined,
                  pnl: closed.profit ?? undefined,
                },
                userId,
              );
            }
          });
      }
    } catch (error) {
      this.logger.error(`Failed to close trade ${tradeId}: ${error.message}`);
      throw error;
    }
  }

  @Process({ name: 'modify_trade', concurrency: TRADE_MODIFY_CONCURRENCY })
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

  @Process({ name: 'break_even', concurrency: TRADE_MODIFY_CONCURRENCY })
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

  @Process({ name: 'trailing_stop', concurrency: TRADE_MODIFY_CONCURRENCY })
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
        /* ignore */
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
