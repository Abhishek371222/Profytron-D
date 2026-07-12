import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  CoachConversationStatus,
  CoachEscalationStatus,
  CoachMessageRole,
  CoachMessageSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { CoachGateway } from './coach.gateway';
import { matchFaq, rankFaq, type FaqCandidate } from './faq-matcher';

type AccountSnapshot = {
  hasBroker: boolean;
  broker: {
    id: string;
    brokerName: string;
    accountNumberLast4: string;
    isPaperTrading: boolean;
    isDefault: boolean;
    initialEquity: number | null;
  } | null;
  openTrades: Array<{
    symbol: string;
    direction: string;
    volume: number;
    openPrice: number;
    stopLoss: number | null;
    takeProfit: number | null;
    profit: number | null;
    openedAt: Date;
  }>;
  closedSample: Array<{
    profit: number | null;
    symbol: string;
    direction: string;
    volume: number;
  }>;
  winRate: number | null;
  periodPnl: number;
  openPnl: number;
  maxDd: number;
  summaryLine: string;
};

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);
  private faqCache: FaqCandidate[] | null = null;
  private faqCacheAt = 0;
  private faqLoadPromise: Promise<FaqCandidate[]> | null = null;
  private readonly FAQ_TTL_MS = 30 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly gateway: CoachGateway,
  ) {
    // Pre-warm FAQ cache so the first user message is not blocked on a large DB read.
    void this.loadFaqCandidates().catch((err: Error) =>
      this.logger.warn(`FAQ prewarm failed: ${err.message}`),
    );
  }

  private async loadFaqCandidates(): Promise<FaqCandidate[]> {
    const now = Date.now();
    if (this.faqCache && now - this.faqCacheAt < this.FAQ_TTL_MS) {
      return this.faqCache;
    }
    if (this.faqLoadPromise) return this.faqLoadPromise;

    this.faqLoadPromise = (async () => {
      const rows = await this.prisma.coachFaqQuestion.findMany({
        select: {
          id: true,
          answerId: true,
          question: true,
          normalized: true,
          keywords: true,
          answer: { select: { id: true, body: true, category: true } },
        },
      });
      this.faqCache = rows.map((r) => ({
        id: r.id,
        answerId: r.answerId,
        question: r.question,
        normalized: r.normalized,
        keywords: r.keywords,
        answerBody: r.answer.body,
        category: r.answer.category,
      }));
      this.faqCacheAt = Date.now();
      this.logger.log(`FAQ cache loaded: ${this.faqCache.length} questions`);
      return this.faqCache;
    })().finally(() => {
      this.faqLoadPromise = null;
    });

    return this.faqLoadPromise;
  }

  async listConversations(userId: string) {
    try {
      return await this.prisma.coachConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, role: true },
          },
          escalations: {
            where: { status: { in: ['OPEN', 'CLAIMED'] } },
            take: 1,
            select: { id: true, status: true },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `listConversations failed for ${userId}: ${(error as Error).message}`,
      );
      // Missing migrations / transient DB errors must not 500 the whole shell.
      return [];
    }
  }

  async createConversation(userId: string, title?: string) {
    const stamp = new Date().toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
    try {
      const conversation = await this.prisma.coachConversation.create({
        data: {
          userId,
          title: title?.trim() || `Coach · ${stamp}`,
        },
      });

      const welcome = await this.prisma.coachMessage.create({
        data: {
          conversationId: conversation.id,
          role: CoachMessageRole.SYSTEM,
          source: CoachMessageSource.SYSTEM,
          content:
            'Alpha Coach is online.\n\nI coach from your connected account when data is available.\n\nAsk about:\n• Exposure & correlation\n• Gold (XAUUSD) playbooks\n• SL / TP placement\n• SMC structure & bots\n\nNeed a human? Use Chat with Executive.',
        },
      });

      this.gateway.emitToUser(userId, 'message', {
        conversationId: conversation.id,
        message: welcome,
      });

      return conversation;
    } catch (error) {
      this.logger.error(
        `createConversation failed for ${userId}: ${(error as Error).message}`,
      );
      throw new BadRequestException(
        'Alpha Coach is temporarily unavailable. Please try again in a moment.',
      );
    }
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.coachConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 200 },
        escalations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            claimedBy: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.coachConversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.prisma.coachConversation.delete({
      where: { id: conversationId },
    });

    this.gateway.emitToUser(userId, 'conversation:deleted', {
      conversationId,
    });

    return { ok: true, id: conversationId };
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const text = content?.trim();
    if (!text) throw new BadRequestException('Message is required');
    if (text.length > 2000) {
      throw new BadRequestException('Message must be 2000 characters or fewer');
    }

    const conversation = await this.prisma.coachConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const userMessage = await this.prisma.coachMessage.create({
      data: {
        conversationId,
        role: CoachMessageRole.USER,
        source: CoachMessageSource.SYSTEM,
        content: text,
        senderId: userId,
      },
    });

    // Title from first user message (default sessions start with "Coach · …")
    if (
      conversation.title === 'New coaching session' ||
      /^Coach · /.test(conversation.title)
    ) {
      await this.prisma.coachConversation.update({
        where: { id: conversationId },
        data: {
          title: text.slice(0, 60),
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.coachConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    this.gateway.emitToUser(userId, 'message', {
      conversationId,
      message: userMessage,
    });
    this.gateway.emitToConversation(conversationId, 'message', {
      conversationId,
      message: userMessage,
    });
    this.gateway.emitToAdmins('message', {
      conversationId,
      message: userMessage,
      userId,
    });

    // If escalated and claimed, wait for human — still allow AI/FAQ for user questions
    // unless status is ESCALATED and we prefer human-only. Plan: still answer via FAQ/AI,
    // executive can also reply.
    this.gateway.emitToUser(userId, 'typing', {
      conversationId,
      userId: 'assistant',
      isTyping: true,
    });

    let assistantMessage;
    try {
      assistantMessage = await this.generateReply(userId, conversationId, text);
    } finally {
      this.gateway.emitToUser(userId, 'typing', {
        conversationId,
        userId: 'assistant',
        isTyping: false,
      });
    }

    this.gateway.emitToUser(userId, 'message', {
      conversationId,
      message: assistantMessage,
    });
    this.gateway.emitToConversation(conversationId, 'message', {
      conversationId,
      message: assistantMessage,
    });
    this.gateway.emitToAdmins('message', {
      conversationId,
      message: assistantMessage,
      userId,
    });

    return {
      userMessage,
      assistantMessage,
    };
  }

  private async generateReply(
    userId: string,
    conversationId: string,
    text: string,
  ) {
    const greeting = this.greetingReply(text);
    if (greeting) {
      return this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.SYSTEM,
          content: greeting,
        },
      });
    }

    const candidates = await this.loadFaqCandidates();
    const account = await this.buildAccountSnapshot(userId);
    const preferAi = this.shouldPreferAccountAi(text, account);
    const faqHit = preferAi ? null : matchFaq(text, candidates, 0.55);

    if (faqHit) {
      const content = this.withAccountAppendix(faqHit.answerBody, account);
      return this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.FAQ,
          content,
          faqAnswerId: faqHit.answerId,
        },
      });
    }

    const { prompt, systemPrompt } = await this.buildAiPrompt(
      userId,
      conversationId,
      text,
      candidates,
      account,
    );

    try {
      const reply = await this.aiService.generateCoachReply(
        systemPrompt,
        prompt,
        700,
      );
      return this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.AI,
          content: reply,
        },
      });
    } catch (err: any) {
      this.logger.error(`AI coach fallback failed: ${err.message}`);
      return this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.SYSTEM,
          content:
            'Alpha Coach AI is temporarily unavailable. Try a common topic (risk, gold, forex, bots) or tap Chat with Executive for a human.',
        },
      });
    }
  }

  private greetingReply(text: string): string | null {
    const t = text.trim().toLowerCase();
    if (!/^(hi|hello|hey|yo|sup|good (morning|afternoon|evening)|hola)[\s!.]*$/i.test(t) &&
        !/^(hi|hello|hey)\s+(hello|there|coach|alpha)\b/i.test(t)) {
      return null;
    }
    return 'Hey — Alpha Coach here.\n\nAsk about exposure, gold (XAUUSD), SL/TP, drawdown, or a bot.\n\nI’ll give you a direct playbook from your account data.';
  }

  private shouldPreferAccountAi(
    text: string,
    account: AccountSnapshot,
  ): boolean {
    if (!account.hasBroker && account.openTrades.length === 0) return false;
    return /\b(exposure|drawdown|my (account|trades|pnl|positions?)|open (trade|position)|stop[- ]?loss|analyze|optimize|portfolio|win rate|p&?l|connected account|xauusd|validate bot)\b/i.test(
      text,
    );
  }

  private withAccountAppendix(body: string, account: AccountSnapshot): string {
    if (!account.summaryLine) return body;
    return `${body}\n\nYour connected account right now: ${account.summaryLine}`;
  }

  private async buildAccountSnapshot(userId: string): Promise<AccountSnapshot> {
    const empty: AccountSnapshot = {
      hasBroker: false,
      broker: null,
      openTrades: [],
      closedSample: [],
      winRate: null,
      periodPnl: 0,
      openPnl: 0,
      maxDd: 0,
      summaryLine: 'no broker linked · no open trades',
    };

    try {
      const broker = await this.prisma.brokerAccount.findFirst({
        where: { userId, isActive: true },
        orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
        select: {
          id: true,
          brokerName: true,
          accountNumberLast4: true,
          isPaperTrading: true,
          isDefault: true,
          initialEquity: true,
        },
      });

      const openTrades = await this.prisma.trade.findMany({
        where: {
          userId,
          status: 'OPEN',
          ...(broker ? { brokerAccountId: broker.id } : {}),
        },
        orderBy: { openedAt: 'desc' },
        take: 20,
        select: {
          symbol: true,
          direction: true,
          volume: true,
          openPrice: true,
          stopLoss: true,
          takeProfit: true,
          profit: true,
          openedAt: true,
        },
      });

      const closed = await this.prisma.trade.findMany({
        where: {
          userId,
          status: 'CLOSED',
          ...(broker ? { brokerAccountId: broker.id } : {}),
          closedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { closedAt: 'desc' },
        take: 80,
        select: { profit: true, symbol: true, direction: true, volume: true },
      });

      const wins = closed.filter((t) => (t.profit ?? 0) > 0).length;
      const winRate = closed.length
        ? Math.round((wins / closed.length) * 1000) / 10
        : null;
      const periodPnl = closed.reduce((s, t) => s + (t.profit ?? 0), 0);
      const openPnl = openTrades.reduce((s, t) => s + (t.profit ?? 0), 0);

      let equity = 0;
      let peak = 0;
      let maxDd = 0;
      for (const t of [...closed].reverse()) {
        equity += t.profit ?? 0;
        peak = Math.max(peak, equity);
        if (peak > 0) maxDd = Math.max(maxDd, ((peak - equity) / peak) * 100);
      }

      const symbols = Array.from(new Set(openTrades.map((t) => t.symbol)));
      const summaryParts: string[] = [];
      if (broker) {
        summaryParts.push(
          `${broker.brokerName} …${broker.accountNumberLast4}${broker.isPaperTrading ? ' (paper)' : ''}`,
        );
      } else {
        summaryParts.push('no broker linked');
      }
      summaryParts.push(`${openTrades.length} open`);
      if (winRate !== null) summaryParts.push(`WR ${winRate}% (30d)`);
      summaryParts.push(
        `period P&L ${periodPnl >= 0 ? '+' : ''}${periodPnl.toFixed(2)}`,
      );
      if (openTrades.length) {
        summaryParts.push(
          `open P&L ${openPnl >= 0 ? '+' : ''}${openPnl.toFixed(2)}`,
        );
        summaryParts.push(`symbols ${symbols.join(', ') || '—'}`);
      }
      if (maxDd > 0) summaryParts.push(`approx DD ${maxDd.toFixed(1)}%`);

      return {
        hasBroker: Boolean(broker),
        broker,
        openTrades,
        closedSample: closed.slice(0, 12),
        winRate,
        periodPnl,
        openPnl,
        maxDd,
        summaryLine: summaryParts.join(' · '),
      };
    } catch (err: any) {
      this.logger.warn(`Account snapshot failed: ${err?.message || err}`);
      return empty;
    }
  }

  private async buildAiPrompt(
    userId: string,
    conversationId: string,
    text: string,
    candidates: FaqCandidate[],
    account?: AccountSnapshot,
  ) {
    const snap = account ?? (await this.buildAccountSnapshot(userId));

    const history = await this.prisma.coachMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { role: true, content: true },
    });

    const rag = rankFaq(text, candidates, 4).filter((r) => r.score >= 0.2);
    const knowledge = rag.length
      ? rag
          .map((r, i) => `[KB${i + 1} · ${r.category}] ${r.answerBody}`)
          .join('\n')
      : 'No close knowledge snippets.';

    const systemPrompt = `You are Profytron Alpha Coach — a sharp trading-desk coach.

Rules:
- ALWAYS ground answers in the CONNECTED ACCOUNT snapshot when it exists (open trades, WR, P&L, drawdown, broker). Cite those numbers.
- Lead with the direct play: concrete next steps (1-2-3).
- Be specific: lots, SL relative to structure/ATR, session timing, correlation cuts.
- Do NOT invent live prices. Do NOT dump compliance lectures or “educational only” disclaimers.
- Max 6 short sentences or a tight bullet list.
- If no broker/trades, say that once, then still give a usable playbook.
- If they need a human: Chat with Executive.`;

    const openLines = snap.openTrades.length
      ? snap.openTrades
          .map(
            (t) =>
              `- ${t.symbol} ${t.direction} ${t.volume} lots @ ${t.openPrice}` +
              `${t.stopLoss != null ? ` SL ${t.stopLoss}` : ''}` +
              `${t.takeProfit != null ? ` TP ${t.takeProfit}` : ''}` +
              ` P&L ${t.profit != null ? (t.profit >= 0 ? '+' : '') + t.profit.toFixed(2) : 'n/a'}`,
          )
          .join('\n')
      : '- none';

    const closedLines = snap.closedSample.length
      ? snap.closedSample
          .map(
            (t) =>
              `- ${t.symbol} ${t.direction} ${t.volume} → ${
                t.profit != null
                  ? (t.profit >= 0 ? '+' : '') + t.profit.toFixed(2)
                  : 'n/a'
              }`,
          )
          .join('\n')
      : '- none in last 30d sample';

    const accountCtx = `CONNECTED ACCOUNT
${snap.summaryLine}
Open positions:
${openLines}
Recent closed (sample):
${closedLines}`;

    const historyCtx = history
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `${accountCtx}

Curated knowledge:
${knowledge}

Recent chat:
${historyCtx}

User: ${text}`;

    return { systemPrompt, prompt };
  }

  /**
   * Streaming send: persists user message, streams Gemini tokens via callback,
   * then persists the final assistant message.
   */
  async sendMessageStream(
    userId: string,
    conversationId: string,
    content: string,
    onEvent: (event: {
      type: 'user' | 'token' | 'done' | 'error' | 'faq';
      message?: unknown;
      text?: string;
    }) => void,
  ) {
    const text = content?.trim();
    if (!text) throw new BadRequestException('Message is required');
    if (text.length > 2000) {
      throw new BadRequestException('Message must be 2000 characters or fewer');
    }

    const conversation = await this.prisma.coachConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const userMessage = await this.prisma.coachMessage.create({
      data: {
        conversationId,
        role: CoachMessageRole.USER,
        source: CoachMessageSource.SYSTEM,
        content: text,
        senderId: userId,
      },
    });

    if (
      conversation.title === 'New coaching session' ||
      /^Coach · /.test(conversation.title)
    ) {
      await this.prisma.coachConversation.update({
        where: { id: conversationId },
        data: { title: text.slice(0, 60), updatedAt: new Date() },
      });
    } else {
      await this.prisma.coachConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    onEvent({ type: 'user', message: userMessage });
    this.gateway.emitToUser(userId, 'message', {
      conversationId,
      message: userMessage,
    });

    const greeting = this.greetingReply(text);
    if (greeting) {
      const assistantMessage = await this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.SYSTEM,
          content: greeting,
        },
      });
      onEvent({ type: 'faq', message: assistantMessage, text: greeting });
      onEvent({ type: 'done', message: assistantMessage, text: greeting });
      this.gateway.emitToUser(userId, 'message', {
        conversationId,
        message: assistantMessage,
      });
      return { userMessage, assistantMessage };
    }

    const candidates = await this.loadFaqCandidates();
    const account = await this.buildAccountSnapshot(userId);
    const preferAi = this.shouldPreferAccountAi(text, account);
    const faqHit = preferAi ? null : matchFaq(text, candidates, 0.55);
    if (faqHit) {
      const content = this.withAccountAppendix(faqHit.answerBody, account);
      const assistantMessage = await this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.FAQ,
          content,
          faqAnswerId: faqHit.answerId,
        },
      });
      onEvent({ type: 'faq', message: assistantMessage, text: content });
      onEvent({ type: 'done', message: assistantMessage, text: content });
      this.gateway.emitToUser(userId, 'message', {
        conversationId,
        message: assistantMessage,
      });
      return { userMessage, assistantMessage };
    }

    const { systemPrompt, prompt } = await this.buildAiPrompt(
      userId,
      conversationId,
      text,
      candidates,
      account,
    );

    let assembled = '';
    try {
      for await (const chunk of this.aiService.streamCoachReply(
        systemPrompt,
        prompt,
        700,
      )) {
        if (chunk.type === 'token' && chunk.text) {
          assembled += chunk.text;
          onEvent({ type: 'token', text: chunk.text });
        } else if (chunk.type === 'done' && chunk.text) {
          assembled = chunk.text;
        } else if (chunk.type === 'error') {
          throw new Error(chunk.text || 'stream error');
        }
      }
    } catch (err: any) {
      this.logger.error(`Stream coach failed: ${err.message}`);
      onEvent({
        type: 'error',
        text: err.message || 'AI unavailable',
      });
      const assistantMessage = await this.prisma.coachMessage.create({
        data: {
          conversationId,
          role: CoachMessageRole.ASSISTANT,
          source: CoachMessageSource.SYSTEM,
          content:
            'Alpha Coach could not reach Gemini just now. Tap retry, or Chat with Executive.',
        },
      });
      onEvent({ type: 'done', message: assistantMessage, text: assistantMessage.content });
      return { userMessage, assistantMessage };
    }

    const assistantMessage = await this.prisma.coachMessage.create({
      data: {
        conversationId,
        role: CoachMessageRole.ASSISTANT,
        source: CoachMessageSource.AI,
        content: assembled,
      },
    });
    onEvent({ type: 'done', message: assistantMessage, text: assembled });
    this.gateway.emitToUser(userId, 'message', {
      conversationId,
      message: assistantMessage,
    });
    return { userMessage, assistantMessage };
  }

  async escalate(userId: string, conversationId: string) {
    const conversation = await this.prisma.coachConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const existing = await this.prisma.coachEscalation.findFirst({
      where: {
        conversationId,
        status: { in: [CoachEscalationStatus.OPEN, CoachEscalationStatus.CLAIMED] },
      },
      include: {
        claimedBy: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
    if (existing) {
      return existing;
    }

    const slaDeadline = new Date(Date.now() + 15 * 60 * 1000);

    const [escalation] = await this.prisma.$transaction([
      this.prisma.coachEscalation.create({
        data: {
          conversationId,
          userId,
          status: CoachEscalationStatus.OPEN,
          slaDeadline,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          conversation: { select: { id: true, title: true } },
          claimedBy: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.coachConversation.update({
        where: { id: conversationId },
        data: { status: CoachConversationStatus.ESCALATED },
      }),
    ]);

    // Notify admins + user wait UI in real time — no system chat bubble for the trader.
    this.gateway.emitToAdmins('escalation:new', escalation);
    this.gateway.emitToUser(userId, 'escalation:new', escalation);

    return escalation;
  }

  async listEscalations(status?: CoachEscalationStatus) {
    return this.prisma.coachEscalation.findMany({
      where: status
        ? { status }
        : {
            status: {
              in: [CoachEscalationStatus.OPEN, CoachEscalationStatus.CLAIMED],
            },
          },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        claimedBy: { select: { id: true, fullName: true } },
        conversation: {
          select: {
            id: true,
            title: true,
            status: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, createdAt: true, role: true },
            },
          },
        },
      },
    });
  }

  async claimEscalation(adminId: string, escalationId: string) {
    const escalation = await this.prisma.coachEscalation.findUnique({
      where: { id: escalationId },
    });
    if (!escalation) throw new NotFoundException('Escalation not found');
    if (escalation.status === CoachEscalationStatus.RESOLVED) {
      throw new BadRequestException('Escalation already resolved');
    }

    const updated = await this.prisma.coachEscalation.update({
      where: { id: escalationId },
      data: {
        status: CoachEscalationStatus.CLAIMED,
        claimedById: adminId,
        claimedAt: new Date(),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        conversation: { select: { id: true, title: true } },
        claimedBy: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    this.gateway.emitToAdmins('escalation:claimed', updated);
    this.gateway.emitToUser(escalation.userId, 'escalation:claimed', updated);
    return updated;
  }

  async adminReply(
    adminId: string,
    escalationId: string,
    content: string,
  ) {
    const text = content?.trim();
    if (!text) throw new BadRequestException('Message is required');
    if (text.length > 4000) {
      throw new BadRequestException('Message too long');
    }

    const escalation = await this.prisma.coachEscalation.findUnique({
      where: { id: escalationId },
    });
    if (!escalation) throw new NotFoundException('Escalation not found');
    if (escalation.status === CoachEscalationStatus.RESOLVED) {
      throw new BadRequestException('Escalation already resolved');
    }

    if (
      escalation.status === CoachEscalationStatus.OPEN ||
      escalation.claimedById !== adminId
    ) {
      await this.prisma.coachEscalation.update({
        where: { id: escalationId },
        data: {
          status: CoachEscalationStatus.CLAIMED,
          claimedById: adminId,
          claimedAt: escalation.claimedAt ?? new Date(),
        },
      });
    }

    const message = await this.prisma.coachMessage.create({
      data: {
        conversationId: escalation.conversationId,
        role: CoachMessageRole.EXECUTIVE,
        source: CoachMessageSource.HUMAN,
        content: text,
        senderId: adminId,
      },
    });

    await this.prisma.coachConversation.update({
      where: { id: escalation.conversationId },
      data: { updatedAt: new Date() },
    });

    const payload = {
      conversationId: escalation.conversationId,
      escalationId,
      message,
    };
    this.gateway.emitToUser(escalation.userId, 'message', payload);
    this.gateway.emitToUser(escalation.userId, 'escalation:reply', payload);
    this.gateway.emitToConversation(escalation.conversationId, 'message', payload);
    this.gateway.emitToAdmins('escalation:reply', payload);

    return message;
  }

  async resolveEscalation(adminId: string, escalationId: string) {
    const escalation = await this.prisma.coachEscalation.findUnique({
      where: { id: escalationId },
    });
    if (!escalation) throw new NotFoundException('Escalation not found');

    const [updated, systemMsg] = await this.prisma.$transaction([
      this.prisma.coachEscalation.update({
        where: { id: escalationId },
        data: {
          status: CoachEscalationStatus.RESOLVED,
          claimedById: escalation.claimedById || adminId,
          resolvedAt: new Date(),
        },
      }),
      this.prisma.coachMessage.create({
        data: {
          conversationId: escalation.conversationId,
          role: CoachMessageRole.SYSTEM,
          source: CoachMessageSource.SYSTEM,
          content: 'Executive chat resolved. You can continue with Alpha Coach anytime.',
        },
      }),
      this.prisma.coachConversation.update({
        where: { id: escalation.conversationId },
        data: { status: CoachConversationStatus.ACTIVE },
      }),
    ]);

    this.gateway.emitToUser(escalation.userId, 'message', {
      conversationId: escalation.conversationId,
      message: systemMsg,
    });
    this.gateway.emitToUser(escalation.userId, 'escalation:resolved', updated);
    this.gateway.emitToAdmins('escalation:resolved', updated);

    return updated;
  }

  /** Admin can load any conversation for an escalation. */
  async getConversationForAdmin(conversationId: string) {
    const conversation = await this.prisma.coachConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 300 },
        escalations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
  }
}
