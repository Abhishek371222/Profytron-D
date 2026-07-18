import type { Citation, CoachIntent, EvidenceBundle, ToolId } from './types.ts';
import { toolsForIntent } from './tool-router.ts';

const LABELS: Record<ToolId, string> = {
  analytics_portfolio: 'Portfolio metrics',
  analytics_risk: 'Risk analytics',
  analytics_strategy_comparison: 'Strategy comparison',
  analytics_trades: "Analytics trades",
  trading_history: 'Trade history',
  trading_open: 'Open positions',
  ai_explain_trade: 'Trade explanation',
  coaching_report: 'Coaching report',
};

export function buildCitations(
  intent: CoachIntent,
  evidence: EvidenceBundle,
  toolsUsed: ToolId[],
): Citation[] {
  const failed = new Set(evidence.toolErrors.map((t) => t.tool));
  const citations: Citation[] = toolsUsed
    .filter((t) => !failed.has(t))
    .map((t) => ({
      id: t,
      label: LABELS[t],
      source: t,
    }));

  if (evidence.todayPnL != null || evidence.weekPnL != null) {
    citations.push({
      id: 'derived-pnl',
      label: "Today's / period P&L (derived)",
      source: 'derived',
    });
  }

  if (!citations.length && toolsForIntent(intent).length) {
    citations.push({
      id: 'limited',
      label: 'Limited evidence — some tools unavailable',
      source: 'session',
    });
  }

  return citations;
}
