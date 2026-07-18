# AI Coach Intelligence — Roadmap (Post-MVP)

Ordered after frozen MVP: Explainability & Plain-Language Performance.

| Stage | Theme | Depends on |
| --- | --- | --- |
| MVP | Explainability + plain-language performance | Frozen stack data |
| R2 | Safe configuration guidance | Action Policy Config class |
| R3 | Strategy optimization suggestions | R2 + strategy performance |
| R4 | Portfolio intelligence (multi-account) | Broader snapshot scope |
| R5 | Cross-account insights | R4 |
| R6 | Marketplace recommendations | Marketplace + user subs |
| R7 | Proactive alerts | Notifications + rules |
| R8 | Personalized coaching | Journal + behavior report |

## Alignment with company Product Roadmap

[`docs/PRODUCT_ROADMAP.md`](../../../PRODUCT_ROADMAP.md) Program 1 → then Strategy Builder (Program 2) can consume Coach for “AI-assisted configuration.”

## Rules

- Each stage: Research lite → Design → Build → User test → Iterate  
- No infrastructure audit programs unless measured breakage  
- Launch/UAT deferred items (live OTP/MetaAPI/checkout) stay separate  
