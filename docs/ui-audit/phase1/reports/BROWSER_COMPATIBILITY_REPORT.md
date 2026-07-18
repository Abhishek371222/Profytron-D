# Browser Compatibility Report

Slice: Tier A surfaces + smoke routes × {390×844, 768×1024, 1920×1080} × Chromium / Firefox / WebKit / Edge (when installed).

## Counts

- Captures: 219
- OK: 214
- Failed: 5

## Gaps

- No launch gaps recorded (or browser matrix not run).

## Failures by browser

| Browser | Failures | OK |
| --- | --- | --- |
| chromium | 0 | 57 |
| firefox | 0 | 57 |
| webkit | 5 | 43 |
| msedge | 0 | 57 |

## OS notes

Lab host: `win32` / `x64` / Node `v24.18.0`.

True Windows / macOS / Linux / iPadOS / Android matrix requires multi-host or device lab. This phase records:

1. Playwright Chromium / Firefox / WebKit engines on the lab host
2. Device descriptors for iPad/Android-class viewports in the viewport matrix
3. Manual OS spot-check checklist in [../before/OS_MANUAL_CHECKLIST.md](../before/OS_MANUAL_CHECKLIST.md)
