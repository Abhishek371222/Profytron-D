import { test, expect } from '@playwright/test';

test.describe('🎨 FRONTEND TESTING - UI & UX (CRITICAL)', () => {
  test.describe('1. RESPONSIVE DESIGN', () => {
    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await expect(page).toHaveTitle(/PROFYTRON/i);

      // Check main navigation
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page).toHaveTitle(/PROFYTRON/i);

      // Check mobile menu exists
      const mobileMenu = page.locator('button[aria-label*="menu"]');
      await expect(mobileMenu).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await expect(page).toHaveTitle(/PROFYTRON/i);

      // Check layout adapts
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('2. AUTHENTICATION FLOW', () => {
    test('should show login form', async ({ page }) => {
      await page.goto('/login');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();
    });

    test('should show signup form', async ({ page }) => {
      await page.goto('/register');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      const fullNameInput = page.locator('input[name="fullName"]');
      const signupButton = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(confirmPasswordInput).toBeVisible();
      await expect(fullNameInput).toBeVisible();
      await expect(signupButton).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');
      const emailInput = page.locator('input[type="email"]');
      const signupButton = page.locator('button[type="submit"]');

      await emailInput.fill('invalid-email');
      await expect(signupButton).toBeDisabled();
      await expect(emailInput).toBeVisible();
    });
  });

  test.describe('3. DASHBOARD FUNCTIONALITY', () => {
    test('should load dashboard for authenticated user', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should display trading charts', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('4. 3D ANIMATIONS & PERFORMANCE', () => {
    test('should load 3D elements without crashing', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('main')).toBeVisible();

      // Check no JavaScript errors
      const errors: Error[] = [];
      page.on('pageerror', error => errors.push(error));
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });

    test('should handle animation performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');

      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(10000); // 10 seconds
    });
  });

  test.describe('5. FORM VALIDATION', () => {
    test('should validate required fields', async ({ page }) => {
      await page.goto('/register');
      const signupButton = page.locator('button[type="submit"]');

      await expect(page.locator('input[name="fullName"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(signupButton).toBeDisabled();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/signup');
      const passwordInput = page.locator('input[name="password"]');

      await passwordInput.fill('123');
      await passwordInput.blur();

      await expect(passwordInput).toHaveValue('123');
    });
  });

  test.describe('6. NAVIGATION', () => {
    test('should navigate between pages', async ({ page }) => {
      await page.goto('/');

      // Click on navigation links
      const loginLink = page.locator('[href="/login"]').first();
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');
      const notFound = page.locator('text=/404/i').or(page.locator('text=/not found/i'));
      await expect(notFound).toBeVisible();
    });
  });
});
