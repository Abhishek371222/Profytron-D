# Staging Deployment Report — RC-1

**Date:** 2026-08-02  
**Code:** `4911b69` (includes RC-1 + Nest circular boot fix)  
**Production Cloud Run:** **not revised**

## Staging endpoints

| Service | URL | Revision |
|---------|-----|----------|
| API staging | https://api-staging-y4zmug7lwa-el.a.run.app | `api-staging-00002-ltm` (image staging-4911b69…) |
| Web staging | Deploy via `cloudbuild-web-staging.yaml` | separate from production `web` |
| Production API | https://api-y4zmug7lwa-el.a.run.app | still `gitSha: c13eedb` (untouched) |

## How to redeploy staging API only

```powershell
gcloud builds submit --config=cloudbuild-api-staging.yaml `
  --project=gen-lang-client-0497144011 `
  --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
```

Does **not** update production service `api`.
