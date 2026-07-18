# Continuous Session Report

Dashboard left open for nominal **30 min / 1 hour / 4 hours**.

Scale used: **0.01** (set `UI_AUDIT_SESSION_SCALE=1` for full durations).

| Profile | Nominal | Actual ms | Samples | Heap growth | Final CLS | Final longTask ms |
| --- | --- | --- | --- | --- | --- | --- |
| 30min | 30m | 18000 | 9 | 0.00 MB | 0.000 | 454 |
| 1hour | 60m | 36000 | 10 | 0.00 MB | 0.000 | 429 |
| 4hour | 240m | 144000 | 10 | 0.00 MB | 0.000 | 402 |

## What is tracked

- JS heap series
- DOM node counts
- Long tasks / CLS
- FPS samples
- Platform metric console marks (when `NEXT_PUBLIC_PLATFORM_METRICS=1`)
- End-of-session scroll jank sample
