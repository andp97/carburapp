import { test, expect, Page } from '@playwright/test';

// Ensure at least one vehicle exists so the dashboard + TabBar are visible.
// The request context inherits the session cookie from storageState.
test.beforeAll(async ({ request }) => {
  await request.post('/api/vehicles', {
    data: { name: 'Test Car', plate: 'TS001TS', year: 2023 },
  });
});

// Helper: open the add-fuel sheet and advance past the expense-type picker to
// the fuel form (step 2) by selecting "Carburante".
async function openFuelForm(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
  await expect(addTab).toBeVisible({ timeout: 10000 });
  await addTab.click();

  // Step 1: expense type picker — choose Carburante to reach the fuel form.
  await expect(page.getByText('Aggiungi spesa')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('sheet-add-fuel').getByRole('button', { name: /Carburante/ }).click();

  // Step 2: fuel form should now be visible (header shows the expense type label).
  await expect(page.getByText('Tipo carburante')).toBeVisible({ timeout: 5000 });
}

test.describe('Refuel logging', () => {
  test('add refuel button opens expense-type picker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();

    await expect(page.getByText('Aggiungi spesa')).toBeVisible({ timeout: 5000 });
  });

  test('selecting Carburante shows fuel form', async ({ page }) => {
    await openFuelForm(page);
    await expect(page.getByText('Tipo carburante')).toBeVisible();
    await expect(page.getByText('Benzina')).toBeVisible();
    await expect(page.getByText('Diesel')).toBeVisible();
  });

  test('refuel form validates required fields', async ({ page }) => {
    await openFuelForm(page);

    await page.getByText('Salva rifornimento').click();

    await expect(page.getByText('Compila tutti i campi obbligatori')).toBeVisible({ timeout: 5000 });
  });

  test('refuel sheet can be closed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const addTab = page.getByRole('button', { name: 'Aggiungi', exact: true });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();

    await expect(page.getByText('Aggiungi spesa')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('sheet-add-fuel').getByRole('button', { name: 'Chiudi' }).click();

    await expect(page.getByTestId('sheet-add-fuel')).toHaveAttribute('data-open', 'false', { timeout: 5000 });
  });
});
