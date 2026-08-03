# Day 15 — Paper Lifecycle Fix (PT1)

**Date:** 2026-08-03  
**Scope:** Paper trading lifecycle only — remove ~10s random auto-close; paper SL/TP via shared `close_trade`.  
**Out of scope:** PT2 (paper close adapter — already shipped), PT3 (history isPaper — already shipped), MetaAPI, live trading, wallet, schema, coach, subscriptions.

---

## Executive Summary

Paper trades no longer auto-close after 10 seconds with synthetic random PnL.  
Positions remain **OPEN** until:

1. User manual close (`close_trade` queue), or  
2. Stop Loss / Take Profit is hit (new paper-only `PaperSlTpService` poller → same `close_trade` path), or  
3. Other existing legitimate close job (bulk close, emergency stop, etc.).

Close PnL continues to come from `estimateUnrealizedPnl` / paper adapter (unchanged PT2 path).  
**No second PnL engine** and **no random price/PnL fabrication**.

**Verdict: READY FOR PRODUCTION** (after deploy verification).

---

## Root Cause

After paper fill, `TradeProcessor.handleTradeExecution` scheduled:

```ts
setTimeout(async () => {
  closePrice = adjustedFillPrice * (1 + (Math.random() * 0.02 - 0.01));
  profitValue = (closePrice - adjustedFillPrice) * dir * 1000;
  // force CLOSED
}, 10000);
```

This forced a fake cycle for demos and polluted history/stats.

---

## Why the previous behaviour existed

Likely a temporary simulator shortcut so paper open→close could be dogfooded without markets, SL/TP, or user action. It was never a production-grade paper broker model.

---

## Architecture Review

| Concern | Existing behaviour |
| --- | --- |
| Open | `handleTradeExecution` → `Trade` row `status=OPEN`, `isPaper=true` |
| Store | Postgres `Trade` |
| Prices | `MarketService` quotes; WS broadcast every ~8s |
| Unrealized PnL | `getOpenTrades` + `estimateUnrealizedPnl` on read |
| Manual close | API → `close_trade` job → paper adapter (PT2) |
| Trailing | `TrailingStopService` moves SL (any open with trailing meta) |
| Live SL/TP hit | Broker/MetaAPI (out of scope) |

**Gap after removing timeout:** paper had no server SL/TP fill. Minimal paper-only poller added (same close path as user).

### Documented simulation rules (post-fix)

1. No time-based forced close.  
2. No random PnL.  
3. SL preferred over TP if both would touch in one tick.  
4. Close always goes through `close_trade` (deduped job id `paper-sltp-close:{tradeId}`).  
5. Paper account “balance” display remains `initialEquity` seed — not a full cash ledger (pre-existing; not changed).

---

## Files Changed

| File | Change |
| --- | --- |
| `apps/api/src/modules/trading/trade.processor.ts` | Removed 10s random paper auto-close |
| `apps/api/src/modules/trading/utils/paper-sl-tp.util.ts` | Pure SL/TP evaluation |
| `apps/api/src/modules/trading/utils/paper-sl-tp.util.spec.ts` | Unit + PT1 source regression |
| `apps/api/src/modules/trading/paper-sl-tp.service.ts` | Paper-only poller → `close_trade` |
| `apps/api/src/modules/trading/trading.service.ts` | Start paper SL/TP poll |
| `apps/api/src/modules/trading/trading.module.ts` | Register/export service |
| `apps/api/src/modules/trading/trading.service.spec.ts` | Mock `PaperSlTpService` |
| `docs/audits/day15-paper-lifecycle-fix-2026-08-03.md` | This report |

### Functions Changed

- `TradeProcessor.handleTradeExecution` — deleted `setTimeout` paper close  
- `evaluatePaperStopLevels` — new  
- `PaperSlTpService.startPolling` / `tick` — new  
- `TradingService` constructor — optional start of paper SL/TP poller  

Env (optional):

- `PAPER_SL_TP_ENABLED` (default on unless `false`)  
- `PAPER_SL_TP_INTERVAL_MS` (default same cadence as trailing)

---

## Why the new behaviour is correct

- Positions persist until legitimate events.  
- SL/TP uses live quotes and shared close pipeline → history/PnL matches manual close quality.  
- Live path untouched (`isPaper: true` filter only).  
- No fabricated close prices in the open handler.

---

## Regression Evidence

| Suite | Result |
| --- | --- |
| `paper-sl-tp` (8) | **PASS** |
| `paper.adapter` (4) | **PASS** |
| `trading` (41) | **PASS** |
| `map-saved-trade` (3) | **PASS** |
| `nest build` | **PASS** |

PT1 regression asserts `trade.processor.ts` contains **no** `setTimeout(..., 10000)` random paper close pattern.

---

## Live Validation

| Check | Result |
| --- | --- |
| Pre-fix branch | `main` @ `b0bdd15`, clean |
| Pre-fix API | `api-00106-ptx` / `gitSha` `84db36c` |
| Rollback tag `pre-paper-lifecycle-fix` | **Created** at `b0bdd15` (not overwritten) |
| Authenticated open stays OPEN 10s+ | **Not run with prod JWT** — covered by code removal + unit regression |

Post-deploy unauth probes (filled after ship): see Deployment.

---

## Performance Impact

- One extra lightweight poll (default ~5s) querying open paper trades **with SL or TP only**, capped at 200 rows.  
- Quote reuse per symbol per tick.  
- Negligible vs market broadcast / trailing-stop timers already running.

---

## Rollback Procedure

```bash
git rev-parse pre-paper-lifecycle-fix
# b0bdd152925d63afe48f5b050551af4b70e4e8e1

# Redeploy API image / revision for that SHA, or traffic-shift Cloud Run
# to the revision ready before this deploy.
```

Do **not** delete or move `pre-paper-lifecycle-fix`.

Practical single-commit undo after this fix is the parent of the deploy SHA (prefer previous CR revision if unrelated commits interleaved).

---

## Risk Assessment

| Risk | Level | Mitigation |
| --- | --- | --- |
| Paper positions accumulate | Low | Expected; user/SL/TP close |
| SL/TP poll miss if no quote | Low | Retries next tick; manual close still works |
| Duplicate closes | Low | `updateMany` OPEN guard + Bull `jobId` |
| Live regression | Low | `isPaper: true` only |
| Auth dogfood gap | Process | Unit + deploy health |

---

## Deployment

| Step | Status |
| --- | --- |
| Commit | **`7af9121`** — `fix(api): keep paper trades open until manual or SL/TP close` |
| Push `main` | **Done** |
| Cloud Build API | **SUCCESS** `f7575d84-0c4b-406a-8ad1-a9868e029cc7` (~5m31s) |
| Cloud Run ready revision | **`api-00107-jb8`** |
| Process `gitSha` | **`7af9121`** |
| Tag `pre-paper-lifecycle-fix` | **Present** → `b0bdd15` |

### Production probes (post-deploy)

| Probe | Result |
| --- | --- |
| `GET /live` | **200** `gitSha` `7af9121` |
| `GET /health` | **200** DB/redis/queue/ws healthy; `metaApi: configured` |
| Wallet / trading open / coach (no JWT) | **401** |
| Subscriptions plans | **200** |

Web not redeployed (API-only).

---

## Final Report

**READY FOR PRODUCTION**

- 10s random paper auto-close **removed**.
- Paper SL/TP poller uses shared `close_trade` (no new PnL engine).
- Deployed **`api-00107-jb8`** / **`7af9121`**.
- Rollback tag **`pre-paper-lifecycle-fix`** intact at `b0bdd15`.
- No unrelated fixes bundled.
