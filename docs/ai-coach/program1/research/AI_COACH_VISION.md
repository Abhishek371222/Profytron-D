# AI Coach Vision

## Differentiator

Profytron’s AI Coach is not a generic chatbot bolted onto a dashboard.

It is an **intelligent trading assistant** that helps users **understand, improve, and trust** automated trading — grounded in **their** accounts, strategies, and trades on the Profytron platform.

## North star (2–3 years)

Users ask natural questions and receive answers that are:

1. **Grounded** in platform data (never invented P&L or trade reasons)  
2. **Explainable** — what / why / meaning / next step  
3. **Safe** — advisory by default; configuration only with confirmation; never silent execution  
4. **Product-native** — broker sync, strategies, marketplace, billing, notifications — not generic market chat  
5. **Escalable** — clear path to human Executive / support when confidence is low  

## What we will not become

| Anti-goal | Why |
| --- | --- |
| Uncontrolled automation agent | Violates Action Policy; trading core stays frozen |
| Generic LLM wrapper | Commodity; no trust advantage |
| Financial advice engine | Regulatory / safety boundary |
| Second competing chat stack | Unify intelligence on `/coach` + existing data APIs |

## Evidence baseline (today)

| Layer | Reality |
| --- | --- |
| Chat UX | `/alpha-coach` — conversations, SSE stream, suggestions, escalate |
| Knowledge | FAQ seed + Jaccard match + light FAQ “RAG” into prompt |
| Account grounding | Server Prisma snapshot: active broker, open/closed trades stats |
| Unused gold | `/ai/explain-trade`, analytics, account snapshots, strategy performance |
| Safety | Escalation SLA 15m; Alpha Coach strips disclaimer lectures; other AI surfaces attach educational disclaimers |

## Strategic bet

Ship **trust** first (explainability + plain-language performance), then configuration guidance, then portfolio intelligence — always on frozen Platform / API / DB.
