import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export type FaqSeedGroup = {
  category: string;
  answer: string;
  questions: string[];
};

const PREFIXES = ['', 'how do i ', 'what is ', 'tell me about ', 'help with '];

const SUFFIXES = ['', '?', ' in profytron'];

const CORE_GROUPS: Array<{
  category: string;
  answer: string;
  bases: string[];
}> = [
  {
    category: 'product',
    answer:
      'Profytron is a trading OS for bots, copy trading, risk coaching, and portfolio analytics. Alpha Coach reviews your account context and helps you improve process — it is educational, not financial advice.',
    bases: [
      'profytron',
      'what is profytron',
      'profytron trading os',
      'alpha coach',
      'what does alpha coach do',
      'how does alpha coach work',
      'is alpha coach free',
      'profytron features',
      'trading os overview',
    ],
  },
  {
    category: 'risk',
    answer:
      'Playbook: risk 0.5% of equity per idea. Lot size = (equity × 0.005) ÷ (stop distance × pip/point value). Cap 2 correlated positions. After 2 losses in a row, cut size 50% for the next 3 trades — then resume normal size only if those 3 are clean.',
    bases: [
      'risk management',
      'position sizing',
      'how much risk per trade',
      'risk per trade',
      'overleveraging',
      'how to size positions',
      'account risk rules',
      'risk of ruin',
      'max risk',
      'analyze exposure',
    ],
  },
  {
    category: 'risk',
    answer:
      'Drawdown fix: (1) flatten or hedge the worst correlated book, (2) cut size to 25–50% until equity recovers half the DD, (3) only take A+ setups with predefined SL before entry. No “make it back” trades — schedule is more important than revenge.',
    bases: [
      'drawdown',
      'max drawdown',
      'how to reduce drawdown',
      'drawdown alert',
      'recovering from drawdown',
      'high drawdown',
      'equity curve down',
      'review drawdown',
    ],
  },
  {
    category: 'stops',
    answer:
      'SL/TP playbook: put SL past the invalidation candle/structure (or 1× ATR beyond), never a random dollar stop. TP1 at 1R, trail or scale at 1.5–2R. If price tags +1R, move SL to breakeven. Never widen a losing stop after entry — only tighten or exit.',
    bases: [
      'stop loss',
      'optimize stop loss',
      'where to place stop',
      'take profit',
      'tp and sl',
      'trailing stop',
      'stop too tight',
      'widen stop loss',
    ],
  },
  {
    category: 'bots',
    answer:
      'Bot checklist: (1) paper or 0.01 lots for 20+ trades, (2) max DD ≤ your account rule, (3) symbols match your broker feed, (4) kill-switch if DD hits your limit. If live WR drops >15 pts vs backtest for a week, pause and review — don’t keep averaging losers.',
    bases: [
      'validate bot',
      'how to test a bot',
      'my bots',
      'activate strategy',
      'bot not trading',
      'pause bot',
      'bot risk settings',
      'strategy subscription',
      'marketplace bots',
    ],
  },
  {
    category: 'copy',
    answer:
      'Copy trading mirrors a master with your risk overrides. Cap allocation, set max drawdown kill-switch, and review slippage/latency. You remain responsible for follower risk.',
    bases: [
      'copy trading',
      'how copy trading works',
      'follow a trader',
      'copy relationship',
      'copy slippage',
      'stop copying',
      'master trader',
      'follower allocation',
    ],
  },
  {
    category: 'accounts',
    answer:
      'Connect a broker or paper account under Connected Accounts. Paper mode is safest for learning. Live brokers require correct credentials and bridge/EA setup where applicable.',
    bases: [
      'connect broker',
      'paper account',
      'connected accounts',
      'link mt5',
      'link mt4',
      'broker connection failed',
      'default account',
      'switch trading account',
    ],
  },
  {
    category: 'wallet',
    answer:
      'Wallet holds platform balances for subscriptions and payouts. Deposits/withdrawals follow KYC and payment rails configured for your region. Check Wallet and Subscription pages for status.',
    bases: [
      'wallet',
      'deposit funds',
      'withdraw money',
      'subscription payment',
      'billing',
      'payment failed',
      'refund',
      'invoice',
    ],
  },
  {
    category: 'psychology',
    answer:
      'Trading psychology: pre-define rules, trade the plan, journal emotions after sessions, and take breaks after losses. Alpha Coach can review patterns — escalate to an executive if you need human support.',
    bases: [
      'trading psychology',
      'revenge trading',
      'fomo',
      'fear of missing out',
      'overtrading',
      'emotional trading',
      'discipline',
      'tilt',
    ],
  },
  {
    category: 'markets',
    answer:
      'Exposure check: list open pairs + direction. If 2+ are USD-driven the same way, cut the weakest to 50% size or flatten one. Prefer one theme (e.g. USD short) over scatter. Cap total risk across opens at ~2% equity until the book is clean.',
    bases: [
      'market regime',
      'trending market',
      'ranging market',
      'volatile market',
      'check correlation',
      'portfolio exposure',
      'correlation risk',
      'net exposure',
    ],
  },
  {
    category: 'support',
    answer:
      'If Alpha Coach answers are not enough, tap Chat with Executive. An admin will join this conversation in real time. For account/billing issues, include your email and a short summary.',
    bases: [
      'talk to human',
      'chat with executive',
      'speak to admin',
      'human support',
      'escalate to support',
      'not happy with ai',
      'real person help',
      'customer support',
    ],
  },
  {
    category: 'product',
    answer:
      'Leaderboard ranks verified performance metrics. Affiliate Program tracks referrals. Preferences control theme, language, and notifications. Use Overview for a daily operating snapshot.',
    bases: [
      'leaderboard',
      'affiliate program',
      'preferences',
      'notifications settings',
      'overview dashboard',
      'referral code',
      'achievements',
    ],
  },
  {
    category: 'execution',
    answer:
      'Slippage and latency affect fills. Prefer liquid sessions, avoid oversized market orders in thin books, and review trade history for repeated adverse slippage on a symbol.',
    bases: [
      'slippage',
      'latency',
      'bad fill',
      'execution quality',
      'partial fill',
      'order rejected',
      'trade failed',
    ],
  },
  {
    category: 'journal',
    answer:
      'Use the trading journal to log emotions, lessons, and screenshots. AI journal notes are separate from Alpha Coach chat history — both help improve process over time.',
    bases: [
      'trading journal',
      'journal entry',
      'log emotions',
      'ai journal analysis',
      'lessons learned',
    ],
  },
  {
    category: 'safety',
    answer:
      'Never share passwords, API secrets, or 2FA codes in chat. Profytron staff will not ask for them. Enable 2FA in security settings and keep broker credentials only in Connected Accounts.',
    bases: [
      'security',
      'two factor',
      '2fa',
      'phishing',
      'share password',
      'api key safety',
      'account hacked',
    ],
  },
  {
    category: 'plans',
    answer:
      'Subscription tiers unlock higher limits on bots, coaching depth, and platform features. Compare plans on the Subscription page. Free tier still gets Alpha Coach with FAQ + AI coaching.',
    bases: [
      'subscription tiers',
      'pro plan',
      'elite plan',
      'upgrade plan',
      'cancel subscription',
      'what plan am i on',
      'free vs pro',
    ],
  },
  {
    category: 'forex',
    answer:
      'Forex is trading currency pairs (e.g. EURUSD). Focus on session liquidity (London/NY), pip value, spreads, and correlation with USD strength. Always size with stop distance in pips, not gut feel.',
    bases: [
      'forex basics',
      'what is forex',
      'currency pairs',
      'eurusd',
      'pip value',
      'forex sessions',
      'london session',
      'new york session',
      'major pairs',
      'spread in forex',
    ],
  },
  {
    category: 'gold',
    answer:
      'XAUUSD playbook: trade London open / NY overlap first. Size for a wider stop (often 1.0–1.5× ATR) so you aren’t shaken out. Avoid stacking gold into high-impact USD/CPI/FOMC candles. Scale out at 1R, trail the rest — don’t “set and forget” with a tight fixed stop.',
    bases: [
      'gold trading',
      'xauusd',
      'xau usd',
      'trade gold',
      'gold volatility',
      'gold stop loss',
      'gold news',
      'how to trade xauusd',
      'gold during nfp',
      'explain xauusd risk',
    ],
  },
  {
    category: 'technical',
    answer:
      'Technical analysis studies price structure: trend, support/resistance, momentum, and volume/context. Prefer confluence over single indicators. Define invalidation before entry.',
    bases: [
      'technical analysis',
      'support and resistance',
      'trendline',
      'moving average',
      'rsi indicator',
      'macd',
      'candlestick patterns',
      'breakout trading',
      'chart timeframe',
    ],
  },
  {
    category: 'fundamental',
    answer:
      'Fundamental analysis for FX/gold uses rates, inflation, employment, and geopolitics. Trade the reaction and liquidity after releases more than the headline itself. Reduce size into high-impact news.',
    bases: [
      'fundamental analysis',
      'economic calendar',
      'interest rates',
      'fed decision',
      'cpi inflation',
      'nfp trading',
      'news trading',
      'central bank',
    ],
  },
  {
    category: 'smc',
    answer:
      'Smart Money Concepts (SMC) focus on liquidity, order blocks, fair value gaps, and market structure shifts. Treat them as a framework — confirm with risk rules; do not chase every FVG.',
    bases: [
      'smart money concepts',
      'smc trading',
      'order block',
      'fair value gap',
      'fvg',
      'liquidity sweep',
      'bos choch',
      'market structure',
      'breaker block',
    ],
  },
  {
    category: 'ict',
    answer:
      'ICT concepts overlap SMC: killzones, liquidity pools, displacement, and PD arrays. Use them for timing and location, then enforce fixed risk. Journal which setups actually fit your stats.',
    bases: [
      'ict concepts',
      'ict trading',
      'killzone',
      'london killzone',
      'new york killzone',
      'optimal trade entry',
      'ote',
      'premium discount array',
      'judas swing',
    ],
  },
  {
    category: 'mt5',
    answer:
      'In MT5: check AutoTrading, Expert Advisors permissions, symbol suffixes, and account type. On Profytron, connect MT5 via Connected Accounts / bridge EA and confirm the default account is selected.',
    bases: [
      'mt5 usage',
      'how to use mt5',
      'mt5 autotrading',
      'expert advisor',
      'ea not trading',
      'mt5 symbol suffix',
      'mt5 connection',
      'install ea',
      'mt5 history',
    ],
  },
  {
    category: 'builder',
    answer:
      'Strategy Builder lets you compose rules visually, then compile/backtest before publish. Start simple (entry + SL/TP + filter), validate on paper, then subscribe from Marketplace if listed.',
    bases: [
      'strategy builder',
      'bot builder',
      'build a strategy',
      'compile strategy',
      'backtest strategy',
      'publish strategy',
      'builder nodes',
    ],
  },
  {
    category: 'marketplace',
    answer:
      'Marketplace lists creator strategies with stats. Review drawdown, sample size, and risk level before subscribe. You can pause or cancel from My Bots / subscriptions anytime.',
    bases: [
      'marketplace',
      'browse strategies',
      'subscribe strategy',
      'strategy rating',
      'creator bot',
      'marketplace fees',
      'unsubscribe strategy',
    ],
  },
  {
    category: 'ai_trading',
    answer:
      'AI-assisted trading on Profytron means coaching, explanations, and risk nudges — not autopilot guarantees. Alpha Coach uses Gemini with curated knowledge; you still own entries, size, and exits.',
    bases: [
      'ai assisted trading',
      'ai trading',
      'gemini coach',
      'does ai trade for me',
      'ai signals',
      'automated ai bot',
      'trust ai coach',
    ],
  },
  {
    category: 'sizing',
    answer:
      'Position size = (account risk $) / (stop distance in price units × pip/point value). Cap correlated exposure. After losses, cut size — do not increase to “get even.”',
    bases: [
      'lot size calculator',
      'how to calculate lot size',
      'position size formula',
      'risk reward ratio',
      '1 percent rule',
      'correlation exposure',
    ],
  },
];

