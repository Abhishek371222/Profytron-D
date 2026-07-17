# Profytron GCP — Runbooks (CLI only)

Project: `gen-lang-client-0497144011` · Region: `asia-south1`

## Quick commands

| Action | Command |
|--------|---------|
| Full bootstrap | `.\deploy\gcp\scripts\setup.ps1` |
| Inventory | `.\deploy\gcp\scripts\gcp-inventory.ps1` |
| Enable safe APIs | `.\deploy\gcp\scripts\enable-apis.ps1` |
| Cost audit | `.\deploy\gcp\scripts\cost-audit.ps1` |
| Health | `.\deploy\gcp\scripts\health.ps1` |
| IAM audit | `.\deploy\gcp\scripts\iam-audit.ps1` |
| Deploy | `.\deploy\gcp\scripts\deploy.ps1 -Service api` |
| Rollback | `.\deploy\gcp\scripts\rollback.ps1 -Service api -Revision <rev>` |

## Deploy (zero downtime)

Cloud Run revises with gradual traffic. Capture previous revision first (deploy script does this).

```powershell
.\deploy\gcp\scripts\deploy.ps1 -Service api
.\deploy\gcp\scripts\deploy.ps1 -Service web
.\deploy\gcp\scripts\deploy.ps1 -Service ai
.\deploy\gcp\scripts\deploy.ps1 -Service backtest
```

## Rollback

```powershell
gcloud run revisions list --service=api --region=asia-south1 --limit=5
.\deploy\gcp\scripts\rollback.ps1 -Service api -Revision api-XXXXX-XXX
```

## Disaster recovery

1. **App rollback** — route 100% traffic to last known-good Cloud Run revision (above).
2. **Secrets** — restore from Secret Manager version history:
   ```powershell
   gcloud secrets versions list SECRET_NAME
   gcloud secrets versions access VERSION --secret=SECRET_NAME
   ```
3. **Database**
   - If Neon: use Neon PITR / branch restore (external).
   - If Cloud SQL: enable backups first, then:
     ```powershell
     gcloud sql backups list --instance=INSTANCE
     gcloud sql backups restore BACKUP_ID --backup-instance=INSTANCE --backup-id=BACKUP_ID
     ```
4. **Redis** — Memorystore BASIC has no replica; treat as ephemeral cache. Restart app; warm caches.

## Stop expensive idle Cloud SQL (after confirming unused)

```powershell
# Soft stop (keeps disk; stops compute charges roughly)
gcloud sql instances patch profytron --activation-policy=NEVER

# Or delete only after snapshot + confirmation
# gcloud sql instances delete INSTANCE --quiet
```

## Enable backups on chosen Cloud SQL

```powershell
gcloud sql instances patch INSTANCE `
  --backup-start-time=02:00 `
  --enable-point-in-time-recovery `
  --retained-backups-count=7
```

## Terraform (platform resources only)

```powershell
cd deploy\gcp\terraform
terraform init
# Import Artifact Registry first — see IMPORT.md
terraform plan
terraform apply
```

## Monitoring

Existing ~23 alert policies. Add uptime check:

```powershell
gcloud monitoring uptime create api-health `
  --resource-type=uptime-url `
  --host=api-y4zmug7lwa-el.a.run.app `
  --path=/health `
  --period=60
```

(Exact flags vary by gcloud version; use `gcloud monitoring uptime --help`.)
