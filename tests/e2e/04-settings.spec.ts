import { test, expect } from '@playwright/test';

test.describe('Settings sheet', () => {
  test('gear icon opens settings sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Impostazioni' }).click();

    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });
    await expect(page.getByText('Impostazioni').first()).toBeVisible();
  });

  test('settings sheet shows all sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();

    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });
    await expect(page.getByText('Veicoli')).toBeVisible();
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await expect(page.getByText('Aggiorna app')).toBeVisible();
    await expect(page.getByText('Elimina account')).toBeVisible();
  });

  test('settings sheet closes on X button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    await page.getByTestId('settings-sheet').getByRole('button', { name: 'Chiudi' }).click();

    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'false', { timeout: 5000 });
  });

  test('Aggiungi veicolo opens sub-sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    await page.getByText('Aggiungi veicolo').click();

    await expect(page.getByText('Nuovo veicolo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('es. Panda 1.2, Golf TDI…')).toBeVisible();
  });

  test('add vehicle form validates empty fields', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByText('Aggiungi veicolo').click();
    await expect(page.getByText('Nuovo veicolo')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Aggiungi veicolo' }).click();

    await expect(page.getByText('Compila tutti i campi')).toBeVisible({ timeout: 5000 });
  });

  test('back button returns to main settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByText('Aggiungi veicolo').click();
    await expect(page.getByText('Nuovo veicolo')).toBeVisible({ timeout: 5000 });

    await page.getByText('← Indietro').click();

    await expect(page.getByText('Impostazioni').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Veicoli')).toBeVisible();
  });

  test('Modifica email opens sub-sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    await page.getByText('Modifica').click();

    await expect(page.getByText('Modifica email')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('nuova@email.it')).toBeVisible();
  });

  test('Cambia password opens sub-sheet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    await page.getByText('Cambia').click();

    await expect(page.getByText('Cambia password')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password attuale').first()).toBeVisible();
  });

  test('Elimina account opens sub-sheet with warning', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await expect(page.getByTestId('settings-sheet')).toHaveAttribute('data-open', 'true', { timeout: 5000 });

    await page.getByText('Elimina account').click();

    await expect(page.getByText('irreversibile')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Elimina account definitivamente')).toBeVisible();
  });
});
