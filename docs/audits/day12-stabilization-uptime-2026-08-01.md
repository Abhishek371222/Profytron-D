# Day 12 — Production Stabilization & Uptime Alert Verification

**Date:** 2026-08-01
**Scope:** Reproduce and fix VERIFIED bugs from Days 7-11; verify uptime monitoring and alerting actually works.
**Commits:** `cf50a65` (BotTradeSyncService backoff), `c8945dc` (COOKIE_SECURE wiring). Both deployed to production and live-verified.

---

## 1. Review of previous findings

On-disk/in-context sources checked: `docs/audits/` (Day 4, 5, 6, 8 reports exist), `docs/tracks/D-launch-readiness/evidence/D7_OTP_UAT_20260728.md` (Day 7), and this session's own Day 9 (MetaAPI) / Day 11 (AI Coach) work. **No Day 10 record exists anywhere** — not fabricated for this report.

| # | Finding | Severity | Day | Status before today | Fixed today? |
|---|---|---|---|---|---|
| 1 | Starter/Pro trial advertised but not implemented | High | 8 | Superseded — Platform Trial feature built + race-condition-fixed + deployed prior to this session | N/A (already resolved) |
| 2 | `Enterprise` tier missing from `SubscriptionTier` DB enum | Medium | 8 | Unaddressed | No — business decision, out of scope |
| 3 | AI Coach session caps / AI-risk tier gating advertised but not enforced | Medium | 8 | Unaddressed | No — business decision, out of scope |
| 4 | API access not tier-gated | Low-Medium | 8 | Unaddressed | No — business decision, out of scope |
| 5 | Analytics history window not enforced | Low | 8 | Unaddressed | No — business decision, out of scope |
| 6 | No native recurring billing for platform plans | Medium | 8 | Unaddressed | No — business decision, out of scope |
| 7 | `ADMIN_MT5_SERVER` secret mismatch vs MetaAPI canonical server string | High | 9 | Diagnosed, fix withdrawn (risk to live master connection) | **Yes** — secret corrected, re-authorized this session |
| 8 | `BotTradeSyncService` unbounded retry for chronically-broken account | High (once fully root-caused) | 9 & 11 (recurred) | Observed twice, not root-caused | **Yes** — code fix, deployed, live-verified |
| 9 | `OPENAI_API_KEY` holds OpenRouter-format key | Low | 11 | Not a bug — code already handles it correctly | N/A |
| 10 | `AWS_BEARER_TOKEN_BEDROCK` unused | Info | 11 | Dead config | No — cosmetic |
| 11 | `getCoachingReport` silent static fallback | Info | 11 | Design caveat | No — noted only |

---

## 2. Bug reproduction (read-only re-checks before fixing)

**Bug #7** — re-queried MetaAPI's `/users/current/accounts` directly: account `961334` still `DEPLOYED`/`CONNECTED` with canonical server `BitrageCapitalMarkets-Server`. Secret still `"Bitrage Capital Markets"` (single version since 2026-07-11). Mismatch reconfirmed.

**Bug #8** — re-scanned Cloud Run logs: account `fdd3f450-1d1e-4e0c-a03a-59c271105731` failing every ~90-150s, counter past `2589x`, alternating `404`/`429`. Blast-radius check across 1,000 most recent failure log lines (24h window): **all** attributed to this single account — no other accounts affected.

---

## 3. Fixes applied

### Bug #7 — ADMIN_MT5_SERVER secret correction

- **Root cause:** Secret value `"Bitrage Capital Markets"` (human-readable) vs MetaAPI's canonical `"BitrageCapitalMarkets-Server"`. `findExistingAccount()` ([metatrader.adapter.ts:856](../../apps/api/src/modules/broker/adapters/metatrader.adapter.ts)) does exact case-sensitive string equality, no normalization — so it never matched, and `connect()` fell through to a redundant provisioning attempt (this is what actually timed out during the Day 9 UAT).
- **Fix:** New Secret Manager version (`ADMIN_MT5_SERVER` v2 = `"BitrageCapitalMarkets-Server"`). Config-only, zero code changed. Rollback: version 1 remains `enabled`, un-deleted.
- **Verification:** New value confirmed matching MetaAPI's canonical string via direct comparison. Live Cloud Run revision confirmed resolving `ADMIN_MT5_SERVER:latest` (i.e. v2) after deploy.
- **Note:** this does not retroactively affect the already-running master connection; it only changes what a *future* `provisionMasterCopyTrading()` invocation would do.

### Bug #8 — BotTradeSyncService unbounded retry

