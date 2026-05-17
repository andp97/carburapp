import { test as setup } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

const TEST_EMAIL = 'e2e@carburapp.test';
const TEST_PASSWORD = 'e2e-password-123';

setup('register and save auth state', async ({ request }) => {
  // Register a fresh test user. With TURNSTILE_SECRET_KEY set to the Cloudflare
  // always-pass test key, any cfToken value succeeds server-side verification.
  const res = await request.post('/api/auth/register', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, cfToken: 'test-bypass-token' },
  });

  // 201 = newly created; 409 = already exists from a previous run — both are fine.
  // On 409, the existing session from the register call is absent, so log in instead.
  if (res.status() === 409) {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (!loginRes.ok()) throw new Error(`Auth setup login failed: ${loginRes.status()}`);
  } else if (!res.ok()) {
    throw new Error(`Auth setup register failed: ${res.status()} ${await res.text()}`);
  }

  // Persist the session cookie so test files can reuse it.
  await request.storageState({ path: AUTH_FILE });
});
