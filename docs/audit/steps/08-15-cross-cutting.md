# Steps 8–15 — State, Animation, Memory, Network, Assets, A11y, Build, Code Quality

## Step 8 — State management

| Store / cache | Role | Issues |
|---------------|------|--------|
| `useAuthStore` (persist) | Auth + sessionReady | Circular import with api client |
| TanStack Query | Server state | Broad invalidation on trade events; 60s poll + socket duplicate refresh paths |
| `dashboard-cache` / `overview-account-cache` | sessionStorage hydration | Can show stale MetaApi figures across account switches (mitigated by clear on no-broker) |
| `useUIStore` / tutorial / bootstrap | UI chrome | OK |
| `useBuilderStore` | reactflow types | Premature global state for unfinished builder |

**Simplifications:** single dashboard query store or batch endpoint; narrower invalidate keys; remove builder store until needed.

## Step 9 — Animation

| Surface | Library | Cost signal |
|---------|---------|-------------|
| Landing | framer-motion + Lenis | `/` **26 long tasks / 7127 ms** |
| Login earth | three.js + HDR/JPG ~3.4MB | FCP **8452 ms** |
| Dashboard chrome | framer-motion | Present across layout; lower long-task count once loaded |
| CinematicCursor | gsap | 1 file — verify not on dashboard |
| Confetti | canvas-confetti | Episodic |

Many animations animate layout-affecting properties via framer-motion defaults — treat as **not compositor-only** until audited per component in Phase 2 with paint profiler.

## Step 10 — Memory

| Sample | Heap MB | DOM nodes | Notes |
|--------|---------|-----------|-------|
| Playwright `/` | 157 | — | Marketing heavy |
| Playwright `/connected-accounts` | 177 | — | Largest auth route |
| Playwright dashboard family | 123–131 | — | |
| 3-min dashboard growth proxy | ~10 flat | 238 | **Auth likely failed in long sampler — NOT a clean leak test** |

**30m / 1h / 4h:** marked **NOT MEASURED** (requires overnight harness). Proxy artifact: `docs/audit/data/memory/dashboard-3min-growth.json`.  
Leak suspects from code review: wallet ad-hoc socket, three.js contexts on auth remount, Query cache growth without gc.

## Step 11 — Network

- REST parallel dashboard fan-out (good) but multi-RTT to Neon.
- WS `/trading` + `/coach`; wallet duplicate connection risk.
- Market quotes cached ~30s server-side; client also polls.
- No HTTP cache headers on most `/v1` JSON (by design for private data).
- Health endpoint anti-pattern: 1.5s timeout wait.

## Step 12 — Assets

**Evidence:** `docs/audit/data/assets-inventory.json`

| Total public/ | 7.39 MB / 36 files |
|---------------|---------------------|
| Largest | `auth/earth/env.hdr` 1.51 MB |
| | `earth_daymap.jpg` 1.41 MB |
| | `continent-points.json` 1.32 MB |
| | `hero-trading-3d.png` 0.72 MB |

Next image config already avif/webp. Earth assets dominate login cost.

## Step 13 — Accessibility

- LHCI config targets a11y ≥0.95 (`.lighthouserc.json`).
- Full axe run this session: **partial** — rely on existing CI + manual notes: framer-motion should respect `prefers-reduced-motion` (verify globally).
- Login WebGL has no text alternative beyond form — ensure decorative `aria-hidden`.

## Step 14 — Production build

| Metric | Value |
|--------|-------|
| Build command | `next build --webpack` |
| Duration | ~239 s (ANALYZE=true) |
| Exit | 0 |
| Output | standalone + `.next/analyze/*.html` |
| Source maps | `productionBrowserSourceMaps: false` |
| Compression | `compress: true` |

## Step 15 — Code quality

| Finding | Evidence |
|---------|----------|
| Large files | payments.service 1700 LOC, auth.service 1536, connected-accounts page 1039 |
| Circular deps | 3 (madge) — see step 01 |
| Client-heavy pages | 65/76 |
| Dead/underused | reactflow builder incomplete |
| Duplication | Next RH + Nest for similar trading/broker paths |
