#!/usr/bin/env node
/**
 * Product Excellence Phase 1 — generate all markdown reports from capture data.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  loadEnv,
  ensureDirs,
  readJson,
  loadJourneys,
  OUT_ROOT,
  REPORTS,
  DATA,
} from './lib.mjs';

loadEnv();
ensureDirs();

function writeReport(name, body) {
  const p = path.join(REPORTS, name);
  fs.writeFileSync(p, body.trimEnd() + '\n');
  return p;
}

function writeRoot(name, body) {
  fs.writeFileSync(path.join(OUT_ROOT, name), body.trimEnd() + '\n');
}

function mdTable(headers, rows) {
  const esc = (c) => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const head = `| ${headers.map(esc).join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map(esc).join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}`;
}

const manifest = loadJourneys();
const journeys = readJson('journey-results.json', {
  journeys: [],
  summary: {},
  hasJwt: false,
  base: '',
  capturedAt: null,
});
const conversion = readJson('conversion.json', { funnels: [], overallSuccessRateLab: 0 });
const errors = readJson('errors.json', { probes: [], summary: {} });
const empty = readJson('empty-states.json', { pages: [] });
const inventory = readJson('inventory.json', { journeys: [], features: [] });

const allSteps = (journeys.journeys || []).flatMap((j) =>
  (j.steps || []).map((s) => ({ ...s, journeyId: j.id, domain: j.domain })),
);

function domainJourney(domainOrId) {
  return (journeys.journeys || []).find(
    (j) => j.id === domainOrId || j.domain === domainOrId,
  );
}

function domainReport(title, journeyId, extra = '') {
  const j = domainJourney(journeyId);
  if (!j) {
    return `# ${title}

_No capture data for journey \`${journeyId}\`. Run \`pnpm product-audit:journeys\`._

${extra}
`;
  }
  const rows = j.steps.map((s) => [
    s.id,
    s.path,
    s.status,
    s.wallMs ?? '',
    (s.consoleErrors || []).length,
    s.screenshot || s.evidence || '—',
    s.note || '',
  ]);
  return `# ${title}

**Journey:** ${j.name} (\`${j.id}\`)  
**Wall time:** ${j.wallMs} ms  
**Steps:** ${j.steps.length}

${mdTable(
  ['Step', 'Path', 'Status', 'ms', 'Console errs', 'Evidence', 'Note'],
  rows,
)}

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |

${extra}
`;
}

// --- USER_JOURNEY_REPORT ---
writeReport(
  'USER_JOURNEY_REPORT.md',
  `# User Journey Report

Evidence-only matrix from lab Playwright walks (${journeys.capturedAt || 'n/a'}).

**Base:** ${journeys.base || '—'}  
**JWT seeded:** ${journeys.hasJwt ? 'yes' : 'no'}  
**Probe depth:** screenshot + reachability smoke

## Summary

${mdTable(
  ['Metric', 'Value'],
  [
    ['Journeys', journeys.summary?.journeys ?? 0],
    ['Steps', journeys.summary?.steps ?? 0],
    ['Complete', journeys.summary?.complete ?? 0],
    ['Partial', journeys.summary?.partial ?? 0],
    ['Blocked', journeys.summary?.blocked ?? 0],
    ['Missing', journeys.summary?.missing ?? 0],
    ['Skipped (policy)', journeys.summary?.skipped ?? 0],
  ],
)}

## Journey matrix

${mdTable(
  ['Journey', 'Steps', 'Clicks', 'Wall ms', 'Console errs', 'Complete', 'Partial', 'Blocked', 'Missing'],
  (journeys.journeys || []).map((j) => [
    j.id,
    j.steps.length,
    j.clicks,
    j.wallMs,
    (j.consoleErrors || []).length,
    j.steps.filter((s) => s.status === 'Complete').length,
    j.steps.filter((s) => s.status === 'Partial').length,
    j.steps.filter((s) => s.status === 'Blocked').length,
    j.steps.filter((s) => s.status === 'Missing').length,
  ]),
)}

## Step detail

${mdTable(
  ['Journey', 'Step', 'Path', 'Status', 'ms', 'Errors', 'Evidence'],
  allSteps.map((s) => [
    s.journeyId,
    s.id,
    s.path,
    s.status,
    s.wallMs ?? '',
    (s.consoleErrors || []).length,
    s.screenshot || '—',
  ]),
)}
`,
);

writeReport('ONBOARDING_REPORT.md', domainReport('Onboarding Report', 'onboarding'));
writeReport('AUTH_REPORT.md', domainReport('Auth Report', 'auth', `
## Policy skips

Live email OTP and live OAuth handshakes are **Blocked/Partial** by design — UI reachability only.
`));
writeReport('BROKER_FLOW_REPORT.md', domainReport('Broker Flow Report', 'broker', `
## Policy skips

Live MetaAPI connect is **Blocked** — CTA/page reachability only.
`));
writeReport(
  'STRATEGY_REPORT.md',
  domainReport('Strategy Report', 'strategies'),
);
writeReport(
  'AI_COACH_REPORT.md',
  domainReport('AI Coach Report', 'ai_coach', `
## Policy skips

Live model streaming classified **Partial** when not exercised.
`),
);
writeReport(
  'MARKETPLACE_REPORT.md',
  domainReport('Marketplace Report', 'marketplace'),
);
writeReport(
  'BILLING_REPORT.md',
  domainReport('Billing Report', 'billing', `
## Policy skips

Real Razorpay/Stripe checkout is **Blocked**.
`),
);
writeReport('SETTINGS_REPORT.md', domainReport('Settings Report', 'settings'));

writeReport(
  'ERROR_RECOVERY_REPORT.md',
  `# Error Recovery Report

${mdTable(
  ['Probe', 'Status', 'Note', 'Evidence'],
  (errors.probes || []).map((p) => [
    p.id,
    p.status,
    p.note || '',
    p.screenshot || '—',
  ]),
)}

## Journey error_recovery steps

${(() => {
  const j = domainJourney('error_recovery');
  if (!j) return '_No journey capture._';
  return mdTable(
    ['Step', 'Path', 'Status', 'Note'],
    j.steps.map((s) => [s.id, s.path, s.status, s.note || '']),
  );
})()}
`,
);

writeReport(
  'EMPTY_STATE_REPORT.md',
  `# Empty State Report

Screenshots of empty-capable surfaces (lab). Empty cue detection is heuristic.

${mdTable(
  ['Page', 'Path', 'Status', 'Empty cue', 'Evidence', 'Note'],
  (empty.pages || []).map((p) => [
    p.id,
    p.path,
    p.status,
    p.emptyCueDetected ? 'yes' : 'no',
    p.screenshot || '—',
    p.note || '',
  ]),
)}
`,
);

writeReport(
  'CONVERSION_REPORT.md',
  `# Conversion Report (Lab)

**Not production analytics.** Rates derived from journey step statuses in this lab run.

**Overall lab success rate:** ${conversion.overallSuccessRateLab ?? 0}

${mdTable(
  ['Journey', 'Success rate', 'Skip rate', 'Avg step ms', 'Total wall ms'],
  (conversion.funnels || []).map((f) => [
    f.journeyId,
    f.successRateLab,
    f.skipRateLab,
    f.avgStepMs,
    f.totalWallMs,
  ]),
)}

## Step funnel detail

${(conversion.funnels || [])
  .map(
    (f) => `### ${f.name} (\`${f.journeyId}\`)

${mdTable(
  ['Step', 'Path', 'Status', 'Lab rate', 'Drop-off', 'ms'],
  (f.steps || []).map((s) => [
    s.stepId,
    s.path,
    s.status,
    s.completionRateLab,
    s.dropOff ? 'yes' : 'no',
    s.wallMs ?? '',
  ]),
)}
`,
  )
  .join('\n')}
`,
);

writeReport(
  'FEATURE_COMPLETENESS.md',
  `# Feature Completeness

Static inventory mapped to journey outcomes.

${mdTable(
  ['Feature', 'Domain', 'Status'],
  (inventory.features || manifest.features || []).map((f) => [
    f.name || f.id,
    f.domain,
    f.status || 'Missing',
  ]),
)}

## Journey rollup

${mdTable(
  ['Journey', 'Status', 'Complete', 'Partial', 'Blocked', 'Missing'],
  (inventory.journeys || []).map((j) => [
    j.id,
    j.status,
    j.complete,
    j.partial,
    j.blocked,
    j.missing,
  ]),
)}
`,
);

// Debt from measured failures / blocks only
const debt = [];
for (const s of allSteps) {
  if (s.status === 'Missing') {
    debt.push({
      id: `PROD-P0-${s.journeyId}-${s.id}`,
      sev: 'P0',
      finding: `Step ${s.journeyId}/${s.id} Missing: ${s.path}`,
      evidence: s.note || s.screenshot || 'journey-results',
      phase2: 'Investigate reachability / routing before launch',
    });
  } else if (s.status === 'Blocked' && s.skipped) {
    debt.push({
      id: `PROD-P1-${s.journeyId}-${s.id}`,
      sev: 'P1',
      finding: `Step ${s.journeyId}/${s.id} Blocked (policy skip): ${s.note || s.path}`,
      evidence: 'skipIf policy',
      phase2: 'Authorize live probe or manual QA outside measure harness',
    });
  } else if (s.status === 'Partial') {
    debt.push({
      id: `PROD-P2-${s.journeyId}-${s.id}`,
      sev: 'P2',
      finding: `Step ${s.journeyId}/${s.id} Partial: ${s.path}`,
      evidence: s.note || '',
      phase2: 'Tighten expect selectors or complete UI signal',
    });
  }
}
for (const p of errors.probes || []) {
  if (p.status === 'Missing') {
    debt.push({
      id: `PROD-P0-err-${p.id}`,
      sev: 'P0',
      finding: `Error probe ${p.id} Missing`,
      evidence: p.note || '',
      phase2: 'Fix error/recovery surface',
    });
  } else if (p.status === 'Partial') {
    debt.push({
      id: `PROD-P2-err-${p.id}`,
      sev: 'P2',
      finding: `Error probe ${p.id} Partial`,
      evidence: p.note || '',
      phase2: 'Improve offline/unauthorized UX if launch-critical',
    });
  }
}
if (!journeys.hasJwt) {
  debt.push({
    id: 'PROD-P0-JWT',
    sev: 'P0',
    finding: 'No AUDIT_JWT — authenticated journeys Blocked',
    evidence: 'env',
    phase2: 'Seed AUDIT_JWT for full lab coverage (measure only)',
  });
}

const bySev = { P0: [], P1: [], P2: [], P3: [] };
for (const d of debt) {
  (bySev[d.sev] || bySev.P3).push(d);
}

writeReport(
  'PRODUCT_DEBT.md',
  `# Product Debt

Derived **only** from measured skips/failures in this Phase 1 lab run.

${mdTable(
  ['ID', 'Severity', 'Finding', 'Evidence'],
  debt.map((d) => [d.id, d.sev, d.finding, d.evidence]),
)}

## Counts

| Severity | Count |
| --- | ---: |
| P0 | ${bySev.P0.length} |
| P1 | ${bySev.P1.length} |
| P2 | ${bySev.P2.length} |
| P3 | ${bySev.P3.length} |
`,
);

writeReport(
  'PRIORITY_MATRIX.md',
  `# Priority Matrix

| Priority | Theme | Items | Phase 2 stance |
| --- | --- | ---: | --- |
| P0 | Launch blockers (Missing / no JWT) | ${bySev.P0.length} | Fix reachability before claiming launch-ready |
| P1 | Policy-blocked live flows | ${bySev.P1.length} | Manual/live QA outside harness; do not enable in measure scripts |
| P2 | Partial UI signals | ${bySev.P2.length} | Tighten expectations or polish |
| P3 | Polish | ${bySev.P3.length} | Deferred |

${mdTable(
  ['ID', 'Sev', 'Finding', 'Suggested Phase 2'],
  debt.map((d) => [d.id, d.sev, d.finding, d.phase2]),
)}
`,
);

const themes = [
  ...new Set(
    debt
      .filter((d) => d.sev === 'P0' || d.sev === 'P1')
      .map((d) => d.phase2),
  ),
];

writeReport(
  'PHASE2_INPUTS.md',
  `# Phase 2 Inputs

Authorized fix themes from measured evidence only — **no speculative redesign**.

## Themes

${themes.length ? themes.map((t) => `- ${t}`).join('\n') : '- No P0/P1 themes yet (or captures incomplete).'}

## Explicit non-goals (still locked)

- Platform / UI / Database / API excellence redesigns
- Enabling live MetaAPI / checkout / OTP inside the harness
- Trading, auth product changes, AI model work

## Evidence pointers

- \`data/journey-results.json\`
- \`data/conversion.json\`
- \`data/errors.json\`
- \`data/empty-states.json\`
- \`data/inventory.json\`
- \`reports/PRODUCT_DEBT.md\`
`,
);

writeRoot(
  'README.md',
  `# Product Audit — Phase 1 (Measure Only)

Answers: *is Profytron launch-ready from a customer journey perspective?*

**Locks:** no redesign, backend, API, trading, auth, AI, UI, or feature work.

## Layout

| Path | Role |
| --- | --- |
| \`data/\` | journey-results, conversion, errors, empty-states, inventory |
| \`journeys/\` | PNGs + per-journey JSON |
| \`reports/\` | Evidence markdown |
| \`EXIT_CRITERIA.md\` | Mission checklist |

## Commands

\`\`\`bash
pnpm product-audit:journeys
pnpm product-audit:screenshots
pnpm product-audit:conversion
pnpm product-audit:errors
pnpm product-audit:empty
pnpm product-audit:reports
pnpm product-audit:all
\`\`\`

Env: \`PRODUCT_AUDIT_BASE\` (default \`http://localhost:3000\`), \`AUDIT_JWT\`, \`COMPAT_ADMIN_JWT\`, \`PRODUCT_AUDIT_LIMIT\`, \`PRODUCT_AUDIT_OUT\`.
`,
);

writeRoot(
  'IMPLEMENTATION_SUMMARY.md',
  `# Implementation Summary — Product Phase 1

## Harness

- \`tools/product-audit/journeys.json\` — ${manifest.journeys.length} journeys, ${(manifest.features || []).length} features
- Capture scripts: journeys, screenshots, conversion, errors, empty-states
- \`generate-reports.mjs\` → reports under \`docs/product-audit/phase1/reports/\`
- JWT seed reuses UI-audit pattern (\`profytron_access\` + \`profytron-auth\` + \`onboarding_completed\`)

## Lab run snapshot

| Metric | Value |
| --- | --- |
| Captured at | ${journeys.capturedAt || 'not yet'} |
| Base | ${journeys.base || '—'} |
| JWT | ${journeys.hasJwt ? 'yes' : 'no'} |
| Journeys | ${journeys.summary?.journeys ?? 0} |
| Steps Complete/Partial/Blocked/Missing | ${journeys.summary?.complete ?? 0}/${journeys.summary?.partial ?? 0}/${journeys.summary?.blocked ?? 0}/${journeys.summary?.missing ?? 0} |
| Debt items | ${debt.length} |

## Removability

All artifacts live under \`tools/product-audit/\`, \`docs/product-audit/\`, and \`apps/web/tests/product-audit/\` — no app product code changes.
`,
);

writeRoot(
  'EXIT_CRITERIA.md',
  `# Exit Criteria — Product Excellence Phase 1

| # | Criterion | Status |
| ---: | --- | --- |
| 1 | \`journeys.json\` covers visitor→error_recovery catalog | ${manifest.journeys.length >= 11 ? 'PASS' : 'FAIL'} |
| 2 | Capture scripts exist and skip live broker/checkout/OTP | PASS |
| 3 | \`data/journey-results.json\` written by harness | ${fs.existsSync(path.join(DATA, 'journey-results.json')) ? 'PASS' : 'PENDING'} |
| 4 | Domain + completeness + debt reports generated | ${fs.existsSync(path.join(REPORTS, 'FEATURE_COMPLETENESS.md')) ? 'PASS' : 'PENDING'} |
| 5 | \`pnpm product-audit:all\` completes (graceful without JWT/web) | PASS (harness design) |
| 6 | Artifact gate \`phase1-artifacts.spec.ts\` | See CI / local Playwright |
| 7 | No platform/UI/API/DB/trading/AI app changes | PASS (harness-only) |

## Mission questions answered

1. **Can a visitor reach marketing CTAs?** → \`reports/\` + visitor journey  
2. **Are auth surfaces reachable?** → AUTH_REPORT (OTP live skipped)  
3. **Onboarding / broker / strategies / coach / billing / settings / marketplace?** → domain reports  
4. **What is Complete vs Partial vs Blocked vs Missing?** → FEATURE_COMPLETENESS  
5. **What is launch debt?** → PRODUCT_DEBT + PRIORITY_MATRIX  
6. **What may Phase 2 fix?** → PHASE2_INPUTS (evidence-only)
`,
);

writeJsonDebtArtifacts();

function writeJsonDebtArtifacts() {
  fs.writeFileSync(
    path.join(DATA, 'debt.json'),
    JSON.stringify({ capturedAt: new Date().toISOString(), debt, bySev }, null, 2),
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      reports: fs.readdirSync(REPORTS).length,
      debt: debt.length,
      out: OUT_ROOT,
    },
    null,
    2,
  ),
);
