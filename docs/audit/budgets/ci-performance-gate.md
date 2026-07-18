# CI Performance Gate — Design Proposal (not wired)

Status: **documentation only** for Phase 1. Do not merge as required checks until baselines stabilize on production builds.

## Goals

Fail PRs that regress:

1. Bundle size (total client JS or critical route chunks)
2. LCP / FCP / INP (LHCI or Playwright CDP)
3. Memory footprint on `/dashboard` after 60s idle
4. FPS during scroll on `/` (optional, GPU lab)
5. Duplicate package versions for heavy deps (`pnpm list`)

## Proposed workflow additions

Extend `.github/workflows/lighthouse.yml`:

- Remove `continue-on-error: true` once green for 2 weeks on main.
- Add `ANALYZE=true` build artifact upload of chunk-sizes JSON.
- Add step comparing `docs/audit/budgets/route-budgets.json` budgets vs measured.

## Suggested thresholds (v1)

| Check | Fail if |
|-------|---------|
| `static JS total` | > baseline + 5% |
| Dashboard page+layout chunks | > 200 KB combined ungzipped |
| LHCI LCP `/login` | > 4000 ms (interim; target 2500) |
| LHCI TBT `/` | > 600 ms |
| Accessibility | keep error at 0.95 |
| `pnpm why` duplicates | any duplicate `react` / `framer-motion` major |

## k6 gate

Install k6 in CI; run `performance-tests/api-performance-test.js` at 50 VUs; fail if p95 `/v1/market/quotes` > 100ms or error rate > 1%.

## Ownership

Performance gate owned by whoever owns Rendering + Caching (see Step 32).
