import { Injectable, Logger } from '@nestjs/common';
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

  // AI Analysis (Demo - will call OpenAI in production)
  async generateAiAnalysis(entryId: string) {
    const entry = await this.prisma.tradeJournalEntry.findUnique({
      where: { id: entryId },
      include: { trade: true },
    });

    if (!entry) return null;

    const analysis = `[AI ANALYSIS DEMO]

Trade Analysis:
- Symbol: ${entry.trade?.symbol || 'N/A'}
- Direction: ${entry.trade?.direction || 'N/A'}
- P&L: ${entry.trade?.profit || 0}

Emotional Pattern:
- Detected Emotion: ${entry.emotions ? entry.emotions.split(',')[0] : 'Neutral'}
- Risk Level: Medium
- Recommendation: Consider using 1:2 RR on similar setups

Psychology Insights:
- This trade shows signs of ${entry.emotions || 'neutral'} trading
- Consider journaling before entering high-risk trades
- Review your pre-trade checklist for consistency

Lesson Learned:
${entry.lessonLearned || 'No lesson recorded for this trade'}

Action Items:
1. Review entry criteria
2. Practice risk management
3. Track emotional state before trades`;

    return this.updateJournalEntry(entryId, {
      aiAnalysis: analysis,
    });
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
