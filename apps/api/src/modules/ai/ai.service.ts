import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

interface AIChatRequest {
  message: string;
  context?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly baseUrl =
    process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(private readonly prisma: PrismaService) {}

  async explainTrade(tradeData: any) {
    try {
      this.logger.log(
        `Requesting AI explanation for trade on ${tradeData.asset}`,
      );
      const response = await axios.post(`${this.baseUrl}/ai/explain-trade`, {
        asset: tradeData.asset,
        type: tradeData.type,
        entry: tradeData.entry,
        reason: tradeData.reason,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`AI Service error: ${error.message}`);
      throw new BadRequestException('AI Coach currently unavailable');
    }
  }

  async explainTradeById(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
      include: {
        strategy: { select: { name: true, category: true, riskLevel: true } },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const promptPayload = {
      asset: trade.symbol,
      type: trade.direction,
      entry: trade.openPrice,
      reason: `Strategy: ${trade.strategy?.name || 'Manual'}. Risk level: ${trade.strategy?.riskLevel || 'N/A'}`,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      profit: trade.profit,
      status: trade.status,
    };

    const ai = await this.explainTrade(promptPayload);

    const summary =
      typeof ai === 'string'
        ? ai
        : Array.isArray(ai)
          ? JSON.stringify(ai[0] ?? ai)
          : JSON.stringify(ai);

    await this.prisma.aITradeExplanation.upsert({
      where: { tradeId: trade.id },
      update: {
        summary,
        confidenceScore: 78,
        riskFactorsJson: {
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          currentStatus: trade.status,
        },
        keyLevelsJson: {
          entry: trade.openPrice,
          close: trade.closePrice,
        },
      },
      create: {
        tradeId: trade.id,
        strategyId: trade.strategyId,
        summary,
        confidenceScore: 78,
        riskFactorsJson: {
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          currentStatus: trade.status,
        },
        keyLevelsJson: {
          entry: trade.openPrice,
          close: trade.closePrice,
        },
      },
    });

    return {
      tradeId: trade.id,
      symbol: trade.symbol,
      explanation: ai,
    };
  }

  async chat(userId: string, payload: AIChatRequest) {
    try {
      const recentTrades = await this.prisma.trade.findMany({
        where: { userId },
        orderBy: { openedAt: 'desc' },
        take: 5,
        select: {
          symbol: true,
          direction: true,
          profit: true,
          status: true,
        },
      });

      const response = await axios.post(`${this.baseUrl}/ai/chat`, {
        message: payload.message,
        context: payload.context,
        recentTrades,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`AI chat error: ${error?.message || 'unknown error'}`);
      throw new BadRequestException('AI chat currently unavailable');
    }
  }

  async getCoachingReport(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
      take: 50,
      select: {
        profit: true,
        openedAt: true,
        closedAt: true,
        symbol: true,
      },
    });

    const pnl = trades.map((t) => t.profit ?? 0);
    const winningTrades = pnl.filter((v) => v > 0).length;
    const avgPnl = pnl.length
      ? pnl.reduce((acc, v) => acc + v, 0) / pnl.length
      : 0;

    const behaviorFlags: string[] = [];
    if (pnl.filter((v) => v < 0).length >= 5) {
      behaviorFlags.push('Loss streak detected');
    }
    if (avgPnl < 0) {
      behaviorFlags.push('Negative expectancy in recent sample');
    }

    return {
      sampleSize: trades.length,
      winRate: trades.length
        ? Number(((winningTrades / trades.length) * 100).toFixed(1))
        : 0,
      avgPnl: Number(avgPnl.toFixed(2)),
      behaviorFlags,
      suggestions: [
        'Reduce position size after 2 consecutive losses',
        'Avoid new entries outside your highest win-rate session',
        'Review stop loss placement for the last 10 losing trades',
      ],
    };
  }

  async getMarketRegime(symbol?: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/ai/market-regime`, {
        symbol: symbol || 'BTCUSDT',
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `AI Service error: ${error?.message || 'unknown error'}`,
      );
      return {
        regime: 'UNKNOWN',
        adx: 0,
        atr_volatility: 'LOW',
        symbol: symbol || 'BTCUSDT',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
