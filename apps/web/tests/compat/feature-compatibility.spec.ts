/**
 * Feature Compatibility Suite — Phase 2 gate.
 * Skips are explicit with reasons (never silent pass).
 */
import { test, expect } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const hasApi = process.env.COMPAT_API === '1';
const hasAuth = Boolean(process.env.COMPAT_EMAIL && process.env.COMPAT_PASSWORD);

test.describe('Phase 2 Feature Compatibility', () => {
  test('public: home loads', async ({ page }) => {
    const res = await page.goto(base + '/');
    expect(res?.ok() || res?.status() === 304).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('public: login page loads', async ({ page }) => {
    await page.goto(base + '/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('public: marketplace loads', async ({ page }) => {
    await page.goto(base + '/marketplace');
    await expect(page.locator('body')).toBeVisible();
  });

  test('public: pricing loads', async ({ page }) => {
    await page.goto(base + '/pricing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('auth flows', async ({ page }) => {
    test.skip(!hasAuth, 'COMPAT_EMAIL/COMPAT_PASSWORD not set');
    test.setTimeout(90_000);
    await page.goto(base + '/login');
    await page.fill('input[type="email"], input[name="email"]', process.env.COMPAT_EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', process.env.COMPAT_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|onboarding|marketplace/, { timeout: 60000 });
  });

  test('dashboard shell (authed seed)', async ({ page }) => {
    test.skip(!process.env.AUDIT_JWT, 'AUDIT_JWT not set — skip authed dashboard');
    await page.addInitScript((t) => {
      sessionStorage.setItem('profytron_access', t);
      localStorage.setItem(
        'profytron-auth',
        JSON.stringify({
          state: {
            accessToken: t,
            isAuthenticated: true,
            sessionReady: true,
            isHydrating: false,
            user: { id: 'compat', email: 'compat@test', onboardingCompleted: true },
          },
          version: 0,
        }),
      );
      document.cookie = 'onboarding_completed=1; path=/';
    }, process.env.AUDIT_JWT);
    await page.goto(base + '/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  for (const route of [
    '/copy-trading',
    '/strategies/builder',
    '/wallet',
    '/alpha-coach',
    '/notifications',
    '/connected-accounts',
    '/billing',
  ]) {
    test(`route smoke ${route}`, async ({ page }) => {
      test.skip(!process.env.AUDIT_JWT, `AUDIT_JWT required for ${route}`);
      await page.addInitScript((t) => {
        sessionStorage.setItem('profytron_access', t);
        localStorage.setItem(
          'profytron-auth',
          JSON.stringify({
            state: {
              accessToken: t,
              isAuthenticated: true,
              sessionReady: true,
              isHydrating: false,
              user: { id: 'compat', onboardingCompleted: true },
            },
            version: 0,
          }),
        );
        document.cookie = 'onboarding_completed=1; path=/';
      }, process.env.AUDIT_JWT);
      const res = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      expect(res?.status() ?? 0).toBeLessThan(500);
    });
  }

  test('admin route', async ({ page }) => {
    test.skip(!process.env.COMPAT_ADMIN_JWT, 'COMPAT_ADMIN_JWT not set — skip admin');
    await page.goto(base + '/admin');
    await expect(page.locator('body')).toBeVisible();
  });

  test('api health (optional)', async ({ request }) => {
    test.skip(!hasApi, 'COMPAT_API=1 not set');
    const api = process.env.COMPAT_API_URL || 'http://localhost:4000';
    const res = await request.get(api + '/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body?.data?.database || body?.database).toBeTruthy();
  });
});
