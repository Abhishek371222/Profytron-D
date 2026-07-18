# Coach Insights — Build notes

**Status:** Instrumented baseline shipped  

## Shipped

- Event taxonomy + KPIs docs  
- `CoachInsightEvent` table + migration  
- `POST /coach/insights/events` (authenticated)  
- `GET /coach/admin/insights?days=` (admin)  
- Client dual-write via `trackCoachEvent` (PostHog + first-party)  
- Alpha Coach instrumentation: session, suggestions, messages, intents, responses, errors, evidence expand, feedback, trade select, abandon  
- Admin UI: `/admin/coach-insights`

## Not yet (phase 2)

- Retention correlation join (Coach WAU ∩ product retention cohorts)  
- Strategy-open CTA funnel (`coach_cta_open_strategy`) end-to-end  
- Real-time dashboard alerts for unsupported-intent spikes  

## Deploy

Run Prisma migrate for `20260719040000_coach_insight_events` before relying on Insights UI.
