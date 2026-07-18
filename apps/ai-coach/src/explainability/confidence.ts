import type { CoachIntent, ConfidenceLevel, EvidenceBundle, ToolId } from './types.ts';
import { toolsForIntent } from './tool-router.ts';

export function scoreConfidence(params: {
  intent: CoachIntent;
  evidence: EvidenceBundle;
  toolsUsed: ToolId[];
}): ConfidenceLevel {
  const needed = toolsForIntent(params.intent);
  const failed = params.evidence.toolErrors.length;
  const successRatio =
    needed.length === 0 ? 0 : (needed.length - failed) / needed.length;

  let points = 0;
  if (successRatio >= 0.8) points += 2;
  else if (successRatio >= 0.4) points += 1;

  const e = params.evidence;
  const hasCore =
    e.todayPnL != null ||
    e.weekPnL != null ||
    e.drawdownPct != null ||
    e.bestStrategy != null ||
    e.healthLabel != null ||
    e.trendLabel != null ||
    (e.strategies?.length ?? 0) > 0 ||
    (e.attentionFlags?.length ?? 0) > 0 ||
    (e.advisoryHints?.length ?? 0) > 0 ||
    (e.tradeExplanation?.available ?? false) ||
    (e.tradeExplanation?.knownFacts?.length ?? 0) > 0;

  if (hasCore) points += 2;
  if (failed === 0 && needed.length > 0) points += 1;
  if (e.toolErrors.some((x) => /timeout|unavailable|network/i.test(x.message)))
    points -= 1;

  if (params.intent.startsWith('trade_') && !e.tradeExplanation?.available) {
    points = Math.min(points, 2);
  }

  if (points >= 4) return 'High';
  if (points >= 2) return 'Medium';
  return 'Low';
}
