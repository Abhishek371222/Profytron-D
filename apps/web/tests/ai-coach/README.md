# AI Coach tests

Unit coverage lives in the explainability package:

```bash
cd apps/ai-coach
node --experimental-strip-types --test src/explainability/mvp.test.ts
```

Covers intent-routing, tool-routing, grounding, confidence, citations, fallbacks, and action-policy / hallucination checks.
