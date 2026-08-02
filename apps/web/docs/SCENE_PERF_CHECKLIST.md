# 3D Scene Performance Validation Checklist

Use after wiring Spline URLs (`NEXT_PUBLIC_SPLINE_*`). Empty URLs correctly stay on poster/CSS (mobile/CI).

## Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance (home, pricing) | 95–100 |
| LCP | &lt; 2.5s |
| FCP | &lt; 1s |
| TBT | &lt; 150ms |
| Scene pages FPS | ~60 (degrade if &lt;45 for 2s) |

## Manual checks

1. **Mobile / Low** — DevTools device mode + throttle: no WebGL canvas under SceneSlot; poster + CSS depth only (`gpuMemoryBudget` mobile = 0).
2. **Prefetch** — On `/`, Network: poster/scene bytes for pricing/marketplace may prefetch; no Spline Application until idle + viewport.
3. **Memory eviction** — Mount two interactive scenes if possible; with Medium budget (60MB), oldest instance disposed, poster remains; metrics `scene.evicted`.
4. **FPS degrade** — CPU throttle 4× on a scene page; after ~2s under 45 FPS, degrade level increments (`NEXT_PUBLIC_PLATFORM_METRICS=1` panel).
5. **A11y** — `prefers-reduced-motion: reduce` → no WebGL; motion off.
6. **Ownership** — `rg "@splinetool" apps/web/src` only hits `scene-manager.ts` (+ package lock). Pages use `SceneSlot` only.
7. **Dashboard speed** — Navigating `/dashboard` ↔ `/settings` has no cinematic GSAP camera (marketing-only transitions).

## Analytics

Enable `NEXT_PUBLIC_PLATFORM_METRICS=1` and inspect ExperienceDevPanel:

- `scene.loaded` / `scene.failed` / `scene.fallback`
- `fallbackRate`
- FPS + GPU budget tier

Compress or cut scenes with high `SceneFailed` or `FallbackRate`.
