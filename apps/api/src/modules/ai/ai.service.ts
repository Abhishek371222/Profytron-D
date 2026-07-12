import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';

interface AIChatRequest {
  message: string;
  context?: string;
}

/** TTL constants (seconds) */
const TTL_AI_RESPONSE = 5 * 60; // 5 minutes — same prompt/context can be reused briefly
const TTL_COACHING_REPORT = 2 * 60; // 2 minutes — aggregate stats change slowly

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly baseUrl = process.env.AI_SERVICE_URL || 'http://ai:8000';
  private readonly openaiApiKey = process.env.OPENAI_API_KEY || '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private sanitizeAIResponse(text: string): string {
    const sanitized = text
      .replace(/\bI (predict|forecast)\b/gi, 'data suggests')
      .replace(/\b(guaranteed?|certain) profit\b/gi, 'potential outcome')
      .replace(/\b100% (sure|certain|confident)\b/gi, 'worth considering');

    return (
      sanitized +
      '\n\n⚠️ Educational analysis only — not financial advice. Trading involves significant risk of loss.'
    );
  }

  /** Lighter sanitize for Alpha Coach — strip compliance dumps Gemini sometimes adds. */
  private sanitizeCoachResponse(text: string): string {
    return text
      .replace(/\bI (predict|forecast)\b/gi, 'setups often resolve when')
      .replace(/\b(guaranteed?|certain) profit\b/gi, 'favorable outcome')
      .replace(/\b100% (sure|certain|confident)\b/gi, 'high-conviction')
      .replace(
        /\n*\s*⚠️?\s*Educational analysis only[^\n]*/gi,
        '',
      )
      .replace(
        /\n*\s*Educational (coaching|analysis) only[^\n]*/gi,
        '',
      )
      .replace(
        /\n*\s*Trading involves significant risk of loss\.?/gi,
        '',
      )
      .replace(/\n*\s*This is not financial advice\.?/gi, '')
      .trim();
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private preferredProvider(): 'gemini' | 'openrouter' | 'openai' {
    const explicit = (process.env.AI_PROVIDER || '').toLowerCase();
    if (explicit === 'gemini' || explicit === 'openrouter' || explicit === 'openai') {
      return explicit;
    }
    if (process.env.GEMINI_API_KEY) return 'gemini';
    if (process.env.OPENROUTER_API_KEY) return 'openrouter';
    if (this.openaiApiKey) return 'openai';
    return 'gemini';
  }

  private async callGemini(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 600,
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const start = Date.now();
    const response = await axios.post(
      url,
      {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        timeout: 45000,
      },
    );

    const parts = response.data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p.text || '').join('')
      : '';

    this.logger.log(
      `AI request (gemini/${model}) completed in ${Date.now() - start}ms`,
    );
    if (!text.trim()) throw new Error('Empty Gemini response');
    return text;
  }

  private async callOpenAICompatible(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 600,
    provider: 'openrouter' | 'openai' = 'openrouter',
  ): Promise<string> {
    const apiKey =
      provider === 'openrouter'
        ? process.env.OPENROUTER_API_KEY || this.openaiApiKey
        : this.openaiApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(`No ${provider} API key configured`);
    }

    const isOpenRouter =
      provider === 'openrouter' || apiKey.startsWith('sk-or-');
    const baseUrl = isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const model = isOpenRouter
      ? process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
      : 'gpt-4o-mini';

    const start = Date.now();
    const response = await axios.post(
      baseUrl,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
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
        timeout: 45000,
      },
    );
    this.logger.log(
      `AI request (${model}) completed in ${Date.now() - start}ms`,
    );

    return response.data.choices[0]?.message?.content || '';
  }

  /**
   * Single LLM entry-point for the platform.
   * Prefer Gemini → OpenRouter → OpenAI, with retries and graceful fallback.
   */
  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 600,
  ): Promise<string> {
    const order: Array<'gemini' | 'openrouter' | 'openai'> = [];
    const preferred = this.preferredProvider();
    order.push(preferred);
    for (const p of ['gemini', 'openrouter', 'openai'] as const) {
      if (!order.includes(p)) order.push(p);
    }

    let lastError: Error | null = null;
    for (const provider of order) {
      const attempts = provider === 'gemini' ? 3 : 2;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          if (provider === 'gemini') {
            if (!process.env.GEMINI_API_KEY) break;
            return await this.callGemini(systemPrompt, userPrompt, maxTokens);
          }
          if (provider === 'openrouter') {
            if (!process.env.OPENROUTER_API_KEY && !this.openaiApiKey?.startsWith('sk-or-')) {
              break;
            }
            return await this.callOpenAICompatible(
              systemPrompt,
              userPrompt,
              maxTokens,
              'openrouter',
            );
          }
          if (!this.openaiApiKey && !process.env.OPENAI_API_KEY) break;
          return await this.callOpenAICompatible(
            systemPrompt,
            userPrompt,
            maxTokens,
            'openai',
          );
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error(String(err));
          this.logger.warn(
            `AI ${provider} attempt ${attempt}/${attempts} failed: ${lastError.message}`,
          );
          if (attempt < attempts) await this.sleep(400 * attempt);
        }
      }
    }

    throw lastError || new Error('No AI API key configured');
  }

  /** @deprecated use callLLM — kept as alias for internal call sites */
  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 600,
  ): Promise<string> {
    return this.callLLM(systemPrompt, userPrompt, maxTokens);
  }

  /** Public wrapper for Alpha Coach (Gemini-first via callLLM). */
  async generateCoachReply(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 600,
  ): Promise<string> {
    const reply = await this.callLLM(systemPrompt, userPrompt, maxTokens);
    return this.sanitizeCoachResponse(reply);
  }

  /**
   * Stream Gemini tokens for Alpha Coach. Falls back to one-shot callLLM
   * when Gemini streaming is unavailable.
   */
  async *streamCoachReply(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 700,
  ): AsyncGenerator<{ type: 'token' | 'done' | 'error'; text?: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';

    if (!apiKey || this.preferredProvider() !== 'gemini') {
      try {
        const full = await this.generateCoachReply(
          systemPrompt,
          userPrompt,
          maxTokens,
        );
        yield { type: 'token', text: full };
        yield { type: 'done', text: full };
      } catch (err: any) {
        yield { type: 'error', text: err?.message || 'AI unavailable' };
      }
      return;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      const response = await axios.post(
        url,
        {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
            Accept: 'text/event-stream',
          },
          responseType: 'stream',
          timeout: 60000,
        },
      );

      let assembled = '';
      const stream = response.data as NodeJS.ReadableStream;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const parts = json?.candidates?.[0]?.content?.parts;
            const piece = Array.isArray(parts)
              ? parts.map((p: { text?: string }) => p.text || '').join('')
              : '';
            if (piece) {
              assembled += piece;
              yield { type: 'token', text: piece };
            }
          } catch {
            /* ignore partial SSE */
          }
        }
      }

      const finalText = this.sanitizeCoachResponse(assembled || '…');
      yield { type: 'done', text: finalText };
    } catch (err: any) {
      this.logger.warn(
        `Gemini stream failed (${err.message}) — falling back to one-shot`,
      );
      try {
        const full = await this.generateCoachReply(
          systemPrompt,
          userPrompt,
          maxTokens,
        );
        yield { type: 'token', text: full };
        yield { type: 'done', text: full };
      } catch (fallbackErr: any) {
        yield {
          type: 'error',
          text: fallbackErr?.message || 'AI unavailable',
        };
      }
    }
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
      return {
        explanation: this.sanitizeAIResponse(explanation),
        source: 'openai',
      };
    } catch (err: any) {
      this.logger.error(`OpenAI fallback failed: ${err.message}`);
      throw new BadRequestException('AI Coach currently unavailable');
    }
  }

  /**
   * Returns cached explanation immediately, or queues a background job and returns
   * { status: 'pending' } so the caller can poll. This prevents the 25s blocking
   * request that previously froze the response thread.
   */
  async explainTradeById(userId: string, tradeId: string) {
    const cacheKey = `ai:trade-explain:${tradeId}`;

    // Fast path: return cached result if available (closed trades are immutable).
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit: trade explanation for ${tradeId}`);
      return JSON.parse(cached) as {
        tradeId: string;
        symbol: string;
        explanation: unknown;
      };
    }

    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
      select: {
        id: true,
        userId: true,
        strategyId: true,
        symbol: true,
        direction: true,
        openPrice: true,
        closePrice: true,
        stopLoss: true,
        takeProfit: true,
        profit: true,
        status: true,
        strategy: { select: { name: true, category: true, riskLevel: true } },
      },
    });

    if (!trade) throw new NotFoundException('Trade not found');

    // If already computing (pending key in Redis), return pending status immediately.
    const pendingKey = `ai:trade-explain-pending:${tradeId}`;
    const isPending = await this.redis.get(pendingKey);
    if (isPending) {
      return { status: 'pending', tradeId, symbol: trade.symbol };
    }

    // Mark as pending (5-min TTL — job should complete well within this).
    await this.redis.set(pendingKey, '1', 30 * 60);

    // Fire AI call in background — do NOT await.
    this.runExplainInBackground(trade, cacheKey, pendingKey).catch(
      (err: Error) =>
        this.logger.error(
          `Background AI explain failed for ${tradeId}: ${err.message}`,
        ),
    );

    return { status: 'pending', tradeId, symbol: trade.symbol };
  }

  private async runExplainInBackground(
    trade: {
      id: string;
      userId: string;
      strategyId: string | null;
      symbol: string;
      direction: string;
      openPrice: number;
      closePrice: number | null;
      stopLoss: number | null;
      takeProfit: number | null;
      profit: number | null;
      status: string;
      strategy?: { name: string; category: string; riskLevel: string } | null;
    },
    cacheKey: string,
    pendingKey: string,
  ) {
    try {
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

      const start = Date.now();
      const ai = await this.explainTrade(promptPayload);
      this.logger.log(
        `AI trade explanation for ${trade.id} completed in ${Date.now() - start}ms`,
      );

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
          keyLevelsJson: { entry: trade.openPrice, close: trade.closePrice },
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
          keyLevelsJson: { entry: trade.openPrice, close: trade.closePrice },
        },
      });

      const result = {
        tradeId: trade.id,
        symbol: trade.symbol,
        explanation: ai,
        status: 'ready',
      };
      if (trade.status === 'CLOSED') {
        await this.redis.set(cacheKey, JSON.stringify(result), TTL_AI_RESPONSE);
      }
    } finally {
      await this.redis.del(pendingKey);
    }
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
      return { reply: this.sanitizeAIResponse(reply), source: 'openai' };
    } catch (err: any) {
      this.logger.error(`OpenAI chat fallback failed: ${err.message}`);
      throw new BadRequestException('AI chat currently unavailable');
    }
  }

  async getCoachingReport(userId: string) {
    const cacheKey = `ai:coaching-report:${userId}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit: coaching report for user ${userId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(
        `Coaching report cache read failed for ${userId}: ${(error as Error).message}`,
      );
    }

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

    const hasApiKey = !!(process.env.OPENROUTER_API_KEY || this.openaiApiKey);
    if (hasApiKey && trades.length >= 5) {
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

    const report = {
      sampleSize: trades.length,
      winRate: trades.length
        ? Number(((winningTrades / trades.length) * 100).toFixed(1))
        : 0,
      avgPnl: Number(avgPnl.toFixed(2)),
      behaviorFlags,
      disclaimer:
        'Educational analysis only — not financial advice. Trading involves significant risk of loss.',
      suggestions: aiSuggestions ?? [
        'Reduce position size after 2 consecutive losses',
        'Avoid new entries outside your highest win-rate session',
        'Review stop loss placement for the last 10 losing trades',
      ],
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(report), TTL_COACHING_REPORT);
    } catch (error) {
      this.logger.warn(
        `Coaching report cache write failed for ${userId}: ${(error as Error).message}`,
      );
    }
    return report;
  }

  async getMarketRegime(symbol?: string) {
    const resolvedSymbol = symbol || 'BTCUSDT';
    const cacheKey = `ai:market-regime:${resolvedSymbol}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit: market regime for ${resolvedSymbol}`);
      return JSON.parse(cached);
    }

    try {
      const start = Date.now();
      const response = await axios.post(
        `${this.baseUrl}/ai/market-regime`,
        { symbol: resolvedSymbol },
        { timeout: 8000 },
      );
      this.logger.log(
        `Market regime fetch for ${resolvedSymbol} completed in ${Date.now() - start}ms`,
      );
      await this.redis.set(
        cacheKey,
        JSON.stringify(response.data),
        TTL_AI_RESPONSE,
      );
      return response.data;
    } catch {
      this.logger.warn(
        'External AI service unavailable — returning fallback market regime',
      );
      return {
        regime: 'UNKNOWN',
        adx: 0,
        atr_volatility: 'LOW',
        symbol: resolvedSymbol,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
