# GCP production endpoints (canonical)

| Service | URL |
| --- | --- |
| API | https://api-y4zmug7lwa-el.a.run.app |
| Web (Cloud Run) | https://web-y4zmug7lwa-el.a.run.app |
| Public site | https://www.profytron.com |
| AI | https://ai-y4zmug7lwa-el.a.run.app |
| Backtest | https://backtest-y4zmug7lwa-el.a.run.app |

**Deploy:** push to `main` triggers Cloud Build (`deploy-api`, `deploy-web`, …) in `asia-south1`, or:

```powershell
.\deploy\gcp\scripts\deploy.ps1 -Service api
.\deploy\gcp\scripts\deploy.ps1 -Service web
```

**Do not** use `profytron-api.onrender.com` for production verification — that host is legacy/unused for this launch path.
