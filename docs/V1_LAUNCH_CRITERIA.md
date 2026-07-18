# Profytron v1.0 — Launch Criteria

**Purpose:** Definition of “Profytron v1.0 is ready.”  
**Rule:** No more foundational systems. Ship a controlled beta, observe users, let Coach Insights + activation metrics guide the next generation.

**Decision engine:** [`ai-coach/coach-insights/`](./ai-coach/coach-insights/) — every capability deepen/cut decision must cite usage evidence when available.

---

## Launch gates

| # | Gate | Status | Evidence / home |
| ---: | --- | :---: | --- |
| 1 | Engineering foundation complete | ✅ | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — Platform / UI / DB / API / Product excellence frozen |
| 2 | Product foundation complete | ✅ | [`product-audit/phase1/FROZEN.md`](./product-audit/phase1/FROZEN.md), [`product-audit/phase2/FROZEN.md`](./product-audit/phase2/FROZEN.md) |
| 3 | AI Coach grounded (explainability + capability track) | ✅ | [`ai-coach/CAPABILITY_ROADMAP.md`](./ai-coach/CAPABILITY_ROADMAP.md) |
| 4 | Coach Insights operational (instrument + admin summary) | ✅* | [`ai-coach/coach-insights/`](./ai-coach/coach-insights/) — *deploy migrate + confirm `/admin/coach-insights` in target env |
| 5 | Launch / UAT live integrations complete | 🟡 | UAT scripts + audit opt-in shipped — evidence pending ([`tracks/D-launch-readiness/TRACK_D_BASELINE.md`](./tracks/D-launch-readiness/TRACK_D_BASELINE.md)) |
| 6 | Performance budgets met | 🟡 | k6 ladder ready (`pnpm load:d7:*`) — attach evidence |
| 7 | Monitoring and alerts enabled | 🟡 | Catalog + runbooks — wire host |
| 8 | Backup restore verified | 🟡 | Tooling exists — record date |
| 9 | Disaster recovery verification | ⬜ | Exercise + record |
| 10 | Security checklist complete | 🟡 | D2 first pass — rotation pending |
| 11 | Load testing with realistic traffic | 🟡 | Harness ready — run 100/500/1000 |
| 12 | Documentation complete for beta operators | 🟡 | Ops dashboard + [`CLOSED_BETA_PLAYBOOK.md`](./CLOSED_BETA_PLAYBOOK.md) + `/status` + runbooks — confirm owners |
| 13 | First beta cohort ready | 🟡 | Allowlist ready — run Weeks 1–3 in [`CLOSED_BETA_PLAYBOOK.md`](./CLOSED_BETA_PLAYBOOK.md); log daily in [`BETA_LOG.md`](./BETA_LOG.md) |

\*Gate 4 code/docs are shipped; mark fully ✅ only after migration + live admin read in the launch environment.

---

## Parallel tracks (v1 execution model)

| Track | Goal | Priority / status |
| --- | --- | --- |
| **A — Customer Success & Adoption** | First aha | ✅ Baseline complete |
| **B — Strategy Builder Professional** | Figma for strategies | 📋 Spec locked · **build deferred** |
| **C — Marketplace Growth** | Trust + discovery | ⏸ Later |
| **D — Launch Readiness** | Live ops / closed beta | 🔄 **Continuous (active now)** |

**Eng allocation:** 70% B (when opened) · 20% D · 10% Insights — see [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md).  
**Closed beta ops:** [`CLOSED_BETA_PLAYBOOK.md`](./CLOSED_BETA_PLAYBOOK.md) · [`BETA_LOG.md`](./BETA_LOG.md)

Detail: [`PRODUCT_ROADMAP.md`](./PRODUCT_ROADMAP.md)

---

## Beta success metrics (must move)

| Metric | Target direction |
| --- | --- |
| Time to first connected broker | Decreasing |
| Time to first active strategy | Decreasing |
| Time to first AI Coach conversation | Decreasing |
| 7-day activation rate | Increasing |
| Coach WAU / follow-up / completion / satisfaction | Per [`ai-coach/coach-insights/KPIS.md`](./ai-coach/coach-insights/KPIS.md) |

---

## Coach Insights decision rules

| Signal | Action |
| --- | --- |
| Intent heavily used (e.g. drawdown explain) | Deepen that capability before inventing new ones |
| Intent rarely used | Investigate discoverability vs no demand — don’t silently expand |
| Abandon after risk questions | Fix risk responses / evidence before new features |
| Low confidence / tool failures spike | Fix data/tools first |
| High thumbs-down on a mode | Prioritize response quality for that mode |

---

## What v1.0 is *not*

- Another excellence / audit infrastructure program  
- Autonomous strategy-building agents  
- Unrestricted tool-calling agents  
- Broad GA without gates 5–13  

---

## Sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| Product | | | |
| Engineering | | | |
| Ops / Security | | | |

**v1.0 declared only when gates 1–13 are ✅ (or explicitly waived with written risk acceptance for a named beta).**
