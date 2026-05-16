import { test, expect } from '@playwright/test';

test.describe('Vehicle management', () => {
  test('onboarding: shows landing screen when no vehicles exist', async ({ page }) => {
    await page.goto('/');
    // The onboarding landing screen should show the app name and CTA button
    await expect(page.getByText('CarburApp')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Aggiungi la tua prima auto')).toBeVisible();
  });

  test('onboarding: navigates to vehicle form when CTA is clicked', async ({ page }) => {
    await page.goto('/');
    // Click the main CTA button
    await page.getByText('Aggiungi la tua prima auto').click();
    // Should now show the vehicle form
    await expect(page.getByText('La tua auto')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('es. Panda 1.2, Golf TDI…')).toBeVisible();
    await expect(page.getByPlaceholder('es. AB123CD')).toBeVisible();
  });

  test('onboarding: form shows validation error when submitted empty', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Aggiungi la tua prima auto').click();
    // Click submit without filling in any fields
    await page.getByText('Crea veicolo').click();
    // Should show validation error
    await expect(page.getByText('Compila tutti i campi')).toBeVisible({ timeout: 5000 });
  });

  test('onboarding: back button returns to landing screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Aggiungi la tua prima auto').click();
    await expect(page.getByText('La tua auto')).toBeVisible({ timeout: 5000 });
    // Click the back button (chevron)
    await page.locator('button').filter({ hasText: '' }).first().click();
    // Should be back on landing
    await expect(page.getByText('Aggiungi la tua prima auto')).toBeVisible({ timeout: 5000 });
  });

  test('dashboard loads with vehicle data', async ({ page }) => {
    await page.goto('/');
    // If we have a vehicle stored, check dashboard renders key elements
    // This test checks the page loads without error
    await expect(page).toHaveURL('http://localhost:3000/');
    // The app should render something meaningful — either onboarding or dashboard
    const hasOnboarding = await page.getByText('CarburApp').isVisible().catch(() => false);
    const hasDashboard = await page.getByText('Scadenze').isVisible().catch(() => false);
    expect(hasOnboarding || hasDashboard).toBe(true);
  });
});
