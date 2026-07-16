export type TourStep = {
  id: string;
  page: string;
  target: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** actionId reported via useTutorialStore.notifyAction() — advisory only, never blocks Next */
  waitForAction?: string;
  /** If this selector matches, spotlight emptyTarget (defaults to itself) and swap in emptyBody. */
  emptySelector?: string;
  emptyTarget?: string;
  emptyBody?: string;
};

export const MAIN_TOUR_ID = 'main';

const MARKETPLACE_EMPTY_SELECTOR = '[data-tour-empty="marketplace-bots-list"]';

export const mainTourSteps: TourStep[] = [
  {
    id: 'welcome',
    page: '/dashboard',
    target: '[data-tour="dashboard-overview"]',
    title: 'Welcome to Profytron',
    body: 'This is your dashboard — a live view of your equity, open positions, and performance. Let’s set up your account and take a quick look around.',
    placement: 'bottom',
  },
  {
    id: 'nav-connected-accounts',
    page: '/dashboard',
    target: '[data-tour="nav-connected-accounts"]',
    title: 'Connected Accounts',
    body: 'Nothing can trade until a broker account is linked here — that’s our very next step.',
    placement: 'right',
  },
  {
    id: 'connect-broker',
    page: '/connected-accounts',
    target: '[data-tour="connect-broker-cta"]',
    title: 'Connect a broker',
    body: 'Link a real or demo MT5 account — nothing can trade until you do. We recommend connecting one now, but you can also do this later and come back.',
    placement: 'bottom',
    waitForAction: 'broker-connected',
  },
  {
    id: 'nav-wallet',
    page: '/connected-accounts',
    target: '[data-tour="nav-wallet"]',
    title: 'Wallet',
    body: 'Deposits, withdrawals, and transaction history all live here.',
    placement: 'right',
  },
  {
    id: 'wallet-deposit',
    page: '/wallet',
    target: '[data-tour="wallet-deposit-cta"]',
    title: 'Fund your account (for live trading)',
    body: 'Deposit funds whenever you’re ready to trade live. Paper/demo accounts can skip this and still run bots in simulation.',
    placement: 'top',
  },
  {
    id: 'nav-marketplace',
    page: '/wallet',
    target: '[data-tour="nav-marketplace"]',
    title: 'Marketplace',
    body: 'Browse strategies built by other traders and subscribe to copy their trades automatically.',
    placement: 'right',
  },
  {
    id: 'marketplace-bots-list',
    page: '/marketplace',
    target: '[data-tour="marketplace-bots-list"]',
    title: 'Strategies from other traders',
    body: 'Every card here is a bot built and run by another trader — with its live win rate, drawdown, and subscriber count so you can judge it before copying.',
    placement: 'top',
    emptySelector: MARKETPLACE_EMPTY_SELECTOR,
    emptyBody: 'No strategies match right now — try resetting filters. Once bots are listed here you\'ll see live win rate, drawdown, and subscriber count for each. You can also publish your own from the Creator dashboard for others to copy.',
  },
  {
    id: 'marketplace-subscribe',
    page: '/marketplace',
    target: '[data-tour="marketplace-subscribe-cta"]',
    title: 'Subscribe to a strategy',
    body: 'Pick a strategy and subscribe to start copying its trades into your connected account.',
    placement: 'top',
    emptySelector: MARKETPLACE_EMPTY_SELECTOR,
    emptyBody: 'No strategies to subscribe to yet. Once bots are listed here, click Subscribe on any card to start copying its trades into your connected account.',
  },
  {
    id: 'my-bots-overview',
    page: '/my-bots',
    target: '[data-tour="my-bots-overview"]',
    title: 'My Bots',
    body: 'Every strategy you subscribe to shows up here — track status and P&L, and pause or resume each bot anytime.',
    placement: 'bottom',
  },
  {
    id: 'alpha-coach-panel',
    page: '/alpha-coach',
    target: '[data-tour="alpha-coach-panel"]',
    title: 'Alpha Coach',
    body: 'An AI assistant built into your account — ask it about your trades, risk, or performance anytime.',
    placement: 'left',
  },
  {
    id: 'subscriptions-overview',
    page: '/subscriptions',
    target: '[data-tour="subscriptions-overview"]',
    title: 'Subscriptions & Billing',
    body: 'See all your active bot subscriptions, renewal dates, and billing in one place.',
    placement: 'bottom',
  },
  {
    id: 'settings-subnav',
    page: '/settings/profile',
    target: '[data-tour="settings-subnav"]',
    title: 'Account settings',
    body: 'Profile, Security, Verification (KYC), Notifications, Trading preferences, Billing, and Support — everything about your account is organized here.',
    placement: 'right',
  },
  {
    id: 'settings-replay',
    page: '/settings/profile',
    target: '[data-tour="replay-tour-button"]',
    title: 'You’re all set',
    body: 'You can replay this tour anytime from here, or from the account menu in the top bar.',
    placement: 'bottom',
  },
];
