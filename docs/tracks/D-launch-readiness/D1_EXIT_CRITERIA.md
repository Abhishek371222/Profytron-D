# D1 — Exit Criteria

| # | Criterion | Status |
| ---: | --- | :---: |
| 1 | Health endpoints documented and verified (`/live`, `/ready`, `/health`) | ✅ Code + docs (`D1_HEALTH.md`) — **operator curl verify pending** |
| 2 | Monitoring covers critical services (documented sources) | ✅ Doc (`D1_MONITORING.md`) — **host dashboards confirm pending** |
| 3 | Alerts actionable and mapped to runbooks | ✅ Catalog + runbooks — **wire in host pending** |
| 4 | Backup and restore evidence current | 🟡 Tooling exists — **fill restore date / RPO/RTO actuals** |
| 5 | Incident runbooks for major failures | ✅ `runbooks/` |
| 6 | Operational dashboard complete | ✅ `OPERATIONS_DASHBOARD.md` |
| 7 | Remaining launch blockers clearly identified | ✅ On dashboard |

**D1 engineering baseline:** complete.  
**D1 closed for launch:** after operator rows above flipped with evidence in `WEEKLY_LOG.md`.
