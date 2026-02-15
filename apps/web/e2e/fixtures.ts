import { test as base, expect, type Page } from '@playwright/test';

/**
 * Login helper — authenticates via the API and stores cookies on the page context.
 */
export async function loginViaApi(
  page: Page,
  email = 'test@example.com',
  password = 'password123',
) {
  // Intercept the login API call to avoid needing a real backend
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email,
          user_metadata: { role: 'student', display_name: 'Test User' },
        },
        session: { access_token: 'mock-token', refresh_token: 'mock-refresh' },
      }),
    }),
  );

  // Set a fake Supabase session cookie so middleware treats us as authenticated
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'sb-refresh-token',
      value: 'mock-refresh',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Intercept Supabase auth.getUser calls so protected pages render.
 */
export async function mockAuthenticatedUser(page: Page) {
  await page.route('**/auth/v1/user', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        user_metadata: { role: 'student', display_name: 'Test User' },
      }),
    }),
  );
}

export { base as test, expect };
