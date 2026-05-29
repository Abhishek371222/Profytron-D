import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { TradingGateway } from './trading.gateway';
import { MetaTraderAdapter } from '../broker/adapters/metatrader.adapter';
import { CryptoService } from '../../common/crypto.service';
import { TradeDirection, TradeStatus } from '@prisma/client';

@Processor('trade_execution')
export class TradeProcessor {
  private readonly logger = new Logger(TradeProcessor.name);

  constructor(
    private prisma: PrismaService,
    private gateway: TradingGateway,
    private mtAdapter: MetaTraderAdapter,
    private crypto: CryptoService,
  ) {}

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
    } = job.data;
    this.logger.log(`Executing trade for user ${userId} on ${pair}`);

    try {
      const brokerAccount = await this.prisma.brokerAccount.findFirst({
        where: { userId, isActive: true, isDefault: true },
      });

      if (!brokerAccount) {
        this.logger.error(`No default broker account for user ${userId}`);
        return;
      }

      const direction = type === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT;
      const queuedTimestamp = queuedAt ? new Date(queuedAt).getTime() : Date.now();
      const executionLatencyMs = Math.max(0, Date.now() - queuedTimestamp);
      const adjustedFillPrice = this.calculateFillPrice(direction, price, slippageBps ?? 0);

      // Volume: use lot multiplier on master volume, or default 0.1 for non-copy signals
      const volume = masterVolume != null
        ? Math.max(0.01, parseFloat(((masterVolume as number) * (lotMultiplier ?? 1.0)).toFixed(2)))
        : 0.1;

      let brokerOrderId: string | null = null;

      // Real execution via MetaAPI for non-paper accounts
      if (!brokerAccount.isPaperTrading && this.mtAdapter.isLive) {
        try {
          const creds = JSON.parse(this.crypto.decrypt(brokerAccount.credentialsEncrypted));
          if (creds.metaApiAccountId) {
            const result = await this.mtAdapter.executeTrade(creds.metaApiAccountId, {
              actionType: direction === TradeDirection.LONG ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
              symbol: pair,
              volume,
              comment: `Profytron copy ${strategyId?.slice(0, 8) ?? 'manual'}`,
            });
            brokerOrderId = result.orderId;
          }
        } catch (err) {
          this.logger.error(`MetaAPI trade execution failed for ${userId}: ${err.message}`);
          return;
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

      if (subscriptionId) {
        await this.prisma.userStrategySubscription.update({
          where: { id: subscriptionId },
          data: { lastLatencyMs: executionLatencyMs, lastExecutionAt: new Date() },
        });
      }

      this.gateway.sendToUser(userId, 'trade_opened', trade);
      this.logger.log(`Trade ${trade.id} opened for ${userId} (paper=${brokerAccount.isPaperTrading})`);

      // Auto-close paper trades after 10s for simulation
      if (brokerAccount.isPaperTrading) {
        setTimeout(async () => {
          const closePrice = adjustedFillPrice * (1 + (Math.random() * 0.02 - 0.01));
          const profitValue =
            (closePrice - adjustedFillPrice) *
            (direction === TradeDirection.LONG ? 1 : -1) *
            1000;

          const closedTrade = await this.prisma.trade.update({
            where: { id: trade.id },
            data: { status: TradeStatus.CLOSED, closePrice, profit: profitValue, closedAt: new Date() },
          });
          this.gateway.sendToUser(userId, 'trade_closed', closedTrade);
        }, 10000);
      }
    } catch (error) {
      this.logger.error(`Failed to execute trade: ${error.message}`);
    }
  }

  @Process('close_copy')
  async handleCloseCopy(job: Job<{ tradeId: string; userId: string; brokerAccountId: string }>) {
    const { tradeId, userId, brokerAccountId } = job.data;
    this.logger.log(`Closing copy trade ${tradeId} for user ${userId}`);

    try {
      const trade = await this.prisma.trade.findUnique({
        where: { id: tradeId },
        select: { id: true, status: true, brokerTicket: true, openPrice: true, direction: true },
      });

      if (!trade || trade.status !== 'OPEN') return;

      const brokerAccount = await this.prisma.brokerAccount.findUnique({
        where: { id: brokerAccountId },
        select: { credentialsEncrypted: true, isPaperTrading: true },
      });

      if (!brokerAccount) return;

      if (!brokerAccount.isPaperTrading && this.mtAdapter.isLive && trade.brokerTicket) {
        try {
          const creds = JSON.parse(this.crypto.decrypt(brokerAccount.credentialsEncrypted));
          if (creds.metaApiAccountId) {
            await this.mtAdapter.closePosition(creds.metaApiAccountId, trade.brokerTicket);
          }
        } catch (err) {
          this.logger.error(`MetaAPI close failed for trade ${tradeId}: ${err.message}`);
        }
      }

      const closedTrade = await this.prisma.trade.update({
        where: { id: tradeId },
        data: { status: TradeStatus.CLOSED, closedAt: new Date() },
      });

      this.gateway.sendToUser(userId, 'trade_closed', closedTrade);
    } catch (error) {
      this.logger.error(`Failed to close copy trade ${tradeId}: ${error.message}`);
    }
  }

  private calculateFillPrice(direction: TradeDirection, price: number, slippageBps: number) {
    const slip = (Math.max(slippageBps, 0) / 10000) * price;
    return direction === TradeDirection.LONG ? price + slip : price - slip;
  }
}
