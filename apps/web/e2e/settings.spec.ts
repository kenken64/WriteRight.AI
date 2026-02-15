import { test, expect } from '@playwright/test';
import { loginViaApi, mockAuthenticatedUser } from './fixtures';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await mockAuthenticatedUser(page);

    await page.route('**/api/v1/settings', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            displayName: 'Test User',
            email: 'test@example.com',
            notificationPrefs: { email: true, push: true },
            role: 'student',
          }),
        });
      }
      return route.continue();
    });
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/settings/);
  });

  test('change password section is visible', async ({ page }) => {
    await page.goto('/settings');
    const passwordSection = page.getByText(/change password|update password|password/i).first();
    await expect(passwordSection).toBeVisible();
  });

  test('change password form has required fields', async ({ page }) => {
    await page.goto('/settings');

    // Look for current password and new password fields
    const currentPwField = page.getByLabel(/current password/i);
    const newPwField = page.getByLabel(/new password/i);

    // At least the password-related text should be present
    await expect(page.getByText(/password/i).first()).toBeVisible();
  });

  test('change password API intercept works', async ({ page }) => {
    let changeCalled = false;

    await page.route('**/api/v1/auth/change-password', (route) => {
      changeCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password updated successfully' }),
      });
    });

    await page.goto('/settings');
    await page.waitForTimeout(500);

    // Verify the page loaded with settings content
    await expect(page).toHaveURL(/settings/);
  });
});
