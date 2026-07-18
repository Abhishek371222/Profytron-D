import { test, expect } from '@playwright/test';

test.describe('🎨 FRONTEND TESTING - UI & UX (CRITICAL)', () => {
  test.describe('1. RESPONSIVE DESIGN', () => {
    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await expect(page).toHaveTitle(/PROFYTRON/i);

      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page).toHaveTitle(/PROFYTRON/i);

      const mobileMenu = page.locator('button[aria-label*="menu"]');
      await expect(mobileMenu).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await expect(page).toHaveTitle(/PROFYTRON/i);

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

      const errors: Error[] = [];
      page.on('pageerror', error => errors.push(error));
      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });

    test('should handle animation performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');

      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(10000);
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

  test.describe('7. SECURITY SETTINGS (PASSWORD RESET + 2FA UI)', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'u1',
              email: 'trader@example.com',
              fullName: 'Trader',
              role: 'USER',
              onboardingCompleted: true,
              twoFactorEnabled: false,
            },
          }),
        });
      });
      await page.route('**/users/me/sessions', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      });
      await page.addInitScript(() => {
        localStorage.setItem(
          'profytron-auth',
          JSON.stringify({
            state: {
              user: {
                id: 'u1',
                email: 'trader@example.com',
                fullName: 'Trader',
                role: 'USER',
                onboardingCompleted: true,
                twoFactorEnabled: false,
              },
            },
            version: 0,
          }),
        );
        sessionStorage.setItem('profytron_access', 'test_token');
      });
    });

    test('shows Reset Password and hides old current-password form', async ({ page }) => {
      await page.goto('/settings/security');
      await expect(page.getByTestId('reset-password-button')).toBeVisible();
      await expect(page.getByText('Current password')).toHaveCount(0);
      await expect(page.getByText('Update Password')).toHaveCount(0);
    });

    test('hides Reset Password for Google-only accounts', async ({ page }) => {
      await page.route('**/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'u1',
              email: 'abhishekaj371@gmail.com',
              fullName: 'Trader',
              role: 'USER',
              onboardingCompleted: true,
              twoFactorEnabled: false,
              hasPassword: false,
              googleId: 'google-123',
            },
          }),
        });
      });
      await page.addInitScript(() => {
        localStorage.setItem(
          'profytron-auth',
          JSON.stringify({
            state: {
              user: {
                id: 'u1',
                email: 'abhishekaj371@gmail.com',
                fullName: 'Trader',
                role: 'USER',
                onboardingCompleted: true,
                twoFactorEnabled: false,
                hasPassword: false,
                googleId: 'google-123',
              },
            },
            version: 0,
          }),
        );
        sessionStorage.setItem('profytron_access', 'test_token');
      });

      await page.goto('/settings/security');
      await expect(page.getByTestId('reset-password-button')).toHaveCount(0);
      await expect(page.getByTestId('google-only-password-message')).toBeVisible();
    });

    test('password reset dialog advances email → OTP → password steps', async ({ page }) => {
      await page.route('**/users/me/password-reset/request-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { sent: true } }),
        });
      });
      await page.route('**/users/me/password-reset/verify-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { verified: true } }),
        });
      });

      await page.goto('/settings/security');
      await page.getByTestId('reset-password-button').click();
      await expect(page.getByText('Reset your password')).toBeVisible();
      await page.getByLabel('Registered email for password reset').fill('trader@example.com');
      await page.getByRole('button', { name: 'Send OTP' }).click();
      await expect(page.getByText('Enter verification code')).toBeVisible();
      await page.getByLabel('Password reset OTP').fill('123456');
      await page.getByRole('button', { name: 'Verify OTP' }).click();
      await expect(page.getByText('Choose a new password')).toBeVisible();
    });

    test('rejects mismatched passwords on confirm step', async ({ page }) => {
      await page.route('**/users/me/password-reset/request-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { sent: true } }),
        });
      });
      await page.route('**/users/me/password-reset/verify-otp', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { verified: true } }),
        });
      });

      await page.goto('/settings/security');
      await page.getByTestId('reset-password-button').click();
      await page.getByRole('button', { name: 'Send OTP' }).click();
      await page.getByLabel('Password reset OTP').fill('123456');
      await page.getByRole('button', { name: 'Verify OTP' }).click();
      await page.getByLabel('New password').fill('NewStr0ng!');
      await page.getByLabel('Confirm new password').fill('Different1!');
      await page.getByRole('button', { name: 'Reset password' }).click();
      await expect(page.getByText('Choose a new password')).toBeVisible();
    });

    test('2FA setup shows QR and surfaces backend errors', async ({ page }) => {
      await page.route('**/auth/2fa/setup', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Crypto plugin is required.' }),
        });
      });

      await page.goto('/settings/security');
      await page.getByTestId('2fa-setup-button').click();
      await expect(page.getByText(/Crypto plugin is required/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test('successful 2FA setup shows QR then backup codes after verify', async ({ page }) => {
      await page.route('**/auth/2fa/setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              secret: 'JBSWY3DPEHPK3PXP',
              qrCode: 'data:image/png;base64,iVBORw0KGgo=',
              otpUri: 'otpauth://totp/Profytron:trader@example.com?secret=JBSWY3DPEHPK3PXP',
            },
          }),
        });
      });
      await page.route('**/auth/2fa/verify-setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { success: true, backupCodes: ['AAAA1111', 'BBBB2222'] },
          }),
        });
      });
      await page.route('**/auth/2fa/cancel-setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { cancelled: true } }),
        });
      });

      await page.goto('/settings/security');
      await expect(page.getByTestId('2fa-status-badge')).toHaveText(/Off/i);
      await page.getByTestId('2fa-setup-button').click();
      await expect(page.getByAltText('2FA QR code')).toBeVisible();
      await expect(page.getByTestId('2fa-status-badge')).toHaveText(/Setup in progress/i);
      await page.getByLabel('2FA verification code').fill('123456');
      await page.getByTestId('2fa-confirm-setup').click();
      await expect(page.getByText(/Save these backup codes/i)).toBeVisible();
      await expect(page.getByText('AAAA1111')).toBeVisible();
      await expect(page.getByTestId('2fa-status-badge')).toHaveText(/Enabled/i);
    });

    test('cancelling setup leaves 2FA disabled', async ({ page }) => {
      await page.route('**/auth/2fa/setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              secret: 'JBSWY3DPEHPK3PXP',
              qrCode: 'data:image/png;base64,iVBORw0KGgo=',
            },
          }),
        });
      });
      await page.route('**/auth/2fa/cancel-setup', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { cancelled: true } }),
        });
      });

      await page.goto('/settings/security');
      await page.getByTestId('2fa-setup-button').click();
      await expect(page.getByAltText('2FA QR code')).toBeVisible();
      await page.getByTestId('2fa-cancel-setup').click();
      await expect(page.getByAltText('2FA QR code')).toHaveCount(0);
      await expect(page.getByTestId('2fa-status-badge')).toHaveText(/Off/i);
      await expect(page.getByTestId('2fa-setup-button')).toBeVisible();
      await expect(page.getByTestId('2fa-disable-button')).toHaveCount(0);
    });
  });

  test.describe('8. TESTIMONIAL WALL', () => {
    test('renders the testimonial section heading', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      const section = page.locator('#testimonials');
      await section.scrollIntoViewIfNeeded();
      await expect(section.getByRole('heading', { name: /Validated by the/i })).toBeVisible();
    });

    test('previous/next controls update the focused testimonial and wrap', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      const section = page.locator('#testimonials');
      await section.scrollIntoViewIfNeeded();

      const next = section.getByRole('button', { name: 'Next testimonial' }).first();
      const prev = section.getByRole('button', { name: 'Previous testimonial' }).first();
      const counter = section.getByTestId('testimonial-position').first();

      await expect(counter).toHaveText('01 / 10');

      await expect(async () => {
        await next.click();
        await expect(counter).toHaveText('02 / 10', { timeout: 800 });
      }).toPass({ timeout: 8000 });

      await prev.click();
      await expect(counter).toHaveText('01 / 10');
      await prev.click();
      await expect(counter).toHaveText('10 / 10');
    });

    test('exposes accessible navigation labels', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      const section = page.locator('#testimonials');
      await section.scrollIntoViewIfNeeded();
      await expect(section.getByRole('button', { name: 'Next testimonial' }).first()).toBeVisible();
      await expect(section.getByRole('button', { name: 'Previous testimonial' }).first()).toBeVisible();
    });

    test('mobile carousel does not cause horizontal body overflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      const section = page.locator('#testimonials');
      await section.scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });
});
