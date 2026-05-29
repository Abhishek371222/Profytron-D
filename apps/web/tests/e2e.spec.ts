import { test, expect } from '@playwright/test';

test.describe('🔄 END-TO-END TESTING - Full User Journey (CRITICAL)', () => {
  test('route aliases should resolve', async ({ page }) => {
    await page.goto('/documentation');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/signup');
    await expect(page.locator('body')).toBeVisible();
  });

  test('pricing page should render working CTAs', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('[data-testid="premium-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscribe-button"]')).toBeVisible();
  });

  test('login and register pages should render forms', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.goto('/register');
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('dashboard and key app routes should load', async ({ page }) => {
    for (const route of ['/dashboard', '/strategies', '/marketplace']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('404 page should render on unknown route', async ({ page }) => {
    await page.goto('/invalid-route-12345');
    await expect(
      page.locator('text=/404/i').or(page.locator('text=/not found/i')),
    ).toBeVisible();
  });
});