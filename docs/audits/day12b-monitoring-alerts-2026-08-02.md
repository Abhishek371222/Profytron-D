# Day 12B — Production Monitoring & Alerting

**Date:** 2026-08-02
**Scope:** Infrastructure only. No application code, API behavior, or database schema modified. Nothing deployed.
**Project:** `gen-lang-client-0497144011`, region `asia-south1` (Cloud Run) / global (Cloud Monitoring).

---

## 1. Architecture

Day 12 found: a real Cloud Monitoring uptime check (`api-health`, `/health`, 60s) existed, but zero alert policies, zero notification channels, zero dashboards were wired to it — a production outage would be silently logged and nobody would be told.

Before designing alerts, the exact `/health` semantics were read directly from source ([app.controller.ts](../../apps/api/src/app.controller.ts)):
- `/health` returns **HTTP 503 only when the database is down** (`criticalDown`).
- Redis, BullMQ queue, and WebSocket gateway degradation still return **HTTP 200**, with `"status":"degraded"` in the JSON body.

This means a plain HTTP-200 uptime check alone cannot detect Redis/queue/WebSocket outages — it only catches full DB-down scenarios. This shaped the two-tier uptime-check design below.

---

## 2. Resources created (all additive, all reversible)

| Resource | ID | Purpose |
|---|---|---|
| Notification channel (email) | `notificationChannels/12916402525072961367` | `support@profytron.com`, primary alert destination |
| Uptime check (**new**, additive) | `uptimeCheckConfigs/api-health-deep-JagqSNAKpfc` | `/health`, content-matcher requires `"status":"ok"` in body — catches Redis/queue/WebSocket degradation that a plain HTTP check misses. The original `api-health` check was left completely untouched. |
| Log-based metric | `logging.googleapis.com/user/api_error_rate` | Counts `severity>=ERROR` log entries from the `api` Cloud Run service |
| Dashboard | `dashboards/782d6846-03a0-484b-a0a2-810a8d27f21e` ("Production Health (Day 12B)") | 6 tiles: both uptime checks, request count by response class, p95 latency, error-log count, Cloud SQL `up` |
| Alert policy | `alertPolicies/2295118239536310934` | SEV1: API Unavailable |
| Alert policy | `alertPolicies/619966200937253569` | SEV2: API Degraded (Redis/Queue/WebSocket) |
| Alert policy | `alertPolicies/619966200937251955` | SEV1: Elevated 5xx rate |
| Alert policy | `alertPolicies/3865649589360156872` | SEV2: High request latency |
| Alert policy | `alertPolicies/5064122943537230695` | SEV1: Cloud SQL unavailable |
| Alert policy | `alertPolicies/12039889815022303438` | SEV2: Elevated error-log rate |

**Nothing existing was modified.** The original `api-health` uptime check, all application code, all secrets, and all Cloud Run configuration were left exactly as they were.

---

## 3. Alert policies — thresholds and reasoning

| Alert | Mechanism | Threshold | Window | Severity | Why |
|---|---|---|---|---|---|
| API Unavailable | `api-health` check_passed | fails (any) | 2 consecutive checks (~120s) | SEV1 | Only fails on true HTTP 503 (DB down) per `/health` logic; 2 checks avoids paging on a single transient blip |
| API Degraded | `api-health-deep` check_passed (content matcher) | fails (any) | 2 consecutive checks (~120s) | SEV2 | Catches Redis/queue/WebSocket degradation that returns HTTP 200 and would otherwise be invisible |
| Elevated 5xx rate | `run.googleapis.com/request_count`, MQL ratio of `response_code_class="5xx"` / total | > 5% | 5 min | SEV1 | Slightly more lenient than `D1_ALERTING.md`'s suggested 2%, to avoid noise at low traffic volumes, while still catching a real elevated-error event |
| High request latency | `run.googleapis.com/request_latencies`, p95 | > 3000ms | 5 min | SEV2 | ~10x the measured baseline (196-284ms, Day 12) — generous margin against normal variance |
| Cloud SQL unavailable | `cloudsql.googleapis.com/database/up` | = 0 | 2 min | SEV1 | Native signal, entirely independent of the application |
| Elevated error-log rate | `logging.googleapis.com/user/api_error_rate` | > 10 | 5 min | SEV2 | General safety net for app-level failures that don't fail a health check |

**Explicitly not built (and why, not fabricated):**
- **Queue backlog depth** — BullMQ lives in external Redis (Upstash); no native GCP metric exists, and exposing one would require adding an application metrics endpoint (out of scope — "no application code" today).
- **Cloud Run "instance crash" metric** — no direct equivalent to GKE pod-restart counts exists for Cloud Run; the error-log-rate alert is the closest honest proxy.
- **Low disk/memory** — Cloud Run is fully managed with no persistent disk; CPU/memory utilization metrics exist natively but weren't requested as clearly load-bearing, so left out pending explicit ask.

---

## 4. Notification channels

- **Email** (`support@profytron.com`) created and attached to all 6 policies.
- **Verification: pending.** `sendVerificationCode` was triggered; the code was emailed to `support@profytron.com`, which this session has no inbox access to. The channel is `enabled: true` and functionally attached to every policy — GCP will still attempt delivery to an unverified channel — but the "verified" badge requires the code to be submitted via a follow-up `verifyNotificationChannel` call.
- **Slack / PagerDuty / Discord / Google Chat:** not configured — no credentials were provided or found; per instruction, none were fabricated.

---

## 5. Better Stack

**Not configured — credentials do not exist.** No API key/secret found anywhere in Secret Manager or the repo (re-confirmed this session, consistent with the Day 12 finding). Per the explicit instruction to stop rather than fabricate: what would be required to proceed is (a) a Better Stack account (third-party sign-up, cannot be done via `gcloud`/API automation) and (b) its API key, stored as a new Secret Manager secret. Not attempted.

---

## 6. Test results

- **Synthetic content-matcher test:** queried the new `api-health-deep` check's live time series directly — confirmed `boolValue: true` from an active checker location (`usa-virginia`), proving the content matcher correctly parses the real, current `/health` response (`"status":"ok"`). This is a genuine, live validation of the detection mechanism, obtained without creating any outage.
- **No synthetic outage was created** — `/health` was never made to fail, Cloud Run was never scaled/stopped/restarted, no revision was touched.
- **Full alert-fire test (real page) was not performed** — doing so would require an actual failure condition (real DB outage, real 5xx spike, etc.), which the rules explicitly forbid creating. This is a known limitation, not a shortcut.

---

## 7. Known limitations

1. Email channel verification incomplete pending manual code retrieval.
2. Better Stack not configured — credentials don't exist.
3. No Slack/PagerDuty/Discord/Google Chat — no credentials provided.
4. No end-to-end "real alert fired and email received" test was performed, since that would require a real outage condition.
5. Queue-backlog and Cloud Run "crash" signals are approximated, not directly measured, due to lacking native metrics.

---

## 8. Rollback

Every resource created today is independently deletable with zero effect on anything pre-existing:
- `gcloud alpha monitoring policies delete <policy-name>` for each of the 6 policies.
- `gcloud monitoring uptime delete api-health-deep-JagqSNAKpfc` (leaves the original `api-health` check untouched).
- `gcloud logging metrics delete api_error_rate`.
- Delete the notification channel via the Monitoring API (`DELETE .../notificationChannels/12916402525072961367`) once no longer referenced by any policy.
- Delete the dashboard via the Monitoring API (`DELETE .../dashboards/782d6846-...`).

No code, secrets, or Cloud Run configuration were touched, so no application-side rollback is needed.
