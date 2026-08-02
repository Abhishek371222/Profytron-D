# Critical Secret Rotation Plan

**Status:** Plan only — no secrets rotated by this document.
**Scope:** Production secrets in Secret Manager (`gen-lang-client-0497144011`) judged critical (auth, money, trading, or data-loss blast radius). Non-critical config (feature flags, public `NEXT_PUBLIC_*` values, plain URLs) is intentionally excluded — see [`CREDENTIAL_INVENTORY.md`](./CREDENTIAL_INVENTORY.md) for the full names-only inventory.
**Never store secret values in this file or any file in this repo.** "Current status" below is inferred only from each secret's Secret Manager creation date (non-sensitive metadata) — no value was read to produce this plan, beyond what was already independently verified for the Task 1 database-instance check (`DATABASE_URL`/`DIRECT_URL` host only, never the credential).

Rotation priority key: **P0** = rotate immediately if compromise is ever suspected, plan a proactive schedule regardless; **P1** = rotate on a regular schedule, high value if leaked; **P2** = rotate opportunistically / on provider best-practice cadence.

---

## Authentication & Identity

| Secret | Purpose | Current status | Priority | Rotation method | Downtime | Rollback | Frequency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `JWT_ACCESS_SECRET` | Signs short-lived API access tokens | Active since 2026-07-11 | P0 | Add new secret value, deploy API with **dual-accept** (verify against old + new) if supported, cutover, then retire old after all outstanding tokens expire | None if dual-accept is used; otherwise forces all users to re-login | Revert Secret Manager version to previous; redeploy | Every 90 days, or immediately on suspected leak |
| `JWT_REFRESH_SECRET` | Signs long-lived refresh tokens | Active since 2026-07-11 | P0 | Same dual-accept pattern as access secret; refresh tokens live longer so the dual-accept window must be longer | Forces re-login for any session not yet refreshed post-cutover if no dual-accept | Revert Secret Manager version; redeploy | Every 90 days, or immediately on suspected leak |
| `LEGACY_JWT_SECRET` | Backward-compat verification for tokens issued before the current auth system | Active since 2026-07-11 | P2 | Confirm zero live tokens still depend on it (check issuance date vs. token TTL), then retire rather than rotate | None once confirmed unused | N/A — restore secret if retirement was premature | Retire, don't rotate, once safe |
| `AES_MASTER_KEY` | Encrypts sensitive stored fields (e.g. broker credentials) at rest | Active since 2026-07-11 | **P0, but never rotate casually** | Requires an explicit decrypt-with-old / re-encrypt-with-new migration across every encrypted column before the old key can be retired — this is a data migration, not a config change | Requires a maintenance window sized to the re-encryption job | Keep old key available until every row is confirmed migrated; do not delete old key until then | Only on confirmed compromise, with a written migration plan reviewed first |
| `GOOGLE_CLIENT_SECRET` | OAuth — Google sign-in | Active since 2026-07-11 | P1 | Rotate in Google Cloud Console credentials page, update Secret Manager, redeploy API | None — old and new client secrets are both valid briefly in Google's own console during rotation | Restore prior secret value in Google Console if issues appear | Every 6–12 months, or on suspected leak |
| `GITHUB_CLIENT_SECRET` | OAuth — GitHub sign-in | Active since 2026-07-11 | P1 | Rotate in GitHub OAuth App settings, update Secret Manager, redeploy API | None | Restore prior secret in GitHub settings | Every 6–12 months, or on suspected leak |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side Supabase access | Active since 2026-07-11 | P0 | Rotate in Supabase dashboard, update Secret Manager, redeploy API | None if done during low-traffic window | Restore prior key in Supabase dashboard | Every 90 days, or immediately on suspected leak |
| `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK — FCM push notifications | `FIREBASE_PRIVATE_KEY` active since 2026-07-11 | P1 | Generate a new service-account key in Firebase Console, update both secrets together, redeploy API, then revoke the old key in Firebase Console | None | Old key remains valid in Firebase until explicitly revoked — revoke rollback is instant | Every 12 months, or on suspected leak |
| `FIREBASE_AUTH_PRIVATE_KEY` / `FIREBASE_AUTH_CLIENT_EMAIL` / `FIREBASE_AUTH_PROJECT_ID` | Firebase Admin SDK — sign-in token verification (separate app from FCM, by design) | Active since 2026-07-15 (newest credential set in the store) | P0 | Same as above — generate new key in Firebase Console, update all three secrets together, redeploy, then revoke old key | None | Revoke rollback in Firebase Console | Every 12 months, or on suspected leak |

## Database

| Secret | Purpose | Current status | Priority | Rotation method | Downtime | Rollback | Frequency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Application connection string to `profytron-postgres` (production Cloud SQL) | Active since 2026-07-11; confirmed pointing at the production instance's private IP as of this task | **P0 — do not rotate as part of this plan** | Cloud SQL user password reset (`gcloud sql users set-password`), update both secrets, redeploy API. Requires care: both secrets must be updated together and the new password must be live before redeploy, or the API will fail to connect | Brief connection-pool interruption during redeploy; plan for a low-traffic window | Reset password back to a value matching the previous Secret Manager version, or restore the previous secret version and reset the DB password to match | Every 6–12 months, or immediately on suspected leak. **Explicitly out of scope for today's change per the safety rules above.** |
| `CLOUDSQL_APP_PASSWORD` | Application-role Postgres password (companion to `DATABASE_URL`) | Active since 2026-07-15 | P0 | Rotate together with `DATABASE_URL`/`DIRECT_URL` — these must stay in sync | Same as above | Same as above | Same cadence as `DATABASE_URL` |
| `CLOUDSQL_SUPERUSER_PASSWORD` | Cloud SQL superuser/admin credential | Active since 2026-07-15 | P0 | `gcloud sql users set-password` for the superuser role; update Secret Manager. Not used by the running application — only for admin/migration access, so this can be rotated independently without an API redeploy | None — not read by the running API | Reset password back if a migration tool depending on it breaks | Every 90 days, or immediately on suspected leak |
| `REDIS_URL` | Application connection string to Memorystore Redis | Active since 2026-07-11 | P1 | Rotate via Memorystore AUTH string regeneration (if AUTH is enabled) or firewall/IAM-based access review; update secret, redeploy API | Brief cache-miss period post-redeploy; non-critical since Redis is a cache, not source of truth | Restore previous secret version | Every 6–12 months |
| `UPSTASH_REDIS_REST_TOKEN` / `UPSTASH_REDIS_READONLY_TOKEN` / `UPSTASH_PROMETHEUS_PASSWORD` | Legacy Upstash Redis credentials | Active since 2026-07-11 — **verify still in use.** The Redis backend migrated to Memorystore; these may now be dead credentials from the pre-migration Upstash setup | P2 (or **retire** if confirmed unused) | If still referenced anywhere, rotate via Upstash console. If unused (likely, post-Memorystore migration), retire rather than rotate — this is a genuinely separate, small piece of the "unrelated infrastructure" cleanup category and is flagged here for a future pass, not actioned today | None expected if unused | Restore secret if retirement breaks something unexpected | Confirm usage first, then retire or rotate accordingly |

## Payments

| Secret | Purpose | Current status | Priority | Rotation method | Downtime | Rollback | Frequency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server-side Stripe API access (deposits, subscriptions) | Active since 2026-07-11 | P0 | Roll key in Stripe Dashboard (Stripe supports keeping the old key active briefly during rollover), update Secret Manager, redeploy API, then revoke old key in Stripe | None during Stripe's overlap window | Stripe keeps the old key valid until you explicitly revoke it — instant rollback by not revoking yet | Every 6–12 months, or immediately on suspected leak |
| `STRIPE_WEBHOOK_SECRET` | Verifies incoming Stripe webhook signatures | Active since 2026-07-11 | P0 | Generate new signing secret in Stripe Dashboard for the webhook endpoint, update Secret Manager, redeploy. Must be done together with confirming the webhook endpoint config in Stripe still points at the correct URL | Webhooks arriving in the gap between rotation and deploy will fail signature checks — schedule during low webhook-volume window | Revert to previous signing secret in Stripe Dashboard | Every 6–12 months, or on suspected leak |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server-side Razorpay API access (deposits, subscriptions, INR payments) | Active since 2026-07-11 | P0 | Generate new API key pair in Razorpay Dashboard, update both secrets together, redeploy, then deactivate old key pair in Razorpay | None during Razorpay's overlap window | Reactivate old key pair in Razorpay Dashboard | Every 6–12 months, or on suspected leak |

## Trading

| Secret | Purpose | Current status | Priority | Rotation method | Downtime | Rollback | Frequency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `METAAPI_TOKEN` | Broker connectivity — MT4/MT5 trade execution and account sync via MetaAPI | Active since 2026-07-11 | **P0 — highest business-risk secret in the store** | Generate new token in MetaAPI dashboard, update Secret Manager, redeploy API during a window when live trade execution volume is lowest, verify open-position sync resumes correctly post-deploy | Any broker sync in-flight during redeploy may need a retry; plan for a low-activity window and watch `BotTradeSyncService` logs closely afterward | Restore previous token value; MetaAPI does not require the old token to be explicitly revoked before the new one works, so keeping the old value available makes rollback immediate | Every 90 days, or immediately on suspected leak — this token can execute real trades |
| `ADMIN_MT5_LOGIN` / `ADMIN_MT5_PASSWORD` / `ADMIN_MT5_SERVER` / `ADMIN_MT5_PLATFORM` | Master/admin MT5 account used for the platform's own operational trading account | Active since 2026-07-11 | P0 | Change password at the broker directly, update Secret Manager, redeploy. Coordinate timing with anyone actively monitoring this account's live positions | Master account sync may briefly interrupt during redeploy | Restore previous password at the broker if the new credentials fail to connect | Every 90 days, or immediately on suspected leak |
| `MASTER_BROKER_ACCOUNT_ID` | Identifier for the master copy-trading source account | Active since 2026-07-11 | P1 (identifier, not a credential, but sensitive because it identifies the copy-trading source of truth) | Only changes if the master account itself is replaced — this is an operational decision, not a routine rotation | Requires coordinated cutover of all copy-trading subscribers | Revert to previous account ID | Only on deliberate master-account change, not a schedule |

## AI Providers

| Secret | Purpose | Current status | Priority | Rotation method | Downtime | Rollback | Frequency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `OPENAI_API_KEY` | LLM calls (Alpha Coach and related AI features) | Active since 2026-07-11 | P1 | Generate new key in OpenAI dashboard, update Secret Manager, redeploy, revoke old key | Brief AI-feature degradation possible during redeploy window only | Restore previous key if new key fails | Every 6–12 months, or on suspected leak |
| `OPENROUTER_API_KEY` | LLM routing/fallback provider | Active since 2026-07-11 | P1 | Same pattern as OpenAI | Same | Same | Every 6–12 months, or on suspected leak |
| `GEMINI_API_KEY` | Google Gemini LLM access | Active since 2026-07-11 | P1 | Same pattern | Same | Same | Every 6–12 months, or on suspected leak |
| `HUGGING_FACE_API_KEY` | Model access via Hugging Face | Active since 2026-07-11 | P2 | Same pattern | Same | Same | Every 12 months, or on suspected leak |
| `AWS_BEARER_TOKEN_BEDROCK` | AWS Bedrock model access | Active since 2026-07-11 | P1 | Rotate via AWS IAM credential rotation, update Secret Manager, redeploy | Same | Same | Every 90 days (AWS best practice), or on suspected leak |

## Infrastructure

| Secret | Purpose | Current status | Priority | Rotation method | Downtime | Rollback | Frequency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Operational bot (alerts/notifications) | Active since 2026-07-11 | P2 | Regenerate via BotFather, update Secret Manager, redeploy | None | Restore previous token | Every 12 months, or on suspected leak |
| `RESEND_API_KEY` | Transactional email delivery | Active since 2026-07-11 | P1 | Generate new key in Resend dashboard, update Secret Manager, redeploy, revoke old key | Brief email-sending gap possible during redeploy only | Restore previous key | Every 6–12 months, or on suspected leak |
| `SENTRY_DSN` | Error tracking ingestion | Active since 2026-07-11 | P2 (low sensitivity — a leaked DSN allows spamming the error dashboard, not data access) | Regenerate project DSN in Sentry, update secret, redeploy | None | Restore previous DSN | Only if abused; not on a fixed schedule |
| `ALPHA_VANTAGE_API_KEY` / `TWELVE_DATA_API_KEY` / `FINNHUB_API_KEY` | Market data providers | Active since 2026-07-11 | P2 | Regenerate at each provider, update Secret Manager, redeploy | Brief market-data gap possible during redeploy only | Restore previous key | Every 12 months, or on suspected leak |

---

## Execution notes (apply to every row above)

1. **Never rotate a secret without first confirming it in Secret Manager, then updating Cloud Run's `--set-secrets` reference (already points at `:latest` for every secret in this project) and redeploying** — updating the secret value alone does not restart already-running containers.
2. **Rotate one secret (or one tightly-coupled group, e.g. Stripe key + webhook secret) at a time**, verify health (`/live`, `/ready`, `/health`) and watch error logs for at least 5–10 minutes before moving to the next, exactly as demonstrated in today's Cloud SQL instance change.
3. **Record every actual rotation in [`WEEKLY_LOG.md`](./WEEKLY_LOG.md)** — what, when, who — per the existing [`SECRET_ROTATION_PLAYBOOK.md`](./SECRET_ROTATION_PLAYBOOK.md) procedure.
4. This plan does not itself authorize any rotation — each row still requires an explicit, separate decision to execute, per the standing "no secrets rotated without explicit authorization" rule.
