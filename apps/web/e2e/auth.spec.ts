import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByRole('link', { name: /forgot/i });
    await expect(forgotLink).toBeVisible();
  });

  test('forgot password page loads and shows email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
  });

  test('reset password page with token shows password form', async ({ page }) => {
    await page.goto('/reset-password?token=test-token-abc123');
    await expect(page.getByLabel(/new password|password/i).first()).toBeVisible();
  });

  test('reset password page without token shows error or redirect', async ({ page }) => {
    await page.goto('/reset-password');
    // Should either show an error message or redirect
    const hasError = await page.getByText(/invalid|expired|token/i).isVisible().catch(() => false);
    const isRedirected = page.url().includes('/login') || page.url().includes('/forgot-password');
    expect(hasError || isRedirected).toBeTruthy();
  });

  test('login form submits and calls API', async ({ page }) => {
    let loginCalled = false;

    await page.route('**/api/v1/auth/login', (route) => {
      loginCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'u1', email: 'test@example.com', user_metadata: { role: 'student' } },
          session: { access_token: 'tok', refresh_token: 'ref' },
        }),
      });
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait a moment for the request
    await page.waitForTimeout(1000);
    expect(loginCalled).toBe(true);
  });
});
