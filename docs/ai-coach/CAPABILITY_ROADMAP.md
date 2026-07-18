# AI Coach Capability Roadmap

Extends the grounded explainability MVP ([`program1/phase2/`](./program1/phase2/)).  
Same pipeline: **Intent → Tools → Evidence → Explanation**. No agents.

**Company product programs** (Strategy Builder, Marketplace, etc.) remain in [`docs/PRODUCT_ROADMAP.md`](../PRODUCT_ROADMAP.md).  
This file is the **AI Coach capability track** only.

---

## Priority (max user value on existing architecture)

| Priority | Capability program | User value | Complexity | Status |
| ---: | --- | :---: | :---: | --- |
| ✅ Done | Explainability MVP | ★★★★★ | — | Shipped |
| ✅ Done | **Portfolio Intelligence** | ★★★★★ | Medium | [Frozen](./program2-portfolio-intelligence/FROZEN.md) |
| ✅ Done | Strategy Intelligence | ★★★★★ | High | [Frozen](./program3-strategy-intelligence/FROZEN.md) |
| ✅ Done | Risk Intelligence | ★★★★★ | Medium | [Frozen](./program4-risk-intelligence/FROZEN.md) |
| ✅ Done | Performance Trend Intelligence | ★★★★☆ | Medium | [Frozen](./program5-performance-trends/FROZEN.md) |
| ✅ Done | Personalized Advisory Guidance | ★★★★☆ | High | [Frozen](./program6-personalized-advisory/FROZEN.md) |

**Coach capability track: complete** on the grounded evidence layer.

**Next investment (locked):** Four parallel **v1 tracks** — Customer Success & Adoption (highest), Strategy Builder, Marketplace Growth, Launch Readiness — guided by Coach Insights. See [`../V1_LAUNCH_CRITERIA.md`](../V1_LAUNCH_CRITERIA.md) and [`../PRODUCT_ROADMAP.md`](../PRODUCT_ROADMAP.md).

Do **not** start another Coach intelligence program until usage evidence prioritizes it.

---

## Long-term vision (delivered shape)

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

**Not in the diagram:** agent orchestration, autonomous trading, recursive planning, multi-agent systems.

---

## Operating rule

| Do | Don’t |
| --- | --- |
| Extend Intent → Tools → Evidence → Explanation | Replace the pipeline with agents |
| Stay advisory for guidance | Auto-execute strategies |
| Honest “data missing” answers | Invent session/hold-time/market causes |

*Track closed 2026-07-18 — Programs 2–6 shipped on `@profytron/ai-coach` explainability package.*
