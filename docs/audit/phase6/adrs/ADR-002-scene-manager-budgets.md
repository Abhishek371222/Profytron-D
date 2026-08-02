# ADR-002 — Spline SceneManager & GPU Memory Budgets

- **Status:** Accepted
- **Date:** 2026-08-01

## Context

The 3D-first rebuild introduces Spline scenes owned exclusively by `SceneManager` (`platform.experience.scenes`). Soft experience budgets (ADR-001) remain; hard GPU memory caps are enforced at runtime.

## Decision

| Tier | Max GPU memory | WebGL |
|------|----------------|-------|
| Desktop High | 120 MB | Full layers + ambient |
| Medium | 60 MB | Drop particles/glass |
| Low | 20 MB | Poster + CSS depth |
| Mobile | 0 MB | Never mount WebGL |

- Pages never import `@splinetool/*`; only `SceneManager` may create/dispose instances.
- Soft Spline budget in `EXPERIENCE_BUDGETS.spline`: 10 ms/frame GPU, 120 MB, 1500 ms to interactive.
- On memory exceed: destroy oldest scene, keep poster, emit `scene.evicted`.
- FPS &lt; 45 for 2s → degrade LOD/particles/reflection; recover ≥ 55 for 3s → step up.

## Consequences

- Empty `NEXT_PUBLIC_SPLINE_*` URLs are valid (poster/CSS fallback) for CI and mobile.
- Concurrent cap: 1 interactive + 0–1 ambient.
- Prefetch is bytes-only (Cache API / fetch) — never instantiates WebGL.
