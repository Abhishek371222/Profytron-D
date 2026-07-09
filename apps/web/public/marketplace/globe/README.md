# Marketplace Globe Assets

## 3D Globe (production)
- **`continent-points.json`** — 14k+ lat/lng dots sampled from world atlas (continents)
- **`MarketplaceGlobeCanvas.tsx`** — WebGL globe via `react-globe.gl` + Three.js
  - Dotted continents, wireframe mesh, animated trading arcs (20s dash flow)
  - Pulsing hub rings at NY, London, Dubai, Singapore, Tokyo, Sydney
  - 120s auto-rotate, floating particles, teal atmosphere glow

## Reference images (from `/animations`)
- `1.png` — Full hero mockup target
- `2.png`–`6.png` — Asset specs (wireframe, continents, routes, particles)

## Regenerate continent dots
```bash
cd apps/web && node scripts/generate-globe-points.mjs
```

Brand colors: `#348398`, `#9FE1F3`, `#ADFFFC`.
