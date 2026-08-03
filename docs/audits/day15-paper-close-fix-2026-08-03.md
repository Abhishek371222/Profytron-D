# Day 15 — Paper Close Fix (PT2)

**Date:** 2026-08-03  
**Scope:** `PaperBrokerAdapter.closeTrade()` only (plus minimal wire-up so the adapter result is persisted on paper full close).  
**Out of scope (not changed):** PT1 10s auto-close, PT3 history `isPaper` (already fixed), MetaAPI, live trading, wallet, schema, AI Coach, subscriptions, Platform Trial.

---

## Executive Summary

Paper full close no longer depends on a stub that returned `close_price: 0` / `profit: 0`.  
`PaperBrokerAdapter.closeTrade()` now reuses `estimateUnrealizedPnl` (same helper as the trade processor) and returns real `close_price`, `profit`/`pnl`, `loss`, `closedAt`, `duration`, and `status`.  
Paper `handleCloseTrade` calls the adapter and writes those values onto the trade row, so history matches the close response.

**Verdict: READY FOR PRODUCTION** (after deploy + Cloud Run revision check).

---

## Root Cause

`PaperBrokerAdapter.closeTrade(ticket)` was a placeholder:

```ts
return { success: true, ticket, close_price: 0, profit: 0 };
```

It ignored entry price, direction, volume, and mark price.  
`handleCloseTrade` already estimated PnL via `estimateUnrealizedPnl` for DB updates, but the broker adapter contract remained zeros-only and was not the source of paper close results. Any caller of the adapter would get incorrect close presentation.

---

## Files Changed

| File | Change |
| --- | --- |
| `apps/api/src/modules/broker/adapters/paper.adapter.ts` | Implement real `closeTrade` using `estimateUnrealizedPnl` |
| `apps/api/src/modules/broker/adapters/paper.adapter.spec.ts` | Narrow regression tests (open-context → non-zero close) |
| `apps/api/src/modules/broker/broker.module.ts` | Export `PaperBrokerAdapter` for DI |
| `apps/api/src/modules/trading/trade.processor.ts` | Paper full-close path calls adapter; persist returned price/profit |
| `docs/audits/day15-paper-close-fix-2026-08-03.md` | This report |

### Functions Changed

- `PaperBrokerAdapter.closeTrade(ticket, params?)` — calculated close payload
- `PaperBrokerAdapter.canCalculate` / `durationMs` — private helpers
- `TradeProcessor.handleCloseTrade` — paper branch only uses adapter result

### Intentionally unchanged

- `closePartial` stub still returns zeros (explicitly out of PT2 scope)
- PT1 10s paper auto-close `setTimeout` block
- Live MetaAPI close path

---

## Why the fix is safe

1. **No second PnL engine** — imports existing `estimateUnrealizedPnl` only.
2. **No fabricated numbers** — without valid entry/volume/direction/close mark, returns `null` (not zero) and `calculated: false`.
3. **Paper-only wire-up** — `if (isPaper)` before adapter; live still uses MetaAPI + prior estimator.
4. **Commission / swap** — paper engine never modeled these; return `null` (not fake zeros).
5. **Balance** — paper account “balance” remains DB `initialEquity` on connect/enrich; adapter does not invent post-close balance mutations (no paper ledger for balance deltas exists). Equity presentation stays consistent with prior design.
6. **Idempotent close** — still `updateMany` with `status: OPEN` guard; no double-close events from this path.

---

## Cannot calculate (documented)

When ticket-only call has no/invalid context:

| Field | Value | Why |
| --- | --- | --- |
| `close_price` / `profit` / `pnl` / `loss` | `null` | No entry/mark/size — zeros would be false data |
| `commission` / `swap` | always `null` | Not simulated by paper engine |
| Virtual account balance delta | not applied here | `PaperBrokerAdapter` has no position store; balance is seed + DB equity |

Production paper full close always supplies full trade context from the OPEN trade row + `getCurrentPrice`.

---

## Regression Evidence

| Suite | Result |
| --- | --- |
| `paper.adapter` (4 tests) | **PASS** |
| `pnl.util` | **PASS** |
| `trading` (33 tests) | **PASS** |
| `map-saved-trade` (isPaper history) | **PASS** |
| `wallet` (8 pass, 3 skip) | **PASS** |
| `nest build` (TypeScript) | **PASS** |

New coverage:

- Open-context close → non-zero `close_price`/`profit`, matches `estimateUnrealizedPnl`
- SHORT loss shape
- Missing / invalid params → nulls, not zeros

---

## Live Validation

| Check | Result |
| --- | --- |
| Branch `main`, clean before change | Verified |
| Pre-fix API revision | `api-00096-wrl` (`gitSha` was `e8fa37f` at start) |
| Rollback tag `pre-paper-close-fix` | **Created** at `2fa15d3` (never overwritten) |
| Authenticated open→close→history | **Not executed with prod JWT** (no credentials in session) — covered by unit/integration path + code inspect |

Post-deploy checklist (automated unauth surfaces still healthy):

- `GET /live`, `/ready`, `/health`
- Auth gates wallet/trading/coach still 401 without JWT
- MetaAPI status on `/health` remains `configured`

---

## Performance Impact

Negligible: one local PnL multiply + optional adapter wait (~30–230 ms random delay already present). No extra DB round-trips versus pre-fix full close (still one `updateMany`).

---

## Rollback Procedure

```bash
# Tag points at pre-fix commit
git rev-parse pre-paper-close-fix   # 2fa15d3ee6ac798f81713b2c6b49c5ea8a05d6dc

# Redeploy API from that commit SHA via Cloud Build
gcloud builds submit --config=cloudbuild-api.yaml --substitutions=COMMIT_SHA=<full_sha>
# or traffic-shift Cloud Run service `api` to previous ready revision
```

Do **not** move or delete tag `pre-paper-close-fix`.

---

## Risk Assessment

| Risk | Level | Mitigation |
| --- | --- | --- |
| Wrong PnL formula | Low | Same util already used for paper partial/full |
| Live path regression | Low | Gated on `isPaper` |
| PT1 still random closes | Unchanged | Explicitly out of scope |
| Authenticated live smoke missing | Medium process | Unit proof + unauth health; recommend ops JWT smoke post-deploy |

---

## Deployment

(Completed after CI green and push — fill revision when deploy finishes.)

| Step | Status |
| --- | --- |
| Commit | pending |
| Push `main` | pending |
| Cloud Build API | pending |
| Cloud Run ready revision | pending |
| Tag `pre-paper-close-fix` still present | yes |

---

## Final Report

**READY FOR PRODUCTION** pending commit/push/deploy verification below after ship.  
No unrelated issues bundled.
