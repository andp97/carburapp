import { test, expect, Page } from '@playwright/test';

// Force mobile viewport so the bottom tab bar is visible (desktop hides it in
// favour of the sidebar). These tests are about expense-type picker behaviour.
test.use({ viewport: { width: 390, height: 844 } });

// Unique plate per run prevents state accumulation across test suite executions.
const RUN_PLATE = `EX${Math.random().toString(36).slice(2, 5).toUpperCase()}ET`;

let vehicleId: string;

// Seed a vehicle and both a manutenzione and an altro expense once for the suite.
test.beforeAll(async ({ request }) => {
  const vehicleRes = await request.post('/api/vehicles', {
    data: { name: 'Expense Test Car', plate: RUN_PLATE, year: 2022 },
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

  await expect(page.getByText('Aggiungi spesa')).toBeVisible({ timeout: 5000 });
}

// Helper: ensure 'Expense Test Car' (identified by its unique plate) is selected.
async function selectExpenseTestCar(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // If the vehicle chip doesn't show our run's plate, open the dropdown and switch.
  const alreadySelected = await page.locator('button').filter({ hasText: RUN_PLATE }).count();
  if (!alreadySelected) {
    // Open the vehicle chip dropdown.
    await page.locator('button').filter({ hasText: /[A-Z]{2}[A-Z0-9]{3}[A-Z]{2}/ }).first().click();
    // Use JS-level click to avoid the VehicleChip fixed backdrop intercepting pointer events.
    await page.evaluate((plate) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(plate));
      (btn as HTMLButtonElement | undefined)?.click();
    }, RUN_PLATE);
    await page.waitForLoadState('networkidle');
  }
}

test.describe('Expense type picker', () => {
  test('picker shows all three expense types', async ({ page }) => {
    await openSheet(page);
    const sheet = page.getByTestId('sheet-add-fuel');
    await expect(sheet.getByRole('button', { name: /Carburante/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Manutenzione/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Altro/ })).toBeVisible();
  });

  test('Manutenzione shows maintenance form, not fuel form', async ({ page }) => {
    await openSheet(page);
    await page.getByTestId('sheet-add-fuel').getByRole('button', { name: /Manutenzione/ }).click();

    await expect(page.getByText('Totale (€)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Data')).toBeVisible();
    await expect(page.getByText('Tipo carburante')).not.toBeVisible();
  });

  test('Altro shows generic expense form, not fuel form', async ({ page }) => {
    await openSheet(page);
    await page.getByTestId('sheet-add-fuel').getByRole('button', { name: /Altro/ }).click();

    await expect(page.getByText('Totale (€)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Descrizione')).toBeVisible();
    await expect(page.getByText('Tipo carburante')).not.toBeVisible();
  });

  test('back arrow on step 2 returns to picker', async ({ page }) => {
    await openSheet(page);
    await page.getByTestId('sheet-add-fuel').getByRole('button', { name: /Manutenzione/ }).click();

    await page.getByRole('button', { name: 'Indietro' }).click();

    await expect(page.getByText('Aggiungi spesa')).toBeVisible({ timeout: 5000 });
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
    await selectExpenseTestCar(page);

    await page.getByRole('button', { name: 'Scadenze', exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Storico manutenzioni')).toBeVisible({ timeout: 5000 });
    // The seeded maintenance record should appear
    await expect(page.getByText('Tagliando test')).toBeVisible({ timeout: 5000 });
  });

  test('does NOT show altro entries in Storico manutenzioni', async ({ page }) => {
    await selectExpenseTestCar(page);

    await page.getByRole('button', { name: 'Scadenze', exact: true }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Storico manutenzioni')).toBeVisible({ timeout: 5000 });
    // The seeded "altro" record must NOT appear in this section
    await expect(page.getByText('Pedaggio test')).not.toBeVisible();
  });
});
