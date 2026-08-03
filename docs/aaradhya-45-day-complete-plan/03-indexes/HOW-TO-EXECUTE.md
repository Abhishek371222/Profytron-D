# How to execute this plan at 100%

## Rule of thruput
1. **Evidence > promises.** No task done without screenshot / PR / URL / metric.
2. **Depth > breadth.** One finished PT-* beats five 40% polish tasks.
3. **In Progress always wins** unless a P0 production burn needs firefighting.
4. **Dependencies:** If blocked on ishit/sunish >30 minutes, write blocker in Standup and switch to next unblocked Critical.

## Daily 10h rhythm (from sheet)
| Block | Typical window | Type |
|-------|----------------|------|
| 1 | 09:00–10:00 | Standup / funnel watch / stabilise |
| 2–3 | Main implementation blocks | Core PT-* delivery |
| 4–5 | Ship/QA/support blocks | Evidence + mobile |
| Last | EOD | Sheet updates + post |

## Sheet update protocol
After any meaningful ship:
1. Master Tracker: Status, Actual Hours, Notes/Evidence
2. Website Checklist: Content/SEO/Prod columns honesty
3. Testing Dashboard if module quality changed
4. KPI if LCP/PostHog number known
5. SEO Tracker when landing for a keyword is live
6. Daily Standup row for the day

## Definition of a green day
- [ ] All CHECKLIST blocks checked or deferred with written reason
- [ ] At least one residual PT-* moved forward with evidence if workday
- [ ] No silent blockers
- [ ] Tomorrow first task pre-written

## Definition of phase exit
See each `00-days/<phase>/PHASE.md`.

## Quality bars by work type
### Performance
- 3× Lighthouse mobile runs; median counted
- LCP element identified in notes

### UI polish
- Desktop + 390px screenshots
- Empty/loading/error states covered

### SEO code
- view-source titles unique
- robots/sitemap still 200
- Share debugger for OG when images change

### Analytics
- Real prod event in PostHog UI (not just “wired”)
