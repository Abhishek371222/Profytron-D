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
| Unit-level paper/live flag | **PASS** (`map-saved-trade-is-paper` 3/3) |
| Full API suite | **149 passed**, 35 skipped |
| Web tsc | **PASS** |
| Web deployed | **`web-00076-2f5`** image tag **`310f96e`** (includes fix + Dockerfile heap bump) |
| History unauth | `GET /api/trading/trades/history` → **401** |
| Authenticated paper/live history flags in production UI | **NOT VERIFIED live** without operator JWT; unit proof + code path on live revision |
| API health / wallet / coach / plans | **200 / 401 / 401 / 200** (unchanged) |

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

Unchanged: MetaAPI adapter, trading processor, wallet, AI Coach, trial, API health.

Deploy note: first two Cloud Builds OOMed on Next build; **Dockerfile** `NODE_OPTIONS=--max-old-space-size=6144` added in `310f96e` solely so the web image can compile. No runtime app logic change beyond heap for build.

---

## Risk assessment

| Risk | Level |
| --- | --- |
| UI flash if callers assumed always-false | Low — real boolean is safer |
| MetaAPI rows suddenly paper | None — still hard-false |
| Deploy web only | Done |

---

## Rollback

```text
Tag: pre-paper-history-fix → b2b88e25e73216b82f0942676bba7e8478e32360
(on origin)
```

Redeploy web at that SHA, or `gcloud run services update-traffic web --to-revisions=<prev>=100`.

---

## Post-deploy

| Item | Value |
| --- | --- |
| Fix commit | `b8fff54` |
| Deploy commit (build heap) | `310f96e` |
| Cloud Build | `aeedce0d-59b4-4e47-8e0c-470f95bcff7c` **SUCCESS** |
| Web revision | **`web-00076-2f5`** 100% |
| Image | `web:310f96e831e22138fbafd6107adcd40282684622` |
| Rollback tag | `pre-paper-history-fix` → `b2b88e2` |
| Final verdict | **READY FOR PRODUCTION** |
