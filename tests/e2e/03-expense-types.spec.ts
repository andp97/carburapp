import { test, expect, Page } from '@playwright/test';

// Seed a vehicle once for the whole suite.
test.beforeAll(async ({ request }) => {
  await request.post('/api/vehicles', {
    data: { name: 'Expense Test Car', plate: 'EX001ET', year: 2022 },
  });
});

// Helper: open the sheet and pick an expense type.
async function openSheet(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
  await expect(addTab).toBeVisible({ timeout: 10000 });
  await addTab.click();

  await expect(page.getByText('Tipo di spesa')).toBeVisible({ timeout: 5000 });
}

test.describe('Expense type picker', () => {
  test('picker shows all three expense types', async ({ page }) => {
    await openSheet(page);
    await expect(page.getByText('Carburante')).toBeVisible();
    await expect(page.getByText('Manutenzione')).toBeVisible();
    await expect(page.getByText('Altro')).toBeVisible();
  });

  test('Manutenzione shows maintenance form, not fuel form', async ({ page }) => {
    await openSheet(page);
    await page.getByText('Manutenzione').click();

    // Should show a totale field and a date field, but NOT "Tipo carburante"
    await expect(page.getByText('Totale (€)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Data')).toBeVisible();
    await expect(page.getByText('Tipo carburante')).not.toBeVisible();
  });

  test('Altro shows generic expense form, not fuel form', async ({ page }) => {
    await openSheet(page);
    await page.getByText('Altro').click();

    await expect(page.getByText('Totale (€)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Descrizione')).toBeVisible();
    await expect(page.getByText('Tipo carburante')).not.toBeVisible();
  });

  test('back arrow on step 2 returns to picker', async ({ page }) => {
    await openSheet(page);
    await page.getByText('Manutenzione').click();

    // Back arrow in header
    await page.locator('button').filter({ hasText: /←|‹|indietro/i }).first().click();

    await expect(page.getByText('Tipo di spesa')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Storico filter chips', () => {
  test('filter chips show expense categories, not fuel types', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Storico tab
    await page.getByRole('button', { name: 'Storico', exact: true }).click();
    await page.waitForLoadState('networkidle');

    // Should have expense-type filters
    await expect(page.getByRole('button', { name: 'Tutto', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Carburante', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manutenzione', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Altro', exact: true })).toBeVisible();

    // Old fuel-specific filters should NOT exist
    await expect(page.getByRole('button', { name: 'Diesel', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'GPL', exact: true })).not.toBeVisible();
  });
});
