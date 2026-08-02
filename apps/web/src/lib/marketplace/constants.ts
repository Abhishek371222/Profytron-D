/**
 * Canonical marketplace/strategy filter option lists — mirrors the Prisma
 * enums exactly (`StrategyCategory`, `RiskLevel`, `AssetClass`, `Timeframe`
 * in `schema.prisma`). Use these wherever a form or filter needs the full,
 * backend-accepted set of values for one of these fields.
 *
 * Note: `/marketplace`'s FilterSidebar and `/strategies`' own category chips
 * intentionally use their own narrower (or, in the case of `/strategies`'
 * "MEAN REVERT" chip, non-enum) option sets for that page's existing filter
 * UX — those are left as-is here rather than forced onto this list, since
 * changing what a user can filter by is a visible behavior change, not a
 * pure code-sharing one.
 */

export const STRATEGY_CATEGORIES = [
  'TREND',
  'SCALPING',
  'RANGE',
  'VOLATILITY',
  'ARBITRAGE',
] as const;
export type StrategyCategoryValue = (typeof STRATEGY_CATEGORIES)[number];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'] as const;
export type RiskLevelValue = (typeof RISK_LEVELS)[number];

export const ASSET_CLASSES = ['Forex', 'Crypto', 'Indices', 'Commodities', 'Stocks'] as const;
export type AssetClassValue = (typeof ASSET_CLASSES)[number];

export const TIMEFRAMES = ['M1', 'M3', 'M5', 'M15', 'H1', 'H4', 'D1'] as const;
export type TimeframeValue = (typeof TIMEFRAMES)[number];

export const RISK_LEVEL_LABELS: Record<RiskLevelValue, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  EXPERT: 'Expert',
};

export const STRATEGY_CATEGORY_LABELS: Record<StrategyCategoryValue, string> = {
  TREND: 'Trend',
  SCALPING: 'Scalping',
  RANGE: 'Range',
  VOLATILITY: 'Volatility',
  ARBITRAGE: 'Arbitrage',
};
