import { buildPageMetadata } from './metadata';

export const pageSeo = {
  home: buildPageMetadata({
    title: 'Profytron — Forex Trading Bots for MT4/MT5',
    description:
      'Deploy automated forex trading bots on MT4/MT5 with Profytron. Marketplace strategies, paper trading, AI risk limits, and broker connect. Built for the forex market — bots only.',
    path: '/',
    keywords: [
      'forex trading bots',
      'MT5 forex bots',
      'automated forex trading',
      'algo forex platform',
    ],
  }),
  pricing: buildPageMetadata({
    title: 'Pricing — Forex Bot Plans',
    description:
      'Profytron pricing for forex trading bots: start free with paper trading, upgrade for live MT5 bot execution, risk controls, and advanced analytics. Trial on paid plans.',
    path: '/pricing',
    keywords: ['forex bot pricing', 'MT5 bot subscription', 'automated trading platform pricing'],
  }),
  about: buildPageMetadata({
    title: 'About Us — Mission & Team',
    description:
      'Profytron builds infrastructure for automated forex trading bots — MT4/MT5 execution, marketplace strategies, and AI-assisted risk controls for the global forex market.',
    path: '/about',
    keywords: ['about Profytron', 'forex trading bots company', 'algo forex platform'],
  }),
  contact: buildPageMetadata({
    title: 'Contact Us — Sales & Support',
    description:
      'Contact Profytron for sales, partnerships, press, and customer support. We respond within 24 hours on business days.',
    path: '/contact',
    keywords: ['contact Profytron', 'forex bot platform support', 'trading platform sales'],
  }),
  blog: buildPageMetadata({
    title: 'Blog — Forex Bots & Algo Execution',
    description:
      'Articles on forex trading bots, MT4/MT5 automation, risk controls, backtesting, and execution infrastructure from the Profytron team.',
    path: '/blog',
    keywords: ['forex bot blog', 'algo forex articles', 'MT5 automation insights'],
  }),
  docs: buildPageMetadata({
    title: 'Documentation — Product Guides & API',
    description:
      'Profytron docs: broker connections, forex bot setup, marketplace strategies, API reference, and troubleshooting for MT4/MT5 automation.',
    path: '/docs',
    keywords: ['Profytron docs', 'forex bot setup', 'MT5 integration documentation'],
  }),
  help: buildPageMetadata({
    title: 'Help Center — Support & FAQs',
    description:
      'Help with Profytron accounts, billing, broker connections, forex bots, Alpha Coach, and platform features.',
    path: '/help',
    keywords: ['Profytron help', 'forex trading bot FAQ', 'MT5 bot support'],
  }),
  status: buildPageMetadata({
    title: 'System Status — Platform Health',
    description:
      'Live Profytron status: API, trading engine, authentication, payments, marketplace, database, broker connectivity, and background jobs.',
    path: '/status',
    keywords: ['Profytron status', 'trading platform uptime', 'API health'],
  }),
  guides: buildPageMetadata({
    title: 'Guides — Forex Bots, Risk & Microstructure',
    description:
      'Practitioner guides on forex bot automation, position sizing, order flow, mean reversion vs momentum, and AI signal pipelines.',
    path: '/guides',
    keywords: ['forex bot guide', 'algo forex risk management', 'automated trading guide'],
  }),
  brokers: buildPageMetadata({
    title: 'Supported Brokers — MT4/MT5 Forex Automation',
    description:
      'Connect Profytron to MT4/MT5 forex brokers including IC Markets, Pepperstone, Exness, XM, and OANDA. Compare spreads and execution, or start with paper trading.',
    path: '/brokers',
    keywords: [
      'MT5 broker for forex bots',
      'best broker for automated forex',
      'MT4 MT5 broker comparison',
      'connect broker to forex bot',
    ],
  }),
  apiReference: buildPageMetadata({
    title: 'API Reference — Developer Documentation',
    description:
      'Profytron REST API for developers: authentication, webhooks, trading endpoints, and integration examples for forex bot strategies.',
    path: '/api-reference',
    keywords: ['Profytron API', 'forex bot REST API', 'algo trading webhooks'],
  }),
  community: buildPageMetadata({
    title: 'Community — Forex Bot Operators & Creators',
    description:
      'Join the Profytron community on Discord and social channels. Connect with automated forex traders and strategy creators.',
    path: '/community',
    keywords: ['Profytron Discord', 'forex bot community', 'algo trading community'],
  }),
  careers: buildPageMetadata({
    title: 'Careers — Build Forex Automation',
    description:
      'Join Profytron. Open roles in engineering, product, and growth building forex trading bot infrastructure.',
    path: '/careers',
    keywords: ['Profytron careers', 'fintech jobs', 'trading platform engineering jobs'],
  }),
  privacy: buildPageMetadata({
    title: 'Privacy Policy — How We Protect Your Data',
    description:
      'How Profytron collects, uses, stores, and protects personal data and trading-related information under applicable privacy laws.',
    path: '/privacy',
    keywords: ['Profytron privacy policy', 'trading data protection'],
  }),
  terms: buildPageMetadata({
    title: 'Terms of Service — Platform Rules',
    description:
      'Terms for using Profytron’s forex trading bot platform, including subscriptions, acceptable use, liability, and dispute terms.',
    path: '/terms',
    keywords: ['Profytron terms of service', 'forex bot platform terms'],
  }),
  cookies: buildPageMetadata({
    title: 'Cookie Policy — Analytics & Session Preferences',
    description:
      'How Profytron uses necessary session cookies and optional analytics cookies, and how you can accept or reject analytics preferences.',
    path: '/cookies',
    keywords: ['Profytron cookie policy', 'analytics consent'],
  }),
  riskDisclosure: buildPageMetadata({
    title: 'Risk Disclosure',
    description:
      'Important risk disclosures for forex trading, automated bots, algorithmic strategies, and market risk on the Profytron platform.',
    path: '/risk-disclosure',
  }),
  register: buildPageMetadata({
    title: 'Sign Up — Start Your Free Trial',
    description:
      'Create your free Profytron account. Trial on paid plans, paper trading included, no credit card required for getting started.',
    path: '/register',
    noIndex: true,
  }),
  login: buildPageMetadata({
    title: 'Sign In — Access Your Trading Workspace',
    description:
      'Sign in to Profytron to access your dashboard, forex bots, billing, Alpha Coach, and connected MT5 accounts.',
    path: '/login',
    noIndex: true,
  }),
} as const;

export const privateAppMetadata = buildPageMetadata({
  title: 'Workspace',
  description: 'Private Profytron trading workspace — forex bots, billing, Alpha Coach, and analytics.',
  path: '/dashboard',
  noIndex: true,
});