- **Root cause:** [bot-trade-sync.service.ts](../../apps/api/src/modules/trading/bot-trade-sync.service.ts) tracked `consecutiveFailures` per account but only used it to fire a one-time "degraded" WebSocket notification at exactly 3 failures — no ceiling, no backoff, no permanent skip. A permanently-broken account (stale `metaApiAccountId`, confirmed via alternating 404/429 from MetaAPI) was retried every ~12s indefinitely, for 2,500+ cycles, plausibly contributing to the shared, process-wide MetaAPI rate-limit cooldown (per Day 9's architecture finding) that affects all accounts' sync.
- **Fix (11 lines, one file):** after 10 consecutive failures for an account, the retry interval for that specific account increases to 10 minutes instead of the normal ~12s tick. Never permanently skipped — a reconnected/fixed account recovers automatically on its next slow-cadence tick. In-memory only (`consecutiveFailures`/`lastPolledAt` maps reset on redeploy). No API contract, schema, or unrelated-file changes.
- **Pre-deploy verification:** `tsc --noEmit` clean; `trading` module tests 25/25 pass; full backend suite 19/19 suites, 115/115 tests pass (32 skipped, same pre-existing `describeIfApiInfra` pattern).
- **Post-deploy, live verification (the strongest evidence):** on the new revision, the failure counter for `fdd3f450-...` reset to `(5x)` (confirming a fresh process/map), continued at the old ~90-150s cadence through `(10x)` at `13:39:08`, then the next failure landed at `13:49:08` — **exactly a 10-minute gap**, matching the coded threshold precisely.

### NODE_ENV / COOKIE_SECURE — narrow fix only

- **Finding:** `NODE_ENV=development` is set on the live production `api` service (secret-backed, 15+ conditional call sites across the codebase). Live-confirmed consequences: `/api/docs` (Swagger UI) publicly reachable (`HTTP 200`), HSTS header absent from real responses. Code-confirmed consequences: 500-response error-message sanitization skipped ([all-exceptions.filter.ts:65](../../apps/api/src/common/filters/all-exceptions.filter.ts)); CSP `upgrade-insecure-requests` disabled ([app.setup.ts:105](../../apps/api/src/app.setup.ts)); session cookies issued without `Secure` flag ([auth.controller.ts:69-71](../../apps/api/src/modules/auth/auth.controller.ts)), since that check's fallback (`COOKIE_SECURE==='true'`) was never wired into the deploy.
- **Decision (explicit, scoped):** fix only the cookie issue via a new, additive `COOKIE_SECURE=true` secret, wired into `cloudbuild-api.yaml`'s `--set-secrets` list. Full `NODE_ENV=production` flip declined for today given its much wider, individually-untraced blast radius — parked as a dedicated follow-up.
- **Verification:** live login after deploy — `Set-Cookie` headers for `refresh_token`, `user_role`, `onboarding_completed` all now carry `Secure`. Confirmed via raw response headers, not just deploy success.
- **Secondary finding surfaced by this fix:** logout's cookie-clearing code checks only `NODE_ENV` (no `COOKIE_SECURE` fallback), so it now diverges from the cookie-setting code. Live-tested: this does **not** currently cause a functional failure — the logout response (over HTTPS) successfully clears the `Secure` cookies per RFC 6265bis's "Leave Secure Cookies Alone" rule (a secure-origin response may still expire a `Secure` cookie even without repeating the attribute). Flagged for future consistency, not urgent.

---

## 4. Regression verification

- Pre-deploy: full backend suite 19/19 suites, 115/115 tests pass (both fix commits).
- Post-deploy (live, both deploys): `/live` `/ready` `/health` all `200`; zero `ERROR`-severity logs on new revisions.
- Live smoke after final deploy: `GET /v1/subscriptions/plans` (Platform Trial) → 200; `GET /v1/coach/conversations` (AI Coach) → 200; `GET /v1/broker/accounts` → 200; fresh login → 200 with correctly-flagged cookies.
- No regressions observed in any subsystem.

---

## 5. Uptime monitoring audit — verified against GCP directly, not documentation

| Component | Documented | Actually exists (verified) |
|---|---|---|
| Cloud Monitoring uptime check (`api-health`, `/health`, 60s) | Yes | **Confirmed real** |
| Cloud Run startup probe (`/ready`) | Yes | **Confirmed real** |
| Alert policies | Not claimed | **Zero exist** (Monitoring REST API: empty) |
| Notification channels | Not claimed | **Zero exist** (Monitoring REST API: empty) |
| Cloud Monitoring dashboards | "operator to create if missing" | **Zero exist** |
| Better Stack | Optional TODO in `D8_SUPPORT.md` | **Never configured** — no secret, no code reference, unchecked box |
| Sentry alert rules | DSN wired (Day 5) | **Not verifiable from this environment** — no Sentry management API token available, only ingestion DSNs |

**Conclusion: the uptime check exists and runs, but nothing is wired to act on it.** A sustained production outage today would be logged by Cloud Monitoring and otherwise go completely unnoticed — no page, no email, no Slack message, to anyone. This is the most significant operational (not code) finding of Day 12.

**Phase 6 (alert test-fire): nothing exists to test.** Since there is no alert policy, there is nothing to safely trigger. This finding — the absence itself — fully satisfies the "verify whether alerting works" objective: it does not.

---

## 6. Performance (measured)

| Endpoint | Latency (pre-deploy baseline, `api-00083-4vx`) |
|---|---|
| `/health` | 196-284ms |
| `/live` | 194-206ms |
| `/ready` | 177-195ms |

No regression observed post-deploy (both fix deploys, spot-checked `/live` `/ready` `/health` = 200 with normal response times throughout).

---

## 7. Security

- No secret values, prompts, or tokens found in Cloud Run logs across the session.
- `EXPOSE_DEV_OTP` confirmed absent (secure default), unchanged.
- `NEXT_PUBLIC_ENABLE_MOCK_API` secret exists but is `false` and not even wired into the live `web` service — false positive, ruled out.
- `NODE_ENV=development` on production — see Section 3, partially mitigated (cookies), rest parked.

---

## Final Verdict

**⚠️ PASSED WITH OBSERVATIONS**

Two verified, reproducible bugs were fixed, deployed, and confirmed working via live evidence (not just deploy success). One cookie-security gap was fixed via a narrow, additive change. Uptime monitoring was audited and found to have a real, significant gap (no alerting wired to the existing health check) — this is documented, not fixed, since building new alerting infrastructure is out of today's "fix verified bugs" scope and deserves its own deliberate setup. `NODE_ENV=development` on production remains open, narrowly mitigated for its most acute risk (session cookie security), full resolution deliberately deferred given its wide blast radius.
