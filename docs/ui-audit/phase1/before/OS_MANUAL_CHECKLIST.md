# OS Manual Spot-Check Checklist

Automated Phase 1 runs on the **lab host** (see `environment.json`) using Playwright engines and viewport emulation.

True multi-OS coverage is **manual** for this phase:

## Checklist

| OS | Browser | Viewports to spot-check | Done |
| --- | --- | --- | --- |
| macOS | Safari | 390×844, 768×1024, 1920×1080 | [ ] |
| macOS | Chrome | 390×844, 1920×1080 | [ ] |
| Windows | Edge | 1366×768, 1920×1080 | [ ] |
| Windows | Chrome | 390×844, 1920×1080 | [ ] |
| Linux | Firefox | 1280×720, 1920×1080 | [ ] |
| iPadOS | Safari | 768×1024, 1024×1366 | [ ] |
| Android | Chrome | 360×640, 412×915 | [ ] |

For each: note overflow, sidebar behavior, form zoom (iOS 16px inputs), and safe-area insets.

Record findings as debt IDs in `reports/RESPONSIVE_DEBT_LIST.md` when observed.
