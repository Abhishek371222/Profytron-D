import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface TelegramMessage {
  message_id: number;
  from: { id: number; first_name: string; username: string };
  chat: { id: number };
  text: string;
}

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  constructor(private prisma: PrismaService) {}

  private get apiBase() {
    return `https://api.telegram.org/bot${this.botToken}`;
  }

  async handleTelegramUpdate(update: any) {
    if (!update.message?.text) return;

    const msg = update.message as TelegramMessage;
    const command = msg.text.split(' ')[0];

    this.logger.log(`[TELEGRAM] User ${msg.from.username} sent: ${command}`);

    switch (command) {
      case '/start':
        return this.sendMessage(msg.chat.id, '👋 Welcome to <b>Profytron Bot</b>!\n\nUse /help to see available commands.');
      case '/balance':
        return this.handleBalance(msg.chat.id, msg.from.id);
      case '/trades':
        return this.handleTrades(msg.chat.id, msg.from.id);
      case '/close':
        return this.handleCloseTrade(msg.chat.id, msg.text, msg.from.id);
      case '/alerts':
        return this.handleAlerts(msg.chat.id, msg.from.id);
      case '/portfolio':
        return this.handlePortfolio(msg.chat.id, msg.from.id);
      case '/help':
        return this.sendHelp(msg.chat.id);
      default:
        return this.sendMessage(msg.chat.id, '❓ Unknown command. Use /help for available commands.');
    }
  }

  private async findUserByTelegramId(telegramId: number) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        eventType: 'TELEGRAM_USER_REGISTERED',
        detailsJson: { path: ['telegramChatId'], equals: telegramId },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!log) return null;
    if (!log.userId) return null;
    return this.prisma.user.findUnique({ where: { id: log.userId } });
  }

  private async handleBalance(chatId: number, telegramId: number) {
    const user = await this.findUserByTelegramId(telegramId);
    if (!user) {
      return this.sendMessage(chatId, '⚠️ Account not linked. Please link your Telegram in the app settings.');
    }

    const wallet = await (this.prisma as any).wallet.findUnique({ where: { userId: user.id } });
    const balance = wallet?.balance ?? 0;
    const equity = wallet?.equity ?? balance;

    const message = `💰 <b>Account Balance</b>\n\nBalance: $${balance.toFixed(2)}\nEquity: $${equity.toFixed(2)}\nFree Margin: $${(equity * 0.9).toFixed(2)}`;
    return this.sendMessage(chatId, message);
  }

  private async handleTrades(chatId: number, telegramId: number) {
    const user = await this.findUserByTelegramId(telegramId);
    if (!user) {
      return this.sendMessage(chatId, '⚠️ Account not linked. Please link your Telegram in the app settings.');
    }

    const trades = await this.prisma.trade.findMany({
      where: { userId: user.id, status: 'OPEN' },
      take: 5,
      orderBy: { openedAt: 'desc' },
    });

    if (!trades.length) {
      return this.sendMessage(chatId, '📊 <b>Open Trades</b>\n\nNo open trades at this time.');
    }

    const lines = trades.map((t, i) =>
      `${i + 1}. ${t.symbol} - ${t.direction}\n   Entry: ${t.openPrice}\n   P&L: ${t.profit !== null ? (t.profit >= 0 ? '+' : '') + t.profit.toFixed(2) : 'N/A'}`
    );

    return this.sendMessage(chatId, `📊 <b>Open Trades</b>\n\n${lines.join('\n\n')}`);
  }

  private async handleCloseTrade(chatId: number, text: string, telegramId: number) {
    const user = await this.findUserByTelegramId(telegramId);
    if (!user) {
      return this.sendMessage(chatId, '⚠️ Account not linked. Please link your Telegram in the app settings.');
    }

    const parts = text.split(' ');
    if (parts.length < 2) {
      return this.sendMessage(chatId, '❌ Usage: /close &lt;tradeId&gt;\nExample: /close abc123');
    }

    return this.sendMessage(chatId, '⚠️ Trade closure must be performed via the Profytron app for security reasons.');
  }

  private async handleAlerts(chatId: number, telegramId: number) {
    const user = await this.findUserByTelegramId(telegramId);
    if (!user) {
      return this.sendMessage(chatId, '⚠️ Account not linked.');
    }

    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id, isRead: false },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (!notifications.length) {
      return this.sendMessage(chatId, '🔔 <b>Recent Alerts</b>\n\nNo unread alerts.');
    }

    const lines = notifications.map((n) => `• ${n.title}: ${n.body}`);
    return this.sendMessage(chatId, `🔔 <b>Recent Alerts</b>\n\n${lines.join('\n')}`);
  }

  private async handlePortfolio(chatId: number, telegramId: number) {
    const user = await this.findUserByTelegramId(telegramId);
    if (!user) {
      return this.sendMessage(chatId, '⚠️ Account not linked.');
    }

    const trades = await this.prisma.trade.findMany({
      where: { userId: user.id, status: 'CLOSED' },
      take: 50,
    });

    const totalPnl = trades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
    const winning = trades.filter((t) => (t.profit ?? 0) > 0).length;
    const winRate = trades.length ? ((winning / trades.length) * 100).toFixed(1) : '0.0';

    const message = `📈 <b>Portfolio Summary</b>\n\nTotal P&L: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}\nWin Rate: ${winRate}%\nTotal Trades: ${trades.length}`;
    return this.sendMessage(chatId, message);
  }

  private async sendHelp(chatId: number) {
    const message = `🤖 <b>Profytron Bot Commands</b>\n\n/balance — Account balance\n/trades — Open trades\n/alerts — Recent unread alerts\n/portfolio — Portfolio summary\n/help — Show this message`;
    return this.sendMessage(chatId, message);
  }

  async sendMessage(chatId: number, text: string, parseMode = 'HTML') {
    if (!this.botToken) {
      this.logger.warn('[TELEGRAM] No bot token configured — message not sent');
      return { ok: false, error: 'No token' };
    }

    try {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
      });
      const data = await res.json() as any;
      if (!data.ok) {
        this.logger.warn(`[TELEGRAM] API error: ${JSON.stringify(data)}`);
      }
      return data;
    } catch (err: any) {
      this.logger.error(`[TELEGRAM] Network error: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  async sendAlertToUser(userId: string, title: string, message: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: { eventType: 'TELEGRAM_USER_REGISTERED', userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      this.logger.debug(`[TELEGRAM] No Telegram linked for user ${userId}`);
      return { sent: false };
    }

    const details = log.detailsJson as any;
    const chatId = details?.telegramChatId;
    if (!chatId) return { sent: false };

    await this.sendMessage(chatId, `🔔 <b>${title}</b>\n\n${message}`);
    return { sent: true };
  }

  async sendTradeAlert(userId: string, trade: any) {
    const pnlText = trade.profit !== undefined ? `\nP&L: ${trade.profit >= 0 ? '+' : ''}$${trade.profit}` : '';
    const message = `🚀 <b>Trade ${trade.status === 'CLOSED' ? 'Closed' : 'Opened'}</b>\n\nSymbol: ${trade.symbol}\nDirection: ${trade.direction}\nVolume: ${trade.volume}\nEntry: ${trade.openPrice}${pnlText}`;
    return this.sendAlertToUser(userId, 'Trade Alert', message);
  }

  async registerTelegramUser(userId: string, telegramChatId: number, telegramUsername: string) {
    this.logger.log(`[TELEGRAM] Registering user ${userId} with chat ${telegramChatId}`);

    await this.prisma.auditLog.create({
      data: {
        eventType: 'TELEGRAM_USER_REGISTERED',
        userId,
        detailsJson: { telegramChatId, telegramUsername },
        triggeredBy: userId,
      },
    });

    await this.sendMessage(telegramChatId, `✅ <b>Account linked!</b>\n\nYour Profytron account is now connected. Use /help to see commands.`);
    return { success: true };
  }
}
