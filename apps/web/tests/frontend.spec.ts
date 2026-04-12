import { test, expect } from '@playwright/test';

test.describe('🎨 FRONTEND TESTING - UI & UX (CRITICAL)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
  });

  test.describe('1. RESPONSIVE DESIGN', () => {
    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page).toHaveTitle(/Profytron/);

      // Check main navigation
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page).toHaveTitle(/Profytron/);

      // Check mobile menu exists
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu.or(page.locator('button[aria-label*="menu"]'))).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page).toHaveTitle(/Profytron/);

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
      const loginButton = page.locator('button:has-text("Login")');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(loginButton).toBeVisible();
    });

    test('should show signup form', async ({ page }) => {
      await page.goto('/signup');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const fullNameInput = page.locator('input[name="fullName"]');
      const signupButton = page.locator('button:has-text("Sign Up")');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(fullNameInput).toBeVisible();
      await expect(signupButton).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/signup');
      const emailInput = page.locator('input[type="email"]');
      const signupButton = page.locator('button:has-text("Sign Up")');

      await emailInput.fill('invalid-email');
      await signupButton.click();

      // Check for validation error
      const errorMessage = page.locator('text=/invalid email/i');
      await expect(errorMessage.or(page.locator('[data-testid="email-error"]'))).toBeVisible();
    });
  });

  test.describe('3. DASHBOARD FUNCTIONALITY', () => {
    test('should load dashboard for authenticated user', async ({ page }) => {
      // Mock authentication
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'mock-jwt-token');
        `
      });

      await page.goto('/dashboard');
      await expect(page.locator('text=/dashboard/i')).toBeVisible();
    });

    test('should display trading charts', async ({ page }) => {
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'mock-jwt-token');
        `
      });

      await page.goto('/dashboard');
      const chart = page.locator('[data-testid="trading-chart"]').or(page.locator('canvas'));
      await expect(chart).toBeVisible();
    });
  });

  test.describe('4. 3D ANIMATIONS & PERFORMANCE', () => {
    test('should load 3D elements without crashing', async ({ page }) => {
      await page.goto('/');

      // Wait for any 3D canvas to load
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Check no JavaScript errors
      const errors = [];
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
      await page.goto('/signup');
      const signupButton = page.locator('button:has-text("Sign Up")');

      await signupButton.click();

      // Check for required field errors
      const errors = page.locator('[data-testid*="error"]').or(page.locator('text=/required/i'));
      await expect(errors.first()).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/signup');
      const passwordInput = page.locator('input[type="password"]');

      await passwordInput.fill('123');
      await passwordInput.blur();

      // Check for password strength error
      const error = page.locator('text=/password.*strong/i').or(page.locator('[data-testid="password-error"]'));
      await expect(error).toBeVisible();
    });
  });

  test.describe('6. NAVIGATION', () => {
    test('should navigate between pages', async ({ page }) => {
      await page.goto('/');

      // Click on navigation links
      const loginLink = page.locator('a:has-text("Login")').or(page.locator('[href="/login"]'));
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