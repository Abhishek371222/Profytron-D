# Phase Numbering Crosswalk

**Purpose:** Prevent confusing Master Progress product phases with historical
`docs/audit/phaseN` platform-engine folders. **Do not rename** historical
folders — this map is the source of truth for nomenclature.

| Master Progress (product surfaces) | Meaning | Do **not** equate with | Actual content of that folder |
|---|---|---|---|
| Phase 1 — Platform Audit | Architecture, debt, baselines | `docs/audit` root / `PHASE1_AUDIT.md` | **Aligned** — platform inventory |
| Phase 2 — Trust & Brand | Landing credibility, badges, testimonials | `docs/audit/phase2` | Platform foundation / cache / scheduler |
| Phase 3 — Homepage | Hero, CTAs, LCP | `docs/audit/phase3` | MT5 sync engine / deltas |
| Phase 4 — Navigation | Sidebar, cmd-K, IA | `docs/audit/phase4` | Render scheduler / module isolation |
| Phase 5 — Dashboard | Product dashboard UX / widgets | `docs/audit/phase5` | **Motion engine** |
| Phase 6 — Trading Platform | Execution, risk, copy trading | `docs/audit/phase6` | **Experience / shaders / coach orb** |
| Phase 7 — Marketplace | Listings, subscribe lifecycle | _(no `docs/audit/phase7`)_ | Platform freeze after phase 6 |
| Phase 8 — AI Coach | Coach product readiness | `docs/audit/phase6/AI_COACH_SPEC.md` | Visual identity only |
| Phase 9A — Wallet / Billing / Payments | Wallet races, webhooks, demo gate | _(no matching audit phase)_ | See Track D payments docs |

## Related documentation roots

| Root | Scope |
|---|---|
| `docs/audit/` | Platform excellence engines (frozen after phase 6) |
| `docs/ui-audit/` | Responsive / runtime UI measurement |
| `docs/product-audit/` | Product journey measure & completion |
| `docs/tracks/` | Launch / growth track runbooks |
| `docs/master-progress/` | **This** product-phase verified status + audits |
| `docs/ai-coach/` | Coach program specs beyond audit phase6 |

## Rule

When a chat report says “Phase N complete,” verify against
`docs/master-progress/MASTER_PROGRESS.md` and code — never against folder name
pattern-matching alone.
