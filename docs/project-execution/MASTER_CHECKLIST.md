# Master Checklist — Objective Release Bars

A row is only checked when an artifact is linked in [`MASTER_EVIDENCE_INDEX.md`](./MASTER_EVIDENCE_INDEX.md).

## Code Quality
- [ ] Lint / type / build green on `main` (CI URL)
- [ ] No unresolved critical defects
- [ ] High-priority money/auth TODOs triaged or closed

## Testing
- [ ] API unit tests green (CI)
- [ ] Integration tests green with Postgres + Redis (CI)
- [ ] Playwright CI smoke green
- [ ] Money-path tests on staging (deposit / refund / renew)

## Security
- [ ] Secrets not in git; AES/JWT present only via secret manager
- [ ] Redis-backed rate limits in production
- [ ] 2FA secrets encrypted at rest (migrate users)
- [ ] Dependency audit reviewed for open High/Critical
- [ ] Auth + 2FA smoke on staging

## Performance
- [ ] Landing LCP target met (median of 3 Lighthouse mobile runs)
- [ ] CWV budgets satisfied for home/login/pricing
- [ ] k6 ladder 100 / 500 / 1000 attached

## Reliability
- [ ] `/live` `/ready` `/health` green on staging + prod
- [ ] Alert fire → page → recover drill recorded
- [ ] Backup restore success date recorded
- [ ] Rollback drill executed once

## Operations
- [ ] CI/CD green path documented
- [ ] Deploy revision history screenshot/log
- [ ] Runbook used successfully during a drill

## Documentation
- [ ] Architecture / API / deploy docs current for release candidate
- [ ] This control center kept current

## Release Validation
- [ ] Staging sign-off
- [ ] Closed beta objectives achieved
- [ ] Launch checklist fully checked or waived with written residual risks
