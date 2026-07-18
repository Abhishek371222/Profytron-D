# Runtime UX Improvements

**Sources:** Phase 1B INTERACTION_LATENCY, ANIMATION_RUNTIME, CONTINUOUS_SESSION, MT5_RUNTIME

## Applied in Phase 2 (layout/CSS only)

| Theme | Change |
| --- | --- |
| Resize stability | Density tokens + `contain-inline-size` / overflow-x hidden on shell scroll |
| Interaction targets | Larger hit areas on product chrome (aids click→feedback) |
| Table layout thrash | Column hide reduces forced horizontal layout on narrow viewports |

## Explicitly deferred (P3 / platform freeze)

| Theme | Reason |
| --- | --- |
| Long-tasks on marketing / alpha-coach / analytics | Motion/Experience/Rendering engines frozen; engineering CWV track |
| MT5 synthetic storm long tasks | No dashboard architecture or engine changes |
| Continuous session heap (full 4h) | Measure again after product load path fixes; not a UI chrome change |
| Duplicate API requests | Network layer — out of scope |

## Animation

No Motion Engine edits. Interrupt/queue/FPS findings remain documented in Phase 1B reports.
