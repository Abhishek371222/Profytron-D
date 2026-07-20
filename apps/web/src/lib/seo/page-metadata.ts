import { buildPageMetadata } from './metadata';

export const pageSeo = {
  home: buildPageMetadata({
    title: 'Profytron — Algorithmic Trading Platform for Indian Traders',
    description:
      "Profytron is India's most advanced algorithmic trading platform. Copy top strategies, deploy AI-powered bots, and manage your portfolio with institutional-grade tools. 7-day free trial.",
    path: '/',
    keywords: [
      'algorithmic trading platform India',
      'copy trading India',
      'MT5 automated trading',
      'AI trading platform',
    ],
  }),
  pricing: buildPageMetadata({
    title: 'Pricing — Plans for Every Trader',
    description:
      'Transparent INR pricing for Profytron. Start free with paper trading, or upgrade to Starter (₹799/mo), Pro (₹999/mo), or Business (₹1,299/mo). Paid plans include a 7-day trial.',
    path: '/pricing',
    keywords: ['algo trading pricing India', 'copy trading subscription', 'trading platform cost INR'],
  }),
  about: buildPageMetadata({
    title: 'About Us — Mission & Team',
    description:
      'Profytron builds institutional-grade algorithmic trading infrastructure for Indian retail traders, HNIs, and prop desks. Learn our mission, values, and story.',
    path: '/about',
    keywords: ['about Profytron', 'algo trading company India', 'fintech trading platform'],
  }),
  contact: buildPageMetadata({
    title: 'Contact Us — Sales & Support',
    description:
      'Contact Profytron for sales, enterprise partnerships, press inquiries, and customer support. We respond within 24 hours on business days.',
    path: '/contact',
    keywords: ['contact Profytron', 'trading platform support', 'enterprise trading sales'],
  }),
  blog: buildPageMetadata({
    title: 'Blog — Algo Trading Insights & Research',
    description:
      'Technical articles on algorithmic trading, market microstructure, AI signals, backtesting, and execution infrastructure from the Profytron team.',
    path: '/blog',
    keywords: ['algo trading blog', 'quant trading articles', 'copy trading insights'],
  }),
  docs: buildPageMetadata({
    title: 'Documentation — Product Guides & API',
    description:
      'Profytron documentation: getting started, broker connections, copy trading setup, strategy marketplace, API reference, and troubleshooting.',
    path: '/docs',
    keywords: ['Profytron docs', 'copy trading guide', 'MT5 integration documentation'],
  }),
  help: buildPageMetadata({
    title: 'Help Center — Support & FAQs',
    description:
      'Find answers to common questions about Profytron accounts, billing, broker connections, copy trading, and platform features.',
    path: '/help',
  }),
  guides: buildPageMetadata({
    title: 'Trading Guides — Algorithmic Strategies, Risk & Market Microstructure',
    description:
      'Practitioner guides on algorithmic trading, Kelly Criterion position sizing, order flow toxicity, mean reversion vs. momentum, and AI signal pipelines.',
    path: '/guides',
    keywords: ['algorithmic trading guide', 'position sizing Kelly Criterion', 'trading risk management guide'],
  }),
  brokers: buildPageMetadata({
    title: 'Supported Brokers — Connect MT4/MT5 for Automated Trading',
    description:
      'Connect Profytron to 20+ MT4/MT5 brokers including IC Markets, Pepperstone, Exness, XM, and OANDA. Compare spreads, minimum deposit, and execution type, or start with paper trading.',
    path: '/brokers',
    keywords: [
      'MT5 broker for automated trading',
      'best broker for algo trading India',
      'MT4 MT5 broker comparison',
      'connect broker to trading bot',
    ],
  }),
  apiReference: buildPageMetadata({
    title: 'API Reference — Developer Documentation',
    description:
      'Profytron REST API reference for developers. Authentication, webhooks, trading endpoints, and integration examples.',
    path: '/api-reference',
  }),
  community: buildPageMetadata({
    title: 'Community — Traders & Strategy Creators',
    description:
      'Join the Profytron community. Connect with traders, strategy creators, and our team on Discord and social channels.',
    path: '/community',
  }),
  careers: buildPageMetadata({
    title: 'Careers — Build the Future of Trading',
    description:
      'Join Profytron. Open roles in engineering, product, and growth. Help build India\'s leading algorithmic trading platform.',
    path: '/careers',
  }),
  privacy: buildPageMetadata({
    title: 'Privacy Policy',
    description: 'How Profytron collects, uses, and protects your personal data and trading information.',
    path: '/privacy',
  }),
  terms: buildPageMetadata({
    title: 'Terms of Service',
    description: 'Terms and conditions for using the Profytron algorithmic trading platform.',
    path: '/terms',
  }),
  cookies: buildPageMetadata({
    title: 'Cookie Policy',
    description: 'How Profytron uses cookies and similar technologies on our website and platform.',
    path: '/cookies',
  }),
  riskDisclosure: buildPageMetadata({
    title: 'Risk Disclosure',
    description:
      'Important risk disclosures for algorithmic trading, copy trading, and digital asset markets on Profytron.',
    path: '/risk-disclosure',
  }),
  register: buildPageMetadata({
    title: 'Sign Up — Start Your Free Trial',
    description:
      'Create your free Profytron account. 7-day trial on paid plans, paper trading included, no credit card required.',
    path: '/register',
  }),
  login: buildPageMetadata({
    title: 'Sign In',
    description: 'Sign in to your Profytron account to access your trading dashboard, strategies, and portfolio.',
    path: '/login',
    noIndex: true,
  }),
} as const;

export const privateAppMetadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Profytron trading dashboard',
  path: '/dashboard',
  noIndex: true,
});
