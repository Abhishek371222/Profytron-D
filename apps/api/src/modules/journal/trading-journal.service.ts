import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TradingJournalService {
  private readonly logger = new Logger(TradingJournalService.name);

  constructor(private prisma: PrismaService) {}

  async createJournalEntry(
    userId: string,
    tradeId: string,
    emotions?: string,
    lessonLearned?: string,
  ) {
    return this.prisma.tradeJournalEntry.create({
      data: {
        userId,
        tradeId,
        emotions,
        lessonLearned,
      },
    });
  }

  async getJournalEntries(userId: string, limit = 50, skip = 0) {
    return this.prisma.tradeJournalEntry.findMany({
      where: { userId },
      include: { trade: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }

  async updateJournalEntry(entryId: string, updates: any) {
    return this.prisma.tradeJournalEntry.update({
      where: { id: entryId },
      data: updates,
    });
  }

  async uploadScreenshot(entryId: string, screenshotUrl: string) {
    return this.updateJournalEntry(entryId, { screenshotUrl });
  }

  async rateEntry(entryId: string, rating: number) {
    return this.updateJournalEntry(entryId, {
      rating: Math.min(5, Math.max(1, rating)),
    });
  }

  async generateAiAnalysis(entryId: string) {
    const entry = await this.prisma.tradeJournalEntry.findUnique({
      where: { id: entryId },
      include: { trade: true },
    });

    if (!entry) return null;

    let analysis: string;

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const isOpenRouter = apiKey.startsWith('sk-or-');
        const baseUrl = isOpenRouter
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = isOpenRouter
          ? process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
          : 'gpt-4o-mini';

        const systemPrompt = `You are an expert trading psychology coach at Profytron. Analyze the trader's journal entry and trade data. Provide structured, actionable insights covering:
1. Trade merit and execution quality
2. Emotional patterns detected and their impact
3. Psychology insights and behavioral tendencies
4. Specific action items to improve performance
Be direct, specific, and empathetic. Output clean text without markdown headers. Max 250 words.`;

        const userPrompt = `Journal Entry Analysis:
Symbol: ${entry.trade?.symbol || 'N/A'}
Direction: ${entry.trade?.direction || 'N/A'}
P&L: ${entry.trade?.profit !== undefined && entry.trade.profit !== null ? entry.trade.profit : 'N/A'}
Open Price: ${entry.trade?.openPrice || 'N/A'}
Close Price: ${entry.trade?.closePrice || 'N/A'}
Emotions recorded: ${entry.emotions || 'Not recorded'}
Lesson learned: ${entry.lessonLearned || 'Not recorded'}
Trade status: ${entry.trade?.status || 'N/A'}`;

        const response = await axios.post(
          baseUrl,
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 400,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              ...(isOpenRouter && {
                'HTTP-Referer': 'https://profytron.com',
                'X-Title': 'Profytron Trading Journal',
              }),
            },
            timeout: 20000,
          },
        );

        analysis = response.data.choices[0]?.message?.content || '';
        this.logger.log(`AI journal analysis generated for entry ${entryId}`);
      } catch (err: any) {
        this.logger.warn(
          `AI analysis failed: ${err.message} — using template fallback`,
        );
        analysis = this.buildTemplateAnalysis(entry);
      }
    } else {
      analysis = this.buildTemplateAnalysis(entry);
    }

    return this.updateJournalEntry(entryId, { aiAnalysis: analysis });
  }

  private buildTemplateAnalysis(entry: any): string {
    const pnl = entry.trade?.profit ?? 0;
    const pnlStr = pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2);
    const emotion = entry.emotions?.split(',')[0]?.trim() || 'neutral';
    return `Trade Analysis:
Symbol ${entry.trade?.symbol || 'N/A'} | ${entry.trade?.direction || 'N/A'} | P&L: ${pnlStr}

Emotional Pattern: Detected "${emotion}" state during this trade. Emotional clarity is key to consistent execution. ${pnl < 0 ? 'After a loss, avoid revenge trading — wait for your next high-probability setup.' : 'Positive results can lead to overconfidence — maintain your process.'}

Psychology Insight: ${entry.emotions ? `Your recorded emotion (${emotion}) suggests you were ${pnl < 0 ? 'under pressure during this trade. Practice accepting losses as part of the process.' : 'in a good headspace. Replicate these conditions for future trades.'}` : 'Tracking emotions consistently helps identify patterns. Make it a habit to log your pre-trade state.'}

Lesson: ${entry.lessonLearned || 'No lesson recorded. Capturing lessons after each trade is one of the most powerful habits elite traders develop.'}

Action Items: 1) Review your entry criteria against your trading plan. 2) Log your emotional state before each trade. 3) ${pnl < 0 ? 'Analyze what could have been done differently at entry.' : 'Document what worked well to replicate this setup.'}`;
  }

  async getInsights(userId: string) {
    const entries = await this.prisma.tradeJournalEntry.findMany({
      where: { userId },
      include: { trade: true },
    });

    const emotions = entries
      .map((e) => e.emotions?.split(',') || [])
      .flat()
      .filter(Boolean);

    const emotionCounts: Record<string, number> = {};
    emotions.forEach((e) => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });

    const avgRating =
      entries
        .filter((e) => e.rating)
        .reduce((sum, e) => sum + (e.rating || 0), 0) / entries.length || 0;

    return {
      totalEntries: entries.length,
      averageRating: avgRating,
      emotionalPatterns: emotionCounts,
      lastEntry: entries[0] || null,
    };
  }
}
