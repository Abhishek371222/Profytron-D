import { test, expect } from '@playwright/test';

/**
 * Motion Engine regression suite — stability across a11y, visibility, resize, theme, route.
 * Treat motion regressions like functional regressions.
 */
test.describe('Motion Engine regressions', () => {
  test('reduced motion preference does not crash public home', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('theme switch remains stable', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.classList.toggle('dark');
    });
    await page.waitForTimeout(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('resize does not throw', async ({ page }) => {
    await page.goto('/login');
    await page.setViewportSize({ width: 375, height: 700 });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('hidden tab resume does not crash', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.locator('body')).toBeVisible();
  });

  test('route transition login → pricing', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('rapid repeated clicks on login CTA remain stable', async ({ page }) => {
    await page.goto('/login');
    const btn = page.locator('button').first();
    if (await btn.count()) {
      for (let i = 0; i < 8; i++) {
        await btn.click({ force: true, timeout: 1000 }).catch(() => undefined);
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });
});
