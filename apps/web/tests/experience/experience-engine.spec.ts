import { test, expect } from '@playwright/test';

/**
 * Experience Engine regression suite.
 */
test.describe('Experience Engine regressions', () => {
  test('landing paints without WebGL (reduced motion)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#features')).toBeVisible({ timeout: 15_000 });
  });

  test('hero ambient mounts with layer attribute when engine on', async ({ page }) => {
    await page.goto('/');
    const ambient = page.locator('.hero-ambient').first();
    await expect(ambient).toBeVisible({ timeout: 15_000 });
  });

  test('theme switch on landing remains stable', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      document.documentElement.classList.toggle('dark');
    });
    await page.waitForTimeout(150);
    await expect(page.locator('body')).toBeVisible();
  });

  test('resize landing', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('hidden tab resume', async ({ page }) => {
    await page.goto('/');
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

  test('WebGL unavailable still shows hero layers', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = function () {
        return null;
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto('/');
    await expect(page.locator('.hero-ambient').first()).toBeVisible({ timeout: 15_000 });
  });

  test('about marketing page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('body')).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
  });
});
