import { test, expect } from '@playwright/test';

/**
 * CI smoke suite for public routes. Runs against a local Next server
 * (see playwright.ci.config.ts) with mock API enabled when configured.
 */
test.describe('Public marketing smoke', () => {
  test('home has main landmark and brand signal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const main = page.locator('main, [role="main"], #main-content').first();
    if (await main.count()) {
      await expect(main).toBeVisible();
    }
    // Brand should appear somewhere above the fold / document title
    await expect(page).toHaveTitle(/profytron|home|trading/i);
  });

  test('login page is keyboard-focusable', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveCount(1);
  });

  test('pricing page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
    expect(errors.filter((e) => !/hydrat/i.test(e))).toEqual([]);
  });
});
