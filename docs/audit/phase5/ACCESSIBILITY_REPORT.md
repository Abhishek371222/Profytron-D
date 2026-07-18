# Accessibility Report — Phase 5 Motion

## Reduced motion
- `prefers-reduced-motion: reduce` pins Quality Manager to **Minimal**.
- Minimal policy: opacity / instant / no scale-y translation on modal panels.
- Number engine snaps to target (duration 0).
- CSS still honors `@media (prefers-reduced-motion: reduce)` in animations.css / globals.

## Tab visibility
- `animationApi.pauseAll` / `resumeAll` remain wired in DashboardLayoutClient.
- Motion engine additionally finishes running animations on hide and adapts quality on show.

## Contracts
Forbidden layout/width/height animations on metric cards reduce CLS risk for assistive tech.
