# Prod smoke — 2026-08-02 (continue batch)

HEAD checks against production www:

| URL | Status |
|-----|--------|
| https://www.profytron.com/ | 200 |
| https://www.profytron.com/status | 200 |
| https://www.profytron.com/robots.txt | 200 |
| https://www.profytron.com/sitemap.xml | 200 |
| https://www.profytron.com/pricing | 200 |
| https://www.profytron.com/brokers | 200 |
| https://www.profytron.com/help | 200 |

## Continue-batch code (not yet on prod until deploy)

- Hero ambient: no WebGL on ≤767px
- Footer product/resource links fixed (pricing page, get-bots, status)
- About / pricing / contact internal link rows
- Onboarding welcome step list + paper skip; risk secure cookie + `ONBOARDING_COMPLETED` event; marketplace CTA
- ChoiceCard min touch height 48px
