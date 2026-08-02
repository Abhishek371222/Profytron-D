# Day 15 — Support Dogfood + Paper Trading Verification

**Date:** 2026-08-02  
**Scope:** Production dogfood only. No production code changes. No deploy. No commit.  
**Tester role:** Internal support engineer + early beta customer (black-box usage).  
**API:** `https://api-y4zmug7lwa-el.a.run.app`  
**Web:** `https://www.profytron.com`  

---

## Executive Summary

Production was healthy throughout dogfood: `/live`, `/ready`, `/health` all **HTTP 200** with Redis/queue/WebSocket healthy and MetaAPI configured. Public journey surfaces (login/register/forgot/status/pricing/help) load. Critical auth/API gatekeeping holds (wallet/broker/coach/trading **401** without JWT).  

**No P0 production bugs were confirmed** under the P0 definition (cannot login, money loss, security bypass, crash loops, broken checkout with evidence).  

**Primary gap:** Full authenticated support walkthrough (dashboard widgets, wallet deposits, paper connect, order placement, AI coach chat, admin actions) is **NOT VERIFIED live** because **no production support/beta credentials** were available in this session. Those steps are classified as incomplete dogfood, not as invented failures.

**Paper trading (architecture + unauth API shell):** Paper execution is isolated from MetaAPI by code (`isPaperTrading` short-circuits MT paths). Live place/open/close cycles were **not executed** in production without a session. Two **non-P0** product/data observations are documented for later prioritization.

---

## Environment

| Item | Value |
| --- | --- |
| Git branch | `main` (tracking `origin/main`, clean for tracked work) |
| HEAD | `b2b88e2` — Day 13 close-out tests/docs |
| Cloud Run revision | **`api-00093-rvg`** |
| Process `gitSha` | **`e336e3e`** (user-enumeration fix still serving live) |
| Abort on unhealthy | **Not triggered** |

### Phase 0 health

| Probe | HTTP | Notes |
| --- | --- | --- |
| `GET /live` | 200 | `status:ok`, gitSha `e336e3e` |
| `GET /ready` | 200 | DB connected; redis `skipped` on ready path |
| `GET /health` | 200 | DB/redis/queue/ws healthy; `metaApi: configured` |

---

## User Journey

### Support dogfood path (as exercised)

| Step | Surface | Result | Auth needed? |
| --- | --- | --- | --- |
| Landing | `/` | **200** (~623 ms) HTML | No |
| Login shell | `/login` | **200** | No |
| Register shell | `/register` | **200** | No |
| Signup alias | `/signup` | **308 → `/register` 200** | No |
| Forgot password | `/forgot-password` | **200** | No |
| Verify email shell | `/verify-email` | **200** | No |
| Status | `/status` | **200**, status keyword present | No |
| Pricing / help / about / legal | various | **200** | No |
| Dashboard SPA shell | `/dashboard` (+ wallet, billing, coach, etc.) | **200** HTML shell (~26k same family) — **client-gated; not fully exercised logged-in** | Yes for real UX |
| Admin SPA shell | `/admin` | **200** HTML (client-side gate presumed); API `GET /v1/admin/users` **401** | Yes |

### API auth gate (unauthenticated)

| Call | Expected | Observed |
| --- | --- | --- |
| `GET /v1/wallet/balance` | 401 | **401** |
| `GET /v1/broker/accounts` | 401 | **401** |
| `GET /v1/coach/conversations` | 401 | **401** |
| `GET /v1/trading/trades/open` | 401 | **401** |
| `GET /v1/trading/trades/history` | 401 | **401** |
| `GET /v1/users/me` | 401 | **401** |
| `GET /v1/notifications` | 401 | **401** |
| `GET /v1/leaderboard/me` | 401 | **401** |
| `GET /v1/trading/master-status` | 401/403 | **401** |
| `GET /v1/admin/users` | 401 | **401** |

### Public product APIs

| Call | HTTP | Notes |
| --- | --- | --- |
| `GET /v1/subscriptions/plans` | **200** | Trial/plan surface alive |
| `GET /v1/marketplace` | **200** | Listings payload |
| `GET /v1/strategies` | **200** | 10 strategies; no secret fields in first item keys |
| `GET /v1/leaderboard/monthly` | **200** | empty entries for period |
| `GET /v1/leaderboard/alltime` | **200** | has entries |
| `GET /v1/leaderboard/strategies` | **200** | ok |
| `GET /v1/marketplace/listings` | **404** | wrong path (correct is `/v1/marketplace`) — dogfood confusion risk only if docs use wrong path |
| `GET /v1/leaderboard` | **404** | must use `/monthly` or `/alltime` |

