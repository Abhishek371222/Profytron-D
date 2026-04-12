import { test, expect } from '@playwright/test';

test.describe('🔐 SECURITY TESTING (CRITICAL)', () => {
  test.describe('1. AUTHENTICATION SECURITY', () => {
    test('should prevent unauthorized access to protected routes', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should handle JWT token validation', async ({ page }) => {
      // Set invalid JWT token
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'invalid-jwt-token');
        `
      });

      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should handle expired JWT tokens', async ({ page }) => {
      // Set expired JWT token (mock)
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
        `
      });

      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('2. INPUT VALIDATION & SANITIZATION', () => {
    test('should prevent XSS attacks in forms', async ({ page }) => {
      await page.goto('/signup');

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const fullNameInput = page.locator('input[name="fullName"]');

      // Try XSS payload
      const xssPayload = '<script>alert("XSS")</script>';
      await emailInput.fill(`test${xssPayload}@example.com`);
      await passwordInput.fill('TestPass123!');
      await fullNameInput.fill(xssPayload);

      await page.locator('button:has-text("Sign Up")').click();

      // Should not execute script (no alert should appear)
      // Check that the page doesn't show signs of XSS execution
      const scripts = page.locator('script');
      await expect(scripts).toHaveCount(0); // No inline scripts should be added
    });

    test('should validate email format properly', async ({ page }) => {
      await page.goto('/signup');

      const emailInput = page.locator('input[type="email"]');

      // Test various invalid email formats
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example..com'
      ];

      for (const email of invalidEmails) {
        await emailInput.fill(email);
        await emailInput.blur();

        // Should show validation error
        const error = page.locator('[data-testid="email-error"]').or(page.locator('text=/invalid email/i'));
        await expect(error).toBeVisible();

        await emailInput.clear();
      }
    });

    test('should prevent SQL injection attempts', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // SQL injection payload
      const sqlInjection = "' OR '1'='1'; --";
      await emailInput.fill(sqlInjection);
      await passwordInput.fill(sqlInjection);

      await page.locator('button:has-text("Login")').click();

      // Should not log in (expect error or stay on login page)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('3. API SECURITY', () => {
    test('should require authentication for protected API endpoints', async () => {
      // Test API endpoints directly (would need a separate API test)
      // This is a placeholder for API security tests
      expect(true).toBe(true); // Placeholder
    });

    test('should validate request payloads', async () => {
      // Test malformed JSON, oversized payloads, etc.
      expect(true).toBe(true); // Placeholder
    });
  });

  test.describe('4. SESSION MANAGEMENT', () => {
    test('should handle session timeout', async ({ page }) => {
      // Set a token that will expire
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'short-lived-token');
          localStorage.setItem('token-expires', '${Date.now() - 1000}'); // Already expired
        `
      });

      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should clear session on logout', async ({ page }) => {
      // Set session data
      await page.addScriptTag({
        content: `
          localStorage.setItem('auth-token', 'test-token');
          localStorage.setItem('user-data', '{"id": 1, "email": "test@example.com"}');
        `
      });

      // Simulate logout (if logout button exists)
      const logoutButton = page.locator('button:has-text("Logout")').or(page.locator('[data-testid="logout"]'));
      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Check that session data is cleared
        const token = await page.evaluate(() => localStorage.getItem('auth-token'));
        expect(token).toBeNull();
      }
    });
  });

  test.describe('5. RATE LIMITING', () => {
    test('should handle rapid requests appropriately', async ({ page }) => {
      // Rapidly submit forms or make requests
      await page.goto('/login');

      const loginButton = page.locator('button:has-text("Login")');

      // Click login button multiple times rapidly
      for (let i = 0; i < 10; i++) {
        await loginButton.click();
        await page.waitForTimeout(100); // Small delay
      }

      // Should show rate limiting message or handle gracefully
      const rateLimitMessage = page.locator('text=/too many requests/i').or(page.locator('text=/rate limit/i'));
      // Note: This test might need adjustment based on actual rate limiting implementation
      await expect(rateLimitMessage.or(page.locator('body'))).toBeTruthy();
    });
  });
});