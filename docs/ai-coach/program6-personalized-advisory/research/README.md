# Program 6 — Personalized Advisory Guidance (Research)

**Status:** Complete  
**Depends on:** Program 5  
**Hard lock:** Advisory only — never execution, never “buy/sell now”.

## Job

Suggest review focus and watch items based on grounded evidence.

## Locked intents

| Intent | Example |
|--------|---------|
| `advisory_review_suggestion` | What should I review? |
| `advisory_what_to_watch` | What should I watch? |
| `advisory_improve_consistency` | How can I improve consistency? |

## Policy

- Cite evidence
- Prefer “review / watch / consider sizing discipline” language
- Never place, modify, or close trades
- Never invent market forecasts
