import { test, expect } from '@playwright/test';

// These tests exercise the unauthenticated onboarding flow. They intentionally
// clear auth state so unauthenticated routes are tested correctly.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Vehicle management — unauthenticated onboarding', () => {
  test('unauthenticated root shows public landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'CarburApp' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accedi' })).toBeVisible();
  });

  test('unauthenticated /app redirects to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Registrati')).toBeVisible({ timeout: 5000 });
  });

  test('register page shows Turnstile widget and disabled submit', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Crea il tuo account')).toBeVisible({ timeout: 5000 });
    // Submit button is disabled until the Turnstile widget resolves.
    const btn = page.getByRole('button', { name: 'Registrati' });
    await expect(btn).toBeDisabled();
  });

  test('register page: Turnstile auto-passes with test site key', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Crea il tuo account')).toBeVisible({ timeout: 5000 });

    // With the always-pass test site key the widget fires onSuccess automatically.
    // Wait for the submit button to become enabled.
    const btn = page.getByRole('button', { name: 'Registrati' });
    await expect(btn).toBeEnabled({ timeout: 15000 });
  });
});
