# Staging Deployment Report — RC-1

**Date:** 2026-08-02  
**Code:** `4911b69` (includes RC-1 + Nest circular boot fix)  
**Production Cloud Run:** **not revised**

## Staging endpoints

| Service | URL | Revision |
|---------|-----|----------|
| API staging | https://api-staging-y4zmug7lwa-el.a.run.app | `api-staging-00002-ltm` (`gitSha` 4911b69) |
| Web staging | https://web-staging-y4zmug7lwa-el.a.run.app | `web-staging-00001-z2q` |
| Production API | https://api-y4zmug7lwa-el.a.run.app | Auto-revised by `cloud-build-deployer` after main push (verify on deploy) |

## How to redeploy staging API only

```powershell
gcloud builds submit --config=cloudbuild-api-staging.yaml `
  --project=gen-lang-client-0497144011 `
  --substitutions=COMMIT_SHA=$(git rev-parse HEAD)
```

Does **not** update production service `api`.
