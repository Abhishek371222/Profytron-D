# PT-W01 — Landing LCP evidence (Day 13)

**Date:** 2026-08-02  
**URL measured:** https://www.profytron.com/  
**Tool:** Lighthouse 11.7.1 mobile (headless Chrome)

## Baseline (prod current deployment, before local defer code shipped)

| Metric | Value |
|--------|-------|
| Performance score | 0.54 |
| **LCP** | **3.9 s** (numeric ~3949 ms) |
| FCP | 1.1 s |
| TBT | 1,900 ms |
| Speed Index | 6.7 s |
| CLS | 0 |

Raw JSON: [lighthouse-before.json](./lighthouse-before.json)

**Sheet target:** LCP &lt; 4s → **met on this sample** (margin ~0.05s — needs headroom).  
**DoD from playbook:** median of 3 runs + post-change evidence. Still **In Progress**.

## Code changes (repo — continuous, not yet on prod until deploy)

1. `LandingPageClient.tsx` — delay ambient WebGL + experience engine until after load + idle
2. `SceneProvider.tsx` — delay sceneManagerApi.start() until idle
3. `RotatingWords.tsx` — mobile ≤767: first word only (no interval)
4. `LenisProvider.tsx` — skip smooth scroll on mobile
5. `HeroAmbientVisual.tsx` — no mount of WebGL scene on mobile
6. `PublicPageLayout.tsx` — marketing ambient WebGL off on mobile; overflow-x hidden shell

## Expected impact after deploy

- Lower main-thread contention early (TBT / SI), more stable sub-3.5s LCP median on mobile
- First paint path keeps CSS ambient only

## After deploy — remeasure

```bash
npx lighthouse https://www.profytron.com/ --only-categories=performance --form-factor=mobile \
  --output=json --output-path=docs/aaradhya-45-day-complete-plan/evidence/day-13/lighthouse-after-1.json \
  --chrome-flags="--headless --no-sandbox"
# repeat ×3; log median LCP
```

## KPI update when closed

Set Landing LCP mobile = median seconds; Notes = link this folder + git SHA.
