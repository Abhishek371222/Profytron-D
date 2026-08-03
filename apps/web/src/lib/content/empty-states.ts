/**
 * Final product empty-state copy (aligned with EMPTY_STATE_GUIDE + beta terminology).
 * Ishit long-form FAQs live in help-catalog; journey empties use this module so
 * headlines, guidance, and CTAs stay consistent across dashboard surfaces.
 */
export const EMPTY_STATES = {
  openPositions: {
    title: 'No open positions',
    description:
      'Open trades from your connected paper or live account appear here.',
  },
  recentTrades: {
    title: 'No recent trades',
    description: 'Closed trades from bots and manual orders show here.',
    ctaLabel: 'Browse Marketplace',
    ctaHref: '/marketplace' as const,
  },
  myBots: {
    title: 'No bots running yet',
    description:
      'Open Marketplace to pick a strategy, or Bot Plans to subscribe. Active bots show up here.',
    ctaLabel: 'Browse Marketplace',
    ctaHref: '/marketplace' as const,
  },
  botPlansNoBroker: {
    title: 'Connect a broker to buy bots',
    description:
      'Link MT5 live trading or start paper trading so plan purchases can run executions into an account.',
    ctaLabel: 'Connect broker',
  },
  botPlansNoActive: {
    title: 'No active bots yet',
    description:
      'Choose a plan above to enable automated execution. Active bots will show here.',
    ctaLabel: 'Browse Marketplace',
    ctaHref: '/marketplace' as const,
  },
  noBroker: {
    title: 'No accounts connected yet',
    description:
      'Connect your first MT5 broker to enable live bot execution, or use paper trading to practice without risk.',
    ctaLabel: 'Connect broker',
  },
  history: {
    title: 'No trades in this range',
    description:
      'Try another date range, clear search, or run a bot on paper or live so closed trades can appear here.',
    ctaLabel: 'Bot Plans',
    ctaHref: '/get-bots' as const,
    secondaryLabel: 'Marketplace',
    secondaryHref: '/marketplace' as const,
  },
  wallet: {
    title: 'No transactions yet',
    description: 'Make your first deposit to fund wallet activity on Profytron.',
    ctaLabel: 'Make a deposit',
  },
  notifications: {
    emptyTitle: 'No notifications yet',
    emptyDescription:
      'Trade alerts, system messages, and billing updates appear here.',
    unreadTitle: 'All caught up',
    unreadDescription: 'You have no unread notifications right now.',
  },
  leaderboard: {
    title: 'No one ranked yet',
    description:
      'Connect a broker and make your first trade to appear on the board.',
    ctaLabel: 'Connect account',
    ctaHref: '/connected-accounts' as const,
  },
  coachNoBroker: {
    title: 'No broker connected',
    description: 'Connect a broker to stream positions into Alpha Coach.',
    ctaLabel: 'Connect broker',
    ctaHref: '/connected-accounts' as const,
  },
  coachNoPositions: {
    title: 'No open positions',
    description: 'When you have paper or live trades, they appear here for coach context.',
    ctaLabel: 'Open Market Watch',
    ctaHref: '/markets' as const,
  },
} as const;
