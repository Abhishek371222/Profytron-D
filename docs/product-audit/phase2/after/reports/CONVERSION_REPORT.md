# Conversion Report (Lab)

**Not production analytics.** Rates derived from journey step statuses in this lab run.

**Overall lab success rate:** 0.902

| Journey | Success rate | Skip rate | Avg step ms | Total wall ms |
| --- | --- | --- | --- | --- |
| visitor | 1 | 0 | 6534 | 26154 |
| auth | 0.75 | 0.125 | 4915 | 39346 |
| onboarding | 1 | 0 | 6318 | 25287 |
| broker | 0.667 | 0.333 | 2458 | 7384 |
| dashboard | 1 | 0 | 3667 | 11012 |
| strategies | 1 | 0 | 3613 | 10849 |
| ai_coach | 0.667 | 0.333 | 2390 | 7177 |
| billing | 0.833 | 0.167 | 3016 | 18110 |
| settings | 1 | 0 | 3741 | 26214 |
| marketplace | 1 | 0 | 3612 | 7231 |
| error_recovery | 1 | 0 | 5265 | 10535 |

## Step funnel detail

### Visitor marketing (`visitor`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| home | / | Complete | 1 | no | 9314 |
| pricing | /pricing | Complete | 1 | no | 5498 |
| about | /about | Complete | 1 | no | 5913 |
| help | /help | Complete | 1 | no | 5409 |

### Authentication surfaces (`auth`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| register | /register | Complete | 1 | no | 7380 |
| login | /login | Complete | 1 | no | 6399 |
| forgot | /forgot-password | Complete | 1 | no | 5667 |
| reset | /reset-password | Complete | 1 | no | 5331 |
| verify | /verify-email | Complete | 1 | no | 6026 |
| oauth_buttons | /login | Complete | 1 | no | 4276 |
| logout | /dashboard | Partial | 0.5 | no | 4240 |
| live_otp | /register | Blocked | 0 | no | 0 |

### Onboarding (`onboarding`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| welcome | /onboarding | Complete | 1 | no | 6417 |
| risk | /onboarding/risk | Complete | 1 | no | 5896 |
| terms | /terms | Complete | 1 | no | 7298 |
| risk_disclosure | /risk-disclosure | Complete | 1 | no | 5659 |

### Broker connection (`broker`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| accounts | /connected-accounts | Complete | 1 | no | 3858 |
| connect_cta | /connected-accounts | Complete | 1 | no | 3517 |
| live_metaapi | /connected-accounts | Blocked | 0 | no | 0 |

### Dashboard (`dashboard`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| overview | /dashboard | Complete | 1 | no | 3738 |
| analytics | /analytics | Complete | 1 | no | 3615 |
| markets | /markets | Complete | 1 | no | 3649 |

### Strategies (`strategies`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| browse | /strategies | Complete | 1 | no | 3544 |
| builder | /strategies/builder | Complete | 1 | no | 3718 |
| my_bots | /my-bots | Complete | 1 | no | 3577 |

### AI Coach (`ai_coach`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| open | /alpha-coach | Complete | 1 | no | 3636 |
| input | /alpha-coach | Complete | 1 | no | 3533 |
| live_stream | /alpha-coach | Partial | 0.5 | no | 0 |

### Billing & subscriptions (`billing`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| pricing | /pricing | Complete | 1 | no | 3632 |
| billing | /billing | Complete | 1 | no | 3672 |
| subscriptions | /subscriptions | Complete | 1 | no | 3681 |
| wallet | /wallet | Complete | 1 | no | 3483 |
| settings_billing | /settings/billing | Complete | 1 | no | 3628 |
| live_checkout | /billing | Blocked | 0 | no | 0 |

### Settings (`settings`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| root | /settings | Complete | 1 | no | 3581 |
| profile | /settings/profile | Complete | 1 | no | 3903 |
| security | /settings/security | Complete | 1 | no | 3742 |
| notifications | /settings/notifications | Complete | 1 | no | 3570 |
| trading | /settings/trading | Complete | 1 | no | 3677 |
| api_keys | /settings/api-keys | Complete | 1 | no | 3639 |
| support | /settings/support | Complete | 1 | no | 4074 |

### Marketplace (`marketplace`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| browse | /marketplace | Complete | 1 | no | 3595 |
| success | /marketplace/success | Complete | 1 | no | 3629 |

### Error recovery probes (`error_recovery`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| not_found | /this-route-does-not-exist-product-audit | Complete | 1 | no | 6877 |
| authed_without_jwt | /dashboard | Complete | 1 | no | 3652 |
