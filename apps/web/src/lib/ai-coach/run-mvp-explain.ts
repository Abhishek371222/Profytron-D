import {
  classifyIntent,
  isMvpIntent,
  runExplainability,
  type ExplainabilityResult,
  type SessionMemory,
} from '@profytron/ai-coach';
import { analyticsApi, type AnalyticsRange } from '@/lib/api/analytics';
import { tradingApi } from '@/lib/api/trading';
import { aiApi } from '@/lib/api/ai';

export { classifyIntent, isMvpIntent };
export type { ExplainabilityResult, SessionMemory };

function mapRange(range: string): AnalyticsRange {
  if (range === '7d' || range === '1w') return '1w';
  if (range === '30d' || range === '1m') return '1m';
  if (range === '1d') return '1d';
  if (range === '3m') return '3m';
  if (range === '1y') return '1y';
  if (range === 'all') return 'all';
  return '1m';
}

/** Program 1 Phase 2 — grounded explainability via existing APIs only. */
export async function runMvpExplain(params: {
  message: string;
  session?: SessionMemory;
  tradeIdHint?: string | null;
}): Promise<ExplainabilityResult> {
  return runExplainability({
    message: params.message,
    session: params.session,
    tradeIdHint: params.tradeIdHint,
    fetchers: {
      analyticsPortfolio: (range) =>
        analyticsApi.getPortfolio(mapRange(range)),
      analyticsRisk: (range) => analyticsApi.getRisk(mapRange(range)),
      analyticsStrategyComparison: (range) =>
        analyticsApi.getStrategyComparison(mapRange(range)),
      analyticsTrades: (range) => analyticsApi.getTrades(mapRange(range)),
      tradingHistory: async () => {
        const h = await tradingApi.getTradeHistory({ limit: 100, days: 30 });
        return h.rows || [];
      },
      tradingOpen: () => tradingApi.getOpenTrades(),
      explainTrade: (id) => aiApi.explainTradeById(id),
      coachingReport: () => aiApi.getCoachingReport(),
    },
  });
}
