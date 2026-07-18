# User Personas

Personas are design targets for Program 1. Not marketing segments.

---

## P1 — Beginner automated trader

| | |
| --- | --- |
| **Goals** | Connect broker, run a bot safely, understand if they’re “doing OK” |
| **Frustrations** | Jargon (drawdown, margin, Sharpe); fear of silent losses; unclear next step |
| **Daily questions** | “Am I losing money?” “What does drawdown mean?” “Is my bot still running?” |
| **Success metrics** | Completes onboarding; asks Coach ≥1 explainability question/week; does not churn after first drawdown week |
| **MVP fit** | High — plain-language performance + metric explanations |

---

## P2 — Experienced discretionary trader adopting automation

| | |
| --- | --- |
| **Goals** | Understand *why* the system traded; reconcile with their own judgment |
| **Frustrations** | Black-box bots; can’t see rationale; distrust unexplained entries |
| **Daily questions** | “Why was this trade opened?” “Why did it close?” “Was this strategy or copy?” |
| **Success metrics** | Uses trade explain flows; fewer unsupported escalations; higher bot retention |
| **MVP fit** | High — trade explainability (grounded in data + existing `/ai/explain-trade` where available) |

---

## P3 — Automated strategy operator (power user)

| | |
| --- | --- |
| **Goals** | Monitor multiple strategies; spot underperformers; tune risk |
| **Frustrations** | Fragmented analytics; no “which strategy hurt me this week?” in chat |
| **Daily questions** | “Which strategy contributed most?” “Summarize this week.” “Is risk increasing?” |
| **Success metrics** | Weekly summary usage; strategy comparison questions answered with data |
| **MVP fit** | High — performance summaries / attribution from existing analytics data |

---

## P4 — Portfolio-oriented user / small PM

| | |
| --- | --- |
| **Goals** | Cross-account view; risk concentration; reporting language for others |
| **Frustrations** | Single-account coach snapshot today; multi-account intelligence missing |
| **Daily questions** | “What’s my overall exposure?” “Any unusual drawdown?” |
| **Success metrics** | Cross-account insights (post-MVP) |
| **MVP fit** | Medium — MVP stays single active account; roadmap later |

---

## P5 — Marketplace customer

| | |
| --- | --- |
| **Goals** | Pick and run a subscribed strategy; understand fees/results |
| **Frustrations** | Strategy docs buried; unclear if bot matches marketing claims |
| **Daily questions** | “How is this marketplace bot doing for me?” “Should I pause?” |
| **Success metrics** | Marketplace-linked explain + performance (post-MVP stretch) |
| **MVP fit** | Medium — can surface strategy name/P&L if in snapshot; deeper later |

---

## Persona priority for MVP

1. P1 Beginner  
2. P2 Experienced adopter  
3. P3 Strategy operator  

P4–P5 informed by MVP language but not blockers.
