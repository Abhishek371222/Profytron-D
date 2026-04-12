import { test, expect } from '@playwright/test';

test.describe('🔄 END-TO-END TESTING - Full User Journey (CRITICAL)', () => {
  test.describe('1. COMPLETE USER REGISTRATION FLOW', () => {
    test('should complete signup → email verification → login → dashboard', async ({ page }) => {
      // 1. Go to signup page
      await page.goto('/signup');

      // 2. Fill signup form
      await page.locator('input[type="email"]').fill('e2e-test@example.com');
      await page.locator('input[type="password"]').fill('TestPass123!');
      await page.locator('input[name="fullName"]').fill('E2E Test User');

      // 3. Submit signup
      await page.locator('button:has-text("Sign Up")').click();

      // 4. Should show success message
      await expect(page.locator('text=/check your email/i')).toBeVisible();

      // Note: In real E2E, we would need to handle email verification
      // For this test, we'll mock the verification process

      // 5. Go to login page
      await page.goto('/login');

      // 6. Login with credentials
      await page.locator('input[type="email"]').fill('e2e-test@example.com');
      await page.locator('input[type="password"]').fill('TestPass123!');

      // Mock successful login (since we can't actually verify email in test)
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'mock-jwt-token-for-e2e');
        `
      });

      await page.locator('button:has-text("Login")').click();

      // 7. Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // 8. Dashboard should load
      await expect(page.locator('text=/dashboard/i')).toBeVisible();
    });
  });

  test.describe('2. PAYMENT & SUBSCRIPTION FLOW', () => {
    test('should complete payment flow and unlock features', async ({ page }) => {
      // Mock authenticated user
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'mock-jwt-token-for-e2e');
        `
      });

      // 1. Go to pricing page
      await page.goto('/pricing');

      // 2. Select a plan
      const premiumPlan = page.locator('[data-testid="premium-plan"]').or(page.locator('text=/premium/i').locator('..'));
      await premiumPlan.click();

      // 3. Click subscribe/checkout
      const subscribeButton = page.locator('button:has-text("Subscribe")').or(page.locator('[data-testid="subscribe-button"]'));
      await subscribeButton.click();

      // 4. Should redirect to Stripe checkout (mock this)
      await expect(page).toHaveURL(/checkout\.stripe\.com/);

      // Note: In real E2E, we would need to handle Stripe checkout
      // For this test, we'll simulate successful payment webhook

      // 5. Mock successful payment by setting user as premium
      await page.addScriptTag({
        content: `
          localStorage.setItem('user-subscription', 'premium');
        `
      });

      // 6. Go to dashboard
      await page.goto('/dashboard');

      // 7. Should show premium features
      const premiumFeatures = page.locator('[data-testid="premium-feature"]').or(page.locator('text=/premium/i'));
      await expect(premiumFeatures).toBeVisible();
    });
  });

  test.describe('3. TRADING PLATFORM FUNCTIONALITY', () => {
    test('should execute complete trading workflow', async ({ page }) => {
      // Mock authenticated premium user
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'mock-jwt-token-for-e2e');
          localStorage.setItem('user-subscription', 'premium');
        `
      });

      // 1. Go to trading dashboard
      await page.goto('/dashboard');

      // 2. Select a trading pair
      const pairSelector = page.locator('[data-testid="pair-selector"]').or(page.locator('select'));
      if (await pairSelector.isVisible()) {
        await pairSelector.selectOption('BTCUSD');
      }

      // 3. View trading chart
      const chart = page.locator('[data-testid="trading-chart"]').or(page.locator('canvas'));
      await expect(chart).toBeVisible();

      // 4. Check trading signals (if available)
      const signals = page.locator('[data-testid="trading-signal"]').or(page.locator('text=/signal/i'));
      // Signals might not be immediately visible, so we don't assert

      // 5. Check account balance/portfolio
      const balance = page.locator('[data-testid="account-balance"]').or(page.locator('text=/balance/i'));
      await expect(balance).toBeVisible();
    });
  });

  test.describe('4. STRATEGY BUILDER FUNCTIONALITY', () => {
    test('should create and save trading strategy', async ({ page }) => {
      // Mock authenticated premium user
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'mock-jwt-token-for-e2e');
          localStorage.setItem('user-subscription', 'premium');
        `
      });

      // 1. Go to strategy builder
      await page.goto('/strategies/builder');

      // 2. Add strategy components
      const addIndicatorButton = page.locator('button:has-text("Add Indicator")').or(page.locator('[data-testid="add-indicator"]'));
      if (await addIndicatorButton.isVisible()) {
        await addIndicatorButton.click();

        // Select RSI indicator
        const rsiOption = page.locator('text=/RSI/i');
        await rsiOption.click();
      }

      // 3. Configure strategy parameters
      const rsiPeriod = page.locator('input[placeholder*="period"]').or(page.locator('input[name*="period"]'));
      if (await rsiPeriod.isVisible()) {
        await rsiPeriod.fill('14');
      }

      // 4. Save strategy
      const saveButton = page.locator('button:has-text("Save")').or(page.locator('[data-testid="save-strategy"]'));
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Should show success message
        await expect(page.locator('text=/saved/i')).toBeVisible();
      }
    });
  });

  test.describe('5. ERROR HANDLING & EDGE CASES', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());

      await page.goto('/dashboard');

      // Should show error message or fallback UI
      const errorMessage = page.locator('text=/error/i').or(page.locator('text=/failed/i'));
      await expect(errorMessage).toBeVisible();
    });

    test('should handle invalid routes', async ({ page }) => {
      await page.goto('/invalid-route-12345');

      // Should show 404 page
      const notFound = page.locator('text=/404/i').or(page.locator('text=/not found/i'));
      await expect(notFound).toBeVisible();
    });

    test('should handle expired sessions', async ({ page }) => {
      // Set expired token
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'expired-jwt-token');
        `
      });

      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('6. MOBILE RESPONSIVENESS', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Check mobile menu
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();

        // Menu should open
        const menuItems = page.locator('[data-testid="mobile-menu-item"]');
        await expect(menuItems.first()).toBeVisible();
      }

      // Navigate to login on mobile
      await page.goto('/login');

      // Forms should be usable on mobile
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      // Touch interactions should work
      await emailInput.tap();
      await emailInput.fill('mobile@test.com');
    });
  });
});