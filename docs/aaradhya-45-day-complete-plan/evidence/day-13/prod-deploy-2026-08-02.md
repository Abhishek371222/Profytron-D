# Production web deploy — 2026-08-02

## Why this note
Earlier closeout treated “deploy” as a human blocker. GCP/`gcloud` is available on this machine; deploy is agent work.

## Auth / project
- Account: active gcloud user on this host
- Project: `gen-lang-client-0497144011`
- Region: `asia-south1`
- Service: `web` (Cloud Run)

## Builds
| # | Build ID | Result | Notes |
|---|----------|--------|--------|
| 1 | `b03afe33-0941-48e6-901b-501782bb7e89` | FAILURE | Next.js webpack OOM (~2GB default heap) |
| 2 | `ab9157aa-3145-43c3-a9d4-9cdf535c02e3` | **SUCCESS** | After `NODE_OPTIONS=--max-old-space-size=6144` + `E2_HIGHCPU_32` |

Logs: https://console.cloud.google.com/cloud-build/builds/ab9157aa-3145-43c3-a9d4-9cdf535c02e3?project=919913292233

## Cloud Run
- **Revision (first ship):** `web-00073-qd7` — 100% traffic after build 2
- **Revision (LCP defer follow-up):** `web-00074-nkc` — build `33fbcc44-1c6b-4cb8-b283-2e6bea1ef87e` SUCCESS
- **URL:** https://web-y4zmug7lwa-el.a.run.app

## Builds (continued)
| # | Build ID | Result | Notes |
|---|----------|--------|--------|
| 3 | `33fbcc44-1c6b-4cb8-b283-2e6bea1ef87e` | **SUCCESS** | LandingHeavyShell defer + polling/leaderboard polish |

## Smoke after revision 74
- https://www.profytron.com/ → 200
- https://www.profytron.com/status → 200

## Follow-ups
- Safari device session (A04)
- ishit content, Stripe UAT, sheet paste
- See `PT-W01-lighthouse-median.md` for lab numbers