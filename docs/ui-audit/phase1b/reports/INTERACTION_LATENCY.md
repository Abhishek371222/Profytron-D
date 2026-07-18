# Interaction Latency Report

UX latency baseline — click → mutation / wall time. Skips are explicit.

| Action | Wall ms | Click→mutate ms | Notes |
| --- | --- | --- | --- |
| button-click-visual-feedback | 228 | — | ok |
| nav-to-analytics | — | — | skip: not found |
| navigation-page-ready | — | — | ok |
| modal-open-attempt:button:has-text("Settings") | — | — | skip: not found |
| modal-open-attempt:button:has-text("Open") | — | — | skip: not found |
| modal-open-attempt:[data-slot="dialog-trigger"] | — | — | skip: not found |
| modal-open-attempt:button[aria-haspopup="dialog"] | — | — | skip: not found |
| tooltip | — | — | skip: not found |
| search-focus | — | — | skip: not found |
| search-typing | — | — | skip: no search input |
| table-sort | — | — | skip: not found |
| filter | — | — | skip: not found |
| tabs | — | — | skip: not found |
| accordion | — | — | skip: not found |
| nav-home-to-pricing | — | — | locator.click: Timeout 3000ms exceeded.
Call log:
  - waiting for locator('a[hre |
| login-email-focus | 390 | — | ok |
