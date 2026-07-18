import { classifyIntent, isMvpIntent } from './intent-classifier';
import { buildEvidence } from './evidence-builder';
import { scoreConfidence } from './confidence';
import { buildCitations } from './citations';
import {
  buildResponseSections,
  sectionsToPlainText,
  MVP_FOLLOW_UPS,
} from './response-builder';
import type {
  ExplainabilityResult,
  SessionMemory,
  ToolFetchers,
} from './types';

export async function runExplainability(params: {
  message: string;
  fetchers: ToolFetchers;
  session?: SessionMemory;
  tradeIdHint?: string | null;
}): Promise<ExplainabilityResult> {
  const intent = classifyIntent(params.message);

  if (!isMvpIntent(intent)) {
    const evidence = {
      generatedAt: new Date().toISOString(),
      scopeNote: 'No tools invoked for unknown intent.',
      toolErrors: [],
      rawNotes: ['Fell back — outside grounded intent set.'],
    };
    const sections = buildResponseSections('unknown', evidence);
    return {
      intent: 'unknown',
      confidence: 'Low',
      citations: [],
      evidence,
      sections,
      plainText: sectionsToPlainText(sections),
      followUps: MVP_FOLLOW_UPS,
      toolsUsed: [],
    };
  }

  const { evidence, toolsUsed } = await buildEvidence({
    intent,
    fetchers: params.fetchers,
    session: params.session,
    tradeIdHint: params.tradeIdHint,
  });

  const sections = buildResponseSections(intent, evidence);
  const confidence = scoreConfidence({ intent, evidence, toolsUsed });
  const citations = buildCitations(intent, evidence, toolsUsed);

  return {
    intent,
    confidence,
    citations,
    evidence,
    sections,
    plainText: sectionsToPlainText(sections),
    followUps: MVP_FOLLOW_UPS.filter(
      (q) => q.toLowerCase() !== params.message.trim().toLowerCase(),
    ).slice(0, 4),
    toolsUsed,
  };
}

export { classifyIntent, isMvpIntent } from './intent-classifier';
export { toolsForIntent } from './tool-router';
export { MVP_FOLLOW_UPS } from './response-builder';
export { EVIDENCE_ONLY_SYSTEM, buildEvidenceUserPrompt } from './templates';
export type * from './types';
