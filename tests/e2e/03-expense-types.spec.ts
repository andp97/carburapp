import { test, expect, Page } from '@playwright/test';

let vehicleId: string;

// Seed a vehicle and both a manutenzione and an altro expense once for the suite.
test.beforeAll(async ({ request }) => {
  const vehicleRes = await request.post('/api/vehicles', {
    data: { name: 'Expense Test Car', plate: 'EX001ET', year: 2022 },
  });
  const vehicleData = await vehicleRes.json();
  vehicleId = vehicleData.id;

  // Seed a manutenzione expense — should appear in "Storico manutenzioni"
  await request.post('/api/refuels', {
    data: {
      vehicleId,
      expenseType: 'manutenzione',
      total: 120,
      station: 'Tagliando test',
      isFull: false,
    },
  });

  // Seed an altro expense — must NOT appear in "Storico manutenzioni"
  await request.post('/api/refuels', {
    data: {
      vehicleId,
      expenseType: 'altro',
      total: 15,
      notes: 'Pedaggio test',
      isFull: false,
    },
  });
});

// Helper: open the add-expense sheet and display the picker.
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

    await page.locator('button').filter({ hasText: /←|‹|indietro/i }).first().click();

    await expect(page.getByText('Tipo di spesa')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Storico filter chips', () => {
  test('filter chips show expense categories, not fuel types', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Storico', exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Tutto', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Carburante', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manutenzione', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Altro', exact: true })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Diesel', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'GPL', exact: true })).not.toBeVisible();
  });
});

test.describe('Scadenze — Storico manutenzioni', () => {
  test('shows manutenzione entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Scadenze', exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Storico manutenzioni')).toBeVisible({ timeout: 5000 });
    // The seeded maintenance record should appear
    await expect(page.getByText('Tagliando test')).toBeVisible({ timeout: 5000 });
  });

  test('does NOT show altro entries in Storico manutenzioni', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Scadenze', exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Storico manutenzioni')).toBeVisible({ timeout: 5000 });
    // The seeded "altro" record must NOT appear in this section
    await expect(page.getByText('Pedaggio test')).not.toBeVisible();
  });
});
