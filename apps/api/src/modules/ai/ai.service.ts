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
  private readonly baseUrl = process.env.AI_SERVICE_URL || 'http://ai:8000';
  private readonly openaiApiKey = process.env.OPENAI_API_KEY || '';

  constructor(private readonly prisma: PrismaService) {}

  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY || this.openaiApiKey;
    if (!apiKey) {
      throw new Error('No AI API key configured');
    }

    const isOpenRouter = apiKey.startsWith('sk-or-');
    const baseUrl = isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await axios.post(
      baseUrl,
      {
        model: isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(isOpenRouter && {
            'HTTP-Referer': 'https://profytron.com',
            'X-Title': 'Profytron AI Coach',
          }),
        },
        timeout: 20000,
      },
    );

    return response.data.choices[0]?.message?.content || '';
  }

  async explainTrade(tradeData: any) {
    try {
      this.logger.log(
        `Requesting AI explanation for trade on ${tradeData.asset}`,
      );
      const response = await axios.post(
        `${this.baseUrl}/ai/explain-trade`,
        {
          asset: tradeData.asset,
          type: tradeData.type,
          entry: tradeData.entry,
          reason: tradeData.reason,
        },
        { timeout: 10000 },
      );
      return response.data;
    } catch {
      this.logger.warn(
        'External AI service unavailable — falling back to OpenAI',
      );
      return this.explainTradeOpenAI(tradeData);
    }
  }

  private async explainTradeOpenAI(tradeData: any) {
    try {
      const systemPrompt = `You are an expert forex and trading coach for the Profytron platform.
Provide concise, actionable trade analysis in 3-4 sentences. Focus on:
1. Trade merit based on the entry/direction
2. Risk/reward assessment
3. Key levels to watch
4. One behavioral tip.
Be direct and professional. Output plain text, no markdown headers.`;

      const userPrompt = `Analyze this trade:
Asset: ${tradeData.asset}
Direction: ${tradeData.type}
Entry: ${tradeData.entry}
Stop Loss: ${tradeData.stopLoss ?? 'Not set'}
Take Profit: ${tradeData.takeProfit ?? 'Not set'}
Status: ${tradeData.status ?? 'OPEN'}
${tradeData.profit !== undefined ? `P&L: ${tradeData.profit}` : ''}
Strategy: ${tradeData.reason || 'Manual entry'}`;

      const explanation = await this.callOpenAI(systemPrompt, userPrompt);
      return { explanation, source: 'openai' };
    } catch (err: any) {
      this.logger.error(`OpenAI fallback failed: ${err.message}`);
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
        : ai?.explanation
          ? ai.explanation
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
    const recentTrades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
      take: 5,
      select: { symbol: true, direction: true, profit: true, status: true },
    });

    try {
      const response = await axios.post(
        `${this.baseUrl}/ai/chat`,
        {
          message: payload.message,
          context: payload.context,
          recentTrades,
        },
        { timeout: 10000 },
      );
      return response.data;
    } catch {
      this.logger.warn(
        'External AI service unavailable — falling back to OpenAI for chat',
      );
      return this.chatOpenAI(userId, payload, recentTrades);
    }
  }

  private async chatOpenAI(
    userId: string,
    payload: AIChatRequest,
    recentTrades: any[],
  ) {
    try {
      const systemPrompt = `You are Profytron AI Coach — an expert trading psychology coach and market analyst.
You help traders improve performance, manage risk, and master their psychology.
Be concise (max 4 sentences), encouraging, and actionable.
Never give financial advice that could be considered investment advice.
Recent context about the user's trades is provided below.`;

      const tradesContext = recentTrades.length
        ? `\n\nRecent trades:\n${recentTrades.map((t) => `- ${t.symbol} ${t.direction}: ${t.profit !== null ? (t.profit >= 0 ? '+' : '') + t.profit : 'open'}`).join('\n')}`
        : '';

      const userPrompt = `${payload.context ? `Context: ${payload.context}\n` : ''}${tradesContext}\n\nUser question: ${payload.message}`;

      const reply = await this.callOpenAI(systemPrompt, userPrompt);
      return { reply, source: 'openai' };
    } catch (err: any) {
      this.logger.error(`OpenAI chat fallback failed: ${err.message}`);
      throw new BadRequestException('AI chat currently unavailable');
    }
  }

  async getCoachingReport(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { openedAt: 'desc' },
      take: 50,
      select: { profit: true, openedAt: true, closedAt: true, symbol: true },
    });

    const pnl = trades.map((t) => t.profit ?? 0);
    const winningTrades = pnl.filter((v) => v > 0).length;
    const avgPnl = pnl.length
      ? pnl.reduce((acc, v) => acc + v, 0) / pnl.length
      : 0;

    const behaviorFlags: string[] = [];
    if (pnl.filter((v) => v < 0).length >= 5)
      behaviorFlags.push('Loss streak detected');
    if (avgPnl < 0) behaviorFlags.push('Negative expectancy in recent sample');

    let aiSuggestions: string[] | null = null;

    if (this.openaiApiKey && trades.length >= 5) {
      try {
        const systemPrompt = `You are a trading coach. Based on the trader's stats, give exactly 3 short actionable suggestions. Return them as a JSON array of strings. No other text.`;
        const userPrompt = `Win rate: ${winningTrades}/${trades.length} trades. Avg P&L: $${avgPnl.toFixed(2)}. Flags: ${behaviorFlags.join(', ') || 'none'}.`;
        const raw = await this.callOpenAI(systemPrompt, userPrompt);
        const parsed = JSON.parse(raw.trim());
        if (Array.isArray(parsed)) aiSuggestions = parsed.slice(0, 3);
      } catch {
        // fall through to defaults
      }
    }

    return {
      sampleSize: trades.length,
      winRate: trades.length
        ? Number(((winningTrades / trades.length) * 100).toFixed(1))
        : 0,
      avgPnl: Number(avgPnl.toFixed(2)),
      behaviorFlags,
      suggestions: aiSuggestions ?? [
        'Reduce position size after 2 consecutive losses',
        'Avoid new entries outside your highest win-rate session',
        'Review stop loss placement for the last 10 losing trades',
      ],
    };
  }

  async getMarketRegime(symbol?: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/ai/market-regime`,
        {
          symbol: symbol || 'BTCUSDT',
        },
        { timeout: 8000 },
      );
      return response.data;
    } catch {
      this.logger.warn(
        'External AI service unavailable — returning cached market regime',
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
