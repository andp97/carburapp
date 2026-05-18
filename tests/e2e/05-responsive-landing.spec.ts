import { test, expect } from '@playwright/test';

const DESKTOP = { width: 1280, height: 800 };
const MOBILE  = { width: 390,  height: 844 };

// --- Public landing page (unauthenticated) ---

test.describe('Public landing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows logo, headline, feature pills and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'CarburApp' })).toBeVisible();
    await expect(page.getByText('Il tracker spese auto pensato per gli italiani')).toBeVisible();
    // Feature pill titles (exact to avoid matching the subtitle paragraph)
    await expect(page.getByText('Rifornimenti', { exact: true })).toBeVisible();
    await expect(page.getByText('Scadenze', { exact: true })).toBeVisible();
    await expect(page.getByText('Statistiche', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accedi' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Registrati gratis' })).toBeVisible();
  });

  test('/app redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

// --- Auth redirects (authenticated) ---

test.describe('Auth redirects — authenticated', () => {
  test('authenticated / redirects to /app', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
  });
});

// --- Desktop sidebar layout ---

test.describe('Desktop sidebar (≥768px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/app');
    // Wait for the sidebar to be present before each test
    await page.locator('.sidebar').waitFor({ timeout: 10000 });
  });

  test('sidebar is visible and tab bar is hidden', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const tabBar  = page.locator('.tab-bar');

    await expect(sidebar).toBeVisible();
    await expect(tabBar).not.toBeVisible();
  });

  test('sidebar contains Aggiungi spesa button and all nav items', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    await expect(sidebar.getByRole('button', { name: 'Aggiungi spesa' })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Riepilogo' })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Storico' })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Scadenze' })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'Statistiche' })).toBeVisible();
  });

  test('sidebar navigation switches active tab', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    await sidebar.getByRole('button', { name: 'Storico' }).click();
    await expect(page.getByRole('heading', { name: 'Storico' })).toBeVisible({ timeout: 5000 });
  });

  test('Aggiungi spesa sidebar button opens sheet at expense-type picker (step 1)', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    await sidebar.getByRole('button', { name: 'Aggiungi spesa' }).click();

    const sheet = page.getByTestId('sheet-add-fuel');
    await expect(sheet.getByRole('button', { name: /Carburante/ })).toBeVisible({ timeout: 5000 });
    await expect(sheet.getByRole('button', { name: /Manutenzione/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Altro/ })).toBeVisible();
  });
});

// --- Mobile layout ---

test.describe('Mobile layout (<768px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/app');
    // Wait for the tab bar to be present before each test
    await page.locator('.tab-bar').waitFor({ timeout: 10000 });
  });

  test('tab bar is visible and sidebar is hidden', async ({ page }) => {
    const tabBar  = page.locator('.tab-bar');
    const sidebar = page.locator('.sidebar');

    await expect(tabBar).toBeVisible();
    await expect(sidebar).not.toBeVisible();
  });

  test('tab bar Aggiungi button opens expense-type picker', async ({ page }) => {
    await page.getByRole('button', { name: 'Aggiungi', exact: true }).click();
    const sheet = page.getByTestId('sheet-add-fuel');
    await expect(sheet.getByRole('button', { name: /Carburante/ })).toBeVisible({ timeout: 5000 });
  });
});
