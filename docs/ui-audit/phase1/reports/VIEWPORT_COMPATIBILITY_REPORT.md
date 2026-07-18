# Viewport Compatibility Report

Full matrix: **every static route × 23 viewports** on Chromium @ DPR 1 / zoom 100%.

## Counts

- Captures: 1587
- OK: 1586
- Failed: 1
- Skipped (dynamic fixtures): 0
- Overflow-X hits: 0

## Viewport list

### Mobile
- 320×568
- 360×640
- 375×812
- 390×844
- 412×915
- 430×932
- 480×800

### Tablet
- 768×1024
- 820×1180
- 834×1112
- 1024×1366

### Desktop / Ultrawide
- 1280×720
- 1366×768
- 1440×900
- 1536×864
- 1600×900
- 1728×1117
- 1920×1080
- 1920×1200
- 2048×1152
- 2560×1440
- 3440×1440
- 3840×2160

## Per-viewport overflow summary

| Viewport | Captures | Overflow-X |
| --- | --- | --- |
| 320×568 | 69 | 0 |
| 360×640 | 69 | 0 |
| 375×812 | 69 | 0 |
| 390×844 | 69 | 0 |
| 412×915 | 69 | 0 |
| 430×932 | 69 | 0 |
| 480×800 | 69 | 0 |
| 768×1024 | 69 | 0 |
| 820×1180 | 69 | 0 |
| 834×1112 | 69 | 0 |
| 1024×1366 | 69 | 0 |
| 1280×720 | 69 | 0 |
| 1366×768 | 69 | 0 |
| 1440×900 | 69 | 0 |
| 1536×864 | 69 | 0 |
| 1600×900 | 69 | 0 |
| 1728×1117 | 69 | 0 |
| 1920×1080 | 69 | 0 |
| 1920×1200 | 69 | 0 |
| 2048×1152 | 69 | 0 |
| 2560×1440 | 69 | 0 |
| 3440×1440 | 69 | 0 |
| 3840×2160 | 69 | 0 |

## Dynamic routes

Skipped without fixtures (documented, not silent):

- `/marketplace/:id` — Requires UI_AUDIT_MARKETPLACE_ID fixture (env `UI_AUDIT_MARKETPLACE_ID`)
- `/strategies/:id` — Requires UI_AUDIT_STRATEGY_ID fixture (env `UI_AUDIT_STRATEGY_ID`)
- `/creator/bots/:id` — Requires UI_AUDIT_CREATOR_BOT_ID fixture (env `UI_AUDIT_CREATOR_BOT_ID`)
- `/blog/:slug` — Requires UI_AUDIT_BLOG_SLUG fixture (env `UI_AUDIT_BLOG_SLUG`)
- `/brokers/:slug` — Requires UI_AUDIT_BROKER_SLUG fixture (env `UI_AUDIT_BROKER_SLUG`)
