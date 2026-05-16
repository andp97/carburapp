import { test, expect } from '@playwright/test';

// Seed a vehicle before this suite so the dashboard (and TabBar) is visible.
test.beforeAll(async ({ request }) => {
  await request.post('/api/vehicles', {
    data: { name: 'Test Car', plate: 'TS001TS', year: 2023 },
  });
});

test.describe('Refuel logging', () => {
  test('add refuel button opens sheet', async ({ page }) => {
    await page.goto('/');
    // Wait for app to render
    await page.waitForLoadState('networkidle');

    // The TabBar has an "Aggiungi" tab which opens the add-fuel sheet
    const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();

    // The sheet should slide up with "Aggiungi rifornimento" heading
    await expect(page.getByText('Aggiungi rifornimento')).toBeVisible({ timeout: 5000 });
  });

  test('refuel form validates required fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the add-fuel sheet via the tab bar
    const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();

    // The sheet should appear
    await expect(page.getByText('Aggiungi rifornimento')).toBeVisible({ timeout: 5000 });

    // Try to submit without filling required fields
    await page.getByText('Salva rifornimento').click();

    // Should show validation error about required fields
    await expect(page.getByText('Compila tutti i campi obbligatori')).toBeVisible({ timeout: 5000 });
  });

  test('refuel form shows fuel type selector', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();

    await expect(page.getByText('Aggiungi rifornimento')).toBeVisible({ timeout: 5000 });

    // Check that fuel type options are visible
    await expect(page.getByText('Tipo carburante')).toBeVisible();
    // The sheet contains fuel type buttons
    await expect(page.getByText('Benzina')).toBeVisible();
    await expect(page.getByText('Diesel')).toBeVisible();
  });

  test('refuel sheet can be closed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();

    await expect(page.getByText('Aggiungi rifornimento')).toBeVisible({ timeout: 5000 });

    // Close the sheet using the X button
    await page.getByRole('button', { name: 'Chiudi' }).click();

    // Sheet should be dismissed — data-open attribute flips to false
    await expect(page.getByTestId('sheet-add-fuel')).toHaveAttribute('data-open', 'false', { timeout: 5000 });
  });
});
