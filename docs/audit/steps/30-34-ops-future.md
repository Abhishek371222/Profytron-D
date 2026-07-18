# Steps 30–34 — CI Gate, Scalability, Ownership, Layered Architecture, Future Readiness

## Step 30 — CI performance gate (design only)

Proposal file: `docs/audit/budgets/ci-performance-gate.md`  
**Not wired** into `.github/workflows` this phase.

Suggested fail conditions:

- JS total or dashboard route chunk > budget +5%
- LCP/FCP regression >15% vs baseline artifact
- Duplicate package versions introduced (pnpm)
- LHCI performance score < 0.85 on gated URLs (tighten from warn → error gradually)

Existing: `.lighthouserc.json` + `lighthouse.yml` (`continue-on-error: true`).

## Step 31 — Scalability

| VU target | Status |
|-----------|--------|
| 100–10000 | **NOT MEASURED** — `k6` binary not installed |
| Scripts present | `performance-tests/load-test.js`, `api-performance-test.js` |

Local single-user findings already show Neon RTT + MetaApi RTT as hard floors; at 1k VU expect MetaApi 429 circuit breaker (`METAAPI_RATE_LIMIT_COOLDOWN_MS`) and Bull/queue pressure (`queue: degraded` even idle).

## Step 32 — Code ownership (best-effort)

No `CODEOWNERS` file found. `git shortlog` ownership should be confirmed by org.

| Area | Primary paths |
|------|---------------|
| Rendering / web | `apps/web/src/app`, `components` |
| Caching | `apps/api/.../redis.service.ts`, `apps/web/src/lib/queries` |
| Dashboard | `apps/web/src/hooks/useDashboard*`, `components/dashboard` |
| Charts | `components/charts`, analytics components |
| Trading / MT5 | `apps/api/src/modules/trading`, `broker` |
| Auth | `apps/api/src/modules/auth`, `useAuthStore` |
| AI / Coach | `modules/coach`, `modules/ai`, `services/ai` |

## Step 33 — Layered rendering architecture

See `docs/audit/diagrams/layered-architecture.md`.

## Step 34 — Future readiness scorecard

| Capability | Readiness | Notes |
|------------|-----------|-------|
| React Compiler | **Adopted** | `reactCompiler: true` |
| Server Components | Low | 65/76 pages client; no server data |
| Streaming RSC data | Low | loading.tsx only |
| Edge rendering | Low | API routes force nodejs; dashboard force-dynamic |
| Worker threads | None | Opportunity for AI/parse |
| OffscreenCanvas | None | Charts/globe on main thread |
| WebGPU | None | three.js WebGL today |
| Partial hydration | Low | Full client dashboard |
| MetaApi streaming | Documented gap | REST poll only |
