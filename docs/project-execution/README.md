# Project Execution — Operational Control Center

**Rule:** Confidence increases only when an **evidence artifact** is linked.  
Task completion without evidence does **not** raise release readiness.

**Canonical paths**
- Day plans: [`../aaradhya-45-day-complete-plan/00-days/`](../aaradhya-45-day-complete-plan/00-days/)
- Residual tasks: [`../aaradhya-45-day-complete-plan/01-tasks/`](../aaradhya-45-day-complete-plan/01-tasks/)
- RC package: [`../releases/`](../releases/)
- Launch gates: [`../V1_LAUNCH_CRITERIA.md`](../V1_LAUNCH_CRITERIA.md)

## Evidence gates (every claim maps here)

| Gate | Goal | Required evidence |
|------|------|-------------------|
| Engineering Complete | Feature implemented | PR, unit tests, docs |
| QA Complete | Functionality verified | Reports, screenshots, videos |
| Production Hardened | Safe under expected conditions | Load tests, concurrency, security checks |
| Operationally Proven | Works production-like | Monitors, alerts, webhooks, restore |
| Release Ready | Ready for users | Beta, rollback drill, deploy verification |

## “100%” = objective release checklist

Open [`MASTER_RELEASE_READINESS.md`](./MASTER_RELEASE_READINESS.md).  
A dimension is only green when `MASTER_EVIDENCE_INDEX.md` lists a valid artifact.

## Daily ritual

1. Open today’s day plan (or create `Days/Day-NN/EVIDENCE.md`)
2. Produce at least one artifact under `Evidence/`
3. Link it in `MASTER_EVIDENCE_INDEX.md`
4. Re-evaluate the relevant gate row in `MASTER_RELEASE_READINESS.md`
5. Never mark “Completed” without index entry

## Honesty bound

Engineering can approach high nines (auth/throttle/idempotency code).  
**True production 10/10** also requires live runbooks exercised: staging money, load evidence, DR drill, beta objectives. Those rows stay yellow until proof lands here.
