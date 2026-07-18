# Feature Compatibility Suite

Run (local stack up):

```bash
cd apps/web
AUDIT_JWT=... COMPAT_API=1 pnpm exec playwright test tests/compat --project=chromium
```

| Flow | Coverage | Skip condition |
|------|----------|----------------|
| Login page | always | — |
| Logout | via auth store (manual / e2e) | document if not automated |
| MT5 connect | `/connected-accounts` smoke | needs AUDIT_JWT |
| Copy Trading | `/copy-trading` | AUDIT_JWT |
| Strategy Builder | `/strategies/builder` | AUDIT_JWT |
| Marketplace | public | — |
| Wallet | `/wallet` | AUDIT_JWT |
| AI Coach | `/alpha-coach` | AUDIT_JWT |
| Notifications | `/notifications` | AUDIT_JWT |
| Admin | `/admin` | COMPAT_ADMIN_JWT |
| Payments | `/billing` smoke | AUDIT_JWT; Stripe full flow not in CI without keys |

Skips must print a reason — never silent pass.

## Last gate run (2026-07-18)

- Chromium: **13 passed**, 2 skipped (admin JWT / optional API health) — `docs/audit/phase2/after/compat-chromium.log`
- Firefox/WebKit: not installed locally; install via `pnpm exec playwright install` before claiming cross-browser.
