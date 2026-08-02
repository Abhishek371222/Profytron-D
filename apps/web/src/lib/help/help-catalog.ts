/**
 * Help Center catalog — category navigation + searchable FAQ.
 * CMS/API ready: shapes stay pure data (no React).
 */

import type { FaqItem } from '@/components/seo/JsonLd';

export type HelpCategoryId =
  | 'getting-started'
  | 'account'
  | 'trading'
  | 'strategies'
  | 'marketplace'
  | 'billing'
  | 'risk'
  | 'brokers'
  | 'alpha-coach'
  | 'analytics'
  | 'security'
  | 'api'
  | 'support'
  | 'status'
  | 'legal';

export type HelpSection = {
  id: HelpCategoryId;
  title: string;
  description: string;
  links: { label: string; href: string; external?: boolean }[];
};

export type HelpFaqEntry = FaqItem & {
  id: string;
  category: HelpCategoryId;
  tags: string[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Sign up, paper trade, and deploy your first bot.',
    links: [
      { label: 'Create account', href: '/register' },
      { label: 'Onboarding', href: '/onboarding' },
      { label: 'Product docs', href: '/docs' },
      { label: 'Guides', href: '/guides' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Profile, email verification, and security settings.',
    links: [
      { label: 'Settings', href: '/settings' },
      { label: 'Security / API keys', href: '/settings/api-keys' },
      { label: 'Verify email', href: '/verify-email' },
    ],
  },
  {
    id: 'trading',
    title: 'Trading',
    description: 'Live desk, history, and positions.',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Markets', href: '/markets' },
      { label: 'Trade history', href: '/history' },
    ],
  },
  {
    id: 'strategies',
    title: 'Strategies',
    description: 'Your bots and strategy builder.',
    links: [
      { label: 'My bots', href: '/my-bots' },
      { label: 'Strategies', href: '/strategies' },
      { label: 'Creator studio', href: '/creator' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Discover and subscribe to listed bots.',
    links: [
      { label: 'Browse marketplace', href: '/marketplace' },
      { label: 'Get bots', href: '/get-bots' },
      { label: 'Leaderboard', href: '/leaderboard' },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & subscriptions',
    description: 'Plans, trials, wallet, and invoices.',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'Billing', href: '/billing' },
      { label: 'Wallet', href: '/wallet' },
    ],
  },
  {
    id: 'risk',
    title: 'Risk management',
    description: 'Limits, drawdown guards, and risk analytics.',
    links: [
      { label: 'Risk analytics', href: '/analytics/risk' },
      { label: 'Docs: risk', href: '/docs' },
    ],
  },
  {
    id: 'brokers',
    title: 'Broker connections',
    description: 'MT4/MT5 and paper account linking.',
    links: [
      { label: 'Connected accounts', href: '/connected-accounts' },
      { label: 'Broker directory', href: '/brokers' },
    ],
  },
  {
    id: 'alpha-coach',
    title: 'Alpha Coach',
    description: 'AI coaching sessions and explainability.',
    links: [
      { label: 'Open Alpha Coach', href: '/alpha-coach' },
      { label: 'Journal', href: '/journal' },
      { label: 'Community', href: '/community' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Performance and portfolio views.',
    links: [
      { label: 'Analytics hub', href: '/analytics' },
      { label: 'Risk', href: '/analytics/risk' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Credentials, 2FA path, and API keys.',
    links: [
      { label: 'API keys & security', href: '/settings/api-keys' },
      { label: 'Privacy policy', href: '/privacy' },
    ],
  },
  {
    id: 'api',
    title: 'API',
    description: 'Developer-facing API notes (where available).',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'API keys', href: '/settings/api-keys' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Tickets, contact, and human help.',
    links: [
      { label: 'Open a ticket', href: '/settings/support' },
      { label: 'Email support', href: 'mailto:support@profytron.com', external: true },
      { label: 'Community Discord', href: '/community' },
    ],
  },
  {
    id: 'status',
    title: 'Status',
    description: 'Live platform health.',
    links: [{ label: 'System status', href: '/status' }],
  },
  {
    id: 'legal',
    title: 'Legal',
    description: 'Terms and privacy.',
    links: [
      { label: 'Terms of service', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Risk disclosure', href: '/risk-disclosure' },
    ],
  },
];

/**
 * Final Help Center FAQ copy (Ishit content pack).
 * Restored as the approved long-form set after the Help foundation refactor
 * truncated answers to short stubs — wording preserved for production FAQs.
 */
export const HELP_FAQ_ENTRIES: HelpFaqEntry[] = [
  {
    id: 'what-is-profytron',
    category: 'getting-started',
    tags: ['product', 'overview', 'india'],
    question: 'What is Profytron and who is it built for?',
    answer:
      'Profytron is an institutional-grade algorithmic trading platform designed for Indian retail traders, HNIs, and proprietary desks. It combines AI-powered coaching, copy trading, a strategy marketplace, and real-time analytics — giving you the same tools that hedge funds use, without needing a quant team.',
  },
  {
    id: 'brokers-platforms',
    category: 'brokers',
    tags: ['mt4', 'mt5', 'metaapi', 'paper'],
    question: 'Which brokers and trading platforms are supported?',
    answer:
      'Profytron connects natively with MetaTrader 4 (MT4) and MetaTrader 5 (MT5) accounts via the MetaAPI cloud integration. Support for Binance, Bybit, KuCoin, and Interactive Brokers is on the roadmap. A built-in paper trading account is available for risk-free testing from day one.',
  },
  {
    id: 'copy-trading',
    category: 'trading',
    tags: ['copy trading', 'mirror', 'risk'],
    question: 'How does copy trading work on Profytron?',
    answer:
      "When you subscribe to a strategy, Profytron's execution engine mirrors eligible trades from the strategy source into your connected account. You can set your own risk parameters, including drawdown limits and position-size multipliers, while monitoring execution from your dashboard.",
  },
  {
    id: 'funds-custody',
    category: 'security',
    tags: ['custody', 'safety', 'funds'],
    question: 'Is my money safe? Where are my funds held?',
    answer:
      'Profytron never holds your funds. All capital stays in your own broker account — we only connect to execute trades on your behalf using read/write API access. You retain full custody of your money at all times. Our platform is a SaaS tool, not a broker or fund manager.',
  },
  {
    id: 'what-is-alpha-coach',
    category: 'alpha-coach',
    tags: ['coach', 'ai', 'feedback'],
    question: 'What is Alpha Coach and how does it help me?',
    answer:
      'Alpha Coach analyzes every trade you take — entry timing, risk-reward ratio, emotional patterns, and market context — and delivers plain-English feedback after each session. It identifies your strengths (e.g., excellent trend identification) and weaknesses (e.g., early exits on winning trades) and gives you a structured improvement plan.',
  },
  {
    id: 'data-security',
    category: 'security',
    tags: ['encryption', '2fa', 'tls'],
    question: 'How is my trading data and account secured?',
    answer:
      'Profytron uses AES-256 encryption for all stored credentials, TLS 1.3 for data in transit, and stores broker passwords in encrypted vaults — never in plaintext. Two-factor authentication (2FA) via TOTP authenticator apps is available. Our infrastructure runs on SOC 2-compliant cloud providers with daily encrypted backups.',
  },
  {
    id: 'pricing-plans',
    category: 'billing',
    tags: ['pricing', 'plans', 'inr'],
    question: 'What are the pricing plans and what do they include?',
    answer:
      'Profytron offers a Free plan for paper trading, Starter at ₹799/month, Pro at ₹999/month, and Business at ₹1,299/month. Enterprise deployments with white-label, colocation, or on-premise requirements use custom pricing. Annual billing and current plan limits are listed on the pricing page.',
  },
  {
    id: 'free-trial',
    category: 'billing',
    tags: ['trial', 'free'],
    question: 'Is there a free trial?',
    answer:
      'Yes. Paid plans include a 7-day trial, and the Free plan lets you explore paper trading without a subscription. The signup and checkout screens show any payment requirement before a paid plan begins.',
  },
  {
    id: 'cancel-anytime',
    category: 'billing',
    tags: ['cancel', 'subscription', 'refund'],
    question: 'Can I cancel my subscription at any time?',
    answer:
      "Yes, you can cancel any time from your billing settings. Your access continues until the end of the current billing period. We do not charge cancellation fees. If you cancel within 48 hours of being billed and haven't actively used copy trading, you can request a full refund via our support team.",
  },
  {
    id: 'marketplace',
    category: 'marketplace',
    tags: ['marketplace', 'strategies', 'subscribe'],
    question: 'What is the Strategy Marketplace?',
    answer:
      'The Strategy Marketplace is where verified strategy creators list their algorithmic trading strategies. Each listing shows a verified track record with real brokerage statements — win rate, Sharpe ratio, maximum drawdown, monthly returns, and subscriber count. You can subscribe to any strategy and start copy trading within minutes.',
  },
  {
    id: 'creator-earnings',
    category: 'marketplace',
    tags: ['creators', 'earnings', 'wallet'],
    question: 'How do strategy creators earn money?',
    answer:
      'Strategy creators earn 80% of every subscription fee paid by their followers. Profytron retains a 20% platform fee. Earnings accumulate in your Profytron wallet and can be withdrawn to your bank account weekly. Creators building a following of 50+ subscribers can earn ₹50,000–₹5,00,000+ per month passively.',
  },
  {
    id: 'strategy-verified',
    category: 'marketplace',
    tags: ['verified', 'track record'],
    question: "How is a strategy's performance verified?",
    answer:
      "Strategy performance is verified by connecting the creator's live MT4/MT5 account directly to Profytron. All trades are recorded in real time from the broker, not self-reported. The Profytron team additionally reviews performance data and tags strategies as 'Verified' only after a minimum 60-day live track record with consistent results.",
  },
  {
    id: 'risk-engine',
    category: 'risk',
    tags: ['risk', 'drawdown', 'kill switch'],
    question: 'What is the AI Risk Engine and how does it protect me?',
    answer:
      'The AI Risk Engine monitors your portfolio in real time and enforces the risk rules you set. If your account drawdown exceeds your limit, it automatically stops all copy trading and closes open positions. It also detects unusual volatility events (news spikes, flash crashes) and can pause trading temporarily. You set the thresholds — the engine enforces them without emotion.',
  },
  {
    id: 'strategy-builder',
    category: 'strategies',
    tags: ['builder', 'no-code', 'backtest'],
    question: 'What is the Strategy Builder?',
    answer:
      'The Strategy Builder is a visual, no-code editor where you can design your own trading strategies using a drag-and-drop node graph. Connect indicators (RSI, MACD, Bollinger Bands), conditions (if/else, crossovers), and actions (buy, sell, set stop loss) visually. Built strategies can be backtested on historical data and, once verified, listed on the marketplace.',
  },
  {
    id: 'mobile-pwa',
    category: 'getting-started',
    tags: ['mobile', 'pwa', 'notifications'],
    question: 'Can I use Profytron on my mobile phone?',
    answer:
      'Yes. Profytron is a Progressive Web App (PWA) optimized for mobile. Install it from your browser on iOS or Android and get an app-like experience with real-time push notifications for trade execution, drawdown alerts, and account milestones. A dedicated native app is in development.',
  },
  {
    id: 'analytics-suite',
    category: 'analytics',
    tags: ['analytics', 'sharpe', 'export'],
    question: 'What analytics does Profytron provide?',
    answer:
      'The analytics suite covers: equity curve visualization, win rate by symbol and session, drawdown analysis, trade duration distribution, risk-adjusted returns (Sharpe, Sortino), best/worst days and months, slippage tracking, and AI-generated insights. All charts are interactive, real-time, and exportable to PDF.',
  },
  {
    id: 'trading-journal',
    category: 'alpha-coach',
    tags: ['journal', 'psychology'],
    question: 'What is the Trading Journal?',
    answer:
      'The Trading Journal lets you attach notes, screenshots, and emotional tags to every trade. After each session, Alpha Coach analyzes your journal entries alongside trade data to detect psychological patterns — such as revenge trading after losses or position sizing inconsistency during high-volatility periods.',
  },
  {
    id: 'vps-hosting',
    category: 'trading',
    tags: ['vps', 'uptime', 'latency'],
    question: 'What is VPS hosting and why do I need it?',
    answer:
      "A VPS (Virtual Private Server) keeps your trading bots running 24/7 even when your computer is off. Profytron's VPS integration lets you deploy and manage your MT4/MT5 bots from the dashboard without any technical setup. Latency to major broker servers is under 5ms for faster order execution.",
  },
  {
    id: 'crypto-support',
    category: 'trading',
    tags: ['crypto', 'forex', 'mt5'],
    question: 'Does Profytron support cryptocurrency trading?',
    answer:
      'Profytron currently focuses on broker-connected Forex, commodities, and indices trading through MT4/MT5-compatible accounts. Broader exchange integrations may be added in the future; check the documentation for the current supported integrations.',
  },
  {
    id: 'kyc',
    category: 'account',
    tags: ['kyc', 'verification', 'withdrawals'],
    question: 'What is KYC and do I need to complete it?',
    answer:
      'KYC (Know Your Customer) verification is required to enable wallet withdrawals above ₹10,000 per day and to list strategies on the marketplace. The process takes 2–5 minutes: upload a government-issued ID (Aadhaar, PAN, Passport) and a selfie. Verification is completed within 24 hours by our compliance team.',
  },
  {
    id: 'payment-methods',
    category: 'billing',
    tags: ['payments', 'upi', 'stripe'],
    question: 'What payment methods are accepted?',
    answer:
      'We accept all major payment methods: UPI (PhonePe, Google Pay, Paytm), Debit/Credit Cards (Visa, Mastercard, RuPay), Net Banking, and Razorpay wallet. International payments are accepted via Stripe. All transactions are secured with 3D Secure authentication and PCI-DSS compliant payment gateways.',
  },
  {
    id: 'multiple-brokers',
    category: 'brokers',
    tags: ['broker', 'accounts', 'multi'],
    question: 'Can I have multiple broker accounts connected?',
    answer:
      "Yes. You can connect multiple MT4/MT5 accounts from different brokers simultaneously. Each account can be assigned a different strategy subscription with its own risk parameters. One account can be set as the 'master source' for your own copy trading setup.",
  },
  {
    id: 'affiliate-program',
    category: 'support',
    tags: ['affiliate', 'referrals', 'commission'],
    question: 'What is the Affiliate Program?',
    answer:
      'The Profytron Affiliate Program pays you 30% recurring commission on every subscription payment made by traders you refer — for the lifetime of their account. There are three tiers: Starter (0–10 referrals), Pro (11–50 referrals), and Elite (51+ referrals) with increasing commission rates and bonuses.',
  },
  {
    id: 'support-tiers',
    category: 'support',
    tags: ['support', 'email', 'priority'],
    question: 'What kind of support is available?',
    answer:
      'The Free plan includes community support, Starter includes email support, and Pro and Business include priority support options. Enterprise support and service levels are tailored to the deployment. The pricing page lists the current support entitlement for each plan.',
  },
  {
    id: 'get-started',
    category: 'getting-started',
    tags: ['onboarding', 'signup'],
    question: 'How do I get started on Profytron?',
    answer:
      'Sign up for free in under 2 minutes — no credit card required. Connect your MT4/MT5 broker account (or start with the built-in paper account), browse the strategy marketplace, and click Subscribe on any verified strategy. Your first copied trade can happen within 5 minutes of signing up. The onboarding flow guides you through each step.',
  },
  {
    id: 'api-access',
    category: 'api',
    tags: ['api', 'keys', 'integrations'],
    question: 'Is there an API or developer integration?',
    answer:
      'You can manage API keys under Settings → API keys for secured platform access where offered. Product docs cover integrations and limits. For Enterprise or custom integrations, contact support or sales via the Contact page.',
  },
  {
    id: 'coach-needs-account',
    category: 'alpha-coach',
    tags: ['coach', 'broker', 'context'],
    question: 'Why does Alpha Coach ask me to connect an account?',
    answer:
      'Alpha Coach can answer general product and trading questions without a linked broker. For live book coaching — open trades, win rate, drawdown, and journal-linked insights — connect MT4/MT5 or paper under Connected Accounts so coaching tools can read your account context.',
  },
  {
    id: 'contact-support',
    category: 'support',
    tags: ['ticket', 'discord', 'status'],
    question: 'How do I contact support?',
    answer:
      'Open a ticket from Settings → Support, email support@profytron.com, or join Discord via the Community page. System-wide incidents are listed on the Status page. Plan tier determines email vs priority support response targets (see Pricing).',
  },
];

/** Flat FAQ for JSON-LD / legacy imports */
export const FAQ_ITEMS: FaqItem[] = HELP_FAQ_ENTRIES.map(({ question, answer }) => ({
  question,
  answer,
}));

export const LANDING_FAQ_ITEMS = FAQ_ITEMS.slice(0, 8);

export function slugifyFaqId(id: string): string {
  return id.startsWith('faq-') ? id : `faq-${id}`;
}

export function searchHelpFaqs(
  query: string,
  category: HelpCategoryId | 'all' = 'all',
): HelpFaqEntry[] {
  const q = query.trim().toLowerCase();
  return HELP_FAQ_ENTRIES.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    const hay = `${item.question} ${item.answer} ${item.tags.join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}
