# Day 15 — Paper History `isPaper` Fix

**Date:** 2026-08-02  
**Issue:** History BFF forced `isPaper: false` for all DB closed trades (Day 15 PT3).  
**Scope:** History mapping only — no trade engine / MetaAPI / paper execution changes.

---

## Root cause

`apps/web/src/app/api/trading/trades/history/route.ts` → `loadSavedClosedTrades` mapped Neon `Trade` rows with:

```ts
isPaper: false as const,
```

even though the SQL already selected `"isPaper"`. The shared type `ClosedHistoryRow` also fixed `isPaper: false` as a literal, which forced the lie at compile time.

Impact: paper closes loaded from the database looked like live trades in Overview/history UI.

---

## Files changed

| File | Change |
| --- | --- |
| `apps/web/src/lib/server/metaapi-closed-trades.ts` | `isPaper: boolean` on `ClosedHistoryRow`; add `mapSavedTradeRow()` with `Boolean(row.isPaper)`; MetaAPI path still sets `isPaper: false` (live broker deals) |
| `apps/web/src/app/api/trading/trades/history/route.ts` | DB rows mapped via `mapSavedTradeRow` |
| `apps/api/src/modules/trading/map-saved-trade-is-paper.spec.ts` | Regression unit tests |

## Functions changed

- **`mapSavedTradeRow`** (new) — pure mapper from DB trade row → history row  
- **`loadSavedClosedTrades`** — uses mapper instead of hard-coded false  
- **`ClosedHistoryRow` type** — `isPaper: boolean`  
- **`closedTradesFromMetaDeals`** — still emits `isPaper: false` for MetaAPI (correct)

---

## Why safe

1. Single field correction for DB-sourced history rows.  
2. MetaAPI-sourced history still correctly marked live.  
3. No schema, wallet, order, or PnL math changes.  
4. Clients that already treat `isPaper` as boolean (e.g. `lib/api/trading.ts`) align better.

---

## Tests

| Suite | Result |
| --- | --- |
| `map-saved-trade-is-paper.spec` | **3/3 PASS** |
| Full API jest | _(recorded at commit time)_ |
| `tsc --noEmit` (apps/web) | **PASS** |

Unit map cases:

- paper `isPaper: true` → `true`  
- live `isPaper: false` → `false`  
- missing → `false`

---

## Live / production validation

| Check | Result |
| --- | --- |
| Unit-level paper/live flag | **PASS** (above) |
| Authenticated history HTML path with paper then real | **NOT VERIFIED live** without operator JWT — depends on web deploy of BFF |
| Regression health API after web deploy | To fill post-deploy |

### Operator smoke after web deploy (with JWT)

```bash
# Paper closes from DB path
curl -sS -H "Authorization: Bearer $TOKEN" \
  "https://www.profytron.com/api/trading/trades/history?limit=20" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
    const j=JSON.parse(d); const rows=j.data?.rows||[];
    console.log(rows.map(r=>({id:r.id,isPaper:r.isPaper,source:j.data?.source})));
  })"
# Expect isPaper:true for paper ledger closes when source is database.
```

---

## Regression

Unchanged subsystems: MetaAPI adapter, trading processor, wallet, AI Coach, trial, health. Code diff is web BFF + type only.

---

## Risk assessment

| Risk | Level |
| --- | --- |
| UI flash if callers assumed always-false | Low — real boolean is safer |
| MetaAPI rows suddenly paper | None — still hard-false |
| Deploy web only | Required for Next BFF |

---

## Rollback

```text
Tag: pre-paper-history-fix → b2b88e25e73216b82f0942676bba7e8478e32360
```

Redeploy web (and any co-deployed bits) from that SHA, or restore traffic to previous web Cloud Run revision.

---

## Post-deploy

_To complete after Cloud Build web._

| Item | Value |
| --- | --- |
| Commit | _(pending)_ |
| Web revision | _(pending)_ |
| Final verdict | _(pending)_ |
