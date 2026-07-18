# Phase 1B — Metric Taxonomy

Measure-only inventory. Each row must land in per-route JSON and roll into a report. Gaps are explicit (not silent).

## Rendering / Core Web Vitals

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| First Paint (FP) | PerformanceObserver `paint` | |
| First Contentful Paint (FCP) | paint + web-vitals / LH | |
| Largest Contentful Paint (LCP) | LCP entry + element attribution | Record LCP node selector/size |
| Interaction to Next Paint (INP) | web-vitals / synthetic interactions | Tier A: click primary CTA / first button when present |
| Total Blocking Time (TBT) | Long tasks between FCP–TTI proxy | Headless proxy OK; label as lab |
| Cumulative Layout Shift (CLS) | `layout-shift` observer | Exclude hadRecentInput |

Reuse: `tools/audit/playwright-cwv.mjs`, `apps/web` `WebVitalsProvider` patterns.

## React

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| Number of renders | Dev-only probe / Profiler (React 19) when flag set | Product code untouched; inject via Playwright init or optional `__UI_AUDIT_REACT__` bridge if already present |
| Components rerendered | Profiler `onRender` id histogram | Sample; not every production build |
| Hydration time | `hydration` marks / `ReactDOM` timing if available | Document gap if Next hides marks |
| Suspense duration | Performance marks around Suspense boundaries when instrumentable | Else “not measurable without probe” |
| Route transition duration | Navigation timing between pathname change → settled shell | App Router soft navigations |

## JavaScript

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| JS bundle downloaded | Resource Timing (`script`) transferSize | Align with `docs/audit/data/bundle/` |
| JS executed | CDP `Performance.getMetrics` / ScriptDuration | |
| Long Tasks | `longtask` observer | Count + total ms |
| Main thread blocking | Sum long tasks + CDP Blocking time | |
| Event loop lag | `requestAnimationFrame` / `scheduler` probe | Synthetic 5s window |

## Network

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| API requests | Playwright response log (`/api`, localhost API) | |
| Duplicate requests | Hash method+URL(+body fingerprint) | |
| Waterfalls | Critical path depth from initiator | |
| Request timing | TTFB / duration p50/p95 | |
| Failed requests | status ≥ 400 + net errors | |
| Retry count | Same URL failed then reissued | |

## Images

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| Intrinsic vs display size | NaturalWidth/Height vs clientWidth/Height | Flag over-download ≥ 2× |
| Wrong image sizes | Same | Debt item |
| Lazy loading | `loading=lazy` / IntersectionObserver usage | |
| WebP/AVIF usage | URL / Content-Type / `picture` sources | |
| Largest image | Max transferSize + display area | |
| Decode time | Element Timing / resource duration proxy | Best-effort |

## Animation

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| FPS | `requestAnimationFrame` sampling during hero / known motion selectors | 2–3s windows |
| Frame drops | Frames > 20ms | |
| GPU compositing | CDP LayerTree / compositing reasons sample | Optional deep |
| Paint count | CDP `Tracing` or Performance counters | Tier B |
| Layout invalidations | RecalcStyle / Layout duration | CDP |
| Style recalculations | Same | CDP |

Respect `prefers-reduced-motion` — record whether motion ran or was suppressed.

## Memory

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| JS heap | `performance.memory` (Chromium) | |
| DOM nodes | `document.getElementsByTagName('*').length` | |
| Detached DOM | CDP `DOMSnapshot` / heap sampler if available | Best-effort; gap OK |
| Event listeners | CDP `DOMDebugger.getEventListeners` sample on key nodes | Sample |
| Memory growth after navigation | Heap before/after soft + hard nav | Tier B |

## Scroll

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| FPS while scrolling | Synthetic scroll + rAF | Mid-page |
| Jank | Long frames during scroll | |
| Scroll latency | Input → scroll offset probe | |
| Sticky element cost | Count sticky/fixed + layout during scroll | |
| Infinite list performance | Detect virtualized lists; measure windowed node count | Skip-with-reason if none |

## Accessibility

| Metric | Method (planned) | Notes |
| --- | --- | --- |
| Touch target size | Layout probe (Phase 1) + axe | ≥ 44×44 |
| Keyboard navigation | Tab order sample / focus trap in dialogs | |
| Focus order | Accessibility tree snapshot | |
| ARIA validation | axe-core rules | |
| Color contrast | axe / contrast samples | Measure-only |

## Responsive runtime (live, not screenshot-only)

| Check | Method (planned) |
| --- | --- |
| No horizontal scrolling | `scrollWidth > clientWidth` |
| No clipped cards | card rect vs overflow parent |
| No overflowing tables | table scrollWidth |
| No truncated buttons | scrollWidth > clientWidth on controls |
| No broken grids | large empty gaps / negative space heuristics (sampled) |
| No overlapping elements | hit-test sample on Tier A interactive nodes |
| No invisible text | contrast/opacity/zero-size text nodes |
| No off-screen modals | `[role=dialog]` rect vs viewport when open |
| No inaccessible dialogs | focus trap + aria-modal sample when open |

Open dialogs: best-effort trigger; otherwise document “closed baseline”.

## Interaction latency (expanded)

| Action | Report |
| --- | --- |
| Button click → visual feedback | `INTERACTION_LATENCY.md` |
| Navigation click → page ready | same |
| Modal open / close | same |
| Drawer / tooltip | same |
| Search typing | same |
| Table sort / filter | same |
| Tabs / accordion | same |

## Continuous session (expanded)

| Duration | Metrics |
| --- | --- |
| 30 min / 1 hour / 4 hours | Heap, FPS, long tasks, CLS, DOM nodes, WS/platform marks when available |
| Lab scale | `UI_AUDIT_SESSION_SCALE` (e.g. `0.01`) shortens walls without changing the series shape |

## Animation runtime (expanded)

| Metric | Source |
| --- | --- |
| Interrupted animations | Mid-flight navigation |
| Queue depth / quality | Console `[platform.metrics]` when `NEXT_PUBLIC_PLATFORM_METRICS=1` |
| FPS / dropped frames | rAF sampler |
| Average duration | motion.* marks when present |

## Live MT5 runtime (expanded)

| Metric | Method |
| --- | --- |
| 1000 updates → dashboard | Live `window.__PROFYPTRON_AUDIT_APPLY_EQUITY__` hook **or** synthetic equity DOM storm |
| Long tasks / commits / paints / heap | Probe during storm |

## Browser stress (expanded)

| Step | Verify |
| --- | --- |
| Multiple tabs | All load |
| Resize / zoom cycles | No permanent overflow/CLS blow-up |
| Background → return | Page recovers |
| Visibility hide/show | Shell remains usable |
