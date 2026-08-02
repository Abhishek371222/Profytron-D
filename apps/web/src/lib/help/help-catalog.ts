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

export const HELP_FAQ_ENTRIES: HelpFaqEntry[] = [
  {
    id: 'what-is-profytron',
    category: 'getting-started',
    tags: ['product', 'overview'],
    question: 'What is Profytron?',
    answer:
      'Profytron is a bots-first platform for automated trading on the forex market. Connect MT4/MT5 brokers, deploy marketplace forex bots, set risk limits, and monitor execution and analytics from one workspace.',
  },
  {
    id: 'markets-platforms',
    category: 'trading',
    tags: ['forex', 'mt4', 'mt5'],
    question: 'Which markets and platforms are supported?',
    answer:
      'Profytron focuses on the forex market through your MT4/MT5 broker: currency pairs, metals such as XAUUSD, and other instruments your broker offers. You can paper trade first, then connect MetaTrader 4 or MetaTrader 5 for live automation.',
  },
  {
    id: 'how-bots-work',
    category: 'strategies',
    tags: ['bots', 'automation'],
    question: 'How do forex trading bots work on Profytron?',
    answer:
      'You connect a broker (or paper account), pick a marketplace bot or strategy, set risk limits, then the execution engine places trades into your own MT4/MT5 account. You control drawdown limits and sizing from the dashboard while the bot runs.',
  },
  {
    id: 'funds-custody',
    category: 'security',
    tags: ['custody', 'safety'],
    question: 'Is my money safe? Where are my funds held?',
    answer:
      'Profytron never holds your funds. Capital stays in your own forex broker account — we connect with scoped API access to execute. You retain custody at all times. Profytron is SaaS automation software, not a broker or fund manager.',
  },
  {
    id: 'what-is-alpha-coach',
    category: 'alpha-coach',
    tags: ['coach', 'ai'],
    question: 'What is Alpha Coach?',
    answer:
      'Alpha Coach reviews trade behaviour — timing, risk-reward patterns, and session context — and surfaces plain-English feedback after sessions so you can improve rules and risk discipline around automated forex bots.',
  },
  {
    id: 'data-security',
    category: 'security',
    tags: ['encryption', '2fa'],
    question: 'How is my trading data secured?',
    answer:
      'Credentials are encrypted at rest (AES-256), transit uses TLS, and broker passwords sit in encrypted vaults — never plaintext. 2FA via TOTP is available. Infrastructure runs on hardened cloud providers with encrypted backups.',
  },
  {
    id: 'pricing-plans',
    category: 'billing',
    tags: ['pricing', 'plans'],
    question: 'What are the pricing plans?',
    answer:
      'Plans range from Free paper trading through paid tiers for live MT5 bot capacity, analytics, and support. Exact prices and limits are always shown on the pricing page and checkout before you pay.',
  },
  {
    id: 'free-trial',
    category: 'billing',
    tags: ['trial'],
    question: 'Is there a free trial?',
    answer:
      'Yes. Paid plans include a trial window, and Free paper trading lets you test bot behaviour without a subscription. Checkout screens show any payment requirement before a paid plan starts.',
  },
  {
    id: 'cancel-anytime',
    category: 'billing',
    tags: ['cancel', 'subscription'],
    question: 'Can I cancel anytime?',
    answer:
      'Yes. Cancel from billing settings; access continues until the end of the current billing period. No cancellation fees. Refund eligibility is described in your plan terms and support FAQ.',
  },
  {
    id: 'marketplace',
    category: 'marketplace',
    tags: ['marketplace', 'subscribe'],
    question: 'What is the Strategy Marketplace?',
    answer:
      'Creators list verified algorithmic forex strategies and bots. Listings show track-record metrics such as win rate, drawdown, and returns derived from broker-linked activity where verification rules apply. Subscribe and deploy on your connected account.',
  },
  {
    id: 'risk-engine',
    category: 'risk',
    tags: ['risk', 'drawdown'],
    question: 'What is the AI Risk Engine?',
    answer:
      'It monitors portfolio drawdown and risk rules you configure. If limits are breached, it can pause bot trading and optional close logic. It can also respond to volatility spikes. You set thresholds; the engine enforces them without emotion.',
  },
  {
    id: 'vps-bots',
    category: 'trading',
    tags: ['vps', 'uptime'],
    question: 'Why use a VPS with forex bots?',
    answer:
      'A VPS keeps MT4/MT5 bots online 24/5 even when your PC is off — critical for forex sessions across time zones. Missed exits from downtime often hurt more than missed entries.',
  },
  {
    id: 'crypto-exchanges',
    category: 'trading',
    tags: ['crypto'],
    question: 'Does Profytron support crypto-native exchanges?',
    answer:
      'Core path today is broker-connected forex/CFD automation on MT4/MT5. Exchange-native crypto stack is not the primary product; check docs for current integrations.',
  },
  {
    id: 'get-started',
    category: 'getting-started',
    tags: ['onboarding'],
    question: 'How do I get started?',
    answer:
      'Sign up free, start paper trading or connect MT4/MT5, pick a forex marketplace bot, set risk limits, then go live carefully. Docs and onboarding walk you through each step.',
  },
  {
    id: 'connect-broker',
    category: 'brokers',
    tags: ['broker', 'mt5'],
    question: 'How do I connect a broker?',
    answer:
      'Open Connected Accounts, choose your broker from the directory, enter MT4/MT5 credentials or paper mode, then return to Get Bots or Marketplace to deploy. See the brokers hub for spread and region notes.',
  },
  {
    id: 'coach-empty',
    category: 'alpha-coach',
    tags: ['coach', 'sessions'],
    question: 'Why does Alpha Coach say connect an account?',
    answer:
      'Coach can answer general trading questions without a broker. For live book coaching (open trades, win rate, drawdown), connect MT4/MT5 or paper under Connected Accounts so explainability tools can read your account context.',
  },
  {
    id: 'support-ticket',
    category: 'support',
    tags: ['support', 'ticket'],
    question: 'How do I contact support?',
    answer:
      'Open a ticket from Settings → Support, email support@profytron.com, or join Discord via Community. System-wide incidents are listed on the Status page.',
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
