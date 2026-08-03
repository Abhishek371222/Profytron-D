# Cookie / banner check (Day 13)

**Page:** https://www.profytron.com/cookies · route `apps/web/src/app/cookies/page.tsx`  
**Result:** Policy/marketing page exists (Strictly Necessary / Analytics / Functional).  
**No first-visit consent banner component** in `apps/web` (grep empty).

## Decision
| Item | Status |
|------|--------|
| Policy UX readable | Partial (page exists; not audit of legal sign-off) |
| Consent banner | **Not Implemented** → keep **PT-L02** Not Started |
| Analytics gate on reject | N/A until banner exists; PostHog currently loads after idle when key present (PT-M01) |

**Action:** Do not block Day 13 on banner. Implement banner only under PT-L02 with abhishek legal approval.
