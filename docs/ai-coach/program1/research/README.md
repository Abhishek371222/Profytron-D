# AI Coach Intelligence — Program 1 Phase 1 (Research)

**Mode:** Measure & Design only — product blueprint, **not** production code.  
**Locks:** Backend architecture, Platform, Database, API contracts, Trading engine, Auth, Sync, Rendering/Motion/Experience engines. No new AI models. No prompt implementation. No feature implementation.

## Mission

Define what the AI Coach should become over 2–3 years, and freeze the **smallest high-value MVP** that can ship on the frozen stack.

## Document index

| Doc | Purpose |
| --- | --- |
| [AI_COACH_VISION.md](./AI_COACH_VISION.md) | Differentiator & 2–3 year north star |
| [USER_PERSONAS.md](./USER_PERSONAS.md) | Target personas |
| [USER_PROBLEMS.md](./USER_PROBLEMS.md) | Problem catalog |
| [USE_CASE_CATALOG.md](./USE_CASE_CATALOG.md) | Use cases |
| [CAPABILITY_MAP.md](./CAPABILITY_MAP.md) | What exists vs requires work |
| [DATA_INVENTORY.md](./DATA_INVENTORY.md) | Data the Coach can / cannot access today |
| [TOOL_INVENTORY.md](./TOOL_INVENTORY.md) | APIs & internal tools |
| [ACTION_POLICY.md](./ACTION_POLICY.md) | Informational → Execution policy |
| [CONVERSATION_PATTERNS.md](./CONVERSATION_PATTERNS.md) | Reusable flows (design only) |
| [SAFETY_GUIDELINES.md](./SAFETY_GUIDELINES.md) | Boundaries & escalation |
| [EXPLAINABILITY_FRAMEWORK.md](./EXPLAINABILITY_FRAMEWORK.md) | How explanations must be written |
| [MVP_SCOPE.md](./MVP_SCOPE.md) | **Frozen** first slice |
| [ROADMAP.md](./ROADMAP.md) | Post-MVP programs |
| [EXIT_CRITERIA.md](./EXIT_CRITERIA.md) | Gate before implementation |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | Evidence summary |

## Current-state verdict (evidence)

Alpha Coach today is **FAQ + prompt-grounded chat** with human escalation and a **coarse account snapshot** (`CoachService.buildAccountSnapshot`). It is **not** a tool-calling agent. Rich explain/performance APIs already exist outside the coach module (`/ai/explain-trade`, `/analytics/*`, snapshots) and are **mostly unused** by the chat path.

## Frozen MVP recommendation

**Explainability + Plain-Language Performance** — see [MVP_SCOPE.md](./MVP_SCOPE.md).
