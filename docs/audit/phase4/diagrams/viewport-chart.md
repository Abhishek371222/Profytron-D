# Viewport + chart rendering

```mermaid
flowchart LR
  IO[IntersectionObserver]
  Vis{visible}
  Slot[RenderSlot]
  Chart[Recharts_OverviewPerformance]
  Pause[placeholder_offscreen]

  IO --> Vis
  Vis -->|yes| Slot --> Chart
  Vis -->|no| Pause
```

- PerformanceChartSlot: viewport-gated, dynamic import, React.memo
- News/Calendar: ViewportModule below-fold pause
- Document hidden: animationApi.pauseAll via DashboardLayoutClient
