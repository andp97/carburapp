import { test, expect } from '@playwright/test';

const RESET_TEST_EMAIL = 'reset-e2e@carburapp.test';
const RESET_TEST_PASSWORD = 'reset-e2e-initial-123';
const MAILPIT_API = 'http://localhost:8025/api/v1';

test.describe('password reset flow', () => {
  test.beforeAll(async ({ request }) => {
    // Register a dedicated test user for reset tests (409 = already exists, both are fine)
    await request.post('/api/auth/register', {
      data: { email: RESET_TEST_EMAIL, password: RESET_TEST_PASSWORD, cfToken: 'test-bypass-token' },
    });
  });

  test.beforeEach(async ({ request }) => {
    // Clear Mailpit inbox before each test
    await request.delete(`${MAILPIT_API}/messages`);
  });

  test('happy path: request reset → receive email → set new password → login succeeds', async ({ page, request }) => {
    const newPassword = 'reset-e2e-new-456';

    // Step 1: Request a password reset via the API (bypasses browser Turnstile)
    const resetRes = await request.post('/api/auth/password-reset/request', {
      data: { email: RESET_TEST_EMAIL, cfToken: 'test-bypass-token' },
    });
    expect(resetRes.ok()).toBe(true);
    const resetBody = await resetRes.json();
    expect(resetBody.data.message).toContain('email');

    // Step 2: Wait for Mailpit to capture the email (poll up to 5 s)
    let msgId: string | undefined;
    await expect.poll(
      async () => {
        const res = await request.get(`${MAILPIT_API}/messages`);
        const body = await res.json();
        if (body.total > 0) msgId = body.messages[0].ID;
        return body.total;
      },
      { timeout: 5000, intervals: [500] },
    ).toBeGreaterThan(0);

    // Step 3: Extract the reset URL from the plain-text email body
    const msgRes = await request.get(`${MAILPIT_API}/message/${msgId}`);
    const msg = await msgRes.json();
    const match = (msg.Text as string).match(/http:\/\/[^\s]+\/reset-password\?token=[a-f0-9]+/);
    expect(match).not.toBeNull();
    const resetUrl = match![0];

    // Step 4: Navigate to the reset URL and set the new password
    await page.goto(resetUrl);
    await page.fill('input[placeholder="Nuova password"]', newPassword);
    await page.fill('input[placeholder="Conferma password"]', newPassword);
    await page.click('button[type="submit"]');

    // Step 5: Confirm success message appears (the page shows "Password aggiornata"
    // before redirecting; we don't follow the redirect in the browser because the
    // test's storageState carries an authenticated session that would land at /app).
    await expect(page.getByText('Password aggiornata')).toBeVisible({ timeout: 10000 });

    // Step 6: Verify the new password actually works via API
    const loginRes = await request.post('/api/auth/login', {
      data: { email: RESET_TEST_EMAIL, password: newPassword },
    });
    expect(loginRes.ok()).toBe(true);

    // Restore the original password so beforeAll state is clean for re-runs
    await request.post('/api/auth/password-reset/request', {
      data: { email: RESET_TEST_EMAIL, cfToken: 'test-bypass-token' },
    });
    const res2 = await request.get(`${MAILPIT_API}/messages`);
    const msgs2 = await res2.json();
    const msg2Res = await request.get(`${MAILPIT_API}/message/${msgs2.messages[0].ID}`);
    const msg2 = await msg2Res.json();
    const match2 = (msg2.Text as string).match(/http:\/\/[^\s]+\/reset-password\?token=[a-f0-9]+/);
    if (match2) {
      const restoreToken = match2[0].split('token=')[1];
      await request.post('/api/auth/password-reset/confirm', {
        data: { token: restoreToken, newPassword: RESET_TEST_PASSWORD },
      });
    }
  });

  test('used token shows an error on the reset page', async ({ page, request }) => {
    // Request a reset and get the token
    await request.post('/api/auth/password-reset/request', {
      data: { email: RESET_TEST_EMAIL, cfToken: 'test-bypass-token' },
    });

    await expect.poll(
      async () => {
        const res = await request.get(`${MAILPIT_API}/messages`);
        const body = await res.json();
        return body.total;
      },
      { timeout: 5000, intervals: [500] },
    ).toBeGreaterThan(0);

    const msgsRes = await request.get(`${MAILPIT_API}/messages`);
    const msgs = await msgsRes.json();
    const msgRes = await request.get(`${MAILPIT_API}/message/${msgs.messages[0].ID}`);
    const msg = await msgRes.json();
    const match = (msg.Text as string).match(/http:\/\/[^\s]+\/reset-password\?token=([a-f0-9]+)/);
    expect(match).not.toBeNull();
    const rawToken = match![1];
    const resetUrl = match![0];

    // Use the token once via API
    await request.post('/api/auth/password-reset/confirm', {
      data: { token: rawToken, newPassword: RESET_TEST_PASSWORD },
    });

    // Navigate to the same URL again — should show an error
    await page.goto(resetUrl);
    await page.fill('input[placeholder="Nuova password"]', 'anotherpassword');
    await page.fill('input[placeholder="Conferma password"]', 'anotherpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/non valido o scaduto/i)).toBeVisible();
  });
});

test.describe('login rate limiting', () => {
  test('returns 429 after exceeding the attempt threshold', async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await request.post('/api/auth/login', {
        data: { email: 'ratelimit-test@carburapp.test', password: 'wrongpassword' },
      });
      statuses.push(res.status());
    }
    // At least one response must be 429
    expect(statuses).toContain(429);
    // The last request (well past the threshold) must be 429
    expect(statuses[statuses.length - 1]).toBe(429);
  });
});
