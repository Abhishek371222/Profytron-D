# Grounded Coach Architecture (Conceptual)

## What changed

**Before (chatbot):**

```text
User → Chat → LLM → Answer
```

**After (MVP explainability):**

```text
User → Intent Detection → Tool Router → Existing Profytron Data
  → Evidence Builder → Grounded Explanation → UI
```

(Optional LLM polish may only restate evidence — never invent account facts.)

## Why this is stronger

Answers are tied to **the user’s actual activity** on Profytron (trades, strategies, analytics, risk), not generic LLM market talk.

## Long-term capability layers

```text
                 Alpha Coach
                       │
        ┌──────────────┼──────────────┐
        │              │              │
 Explainability   Portfolio IQ   Strategy IQ
        │              │              │
        ├──────────────┼──────────────┤
        │              │              │
   Risk Engine   Trend Engine   Advisory Engine
        │              │              │
        └──────────────┼──────────────┘
                       │
             Grounded Evidence Layer
                       │
              Existing Profytron APIs
```

**Not present:** agent orchestration, autonomous trading, recursive planning, multi-agent systems.

## Capability build order

See [`../../CAPABILITY_ROADMAP.md`](../../CAPABILITY_ROADMAP.md):

1. Explainability ✅  
2. **Portfolio Intelligence** ← next  
3. Strategy Intelligence  
4. Risk Intelligence  
5. Performance Trends  
6. Personalized Advisory (advisory-only)

## Avoid

- Autonomous agents  
- Automatic strategy execution  
- Unrestricted tool calling  
- Multi-agent orchestration  

## Maturity snapshot

Governed foundation · stable APIs/DB · hardened journeys · grounded Coach that explains rather than guesses.

Evidence: [`EXIT_CRITERIA.md`](./EXIT_CRITERIA.md), [`ACTION_POLICY.md`](../research/ACTION_POLICY.md).
