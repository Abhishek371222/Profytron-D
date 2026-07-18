#!/usr/bin/env node
/**
 * Derive lab conversion funnel metrics from journey-results.json.
 * Not production analytics — lab step completion / drop-off / time-to-step.
 */
import {
  loadEnv,
  ensureDirs,
  readJson,
  writeJson,
  loadJourneys,
} from './lib.mjs';

loadEnv();
ensureDirs();

const results = readJson('journey-results.json');
const manifest = loadJourneys();

if (!results) {
  writeJson('conversion.json', {
    capturedAt: new Date().toISOString(),
    note: 'No journey-results.json — run product-audit:journeys first',
    funnels: [],
  });
  console.log(JSON.stringify({ ok: false, reason: 'missing journey-results' }));
  process.exitCode = 0;
  process.exit(0);
}

const funnels = (results.journeys || []).map((j) => {
  const steps = j.steps || [];
  const completed = steps.filter((s) => s.status === 'Complete' || s.status === 'Partial');
  const rates = steps.map((s, i) => {
    const prevOk =
      i === 0 ||
      steps.slice(0, i).every(
        (x) =>
          x.status === 'Complete' ||
          x.status === 'Partial' ||
          x.status === 'Blocked',
      );
    return {
      stepId: s.id,
      path: s.path,
      status: s.status,
      wallMs: s.wallMs,
      completionRateLab: s.status === 'Complete' ? 1 : s.status === 'Partial' ? 0.5 : 0,
      dropOff: s.status === 'Missing' || (s.status === 'Blocked' && !s.skipped),
      reachable: prevOk && s.status !== 'Missing',
    };
  });
  const successRate =
    steps.length === 0
      ? 0
      : steps.filter((s) => s.status === 'Complete').length / steps.length;
  const skipRate =
    steps.length === 0
      ? 0
      : steps.filter((s) => s.skipped).length / steps.length;

  return {
    journeyId: j.id,
    name: j.name,
    domain: j.domain,
    stepCount: steps.length,
    successRateLab: Number(successRate.toFixed(3)),
    skipRateLab: Number(skipRate.toFixed(3)),
    totalWallMs: j.wallMs,
    avgStepMs:
      steps.length === 0
        ? 0
        : Math.round(steps.reduce((a, s) => a + (s.wallMs || 0), 0) / steps.length),
    steps: rates,
  };
});

const out = {
  capturedAt: new Date().toISOString(),
  source: 'journey-results.json',
  note: 'Lab rates only — not production funnel analytics',
  journeyCount: funnels.length,
  overallSuccessRateLab: Number(
    (
      funnels.reduce((a, f) => a + f.successRateLab, 0) /
      Math.max(1, funnels.length)
    ).toFixed(3),
  ),
  funnels,
  catalogJourneys: manifest.journeys.length,
};

writeJson('conversion.json', out);
console.log(
  JSON.stringify(
    {
      ok: true,
      funnels: funnels.length,
      overallSuccessRateLab: out.overallSuccessRateLab,
    },
    null,
    2,
  ),
);