### Auth unauthenticated behaviours

| Action | HTTP | Body / notes |
| --- | --- | --- |
| Login wrong/nonexistent | **401** | `INVALID_CREDENTIALS` / **Invalid email or password.** (Day 13 fix intact) |
| Forgot password | **200** | Non-enumerating: “If this email exists, a reset link was sent” |
| Register | not fully exercised (avoid spam) | Day 13: rate limit 5/60s verified previously |

### Authenticated steps **NOT VERIFIED** (credentials absent)

Register→OTP→login, dashboard real data, wallet load, billing checkout, Platform Trial claim, AI Coach chat, paper connect, orders, history, notifications inbox, profile edits, settings, admin tools.

---

## Support Findings

| ID | Area | Severity | Notes |
| --- | --- | --- | --- |
| S1 | Full dashboard dogfood | **Incomplete verification** | SPA shells load; interaction requires JWT |
| S2 | Wrong leaderboard/marketplace subpaths | **P3** | 404 if client hits `/leaderboard` or `/marketplace/listings` raw — canonical routes work |
| S3 | `/signup` → `/register` | **OK** | 308 then 200 — intentional alias |
| S4 | Admin HTML route publicly returns shell | **P3/ops** | No API privilege; deeper client guard **NOT VERIFIED** without browser session |
| S5 | `/api/docs` still **200** | **P3** | Day 12 residual (`NODE_ENV` posture) |

**No** confirmed dead buttons, 500 HTML, broken auth gates, or checkout 500s on exercised surfaces.

---

## Paper Trading Verification

### Architecture (code + isolation) — verified by inspection

| Requirement | Evidence | Status |
| --- | --- | --- |
| Paper account connect | UI/`BrokerConnectModal` + `DashboardLayoutClient.connectDemoAccount` posts `brokerName: 'PAPER'`; `BrokerService` uses `PaperBrokerAdapter` when `brokerName === 'PAPER'`; sets `isPaperTrading: true`, `metaApiAccountId: null` | **CODE PASS** |
| Virtual balance | `PaperBrokerAdapter.connect` returns $100k–$150k demo balance, no MetaAPI | **CODE PASS** |
| No MetaAPI on paper open | `trade.processor`: MetaAPI execute only `if (!brokerAccount.isPaperTrading && mtAdapter.isLive)` | **CODE PASS** |
| `isPaper` flag on trade | `isPaper: brokerAccount.isPaperTrading` on create | **CODE PASS** |
| Live flag separation | Activation tracks `FIRST_PAPER_TRADE` vs `FIRST_REAL_TRADE` | **CODE PASS** |
| Live broker require util | `findActiveLiveBroker` forces `isPaperTrading: false` | **CODE PASS** |

### Runtime path (production execution)

| Step | Status |
| --- | --- |
| Create paper account | **NOT VERIFIED live** (needs JWT) |
| Order buy/sell/manual | **NOT VERIFIED live** |
| Close / modify / open / history / PnL | **NOT VERIFIED live** |
| Leaderboard paper contribution | Public leaderboard works; paper attribution **NOT VERIFIED** |
| Reset paper account | **NOT FOUND** dedicated reset endpoint in trading controller (N/A or elsewhere) |

### Paper behaviour observations (code — not auto-fix)

| ID | Finding | Class | Why not P0 |
| --- | --- | --- | --- |
| PT1 | After paper open, **auto-close after 10s** with **synthetic random close/PnL** (`setTimeout` + `Math.random()` in `trade.processor`) | **P1 product** — unrealistic PnL / history not driven by true close | No real money; does not crash production |
| PT2 | `PaperBrokerAdapter.closeTrade` returns `close_price: 0`, `profit: 0` | **P2** | Paper path often DB-updates directly; adapter stub is weak if used |
| PT3 | Web BFF `app/api/trading/trades/history` coerces **`isPaper: false as const`** for DB history rows | **P2 UI accuracy** | Mislabels paper vs real in history type/display contract |

**No evidence** of paper trades writing MetaAPI seats, debits wallet balance as real money, or cross-user trade corruption under unauth testing.

---

## Performance

Client timings (this environment RTT included):

| Endpoint | Samples |
| --- | --- |
| `/v1/subscriptions/plans` | 133–170 ms |
| `/v1/marketplace` | 302–355 ms |
| `/dashboard` HTML | 324–393 ms |
| Login 401 | ~562 ms |
| Forgot password | 90–328 ms |
| `/health` | ~110 ms |

