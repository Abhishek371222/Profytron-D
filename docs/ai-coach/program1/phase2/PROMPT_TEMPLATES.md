# Prompt Templates

Optional evidence-only polish templates live in `apps/ai-coach/src/explainability/templates.ts`.

- `EVIDENCE_ONLY_SYSTEM` — forbid inventing facts; follow What→Why→Evidence→Meaning→Next  
- `buildEvidenceUserPrompt(evidenceJson, question)`

**MVP runtime:** grounded answers are produced by `response-builder` templates without requiring a new model call. Existing `/coach` stream remains for non-MVP intents (FAQ/chat).
