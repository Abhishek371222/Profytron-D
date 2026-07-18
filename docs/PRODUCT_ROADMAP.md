# Product Development Roadmap

Engineering foundation is closed ([`PROJECT_STATUS.md`](./PROJECT_STATUS.md)).  
**v1 target:** [`V1_LAUNCH_CRITERIA.md`](./V1_LAUNCH_CRITERIA.md)

This is **not** Phase X. Do **not** start another foundational systems / engine / audit program.

**Delivery cycle:** Research → Design → Build → Test with users → Iterate  

---

## Engineering time allocation (locked)

| Share | Focus | Notes |
| ---: | --- | --- |
| **70%** | **Track B — Strategy Builder Professional** | Primary differentiator after Coach — *build when Strategy work is opened* |
| **20%** | **Track D — Launch Readiness** | Continuous weekly — do not wait for “finished product” |
| **10%** | **Coach Insights–driven improvements** | Refine journeys from real usage |

**Current focus:** Operator Weeks 1–3 → closed beta (20–50) → Coach Insights → open Track B only when evidence-gated.  
**Playbook / log:** [`CLOSED_BETA_PLAYBOOK.md`](./CLOSED_BETA_PLAYBOOK.md) · [`BETA_LOG.md`](./BETA_LOG.md)

**Current execution hold (owner):** Strategy Builder implementation **deferred** — “strategy later, not now.” Until Track B is opened, put capacity into **Track D (20%+)** and **Insights (10%+)** without inventing new platforms.

```text
Track A  ████████████  Complete (baseline)
Track B  ██████████░░  Spec locked · BUILD DEFERRED
Track C  ░░░░░░░░░░░  Later
Track D  ██████████░░  Run continuously ← active now
Insights ████░░░░░░░░  Decision engine · continuous
```

---

## Decision engine

[`ai-coach/coach-insights/`](./ai-coach/coach-insights/) + Track A activation metrics.

| If… | Then… |
| --- | --- |
| Intent heavily used | Deepen that path |
| Intent rarely used | Check discoverability vs demand |
| Abandon after risk / builder steps | Fix that response/UX first |
| Tool failures / low confidence spike | Fix data/tools before features |

---

## Four tracks

| Track | Goal | Status |
| --- | --- | --- |
| **A — Customer Success & Adoption** | First aha | ✅ Baseline complete → [`tracks/A-customer-success/`](./tracks/A-customer-success/) |
| **B — Strategy Builder Professional** | “Figma for trading strategies” | 📋 Spec locked · **build deferred** → [`tracks/B-strategy-builder/`](./tracks/B-strategy-builder/) |
| **C — Marketplace Growth** | Trust + discovery | ⏸ Later |
| **D — Launch Readiness** | Live ops / beta / payments | 🟡 Eng baseline complete → [`tracks/D-launch-readiness/TRACK_D_BASELINE.md`](./tracks/D-launch-readiness/TRACK_D_BASELINE.md) |

---

## Track B (when opened) — vision

Not a config form — **Figma for trading strategies**. User immediately understands: what they’re building, why it works, how risky, what changed, what will happen.

| Program | Focus |
| --- | --- |
| B1 | Strategy Creation Experience |
| B2 | Strategy Explainability (reuse Coach) |
| B3 | Parameter Intelligence |
| B4 | Risk Preview before activation |
| B5 | Version History (diff / rollback / notes) |
| B6 | Strategy Comparison |
| B7 | Backtest Explanation (Coach) |

**Hard lock:** Coach **explains** — never builds or activates autonomously.  
Full charter: [`tracks/B-strategy-builder/README.md`](./tracks/B-strategy-builder/README.md)

---

## Track D — continuous weekly (locked order)

🥇 D2 Security → 🥈 D1 Infra → 🥉 D4 MetaAPI → D3 Payments → D5 Email → D7 Load → D8 Ops → D6 Beta  

Detail: [`tracks/D-launch-readiness/EXECUTION_ORDER.md`](./tracks/D-launch-readiness/EXECUTION_ORDER.md)  
After D: controlled beta (20–50) per [`CLOSED_BETA_PLAYBOOK.md`](./CLOSED_BETA_PLAYBOOK.md), then open Track B from Insights — not assumptions.

---

## What we will not build now

| Don’t | Why |
| --- | --- |
| Another platform / engine / architecture | Already mature & frozen |
| Another audit framework | Excellence phases closed |
| More AI abstractions / agents | Coach pipeline grounded |
| Track C Marketplace expansion | Queued after B + D |
| Track B implementation | Owner hold: strategy later |

---

## Operating rules

| Do | Don’t |
| --- | --- |
| Run D weekly toward v1 gates | Block all progress waiting for Builder |
| Keep Insights feeding decisions | Add Coach capabilities from intuition |
| Open Track B only when strategy work is authorized | Autonomously build strategies via AI |

---

*Allocation locked: 70% B (deferred) / 20% D (active) / 10% Insights. Definition of done: [`V1_LAUNCH_CRITERIA.md`](./V1_LAUNCH_CRITERIA.md).*
