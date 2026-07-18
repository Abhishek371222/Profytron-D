# MVP Validation

## Automated

```bash
cd apps/ai-coach && node --experimental-strip-types --test src/explainability/mvp.test.ts
```

Covers: intent-routing, tool-routing, grounding, confidence, citations, fallbacks, hallucination/action-policy checks.

## Manual rubric

1. Ask each frozen example prompt on `/alpha-coach` while logged in.  
2. Confirm structured sections + confidence badge + source chips.  
3. Select an open trade → “Explain this trade” → no invented rationale if store empty.  
4. Non-MVP question still uses existing coach stream/FAQ.  
5. Escalation still works.

## Regression

- `pnpm --filter profytron exec playwright test tests/product-audit/phase1-artifacts.spec.ts --project=chromium`  
- Compatibility suite as available  
- Production build when ready
