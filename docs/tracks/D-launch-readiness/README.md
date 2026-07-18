# Track D — Launch Readiness

**Status:** 🟡 **Engineering baseline complete** · operator live proofs pending  
**Baseline:** [`TRACK_D_BASELINE.md`](./TRACK_D_BASELINE.md)  
**Ops home:** [`OPERATIONS_DASHBOARD.md`](./OPERATIONS_DASHBOARD.md)  
**Order:** [`EXECUTION_ORDER.md`](./EXECUTION_ORDER.md)

## Status board

| # | ID | Eng | Live proof |
| ---: | --- | :---: | :---: |
| 1 | [D2 Security](./D2_SECURITY.md) | ✅ | ⬜ |
| 2 | [D1 Infra](./D1_README.md) | ✅ | ⬜ |
| 3 | [D4 MetaAPI](./D4_METAAPI.md) | ✅ UAT + opt-in | ⬜ |
| 4 | [D3 Payments](./D3_PAYMENTS.md) | ✅ UAT + opt-in | ⬜ |
| 5 | [D5 Email](./D5_EMAIL.md) | ✅ UAT + opt-in | ⬜ |
| 6 | [D7 Load](./D7_LOAD.md) | ✅ k6 ladder | ⬜ |
| 7 | [D8 Support](./D8_SUPPORT.md) | ✅ `/status` + packs | ⬜ |
| 8 | [D6 Beta](./D6_BETA.md) | ✅ allowlist | ⬜ |

## Live probe opt-in

```bash
ALLOW_LIVE_METAAPI=1 ALLOW_LIVE_PAYMENT=1 ALLOW_LIVE_EMAIL_OTP=1 pnpm product-audit:journeys
```

## Load

```bash
API_BASE_URL=https://<api> pnpm load:d7:100
```

## After proofs

Closed beta 20–50 → Coach Insights → **Track B**.
