# Master Roadmap — Evidence Gates (path to 10/10)

Order of attack is **gate confidence**, not calendar week alone.

| # | Stage | Engineering work | Evidence destination |
|---|-------|------------------|----------------------|
| 1 | Close open In Progress residual work | PT-W01 LCP, PT-P03 billing polish, PT-W02 mobile | `Evidence/performance`, `Evidence/release` |
| 2 | Close Critical Not Started | PT-M01 PostHog prod, PT-A04 Safari auth, etc. | `Evidence/operations`, `Evidence/testing` |
| 3 | Hardening batch (code) | Multi-instance throttle, signal unique, 2FA at-rest, deposit keys | `Evidence/security`, code PRs → this batch **partially landed 2026-08-02** |
| 4 | Automated testing gates | Playwright CI smoke, API probe e2e, race suites | `Evidence/testing` |
| 5 | Accessibility + Lighthouse gates | CI LH a11y/SEO hard fail; full WCAG audit | `Evidence/performance` |
| 6 | Staging money validation | Stripe/Razorpay deposits, refunds, renewals | `Evidence/operations` |
| 7 | Load + reliability | k6 100/500/1000, restore drill, alert fire/recover | `Evidence/reliability` |
| 8 | Closed beta | Cohort goals, incident log, funnel metrics | `Evidence/release` |
| 9 | Launch | Rollback drill + signed launch checklist | `Evidence/release` |

**Do not open broad new product modules** until gates 6–8 are green.
