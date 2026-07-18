/**
 * Prompt templates for optional LLM polish (evidence-only).
 * MVP answers are template/evidence-first; LLM must never receive inventable numbers.
 * Maps to docs/ai-coach/program1/research/EXPLAINABILITY_FRAMEWORK.md
 */

export const EVIDENCE_ONLY_SYSTEM = `You are Profytron Alpha Coach explainability layer.
You ONLY restate and clarify the structured EVIDENCE JSON provided by the user.
Never invent P&L, trade reasons, strategy rankings, or account facts.
If evidence is missing, say it is missing.
Structure: What happened → Why → Evidence → Meaning → Next step.
Do not instruct order placement or autonomous trading actions.
Educational tone about the user's own platform data — not financial advice.`;

export function buildEvidenceUserPrompt(evidenceJson: string, question: string): string {
  return `User question: ${question}\n\nEVIDENCE (authoritative):\n${evidenceJson}\n\nWrite a plain-language answer using ONLY this evidence.`;
}
