# Staging Deployment Report — Demo readiness

**Date:** 2026-08-03  
**Code:** `ce5a81fcebf059b2a60dbdbd84a6d18cee4ade47`  
**Production Cloud Run:** **not revised** by this staging refresh  

## Staging endpoints

| Service | URL | Revision | Image tag |
|---------|-----|----------|-----------|
| API staging | https://api-staging-y4zmug7lwa-el.a.run.app | `api-staging-00003-nb9` | `api:staging-ce5a81fc…` |
| Web staging | https://web-staging-y4zmug7lwa-el.a.run.app | `web-staging-00002-fls` | `web:staging-ce5a81fc…` |

## Production (reference — not revised here)

| Service | Revision | Image |
|---------|----------|--------|
| Web | `web-00098-qqb` | `web:ce5a81fc…` @ 100% |
| API | `api-00117-bxt` | `api:ce5a81fc…` |

## Cloud Build IDs (demo env refresh)

| Target | Build ID | Status |
|--------|----------|--------|
| API staging | `46b3efdc-32af-4794-9c65-83546d0e16ef` | SUCCESS |
| Web staging | `ceb25195-baaf-489a-8f75-b149eea32609` | SUCCESS |

## How to redeploy staging API only

```powershell
gcloud builds submit --config=cloudbuild-api-staging.yaml `
  --project=gen-lang-client-0497144011 `
  --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
```

Does **not** update production service `api`.

## How to redeploy staging web only

```powershell
gcloud builds submit --config=cloudbuild-web-staging.yaml `
  --project=gen-lang-client-0497144011 `
  --substitutions=COMMIT_SHA=...,_BACKEND_API_ORIGIN=https://api-staging-y4zmug7lwa-el.a.run.app,_NEXT_PUBLIC_APP_URL=https://web-staging-y4zmug7lwa-el.a.run.app,_NEXT_PUBLIC_FRONTEND_URL=https://web-staging-y4zmug7lwa-el.a.run.app,_NEXT_PUBLIC_API_URL=/api,...
```

Does **not** update production service `web`.

## Demo guidance

- Prefer **staging** URLs for investor/customer demos when live systems must be isolated.  
- Use **paper/demo broker** connect only.  
- Keep demo credentials in 1Password; never commit.  
- Local MSW credentials (`demo@profytron.com`) apply **only** when `NEXT_PUBLIC_ENABLE_MOCK_API=true` (not staging/prod images built with mock=false).