Paper order latency **NOT MEASURED** live (no authenticated place-order cycle).

---

## Security

| Check | Result |
| --- | --- |
| Paper ≠ live MetaAPI path | **CODE PASS** |
| Trading/wallet/admin without JWT | **401** |
| No secrets in public strategies sample | **PASS** |
| Login enumeration regression | **PASS** (generic message) |
| Forgot password enumeration | **PASS** (generic message) |
| Master status admin | requires auth (401 unauth) |
| Privilege escalation | **NOT VERIFIED** for authenticated admin mis-role without second session |
| IDOR paper/live | **NOT VERIFIED** live (Day 13 wallet unit/IDOR tests exist; trading ownership **CODE-scoped by userId** on controller) |

---

## Logs

| Signal | Result (window checked) |
| --- | --- |
| ERROR severity (api, 2h) | **Empty sample** |
| HTTP ≥500 (api, 6h) | **Empty sample** |
| textPayload:paper (24h, limit 5) | **Empty sample** |
| Stuck retry loops | **Not observed** in small window |

---

## Regression

| Feature | Probe | Result |
| --- | --- | --- |
| Health | `/live` `/ready` `/health` | **200 / ok** |
| Platform Trial surface | plans | **200** |
| Wallet gate | balance | **401** |
| AI Coach gate | conversations | **401** |
| MetaAPI | health `metaApi: configured` | **ok** |
| Auth enum fix | login | **generic 401** |
| Marketplace | `/v1/marketplace` | **200** |

Day 13 rate-limit full burst **not re-burned** today; prior Day 13/13-final evidence stands; login still returns `X-RateLimit-Limit: 5` on recent production fixes.

---

## Issues

| ID | Sev | Title | Fix today? |
| --- | --- | --- | --- |
| D15-1 | Incomplete | Authenticated journey + full paper order cycle not live dogfooded | No — needs operator credentials |
| D15-2 | P1 | Paper auto-close + random PnL after 10s | **Documented only** (not P0 money/security/crash) |
| D15-3 | P2 | PaperAdapter stub close P/L zeroes | Document only |
| D15-4 | P2 | History BFF forces `isPaper: false` | Document only |
| D15-5 | P3 | API path footguns (`/leaderboard`, `/marketplace/listings`) | Document only |
| D15-6 | P3 | Swagger still public | Document only |

---

## P0 Bugs

**None confirmed.**

No code changes. No deploy. No commit.

If a future authenticated dogfood proves “cannot place paper order”, “wallet debit on paper”, or “500 loop on order”, treat those as new P0 tickets with reproduction before any fix.

---

## Recommendations (next sessions)

1. Run Day 15 **part B** with a dedicated **support beta user** (env secrets or 1Password) — full paper connect → order → close → history checklist.  
2. Product call on **PT1** (remove random auto-close; close only via user/manual/sync).  
3. Fix history BFF to pass through `isPaper` from DB.  
4. Ops: continue `BETA_ALLOWLIST` / `NODE_ENV` backlog items from Day 13.

### Operator paper checklist (once logged in)

```text
1. Connect paper: POST /v1/broker/accounts/connect { brokerName: PAPER, login: PAPER, serverName: PAPER }
2. GET /v1/broker/accounts → isPaperTrading true, no live MetaAPI id
3. POST /v1/trading/trades/order (manual) → open trade isPaper true
4. GET /v1/trading/trades/open
5. POST close / PATCH modify
6. GET /v1/trading/trades/history
7. Confirm no MetaAPI 4xx/5xx in Cloud Run attributed to paper account id
```

---

## Final Verdict

### ⚠️ PASSED WITH OBSERVATIONS

Unhealthy production was not observed. Public support surfaces and API auth gates work. Auth hygiene (generic login/forgot) holds. Paper isolation from MetaAPI is code-solid.  

Observations remaining: incomplete authenticated dogfood (credentials), paper synthetic auto-close/PnL, minor history labeling, path footguns.

**Day 15 (Support Dogfood + Paper Trading Verification) is complete within the constraints of unauthenticated production dogfood + code-path verification.** Full signed-in support walkthrough remains a gated follow-up, not a failed P0.

---

## Appendix — Evidence sources

- Live HTTP probes against production web/API (PowerShell / curl)  
- `gcloud run services describe` · logging ERROR/5xx samples  
- Source: `trade.processor.ts`, `paper.adapter.ts`, `broker.service.ts`, `trading.controller.ts`, `DashboardLayoutClient.tsx`, `BrokerConnectModal.tsx`, history BFF route  
- Prior: Days 12–13 audits for residual ops items
