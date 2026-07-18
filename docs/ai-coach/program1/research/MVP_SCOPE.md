# MVP Scope — Frozen

**MVP name:** Explainability & Plain-Language Performance  

**Status:** **Frozen for implementation planning** (implementation is a later product build phase — not this research phase).

## Recommendation accepted

Of the three candidates (Explainability, Plain-language performance, Safe-config guidance), MVP = **Explainability + Plain-Language Performance**.

Safe-config guidance → **next** after MVP (Program 1 Roadmap).

## User-facing outcomes

Users can ask (examples):

- “Why is my account down today?”  
- “Summarize this week’s performance.”  
- “Which strategy contributed most?”  
- “Why was this trade opened?”  
- “Explain my drawdown.”  

Answers follow [EXPLAINABILITY_FRAMEWORK.md](./EXPLAINABILITY_FRAMEWORK.md) and [ACTION_POLICY.md](./ACTION_POLICY.md).

## In scope

| Item | Notes |
| --- | --- |
| Structured grounding from existing account/trade/strategy/analytics **reads** | No new API contracts required if reusing GETs / Prisma already used by those modules |
| Consume existing `AITradeExplanation` / explain-trade when present | No new model |
| Conversation patterns CP01–CP06 | Design in research; build later |
| Explicit “unknown” when rationale missing | Anti-hallucination |
| Keep FAQ + escalation | Already shipped |
| Active single-account scope disclosure | Match today’s snapshot behavior |

## Out of scope (MVP)

| Item | Why |
| --- | --- |
| New AI models / providers | Locked |
| Tool-calling agent framework | Unnecessary for first slice |
| Safe strategy configuration / parameter writes | Next roadmap slice |
| Automatic trade execution | Never |
| Cross-account portfolio intelligence | Later |
| Proactive push coaching | Later |
| Marketplace recommendations | Later |
| Prompt engineering production changes | This phase is design-only; prompts change only in Build phase under this frozen MVP |

## Success metrics (for Build → Test)

- ≥70% of sampled MVP questions return grounded answers (manual rubric)  
- 0 invented trade reasons in QA review  
- Escalation still works  
- No frozen architecture files redesigned  

## Non-goals reminder

Phase 1 Research produces this freeze document. **Shipping code starts only after Exit Criteria PASS and a separate Build kickoff.**
