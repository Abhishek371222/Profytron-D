#!/usr/bin/env node
/**
 * Walk product journeys with Playwright — reachability + optional screenshots.
 * Skips live MetaAPI / payment / OTP / AI stream per journeys.json skipIf.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  loadEnv,
  ensureDirs,
  webBase,
  tokens,
  authInitScript,
  writeJson,
  loadJourneys,
  JOURNEYS_DIR,
  slugify,
  ROOT,
} from './lib.mjs';

const require = createRequire(path.join(ROOT, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');

loadEnv();
ensureDirs();

const TAKE_SHOTS = process.env.PRODUCT_AUDIT_SHOTS !== '0';
const LIMIT = Number(process.env.PRODUCT_AUDIT_LIMIT || 0) || 0;
const NAV_TIMEOUT = Number(process.env.PRODUCT_AUDIT_TIMEOUT || 25000);

const SKIP_REASONS = {
  live_metaapi: 'Live MetaAPI broker connect not exercised (set ALLOW_LIVE_METAAPI=1 to run)',
  live_payment: 'Real Razorpay/Stripe checkout not exercised (set ALLOW_LIVE_PAYMENT=1 to run)',
  live_email_otp: 'Live email OTP not exercised (set ALLOW_LIVE_EMAIL_OTP=1 to run)',
  live_ai_stream: 'Live model streaming not exercised (set ALLOW_LIVE_AI_STREAM=1 to run)',
};

const LIVE_ALLOW = {
  live_metaapi: () => process.env.ALLOW_LIVE_METAAPI === '1',
  live_payment: () => process.env.ALLOW_LIVE_PAYMENT === '1',
  live_email_otp: () => process.env.ALLOW_LIVE_EMAIL_OTP === '1',
  live_ai_stream: () => process.env.ALLOW_LIVE_AI_STREAM === '1',
};

function shouldSkipLive(skipIf) {
  if (!skipIf) return false;
  const allow = LIVE_ALLOW[skipIf];
  if (allow && allow()) return false;
  return true;
}

function expectSelectors(expect) {
  if (!expect || expect === 'body') return ['body'];
  return expect.split('|').map((s) => s.trim()).filter(Boolean);
}

async function probeExpect(page, expect) {
  const parts = expectSelectors(expect);
  if (parts.length === 1 && parts[0] === 'body') {
    await page.waitForSelector('body', { timeout: 5000 });
    return { ok: true, matched: 'body' };
  }
  for (const part of parts) {
    const css =
      part === 'oauth'
        ? 'button, a, [role="button"]'
        : part === 'google' || part === 'github'
          ? `text=/${part}/i`
          : part === 'connect' || part === 'broker'
            ? `text=/${part}/i`
            : part === 'textarea' || part === 'input' || part === 'textbox' || part === 'form' || part === 'button' || part === 'link'
              ? part === 'textbox'
                ? '[role="textbox"], textarea, input'
                : part
              : `text=/${part}/i`;
    try {
      const loc = page.locator(css).first();
      if (await loc.count()) {
        await loc.waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
        return { ok: true, matched: part };
      }
    } catch (_) {}
  }
  // Soft: page loaded with body counts as Partial if expect was richer
  const bodyOk = await page.locator('body').count();
  return { ok: !!bodyOk, matched: bodyOk ? 'body-fallback' : null, soft: true };
}

async function main() {
  const manifest = loadJourneys();
  const base = webBase();
  const { user, admin } = tokens();
  const hasJwt = Boolean(user || admin);

  let journeys = manifest.journeys;
  if (LIMIT > 0) {
    journeys = journeys.slice(0, LIMIT);
  }

  const started = new Date().toISOString();
  const results = {
    capturedAt: started,
    base,
    hasJwt,
    probe: 'screenshot+reachability',
    journeys: [],
    summary: {
      journeys: 0,
      steps: 0,
      complete: 0,
      partial: 0,
      blocked: 0,
      missing: 0,
      skipped: 0,
      failed: 0,
    },
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    results.error = `Playwright launch failed: ${e.message || e}`;
    writeJson('journey-results.json', results);
    writeJson('inventory.json', {
      capturedAt: started,
      journeys: manifest.journeys.map((j) => ({
        id: j.id,
        steps: j.steps.length,
        status: 'Missing',
        note: results.error,
      })),
      features: manifest.features || [],
    });
    console.error(results.error);
    process.exitCode = 0;
    return;
  }

  for (const journey of journeys) {
    const jDir = path.join(JOURNEYS_DIR, journey.id);
    fs.mkdirSync(jDir, { recursive: true });
    const jResult = {
      id: journey.id,
      name: journey.name,
      domain: journey.domain,
      steps: [],
      clicks: 0,
      wallMs: 0,
      consoleErrors: [],
    };
    const jStart = Date.now();

    for (const step of journey.steps) {
      const stepStart = Date.now();
      const stepOut = {
        id: step.id,
        path: step.path,
        requiresAuth: !!step.requiresAuth,
        status: 'Missing',
        url: null,
        wallMs: 0,
        consoleErrors: [],
        screenshot: null,
        note: step.note || null,
        evidence: null,
      };

      if (step.skipIf && shouldSkipLive(step.skipIf)) {
        stepOut.status = step.statusHint || 'Blocked';
        stepOut.note = SKIP_REASONS[step.skipIf] || step.note || step.skipIf;
        stepOut.skipped = true;
        results.summary.skipped++;
        results.summary.blocked += stepOut.status === 'Blocked' ? 1 : 0;
        results.summary.partial += stepOut.status === 'Partial' ? 1 : 0;
        results.summary.steps++;
        jResult.steps.push(stepOut);
        continue;
      }

      if (step.requiresAuth && !hasJwt && !step.forceNoAuth) {
        stepOut.status = 'Blocked';
        stepOut.note = 'No AUDIT_JWT / COMPAT_ADMIN_JWT — authed step not probed';
        stepOut.skipped = true;
        results.summary.skipped++;
        results.summary.blocked++;
        results.summary.steps++;
        jResult.steps.push(stepOut);
        continue;
      }

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      const cons = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') cons.push(msg.text());
      });
      page.on('pageerror', (err) => cons.push(String(err.message || err)));

      const needAuth = step.requiresAuth && !step.forceNoAuth && hasJwt;
      if (needAuth) {
        const token = user || admin;
        await context.addInitScript(authInitScript(), token);
      }

      try {
        const target = `${base}${step.path}`;
        const resp = await page.goto(target, {
          waitUntil: 'domcontentloaded',
          timeout: NAV_TIMEOUT,
        });
        await page.waitForTimeout(800);
        stepOut.url = page.url();
        const status = resp ? resp.status() : 0;
        const expect = step.expect || 'body';
        const probe = await probeExpect(page, expect);

        if (TAKE_SHOTS) {
          const shotName = `${slugify(step.id)}.png`;
          const shotPath = path.join(jDir, shotName);
          await page.screenshot({ path: shotPath, fullPage: false }).catch(() => null);
          if (fs.existsSync(shotPath)) {
            stepOut.screenshot = path.relative(
              path.join(JOURNEYS_DIR, '..'),
              shotPath,
            ).replace(/\\/g, '/');
          }
        }

        if (step.allowNotFound) {
          stepOut.status =
            status === 404 || /not.?found|404/i.test(await page.content().catch(() => ''))
              ? 'Complete'
              : probe.ok
                ? 'Partial'
                : 'Partial';
          stepOut.note =
            stepOut.note ||
            `HTTP ${status}; not-found probe (soft)`;
        } else if (step.allowRedirect) {
          const redirected =
            stepOut.url !== target &&
            !stepOut.url.replace(/\/$/, '').endsWith(step.path.replace(/\/$/, ''));
          stepOut.status = probe.ok || redirected ? 'Complete' : 'Partial';
          stepOut.note =
            step.note ||
            (redirected
              ? `Redirected to ${stepOut.url}`
              : `Stayed on path; HTTP ${status}`);
        } else if (step.forceNoAuth) {
          const redirected =
            /login|register|auth/i.test(stepOut.url) ||
            stepOut.url.includes('/login');
          stepOut.status = redirected || probe.ok ? 'Complete' : 'Partial';
          stepOut.note =
            step.note ||
            (redirected
              ? 'Redirected/gated without JWT'
              : `Loaded without JWT (HTTP ${status})`);
        } else if (!probe.ok) {
          stepOut.status = status >= 400 ? 'Missing' : 'Partial';
          stepOut.note = `Expect "${expect}" not matched; HTTP ${status}`;
        } else if (probe.soft) {
          stepOut.status = 'Partial';
          stepOut.note = `Page reachable; expect "${expect}" soft-matched via body`;
        } else {
          stepOut.status = 'Complete';
        }

        stepOut.consoleErrors = cons.slice(0, 20);
        jResult.consoleErrors.push(...cons.slice(0, 5));
        stepOut.httpStatus = status;
        stepOut.evidence = stepOut.screenshot;
      } catch (e) {
        stepOut.status = 'Missing';
        stepOut.note = String(e.message || e);
        stepOut.consoleErrors = cons.slice(0, 10);
        results.summary.failed++;
      } finally {
        stepOut.wallMs = Date.now() - stepStart;
        await context.close().catch(() => {});
      }

      results.summary.steps++;
      if (stepOut.status === 'Complete') results.summary.complete++;
      else if (stepOut.status === 'Partial') results.summary.partial++;
      else if (stepOut.status === 'Blocked') results.summary.blocked++;
      else results.summary.missing++;

      jResult.steps.push(stepOut);
      jResult.clicks += 1;
    }

    jResult.wallMs = Date.now() - jStart;
    fs.writeFileSync(
      path.join(jDir, 'result.json'),
      JSON.stringify(jResult, null, 2),
    );
    results.journeys.push(jResult);
    results.summary.journeys++;
  }

  await browser.close().catch(() => {});

  writeJson('journey-results.json', results);

  const inventory = {
    capturedAt: started,
    base,
    hasJwt,
    journeys: results.journeys.map((j) => {
      const statuses = j.steps.map((s) => s.status);
      let status = 'Complete';
      if (statuses.includes('Missing')) status = 'Missing';
      else if (statuses.includes('Blocked')) status = 'Blocked';
      else if (statuses.includes('Partial')) status = 'Partial';
      return {
        id: j.id,
        name: j.name,
        domain: j.domain,
        steps: j.steps.length,
        status,
        wallMs: j.wallMs,
        complete: j.steps.filter((s) => s.status === 'Complete').length,
        partial: j.steps.filter((s) => s.status === 'Partial').length,
        blocked: j.steps.filter((s) => s.status === 'Blocked').length,
        missing: j.steps.filter((s) => s.status === 'Missing').length,
      };
    }),
    features: (manifest.features || []).map((f) => {
      const j = results.journeys.find((x) => x.domain === f.domain || x.id === f.domain);
      return {
        ...f,
        status: j
          ? j.steps.some((s) => s.status === 'Missing')
            ? 'Missing'
            : j.steps.some((s) => s.status === 'Blocked')
              ? 'Blocked'
              : j.steps.some((s) => s.status === 'Partial')
                ? 'Partial'
                : 'Complete'
          : 'Missing',
      };
    }),
  };
  writeJson('inventory.json', inventory);

  console.log(
    JSON.stringify(
      {
        ok: true,
        journeys: results.summary.journeys,
        steps: results.summary.steps,
        complete: results.summary.complete,
        partial: results.summary.partial,
        blocked: results.summary.blocked,
        missing: results.summary.missing,
        hasJwt,
        base,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 0;
});
