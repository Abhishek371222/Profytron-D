# Evidence Pipeline

```
Intent → toolsForIntent → parallel fetchers → EvidenceBundle → response sections
```

## EvidenceBundle (structured)

Includes: `todayPnL`, `weekPnL`, `drawdownPct`, `winRate`, strategy best/worst, largest loss/gain, trade explanation availability, `toolErrors`, `scopeNote`.

LLM (if used later for polish) receives **only** this JSON via `templates.ts` — never raw DB.

MVP answers are **template/evidence-first** (`response-builder.ts`) so numbers cannot be invented.

Source: `evidence-builder.ts`, `response-builder.ts`
