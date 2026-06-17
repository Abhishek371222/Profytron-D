import type { FaqItem } from '@/components/seo/JsonLd';

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Profytron and who is it built for?",
    answer:
      "Profytron is an institutional-grade algorithmic trading platform designed for Indian retail traders, HNIs, and proprietary desks. It combines AI-powered coaching, copy trading, a strategy marketplace, and real-time analytics — giving you the same tools that hedge funds use, without needing a quant team.",
  },
  {
    question: "Which brokers and trading platforms are supported?",
    answer:
      "Profytron connects natively with MetaTrader 4 (MT4) and MetaTrader 5 (MT5) accounts via the MetaAPI cloud integration. Support for Binance, Bybit, KuCoin, and Interactive Brokers is on the roadmap. A built-in paper trading account is available for risk-free testing from day one.",
  },
  {
    question: "How does copy trading work on Profytron?",
    answer:
      "When you subscribe to a strategy, Profytron's copy engine automatically mirrors every trade from the strategy creator's live account into yours — in real time. You can set your own risk parameters: maximum drawdown limit, lot multiplier, excluded symbols, and execution priority. Trades are copied in milliseconds via MetaAPI's CopyFactory.",
  },
  {
    question: "Is my money safe? Where are my funds held?",
    answer:
      "Profytron never holds your funds. All capital stays in your own broker account — we only connect to execute trades on your behalf using read/write API access. You retain full custody of your money at all times. Our platform is a SaaS tool, not a broker or fund manager.",
  },
  {
    question: "What is the AI Trading Coach and how does it help me?",
    answer:
      "The AI Trading Coach analyzes every trade you take — entry timing, risk-reward ratio, emotional patterns, and market context — and delivers plain-English feedback after each session. It identifies your strengths (e.g., excellent trend identification) and weaknesses (e.g., early exits on winning trades) and gives you a structured improvement plan.",
  },
  {
    question: "How is my trading data and account secured?",
    answer:
      "Profytron uses AES-256 encryption for all stored credentials, TLS 1.3 for data in transit, and stores broker passwords in encrypted vaults — never in plaintext. Two-factor authentication (2FA) via TOTP authenticator apps is available. Our infrastructure runs on SOC 2-compliant cloud providers with daily encrypted backups.",
  },
  {
    question: "What are the pricing plans and what do they include?",
    answer:
      "There are three plans: Developer Node (₹3,999/month) for individual traders with 3 strategy subscriptions and paper trading; Alpha Desk (₹11,999/month) for serious traders with unlimited subscriptions, AI coach, VPS hosting, and priority support; Institution (custom pricing) for proprietary desks and funds needing multi-account management, white labeling, and dedicated infrastructure. Annual plans offer 2 months free.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. All plans come with a 7-day free trial — no credit card required. You get full access to the platform including the strategy marketplace, paper trading, and AI coach. Your trial automatically converts to a paid subscription after 7 days if you choose to continue.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes, you can cancel any time from your billing settings. Your access continues until the end of the current billing period. We do not charge cancellation fees. If you cancel within 48 hours of being billed and haven't actively used copy trading, you can request a full refund via our support team.",
  },
  {
    question: "What is the Strategy Marketplace?",
    answer:
      "The Strategy Marketplace is where verified strategy creators list their algorithmic trading strategies. Each listing shows a verified track record with real brokerage statements — win rate, Sharpe ratio, maximum drawdown, monthly returns, and subscriber count. You can subscribe to any strategy and start copy trading within minutes.",
  },
  {
    question: "How do strategy creators earn money?",
    answer:
      "Strategy creators earn 80% of every subscription fee paid by their followers. Profytron retains a 20% platform fee. Earnings accumulate in your Profytron wallet and can be withdrawn to your bank account weekly. Creators building a following of 50+ subscribers can earn ₹50,000–₹5,00,000+ per month passively.",
  },
  {
    question: "How is a strategy's performance verified?",
    answer:
      "Strategy performance is verified by connecting the creator's live MT4/MT5 account directly to Profytron. All trades are recorded in real time from the broker, not self-reported. The Profytron team additionally reviews performance data and tags strategies as 'Verified' only after a minimum 60-day live track record with consistent results.",
  },
  {
    question: "What is the AI Risk Engine and how does it protect me?",
    answer:
      "The AI Risk Engine monitors your portfolio in real time and enforces the risk rules you set. If your account drawdown exceeds your limit, it automatically stops all copy trading and closes open positions. It also detects unusual volatility events (news spikes, flash crashes) and can pause trading temporarily. You set the thresholds — the engine enforces them without emotion.",
  },
  {
    question: "What is the Strategy Builder?",
    answer:
      "The Strategy Builder is a visual, no-code editor where you can design your own trading strategies using a drag-and-drop node graph. Connect indicators (RSI, MACD, Bollinger Bands), conditions (if/else, crossovers), and actions (buy, sell, set stop loss) visually. Built strategies can be backtested on historical data and, once verified, listed on the marketplace.",
  },
  {
    question: "Can I use Profytron on my mobile phone?",
    answer:
      "Yes. Profytron is a Progressive Web App (PWA) optimized for mobile. Install it from your browser on iOS or Android and get an app-like experience with real-time push notifications for trade execution, drawdown alerts, and account milestones. A dedicated native app is in development.",
  },
  {
    question: "What analytics does Profytron provide?",
    answer:
      "The analytics suite covers: equity curve visualization, win rate by symbol and session, drawdown analysis, trade duration distribution, risk-adjusted returns (Sharpe, Sortino), best/worst days and months, slippage tracking, and AI-generated insights. All charts are interactive, real-time, and exportable to PDF.",
  },
  {
    question: "What is the Trading Journal?",
    answer:
      "The Trading Journal lets you attach notes, screenshots, and emotional tags to every trade. After each session, the AI Coach analyzes your journal entries alongside trade data to detect psychological patterns — such as revenge trading after losses or position sizing inconsistency during high-volatility periods.",
  },
  {
    question: "What is VPS hosting and why do I need it?",
    answer:
      "A VPS (Virtual Private Server) keeps your trading bots running 24/7 even when your computer is off. Profytron's VPS integration lets you deploy and manage your MT4/MT5 bots from the dashboard without any technical setup. Latency to major broker servers is under 5ms for faster order execution.",
  },
  {
    question: "Does Profytron support cryptocurrency trading?",
    answer:
      "Crypto spot and futures trading via Binance and Bybit is on the near-term roadmap (Q3 2025). Currently, Profytron focuses on Forex, Commodities (Gold, Silver, Oil), and Indices (NIFTY, S&P 500) via MT4/MT5. Paper trading for crypto strategies is already available for testing.",
  },
  {
    question: "What is KYC and do I need to complete it?",
    answer:
      "KYC (Know Your Customer) verification is required to enable wallet withdrawals above ₹10,000 per day and to list strategies on the marketplace. The process takes 2–5 minutes: upload a government-issued ID (Aadhaar, PAN, Passport) and a selfie. Verification is completed within 24 hours by our compliance team.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major payment methods: UPI (PhonePe, Google Pay, Paytm), Debit/Credit Cards (Visa, Mastercard, RuPay), Net Banking, and Razorpay wallet. International payments are accepted via Stripe. All transactions are secured with 3D Secure authentication and PCI-DSS compliant payment gateways.",
  },
  {
    question: "Can I have multiple broker accounts connected?",
    answer:
      "Yes. You can connect multiple MT4/MT5 accounts from different brokers simultaneously. Each account can be assigned a different strategy subscription with its own risk parameters. One account can be set as the 'master source' for your own copy trading setup.",
  },
  {
    question: "What is the Affiliate Program?",
    answer:
      "The Profytron Affiliate Program pays you 30% recurring commission on every subscription payment made by traders you refer — for the lifetime of their account. There are three tiers: Starter (0–10 referrals), Pro (11–50 referrals), and Elite (51+ referrals) with increasing commission rates and bonuses.",
  },
  {
    question: "What kind of support is available?",
    answer:
      "All plans include email support with 24-hour response time and an in-app AI support assistant for instant answers. Alpha Desk and Institution plans get priority support with 4-hour response time, live chat, and access to a dedicated Telegram support group. Critical issues (platform down, trade execution failure) are escalated immediately regardless of plan.",
  },
  {
    question: "How do I get started on Profytron?",
    answer:
      "Sign up for free in under 2 minutes — no credit card required. Connect your MT4/MT5 broker account (or start with the built-in paper account), browse the strategy marketplace, and click Subscribe on any verified strategy. Your first copied trade can happen within 5 minutes of signing up. The onboarding flow guides you through each step.",
  },
];
