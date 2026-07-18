# Track B — Strategy Builder Professional

**Revenue priority:** ★★★★★ (highest product ROI after activation)  
**Build status:** 📋 **Spec locked · IMPLEMENTATION DEFERRED** (“strategy later, not now”)  
**Parent:** [`../PRODUCT_ROADMAP.md`](../PRODUCT_ROADMAP.md)

## Mission

Make Strategy Builder feel like **Figma for trading strategies** — not a config screen.

The user should immediately understand:

- what they’re building  
- why it works  
- how risky it is  
- what changed  
- what will happen  

## Hard locks

| Do | Don’t |
| --- | --- |
| Progressive builder, validation, templates | Autonomous strategy generation / activation |
| Reuse Alpha Coach for explain (B2/B3/B7) | New agent frameworks |
| Risk preview before activate (B4) | Hide risk to “convert” |
| Version history + compare (B5/B6) | Silent overwrites without history |

## Programs (B1–B7)

| ID | Program | Spec |
| --- | --- | --- |
| B1 | Strategy Creation Experience | [`B1_CREATION.md`](./B1_CREATION.md) |
| B2 | Strategy Explainability | [`B2_EXPLAINABILITY.md`](./B2_EXPLAINABILITY.md) |
| B3 | Parameter Intelligence | [`B3_PARAMETERS.md`](./B3_PARAMETERS.md) |
| B4 | Risk Preview | [`B4_RISK_PREVIEW.md`](./B4_RISK_PREVIEW.md) |
| B5 | Version History | [`B5_VERSIONS.md`](./B5_VERSIONS.md) |
| B6 | Comparison | [`B6_COMPARISON.md`](./B6_COMPARISON.md) |
| B7 | Backtest Explanation | [`B7_BACKTEST.md`](./B7_BACKTEST.md) |

## When to open build

Owner authorizes Strategy Builder sprint. Until then: keep specs current; put eng time into Track D + Insights.

## Exit criteria (for future build)

- [ ] Creation flow progressive + validated  
- [ ] “Explain this strategy” grounded via Coach  
- [ ] Parameters have plain-language help  
- [ ] Risk preview before activation  
- [ ] Versions with diff/rollback/notes  
- [ ] A vs B comparison  
- [ ] Backtest numbers explained in plain language  
- [ ] No new platform/engine/architecture