function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function keywordsFrom(q: string): string[] {
  const stop = new Set([
    'a',
    'an',
    'the',
    'is',
    'are',
    'do',
    'does',
    'how',
    'what',
    'can',
    'you',
    'me',
    'i',
    'to',
    'of',
    'in',
    'on',
    'for',
    'with',
    'my',
    'please',
    'tell',
    'about',
    'help',
    'need',
    'explain',
  ]);
  return normalizeQuestion(q)
    .split(' ')
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, 12);
}

function expandBases(bases: string[]): string[] {
  const out = new Set<string>();
  for (const base of bases) {
    const clean = base.trim();
    for (const p of PREFIXES) {
      for (const s of SUFFIXES) {
        const q = `${p}${clean}${s}`.replace(/\s+/g, ' ').trim();
        if (q.length >= 6) out.add(q);
      }
    }
    out.add(`quick question about ${clean}`);
    out.add(`${clean} not working`);
  }
  return [...out];
}

export function buildCoachFaqSeedGroups(): FaqSeedGroup[] {
  return CORE_GROUPS.map((g) => ({
    category: g.category,
    answer: g.answer,
    questions: expandBases(g.bases),
  }));
}

export async function seedCoachFaq(prisma: PrismaClient): Promise<{
  answers: number;
  questions: number;
}> {
  await prisma.coachMessage.updateMany({ data: { faqAnswerId: null } });
  await prisma.coachFaqQuestion.deleteMany();
  await prisma.coachFaqAnswer.deleteMany();

  const groups = buildCoachFaqSeedGroups();
  let questionCount = 0;

  for (const group of groups) {
    const answerId = randomUUID();
    await prisma.coachFaqAnswer.create({
      data: {
        id: answerId,
        category: group.category,
        body: group.answer,
      },
    });

    const uniqueQs = [...new Set(group.questions.map((q) => q.trim()).filter(Boolean))];
    const rows = uniqueQs.map((question) => {
      const normalized = normalizeQuestion(question);
      return {
        id: randomUUID(),
        answerId,
        question,
        normalized,
        keywords: keywordsFrom(question),
      };
    });

    const chunk = 100;
    for (let i = 0; i < rows.length; i += chunk) {
      await prisma.coachFaqQuestion.createMany({ data: rows.slice(i, i + chunk) });
    }
    questionCount += rows.length;
  }

  return { answers: groups.length, questions: questionCount };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedCoachFaq(prisma);
    console.log(
      `Coach FAQ seeded: ${result.answers} answers, ${result.questions} questions`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

const invokedDirectly = process.argv[1]
  ? process.argv[1].replace(/\\/g, '/').includes('seed-coach-faq')
  : false;

if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
