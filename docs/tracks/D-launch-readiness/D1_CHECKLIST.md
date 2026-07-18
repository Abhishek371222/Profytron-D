# D1 — Checklist (ops)

| Item | Status | Evidence |
| --- | :---: | --- |
| `/live` documented + curl OK in prod | 🟡 | Code ✅ · prod curl ⬜ |
| `/ready` documented + curl OK | 🟡 | |
| `/health` healthy/degraded/unhealthy understood | 🟡 | [`D1_HEALTH.md`](./D1_HEALTH.md) |
| Monitoring dashboards | ⬜ | [`D1_MONITORING.md`](./D1_MONITORING.md) |
| Alerts wired to runbooks | ⬜ | [`D1_ALERTING.md`](./D1_ALERTING.md) |
| Logging / Sentry | ⬜ | Confirm DSN |
| Backups / PITR confirmed | ⬜ | Neon console |
| Restore drill date recorded | ⬜ | [`D1_BACKUP_RESTORE.md`](./D1_BACKUP_RESTORE.md) |
| Incident runbooks | ✅ | `runbooks/` |
| Operations dashboard | ✅ | [`OPERATIONS_DASHBOARD.md`](./OPERATIONS_DASHBOARD.md) |
| Exit criteria reviewed | 🟡 | [`D1_EXIT_CRITERIA.md`](./D1_EXIT_CRITERIA.md) |
