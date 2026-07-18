# User Journey Report

Evidence-only matrix from lab Playwright walks (2026-07-18T20:50:11.156Z).

**Base:** http://127.0.0.1:3000  
**JWT seeded:** yes  
**Probe depth:** screenshot + reachability smoke

## Summary

| Metric | Value |
| --- | --- |
| Journeys | 11 |
| Steps | 45 |
| Complete | 40 |
| Partial | 2 |
| Blocked | 3 |
| Missing | 0 |
| Skipped (policy) | 4 |

## Journey matrix

| Journey | Steps | Clicks | Wall ms | Console errs | Complete | Partial | Blocked | Missing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| visitor | 4 | 4 | 26154 | 4 | 4 | 0 | 0 | 0 |
| auth | 8 | 7 | 39346 | 7 | 6 | 1 | 1 | 0 |
| onboarding | 4 | 4 | 25287 | 3 | 4 | 0 | 0 | 0 |
| broker | 3 | 2 | 7384 | 2 | 2 | 0 | 1 | 0 |
| dashboard | 3 | 3 | 11012 | 3 | 3 | 0 | 0 | 0 |
| strategies | 3 | 3 | 10849 | 3 | 3 | 0 | 0 | 0 |
| ai_coach | 3 | 2 | 7177 | 2 | 2 | 1 | 0 | 0 |
| billing | 6 | 5 | 18110 | 5 | 5 | 0 | 1 | 0 |
| settings | 7 | 7 | 26214 | 6 | 7 | 0 | 0 | 0 |
| marketplace | 2 | 2 | 7231 | 2 | 2 | 0 | 0 | 0 |
| error_recovery | 2 | 2 | 10535 | 3 | 2 | 0 | 0 | 0 |

## Step detail

| Journey | Step | Path | Status | ms | Errors | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| visitor | home | / | Complete | 9314 | 1 | journeys/visitor/home.png |
| visitor | pricing | /pricing | Complete | 5498 | 1 | journeys/visitor/pricing.png |
| visitor | about | /about | Complete | 5913 | 1 | journeys/visitor/about.png |
| visitor | help | /help | Complete | 5409 | 1 | journeys/visitor/help.png |
| auth | register | /register | Complete | 7380 | 1 | journeys/auth/register.png |
| auth | login | /login | Complete | 6399 | 1 | journeys/auth/login.png |
| auth | forgot | /forgot-password | Complete | 5667 | 1 | journeys/auth/forgot.png |
| auth | reset | /reset-password | Complete | 5331 | 1 | journeys/auth/reset.png |
| auth | verify | /verify-email | Complete | 6026 | 1 | journeys/auth/verify.png |
| auth | oauth_buttons | /login | Complete | 4276 | 1 | journeys/auth/oauth_buttons.png |
| auth | logout | /dashboard | Partial | 4240 | 1 | journeys/auth/logout.png |
| auth | live_otp | /register | Blocked | 0 | 0 | — |
| onboarding | welcome | /onboarding | Complete | 6417 | 1 | journeys/onboarding/welcome.png |
| onboarding | risk | /onboarding/risk | Complete | 5896 | 0 | journeys/onboarding/risk.png |
| onboarding | terms | /terms | Complete | 7298 | 1 | journeys/onboarding/terms.png |
| onboarding | risk_disclosure | /risk-disclosure | Complete | 5659 | 1 | journeys/onboarding/risk_disclosure.png |
| broker | accounts | /connected-accounts | Complete | 3858 | 1 | journeys/broker/accounts.png |
| broker | connect_cta | /connected-accounts | Complete | 3517 | 1 | journeys/broker/connect_cta.png |
| broker | live_metaapi | /connected-accounts | Blocked | 0 | 0 | — |
| dashboard | overview | /dashboard | Complete | 3738 | 1 | journeys/dashboard/overview.png |
| dashboard | analytics | /analytics | Complete | 3615 | 1 | journeys/dashboard/analytics.png |
| dashboard | markets | /markets | Complete | 3649 | 1 | journeys/dashboard/markets.png |
| strategies | browse | /strategies | Complete | 3544 | 1 | journeys/strategies/browse.png |
| strategies | builder | /strategies/builder | Complete | 3718 | 1 | journeys/strategies/builder.png |
| strategies | my_bots | /my-bots | Complete | 3577 | 1 | journeys/strategies/my_bots.png |
| ai_coach | open | /alpha-coach | Complete | 3636 | 1 | journeys/ai_coach/open.png |
| ai_coach | input | /alpha-coach | Complete | 3533 | 1 | journeys/ai_coach/input.png |
| ai_coach | live_stream | /alpha-coach | Partial | 0 | 0 | — |
| billing | pricing | /pricing | Complete | 3632 | 1 | journeys/billing/pricing.png |
| billing | billing | /billing | Complete | 3672 | 1 | journeys/billing/billing.png |
| billing | subscriptions | /subscriptions | Complete | 3681 | 1 | journeys/billing/subscriptions.png |
| billing | wallet | /wallet | Complete | 3483 | 1 | journeys/billing/wallet.png |
| billing | settings_billing | /settings/billing | Complete | 3628 | 1 | journeys/billing/settings_billing.png |
| billing | live_checkout | /billing | Blocked | 0 | 0 | — |
| settings | root | /settings | Complete | 3581 | 0 | journeys/settings/root.png |
| settings | profile | /settings/profile | Complete | 3903 | 1 | journeys/settings/profile.png |
| settings | security | /settings/security | Complete | 3742 | 1 | journeys/settings/security.png |
| settings | notifications | /settings/notifications | Complete | 3570 | 1 | journeys/settings/notifications.png |
| settings | trading | /settings/trading | Complete | 3677 | 1 | journeys/settings/trading.png |
| settings | api_keys | /settings/api-keys | Complete | 3639 | 1 | journeys/settings/api_keys.png |
| settings | support | /settings/support | Complete | 4074 | 1 | journeys/settings/support.png |
| marketplace | browse | /marketplace | Complete | 3595 | 1 | journeys/marketplace/browse.png |
| marketplace | success | /marketplace/success | Complete | 3629 | 1 | journeys/marketplace/success.png |
| error_recovery | not_found | /this-route-does-not-exist-product-audit | Complete | 6877 | 2 | journeys/error_recovery/not_found.png |
| error_recovery | authed_without_jwt | /dashboard | Complete | 3652 | 1 | journeys/error_recovery/authed_without_jwt.png |
